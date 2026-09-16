import Link from "next/link";
import { Plus } from "lucide-react";

import { HomeSectionHeader } from "@/app/components/home/HomeSectionHeader";
import { GoalSetupStep } from "@/app/components/shared/GoalSetupStep";
import { Button } from "@/app/components/ui/Button";
import { AnimatedMacroBar } from "@/app/components/ui/motion";
import type { MealRow } from "@/app/lib/home-dashboard";
import { MACRO_COLORS } from "@/app/lib/nutrition-style";
import type { Macros } from "@/app/lib/nutrition-types";
import { cn } from "@/app/lib/utils";

/** Z4 · nutrición del día: kcal restantes, macros y comidas en filas con "+" (D4-b). */
export function HomeNutrition({
  hasProfile,
  totalKcal,
  targetKcal,
  totalMacros,
  targetMacros,
  mealRows,
  primary,
}: {
  hasProfile: boolean;
  totalKcal: number;
  targetKcal: number;
  totalMacros: Macros;
  targetMacros: Macros;
  mealRows: MealRow[];
  /** El CTA emerald de la pantalla vive acá (hoy ya entrenaste o semana cerrada). */
  primary: boolean;
}) {
  const remaining = Math.round(targetKcal - totalKcal);
  const isOver = remaining < 0;
  const macros = [
    { label: "Proteína", value: totalMacros.proteinG, target: targetMacros.proteinG, color: MACRO_COLORS.protein },
    { label: "Carbos", value: totalMacros.carbsG, target: targetMacros.carbsG, color: MACRO_COLORS.carbs },
    { label: "Grasas", value: totalMacros.fatG, target: targetMacros.fatG, color: MACRO_COLORS.fat },
  ];

  return (
    <section aria-labelledby="home-nutrition-title" className="grid gap-4">
      <HomeSectionHeader
        id="home-nutrition-title"
        title="Nutrición"
        action={hasProfile && !primary ? { href: "/nutricion/registro", label: "Registrar" } : undefined}
      />

      {hasProfile ? (
        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-5">
          <div>
            <p className="font-display text-5xl font-bold leading-none tracking-[-0.03em] tabular-nums text-[var(--foreground)]">
              {isOver ? `+${Math.abs(remaining)}` : remaining}
            </p>
            <p
              className={cn(
                "mt-1.5 text-sm font-medium",
                isOver ? "text-[var(--warning)]" : "text-[var(--foreground-muted)]",
              )}
            >
              {isOver ? "kcal por encima" : "kcal restantes"}
            </p>
          </div>
          <div className="grid gap-2.5">
            {macros.map(({ label, value, target, color }) => (
              <div key={label} className="grid gap-1.5">
                <div className="flex items-center justify-between gap-2 text-[13px] font-semibold text-[var(--foreground)]">
                  <span>{label}</span>
                  <span className="font-mono text-xs font-normal tabular-nums text-[var(--foreground-muted)]">
                    {Math.round(value)}/{Math.round(target)}g
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-[var(--card-alt)]">
                  <AnimatedMacroBar
                    pct={target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0}
                    color={color}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <GoalSetupStep detail="Con tu peso, altura y actividad armamos el objetivo diario." />
      )}

      {primary ? (
        <Button asChild className="h-14 rounded-2xl text-base font-bold">
          <Link href="/nutricion/registro">
            <Plus aria-hidden="true" className="size-4" />
            Registrar comida
          </Link>
        </Button>
      ) : null}

      <ul aria-label="Comidas de hoy">
        {mealRows.map((row) => (
          <li
            key={row.key}
            className="grid min-h-14 grid-cols-[minmax(0,1fr)_auto_2.75rem] items-center gap-3 border-t border-[var(--border)] first:border-t-0"
          >
            <span className="truncate text-base font-semibold text-[var(--foreground)]">{row.label}</span>
            {row.kcal != null ? (
              <span className="font-display text-lg font-bold tabular-nums text-[var(--foreground)]">
                {row.kcal}
                <span className="ml-1 font-sans text-sm font-medium text-[var(--foreground-muted)]">kcal</span>
              </span>
            ) : (
              <span className="text-[var(--foreground-muted)]">
                <span aria-hidden="true">—</span>
                <span className="sr-only">sin registrar</span>
              </span>
            )}
            <Link
              href={row.href}
              aria-label={`Agregar a ${row.label}`}
              className="pressable grid size-11 place-items-center rounded-full bg-[var(--card-alt)] text-[var(--accent-bright)] hover:bg-[var(--card-hover)]"
            >
              <Plus aria-hidden="true" className="size-[18px]" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
