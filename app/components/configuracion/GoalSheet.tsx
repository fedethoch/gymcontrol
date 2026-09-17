"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ChartPie, Check, ChevronLeft, ChevronRight, PenLine, SlidersHorizontal, TriangleAlert } from "lucide-react";

import { BODY_LIMITS } from "@/app/components/configuracion/BodySheet";
import { MacroSliders } from "@/app/components/configuracion/MacroSliders";
import { OptionList } from "@/app/components/configuracion/OptionList";
import { BmrFloorNote } from "@/app/components/configuracion/PlanRows";
import { OfflineNote, ProfileSheet } from "@/app/components/configuracion/ProfileSheet";
import { ProjectionPreview } from "@/app/components/configuracion/ProjectionSection";
import { Input } from "@/app/components/ui/Input";
import { NumberStepper } from "@/app/components/ui/NumberStepper";
import { SegmentedControl } from "@/app/components/ui/SegmentedControl";
import { Slider } from "@/app/components/ui/Slider";
import type { ProfileForm } from "@/app/configuracion/useProfileForm";
import { calculateNutritionPlan } from "@/app/lib/nutrition-calc";
import {
  ADJUSTMENT_RANGE,
  effectiveTargetWeight,
  goalVariantOptions,
  MACRO_PRESET_COPY,
  MAINTENANCE_OVERRIDE_RANGE,
  RECOMMENDED_PRESET,
  recommendedVariant,
  suggestedPreset,
  variantInfo,
} from "@/app/lib/nutrition-plan-options";
import { MACRO_COLORS } from "@/app/lib/nutrition-style";
import {
  GOALS,
  MACRO_PRESETS,
  type Goal,
  type Macros,
  type MacroPreset,
  type NutritionProfileInput,
  type TargetMode,
} from "@/app/lib/nutrition-types";
import { checkManualTarget, formatAdjustment, GOAL_COPY, macroSplit } from "@/app/lib/profile-plan";
import { formatKg } from "@/app/lib/weight-projection";
import { cn } from "@/app/lib/utils";

const TARGET_MODE_OPTIONS: { value: TargetMode; label: string }[] = [
  { value: "auto", label: "Calculados" },
  { value: "manual", label: "Los fijo yo" },
];

type GoalView = "main" | "diet" | "advanced";

const VIEW_COPY: Record<GoalView, { title: string; description: string }> = {
  main: { title: "Objetivo", description: "Tu objetivo, su intensidad y tu tipo de dieta. Los cambios se guardan solos." },
  diet: { title: "Tipo de dieta", description: "Cómo se reparten tus calorías entre proteína, carbos y grasas." },
  advanced: {
    title: "Avanzado",
    description: "Tu mantenimiento real, un peso objetivo y si las calorías se calculan o las fijás vos.",
  },
};

/**
 * Los 3 grupos con las kcal que daría cada uno y el peso a 12 semanas del elegido (S4 y paso 6 del alta).
 * `children` va entre la lista y la vista previa (las variantes en S4).
 */
export function GoalOptions({
  input,
  value,
  onChange,
  disabled,
  children,
}: {
  input: NutritionProfileInput;
  value: Goal;
  onChange: (value: Goal) => void;
  disabled?: boolean;
  children?: ReactNode;
}) {
  const plans = useMemo(
    () =>
      Object.fromEntries(
        GOALS.map((goal) => [
          goal,
          // El grupo elegido usa su variante e intensidad; los otros, su recomendada.
          calculateNutritionPlan(
            goal === input.goal ? input : { ...input, goal, goalVariant: undefined, kcalAdjustment: null },
          ),
        ]),
      ) as Record<Goal, ReturnType<typeof calculateNutritionPlan>>,
    [input],
  );
  const options = GOALS.map((goal) => ({
    value: goal,
    label: GOAL_COPY[goal].label,
    hint: GOAL_COPY[goal].hint,
    trailing: (
      <span className="grid justify-items-end">
        <span className="font-mono text-[15px] tabular-nums text-[var(--foreground)]">{plans[goal].targetKcal}</span>
        <span className="font-mono text-xs text-[var(--foreground-muted)]">{formatAdjustment(plans[goal].adjustment)}</span>
      </span>
    ),
  }));

  return (
    <div className="grid gap-4">
      <OptionList label="Objetivo" options={options} value={value} onChange={onChange} disabled={disabled} />
      {children}
      <ProjectionPreview input={input} targetKcal={plans[input.goal].targetKcal} />
    </div>
  );
}

