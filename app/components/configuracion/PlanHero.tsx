import type { ReactNode } from "react";
import { Check, TriangleAlert } from "lucide-react";

import { AnimatedNumber } from "@/app/components/ui/motion";
import { MACRO_COLORS } from "@/app/lib/nutrition-style";
import type { Goal, ManualTarget, NutritionPlan } from "@/app/lib/nutrition-types";
import { checkManualTarget, GOAL_COPY, macroSplit } from "@/app/lib/profile-plan";
import { cn } from "@/app/lib/utils";

const MACRO_SHORT_LABELS = { protein: "Proteína", carbs: "Carbos", fat: "Grasas" } as const;

/** Z2 · el objetivo diario como protagonista y la cuenta que lo explica (DESIGN.md §15.1). */
export function PlanHero({
  plan,
  calculatedKcal,
  manualTarget,
  goal,
}: {
  plan: NutritionPlan;
  calculatedKcal: number;
  manualTarget: ManualTarget | null;
  goal: Goal;
}) {
  const split = macroSplit(plan.macros);
  const macros = [
    { key: "protein", grams: plan.macros.proteinG, pct: split.protein },
    { key: "carbs", grams: plan.macros.carbsG, pct: split.carbs },
    { key: "fat", grams: plan.macros.fatG, pct: split.fat },
  ] as const;

  return (
    <section aria-labelledby="plan-title" className="flex flex-col gap-4">
      <h2
        id="plan-title"
        className="text-[0.6875rem] font-semibold uppercase leading-normal tracking-[0.08em] text-[var(--foreground-muted)]"
      >
        Tu objetivo diario{manualTarget ? " · fijado a mano" : ""}
      </h2>

      <p className="flex items-baseline gap-2">
        <AnimatedNumber
          value={plan.targetKcal}
          className="font-display text-[clamp(2.75rem,14.5vw,3.625rem)] font-extrabold leading-[0.88] tracking-[-0.05em] tabular-nums text-[var(--foreground)]"
        />
        <span className="text-base font-medium text-[var(--foreground-muted)]">kcal</span>
      </p>

      {manualTarget ? (
        <ManualCheck target={manualTarget} calculatedKcal={calculatedKcal} />
      ) : (
        <Equation plan={plan} goal={goal} />
      )}

      <dl className="grid grid-cols-3">
        {macros.map((macro, index) => (
          <div
            key={macro.key}
            className={cn("flex min-w-0 flex-col gap-1.5", index > 0 && "border-l border-[var(--border)] pl-3")}
          >
            <dt className="order-2 flex min-w-0 items-center gap-1.5 text-[13px] font-medium text-[var(--foreground-muted)]">
              <span aria-hidden="true" className="size-2 shrink-0 rounded-full" style={{ backgroundColor: MACRO_COLORS[macro.key] }} />
              {MACRO_SHORT_LABELS[macro.key]}
            </dt>
            <dd className="order-1 font-display text-[1.75rem] font-bold leading-none tracking-[-0.03em] tabular-nums text-[var(--foreground)]">
              <AnimatedNumber value={macro.grams} />
              <span className="ml-1 font-sans text-base font-medium tracking-normal text-[var(--foreground-muted)]">g</span>
            </dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-1.5">
        <div aria-hidden="true" className="flex h-1.5 gap-0.5 overflow-hidden rounded-full">
          {macros.map((macro) => (
            <span
              key={macro.key}
              className="h-full basis-0"
              style={{ flexGrow: macro.pct, backgroundColor: MACRO_COLORS[macro.key] }}
            />
          ))}
        </div>
        <p aria-hidden="true" className="flex gap-0.5 font-mono text-xs tabular-nums text-[var(--foreground-muted)]">
          {macros.map((macro) => (
            <span key={macro.key} className="min-w-[3ch] basis-0" style={{ flexGrow: macro.pct }}>
              {macro.pct}%
            </span>
          ))}
        </p>
        <p className="sr-only">
          Reparto de calorías: proteína {split.protein}%, carbohidratos {split.carbs}%, grasas {split.fat}%.
        </p>
      </div>
    </section>
  );
}

function Equation({ plan, goal }: { plan: NutritionPlan; goal: Goal }) {
  // Si el déficit tocó el metabolismo basal, la cuenta muestra lo que realmente se aplicó.
  const adjustment = plan.clampedToBmr ? plan.targetKcal / plan.maintenanceKcal - 1 : plan.adjustment;
  const pct = `${Math.round(Math.abs(adjustment) * 100)}%`;
  const sign = adjustment < 0 ? "−" : "+";

  return (
    <div className="border-y border-[var(--border)] py-3">
      <div aria-hidden="true" className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-2">
        <EquationCell value={<AnimatedNumber value={plan.maintenanceKcal} />} label="Mantenimiento" />
        <EquationOperator>{sign}</EquationOperator>
        <EquationCell value={pct} label={GOAL_COPY[goal].label} />
        <EquationOperator>=</EquationOperator>
        <EquationCell value={<AnimatedNumber value={plan.targetKcal} />} label="Objetivo" />
      </div>
      <p className="sr-only">
        Mantenimiento {plan.maintenanceKcal} kcal, {adjustment < 0 ? "menos" : "más"} {pct} por {GOAL_COPY[goal].label}:{" "}
        {plan.targetKcal} kcal.
      </p>
    </div>
  );
}

function EquationCell({ value, label }: { value: ReactNode; label: string }) {
  return (
    <div className="min-w-0">
      <p className="font-display text-xl font-bold tracking-[-0.02em] tabular-nums text-[var(--foreground)]">{value}</p>
      <p className="truncate text-xs font-medium text-[var(--foreground-muted)]">{label}</p>
    </div>
  );
}

function EquationOperator({ children }: { children: ReactNode }) {
  return <span className="pb-[18px] font-mono text-base text-[var(--foreground-subtle)]">{children}</span>;
}

function ManualCheck({ target, calculatedKcal }: { target: ManualTarget; calculatedKcal: number }) {
  const { macroKcal, matches } = checkManualTarget(target);

  return (
    <p
      className={cn(
        "flex items-start gap-2 border-y border-[var(--border)] py-3 text-[13px] leading-snug",
        matches ? "text-[var(--foreground-muted)]" : "text-[var(--warning)]",
      )}
    >
      {matches ? (
        <Check aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-[var(--success)]" />
      ) : (
        <TriangleAlert aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
      )}
      <span>
        Tus macros suman <span className="font-mono text-[var(--foreground)]">{macroKcal} kcal</span>
        {matches ? "" : ", no coinciden con tus calorías"}. Calculado con tus datos daría{" "}
        <span className="font-mono text-[var(--foreground)]">{calculatedKcal}</span>.
      </span>
    </p>
  );
}
