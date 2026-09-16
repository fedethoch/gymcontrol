import { ArcGauge } from "@/app/components/ui/ArcGauge";
import { AnimatedNumber } from "@/app/components/ui/motion";
import { AnimatedProgressRing } from "@/app/components/ui/ProgressRing";
import { GoalSetupStep } from "@/app/components/shared/GoalSetupStep";
import type { Budget, MacroKey } from "@/app/lib/meal-diary";
import { MACRO_COLORS } from "@/app/lib/nutrition-style";

const MACROS: Record<MacroKey, { label: string; name: string; color: string }> = {
  protein: { label: "proteína", name: "Proteína", color: MACRO_COLORS.protein },
  carbs: { label: "carbos", name: "Carbohidratos", color: MACRO_COLORS.carbs },
  fat: { label: "grasas", name: "Grasas", color: MACRO_COLORS.fat },
};

/** Presupuesto del día: medidor con las kcal restantes y anillos con los gramos que faltan (DESIGN.md §14). */
export function BudgetBlock({ budget, dayReference }: { budget: Budget; dayReference: string }) {
  if (budget.state === "no_profile" || budget.targetKcal === null || budget.macros === null) {
    return <GoalSetupStep detail={`${budget.consumedKcal} kcal registradas ${dayReference}.`} />;
  }

  const over = budget.state === "over";
  const tone = over ? "var(--warning)" : budget.state === "on_target" ? "var(--success)" : "var(--foreground)";
  const label = over ? "kcal por encima" : budget.state === "on_target" ? "kcal · en objetivo" : "kcal restantes";
  const summary = [
    over
      ? `Te pasaste ${-budget.remainingKcal} kcal del objetivo de ${budget.targetKcal}.`
      : `Quedan ${budget.remainingKcal} kcal de ${budget.targetKcal}.`,
    ...budget.macros.map((macro) =>
      macro.over
        ? `${MACROS[macro.key].name}: ${-macro.remaining} g de más.`
        : `${MACROS[macro.key].name}: faltan ${macro.remaining} g.`,
    ),
  ].join(" ");

  return (
    <section aria-label="Presupuesto del día" className="grid gap-3">
      <p className="sr-only">{summary}</p>

      <div aria-hidden="true" className="grid gap-3 [@media(max-height:700px)]:gap-2">
        {/* En pantallas bajas el bloque se compacta para que el CTA del panel quede arriba del fold. */}
        <ArcGauge value={budget.progress} color={tone} className="mx-auto max-w-[260px] [@media(max-height:700px)]:max-w-[200px]">
          <p
            className="font-display text-[2.875rem] font-bold leading-none tracking-[-0.03em] tabular-nums [@media(max-height:700px)]:text-[2.25rem]"
            style={{ color: tone === "var(--foreground)" ? undefined : tone }}
          >
            {over ? "+" : null}
            <AnimatedNumber value={Math.abs(budget.remainingKcal)} />
          </p>
          <p
            className="mt-1.5 text-[13px] font-medium"
            style={{ color: over ? tone : "var(--foreground-muted)" }}
          >
            {label}
          </p>
        </ArcGauge>

        <div className="flex items-center justify-between text-[13px] text-[var(--foreground-muted)]">
          <span>
            Comiste <span className="font-mono font-medium tabular-nums text-[var(--foreground)]">{budget.consumedKcal}</span>
          </span>
          <span>
            Objetivo <span className="font-mono font-medium tabular-nums text-[var(--foreground)]">{budget.targetKcal}</span>
          </span>
        </div>

        <ul className="grid grid-cols-3 gap-2">
          {budget.macros.map((macro) => (
            <li key={macro.key} className="grid justify-items-center gap-1.5 text-center">
              <AnimatedProgressRing
                value={macro.progress * 100}
                size={48}
                strokeWidth={5}
                trackColor="var(--card-alt)"
                progressColor={MACROS[macro.key].color}
              >
                <span />
              </AnimatedProgressRing>
              <p
                className="font-mono text-[15px] font-semibold leading-none tabular-nums"
                style={{ color: macro.over ? "var(--warning)" : "var(--foreground)" }}
              >
                {macro.over ? `+${-macro.remaining}` : macro.remaining}g
              </p>
              <p className="text-[12px] leading-tight text-[var(--foreground-muted)]">
                {MACROS[macro.key].label}
                <br />
                {macro.over ? "de más" : "restante"}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