/** S4 · Objetivo en 3 capas: grupo + variante, tipo de dieta y avanzado (vistas internas, sin sheets apilados). */
export function GoalSheet({
  open,
  onOpenChange,
  form,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: ProfileForm;
}) {
  const [view, setView] = useState<GoalView>("main");
  const disabled = !form.online;
  const manual = form.targetMode === "manual";

  function handleOpenChange(next: boolean) {
    if (!next) setView("main");
    onOpenChange(next);
  }

  return (
    <ProfileSheet
      open={open}
      onOpenChange={handleOpenChange}
      title={VIEW_COPY[view].title}
      description={VIEW_COPY[view].description}
      leading={
        view === "main" ? null : (
          <button
            type="button"
            aria-label="Volver a Objetivo"
            onClick={() => setView("main")}
            className="pressable -ml-2 grid size-11 shrink-0 place-items-center rounded-full text-[var(--foreground)] outline-none focus-visible:shadow-[var(--focus-glow)]"
          >
            <ChevronLeft aria-hidden="true" className="size-5" />
          </button>
        )
      }
    >
      {view === "main" ? (
        <div className="flex flex-col gap-5 pt-2">
          {manual ? (
            <button
              type="button"
              onClick={() => setView("advanced")}
              className="flex items-start gap-2 rounded-[12px] border border-[var(--border)] px-3 py-2.5 text-left text-[13px] leading-snug text-[var(--foreground-muted)] outline-none focus-visible:shadow-[var(--focus-glow)]"
            >
              <PenLine aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-[var(--foreground)]" />
              <span>
                <span className="font-medium text-[var(--foreground)]">Fijado a mano.</span> Lo de abajo no cambia tu
                objetivo hasta que vuelvas a Calculados en Avanzado.
              </span>
            </button>
          ) : null}

          <div className={cn("flex flex-col gap-5", manual && "opacity-[0.55]")}>
            <GoalOptions input={form.profileInput} value={form.goal} onChange={form.setGoal} disabled={disabled}>
              <VariantPicker form={form} disabled={disabled} />
            </GoalOptions>
          </div>

          <div className="border-t border-[var(--border)]">
            <NavRow
              icon={<ChartPie className="size-5 text-[var(--foreground-muted)]" />}
              title="Tipo de dieta"
              detail={dietSummary(form)}
              dimmed={manual}
              onClick={() => setView("diet")}
            />
            <NavRow
              icon={<SlidersHorizontal className="size-5 text-[var(--foreground-muted)]" />}
              title="Avanzado"
              detail={advancedSummary(form)}
              onClick={() => setView("advanced")}
            />
          </div>
        </div>
      ) : view === "diet" ? (
        <DietView form={form} disabled={disabled} />
      ) : (
        <AdvancedView form={form} disabled={disabled} />
      )}
      {disabled ? <OfflineNote /> : null}
    </ProfileSheet>
  );
}

function dietSummary(form: ProfileForm): string {
  const split = macroSplit(form.calculatedPlan.macros);
  return `${MACRO_PRESET_COPY[form.macroPreset].label} · P ${split.protein}% · C ${split.carbs}% · G ${split.fat}%`;
}

function advancedSummary(form: ProfileForm): string {
  if (form.targetMode === "manual") return "Calorías y macros fijados a mano";
  const parts = [
    form.maintenanceOverrideKcal != null ? `Mantenimiento ${form.maintenanceOverrideKcal} kcal` : "Mantenimiento calculado",
  ];
  const target = effectiveTargetWeight(form.profileInput);
  if (target != null) parts.push(`meta ${formatKg(target)} kg`);
  return parts.join(" · ");
}

function formatKcalDelta(value: number): string {
  const rounded = Math.round(value);
  if (rounded === 0) return "0 kcal";
  return `${rounded < 0 ? "−" : "+"}${Math.abs(rounded)} kcal`;
}

