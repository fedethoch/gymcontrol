"use client";

import { useMemo, type ReactNode } from "react";
import { Check, TriangleAlert } from "lucide-react";

import { OptionList } from "@/app/components/configuracion/OptionList";
import { OfflineNote, ProfileSheet } from "@/app/components/configuracion/ProfileSheet";
import { ProjectionPreview } from "@/app/components/configuracion/ProjectionSection";
import { Input } from "@/app/components/ui/Input";
import { SegmentedControl } from "@/app/components/ui/SegmentedControl";
import type { ProfileForm } from "@/app/configuracion/useProfileForm";
import { calculateNutritionPlan } from "@/app/lib/nutrition-calc";
import { MACRO_COLORS } from "@/app/lib/nutrition-style";
import { GOAL_INFO, GOALS, type Goal, type NutritionProfileInput, type TargetMode } from "@/app/lib/nutrition-types";
import { checkManualTarget, formatAdjustment, GOAL_COPY } from "@/app/lib/profile-plan";
import { cn } from "@/app/lib/utils";

const TARGET_MODE_OPTIONS: { value: TargetMode; label: string }[] = [
  { value: "auto", label: "Calculados" },
  { value: "manual", label: "Los fijo yo" },
];

/** Los 3 objetivos con las kcal que daría cada uno y el peso a 12 semanas del elegido (S4 y paso 6 del flujo de alta). */
export function GoalOptions({
  input,
  value,
  onChange,
  disabled,
}: {
  input: NutritionProfileInput;
  value: Goal;
  onChange: (value: Goal) => void;
  disabled?: boolean;
}) {
  const options = useMemo(
    () =>
      GOALS.map((goal) => ({
        value: goal,
        label: GOAL_COPY[goal].label,
        hint: GOAL_COPY[goal].hint,
        trailing: (
          <span className="grid justify-items-end">
            <span className="font-mono text-[15px] tabular-nums text-[var(--foreground)]">
              {calculateNutritionPlan({ ...input, goal }).targetKcal}
            </span>
            <span className="font-mono text-xs text-[var(--foreground-muted)]">
              {formatAdjustment(GOAL_INFO[goal].kcalAdjustment)}
            </span>
          </span>
        ),
      })),
    [input],
  );

  return (
    <div className="grid gap-4">
      <OptionList label="Objetivo" options={options} value={value} onChange={onChange} disabled={disabled} />
      <ProjectionPreview input={input} goal={value} />
    </div>
  );
}

/** S4 · Objetivo, con "Calculados / Los fijo yo". */
export function GoalSheet({
  open,
  onOpenChange,
  form,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: ProfileForm;
}) {
  const disabled = !form.online;
  const manual = form.targetMode === "manual";

  const modeControl = (
    <div className="grid gap-2">
      <p className="text-[13px] font-medium text-[var(--foreground)]">Calorías y macros</p>
      <SegmentedControl
        label="Calorías y macros"
        options={TARGET_MODE_OPTIONS}
        value={form.targetMode}
        onChange={form.handleTargetModeChange}
        disabled={disabled}
      />
    </div>
  );

  return (
    <ProfileSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Objetivo"
      description="Tu objetivo y si las calorías se calculan o las fijás vos. Los cambios se guardan solos."
    >
      <div className="flex flex-col gap-5 pt-2">
        {manual ? (
          <>
            {modeControl}
            <ManualTargetFields form={form} disabled={disabled} />
            <p className="text-xs text-[var(--foreground-muted)]">
              El objetivo fijo no cambia aunque modifiques tu cuerpo o tu actividad.
            </p>
          </>
        ) : (
          <>
            <GoalOptions input={form.profileInput} value={form.goal} onChange={form.setGoal} disabled={disabled} />
            {modeControl}
            <p className="-mt-2 text-xs text-[var(--foreground-muted)]">
              Los calculamos con tus datos, tu actividad y tu objetivo.
            </p>
          </>
        )}
      </div>
      {disabled ? <OfflineNote /> : null}
    </ProfileSheet>
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