/** Variantes del grupo (★ = recomendada), su consecuencia y el ajuste fino. */
function VariantPicker({ form, disabled }: { form: ProfileForm; disabled: boolean }) {
  const [tuning, setTuning] = useState(form.kcalAdjustment != null);
  const plan = form.calculatedPlan;
  const variants = goalVariantOptions(form.goal);
  const info = variantInfo(form.goal, form.goalVariant);
  const custom = form.kcalAdjustment != null;
  const [min, max] = ADJUSTMENT_RANGE[form.goal];
  const variantAdjustments = variants.map((variant) => variant.info.adjustment);
  const band = [Math.min(...variantAdjustments), Math.max(...variantAdjustments)] as const;
  const recommended = recommendedVariant(form.goal);
  const isRecommended = !custom && form.goalVariant === recommended;
  // En déficit la intensidad crece hacia valores más negativos: el relleno va de −5% hacia −30%.
  const inverted = form.goal === "cut";

  return (
    <div className="grid gap-2">
      <SegmentedControl
        label="Intensidad"
        options={variants.map((variant) => ({
          value: variant.value,
          label: variant.recommended ? `${variant.info.label} ★` : variant.info.label,
        }))}
        value={form.goalVariant}
        onChange={form.setGoalVariant}
        disabled={disabled}
      />
      <p className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 text-[13px] text-[var(--foreground-muted)]">
        <span>{custom ? "Ajuste propio" : info.hint}</span>
        <span className="font-mono tabular-nums text-[var(--foreground)]">
          {formatAdjustment(plan.adjustment)} · {formatKcalDelta(plan.targetKcal - plan.maintenanceKcal)}
        </span>
      </p>
      {plan.clampedToBmr ? <BmrFloorNote /> : null}

      {tuning ? (
        <div className="grid gap-1 pt-1">
          <Slider
            label="Intensidad fina"
            valueText={formatAdjustment(plan.adjustment)}
            value={Math.round(plan.adjustment * 100)}
            min={Math.round(min * 100)}
            max={Math.round(max * 100)}
            step={1}
            band={[band[0] * 100, band[1] * 100]}
            inverted={inverted}
            disabled={disabled}
            onChange={(next) => form.setKcalAdjustment(next / 100)}
          />
          <div className="flex items-center justify-between font-mono text-xs tabular-nums text-[var(--foreground-subtle)]">
            <span>{formatAdjustment(inverted ? max : min)}</span>
            <span>{formatAdjustment(inverted ? min : max)}</span>
          </div>
        </div>
      ) : null}

      <div className="flex items-center gap-1">
        {tuning ? null : (
          <TextButton onClick={() => setTuning(true)} disabled={disabled}>
            Ajustar intensidad
          </TextButton>
        )}
        {isRecommended ? null : (
          <TextButton onClick={() => form.setGoalVariant(recommended)} disabled={disabled}>
            Volver a lo recomendado
          </TextButton>
        )}
      </div>
    </div>
  );
}

/** S4a · los 6 tipos de dieta con su reparto; Personalizada abre los sliders. */
function DietView({ form, disabled }: { form: ProfileForm; disabled: boolean }) {
  const input = form.profileInput;
  const suggested = suggestedPreset(form.goal, form.goalVariant);
  const options = useMemo(
    () =>
      MACRO_PRESETS.map((preset) => {
        const macros = calculateNutritionPlan({ ...input, macroPreset: preset }).macros;
        const copy = MACRO_PRESET_COPY[preset];
        return {
          value: preset,
          label: preset === RECOMMENDED_PRESET ? `${copy.label} ★` : copy.label,
          hint: preset === suggested && preset !== RECOMMENDED_PRESET ? `Sugerida para tu objetivo · ${copy.hint}` : copy.hint,
          trailing: <SplitPreview macros={macros} />,
        };
      }),
    [input, suggested],
  );

  return (
    <div className="flex flex-col gap-5 pt-2">
      <OptionList<MacroPreset>
        label="Tipo de dieta"
        options={options}
        value={form.macroPreset}
        onChange={form.setMacroPreset}
        disabled={disabled}
      />
      {form.macroPreset === "custom" ? <MacroSliders form={form} disabled={disabled} /> : null}
      {form.macroPreset === RECOMMENDED_PRESET ? null : (
        <TextButton onClick={() => form.setMacroPreset(RECOMMENDED_PRESET)} disabled={disabled} className="self-start">
          Volver a Equilibrada
        </TextButton>
      )}
      {form.targetMode === "manual" ? (
        <p className="text-xs text-[var(--foreground-muted)]">Con el objetivo fijado a mano, el tipo de dieta no se aplica.</p>
      ) : null}
    </div>
  );
}

function SplitPreview({ macros }: { macros: Macros }) {
  const split = macroSplit(macros);
  const parts = [
    { key: "protein", pct: split.protein },
    { key: "carbs", pct: split.carbs },
    { key: "fat", pct: split.fat },
  ] as const;

  return (
    <span className="grid w-[4.75rem] gap-1">
      <span aria-hidden="true" className="flex h-1.5 gap-px overflow-hidden rounded-full">
        {parts.map((part) => (
          <span
            key={part.key}
            className="h-full basis-0"
            style={{ flexGrow: part.pct, backgroundColor: MACRO_COLORS[part.key] }}
          />
        ))}
      </span>
      <span className="font-mono text-[11px] tabular-nums text-[var(--foreground-muted)]">
        {split.protein}·{split.carbs}·{split.fat}
      </span>
      <span className="sr-only">
        Proteína {split.protein}%, carbohidratos {split.carbs}%, grasas {split.fat}%.
      </span>
    </span>
  );
}

/** S4b · mantenimiento real, peso objetivo y el modo manual. */
function AdvancedView({ form, disabled }: { form: ProfileForm; disabled: boolean }) {
  const input = form.profileInput;
  const manual = form.targetMode === "manual";
  const calculatedMaintenance = calculateNutritionPlan({ ...input, maintenanceOverrideKcal: null }).maintenanceKcal;
  const showsTarget = form.goal !== "maintenance";
  const wrongTarget = form.targetWeightKg != null && showsTarget && effectiveTargetWeight(input) === null;

  return (
    <div className="flex flex-col gap-5 pt-2">
      <div className="border-t border-[var(--border)]">
        <StepperBlock
          title="Mantenimiento real"
          hint={
            form.maintenanceOverrideKcal == null
              ? `Vacío = el calculado (${calculatedMaintenance} kcal)`
              : "Si sabés cuánto gastás por día"
          }
          action={
            form.maintenanceOverrideKcal == null ? null : (
              <TextButton onClick={() => form.setMaintenanceOverrideKcal(null)} disabled={disabled}>
                Usar el calculado
              </TextButton>
            )
          }
        >
          <NumberStepper
            size="m"
            label="Mantenimiento real en kcal"
            unit="kcal"
            step={10}
            min={MAINTENANCE_OVERRIDE_RANGE[0]}
            max={MAINTENANCE_OVERRIDE_RANGE[1]}
            maxDecimals={0}
            value={form.maintenanceOverrideKcal}
            onChange={form.setMaintenanceOverrideKcal}
            disabled={disabled || manual}
            className="w-[196px] shrink-0"
          />
        </StepperBlock>

        {showsTarget ? (
          <StepperBlock
            title="Peso objetivo"
            hint={form.goal === "cut" ? "Menor a tu peso actual" : "Mayor a tu peso actual"}
            action={
              form.targetWeightKg == null ? null : (
                <TextButton onClick={() => form.setTargetWeightKg(null)} disabled={disabled}>
                  Quitar
                </TextButton>
              )
            }
            note={
              wrongTarget ? (
                <span className="flex items-start gap-2 text-[13px] leading-snug text-[var(--warning)]">
                  <TriangleAlert aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
                  Tiene que ser {form.goal === "cut" ? "menor" : "mayor"} que tu peso actual (
                  {formatKg(input.weightKg)} kg).
                </span>
              ) : null
            }
          >
            <NumberStepper
              size="m"
              label="Peso objetivo en kilos"
              unit="kg"
              step={BODY_LIMITS.weightKg.step}
              min={BODY_LIMITS.weightKg.min}
              max={BODY_LIMITS.weightKg.max}
              maxDecimals={1}
              value={form.targetWeightKg}
              onChange={form.setTargetWeightKg}
              disabled={disabled || manual}
              className="w-[196px] shrink-0"
            />
          </StepperBlock>
        ) : null}
      </div>

      <div className="grid gap-2">
        <p className="text-[13px] font-medium text-[var(--foreground)]">Calorías y macros</p>
        <SegmentedControl
          label="Calorías y macros"
          options={TARGET_MODE_OPTIONS}
          value={form.targetMode}
          onChange={form.handleTargetModeChange}
          disabled={disabled}
        />
        <p className="text-xs text-[var(--foreground-muted)]">
          {manual
            ? "El objetivo fijo no cambia aunque modifiques tu cuerpo, tu actividad o tu tipo de dieta."
            : "Los calculamos con tus datos, tu actividad, tu objetivo y tu tipo de dieta."}
        </p>
      </div>

      {manual ? <ManualTargetFields form={form} disabled={disabled} /> : null}
    </div>
  );
}

function StepperBlock({
  title,
  hint,
  action,
  note,
  children,
}: {
  title: string;
  hint: string;
  action?: ReactNode;
  note?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-1 border-b border-[var(--border)] py-2">
      <div className="flex min-h-[72px] items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-medium text-[var(--foreground)]">{title}</p>
          <p className="text-pretty text-[13px] leading-snug text-[var(--foreground-muted)]">{hint}</p>
        </div>
        {children}
      </div>
      {action ? <div className="-mt-1">{action}</div> : null}
      {note}
    </div>
  );
}

function NavRow({
  icon,
  title,
  detail,
  dimmed = false,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  detail: string;
  dimmed?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[72px] w-full items-center gap-3 border-b border-[var(--border)] py-2.5 text-left outline-none transition-colors active:bg-[var(--card)] focus-visible:shadow-[var(--focus-glow)]"
    >
      <span
        aria-hidden="true"
        className={cn(
          "grid h-[52px] w-11 shrink-0 place-items-center rounded-[10px] border border-[var(--border)] bg-[var(--card)]",
          dimmed && "opacity-[0.55]",
        )}
      >
        {icon}
      </span>
      <span className={cn("grid min-w-0 flex-1 gap-0.5", dimmed && "opacity-[0.55]")}>
        <span className="text-[15px] font-medium text-[var(--foreground)]">{title}</span>
        <span className="text-pretty text-[13px] leading-snug text-[var(--foreground-muted)]">{detail}</span>
      </span>
      <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-[var(--foreground-subtle)]" />
    </button>
  );
}

function TextButton({
  onClick,
  disabled,
  className,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "pressable -ml-2 min-h-11 rounded-full px-2 text-[13px] font-semibold text-[var(--foreground)] underline-offset-4 outline-none hover:underline focus-visible:shadow-[var(--focus-glow)] disabled:opacity-50",
        className,
      )}
    >
      {children}
    </button>
  );
}

function ManualTargetFields({ form, disabled }: { form: ProfileForm; disabled: boolean }) {
  const check = form.manualTarget ? checkManualTarget(form.manualTarget) : null;

  return (
    <div className="grid gap-3">
      <div className="grid grid-cols-3 gap-3">
        <ManualField
          id="manual-kcal"
          label="Calorías"
          unit="kcal"
          value={form.manualKcal}
          onChange={form.setManualKcal}
          disabled={disabled}
          className="col-span-3"
        />
        <ManualField
          id="manual-protein"
          label="Proteína"
          color={MACRO_COLORS.protein}
          unit="g"
          value={form.manualProteinG}
          onChange={form.setManualProteinG}
          disabled={disabled}
        />
        <ManualField
          id="manual-carbs"
          label="Carbos"
          color={MACRO_COLORS.carbs}
          unit="g"
          value={form.manualCarbsG}
          onChange={form.setManualCarbsG}
          disabled={disabled}
        />
        <ManualField
          id="manual-fat"
          label="Grasas"
          color={MACRO_COLORS.fat}
          unit="g"
          value={form.manualFatG}
          onChange={form.setManualFatG}
          disabled={disabled}
        />
      </div>

      {check === null ? (
        <Note tone="warning" icon={<TriangleAlert aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />}>
          Completá calorías entre 800 y 10000 y macros de 0 a 1500 g para guardar.
        </Note>
      ) : check.matches ? (
        <Note tone="muted" icon={<Check aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-[var(--success)]" />}>
          Tus macros suman <span className="font-mono text-[var(--foreground)]">{check.macroKcal} kcal</span>: coinciden.
        </Note>
      ) : (
        <Note tone="warning" icon={<TriangleAlert aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />}>
          Tus macros suman <span className="font-mono">{check.macroKcal} kcal</span> y no coinciden con tus calorías.
          Revisalos.
        </Note>
      )}
    </div>
  );
}

function ManualField({
  id,
  label,
  unit,
  color,
  value,
  onChange,
  disabled,
  className,
}: {
  id: string;
  label: string;
  unit: string;
  color?: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  className?: string;
}) {
  return (
    <div className={cn("grid min-w-0 gap-1.5", className)}>
      <label htmlFor={id} className="flex items-center gap-1.5 text-[13px] font-medium text-[var(--foreground-muted)]">
        {color ? <span aria-hidden="true" className="size-2 shrink-0 rounded-full" style={{ backgroundColor: color }} /> : null}
        {label}
      </label>
      <div className="relative">
        <Input
          id={id}
          inputMode="numeric"
          autoComplete="off"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          className={cn("h-12 font-mono tabular-nums", unit.length > 1 ? "pr-12" : "pr-8")}
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-[var(--foreground-muted)]"
        >
          {unit}
        </span>
      </div>
    </div>
  );
}

function Note({ tone, icon, children }: { tone: "muted" | "warning"; icon: ReactNode; children: ReactNode }) {
  return (
    <p
      role="status"
      className={cn(
        "flex items-start gap-2 text-[13px] leading-snug",
        tone === "warning" ? "text-[var(--warning)]" : "text-[var(--foreground-muted)]",
      )}
    >
      {icon}
      <span>{children}</span>
    </p>
  );
}
