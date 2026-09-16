import { ChevronRight, Plus } from "lucide-react";

import { NEUTRAL_BUTTON_CLASS, PANEL_TITLE_CLASS, PANEL_TITLE_SIZES } from "@/app/components/registro/styles";
import { formatMealFoods, type DiaryTab } from "@/app/lib/meal-diary";
import type { MealGroup } from "@/app/lib/meal-logs";
import { cn } from "@/app/lib/utils";

/** Todas las comidas del día registradas: el día pasa a ser el protagonista, sin CTA emerald. */
export function DayClosedPanel({
  idPrefix,
  tabs,
  totalKcal,
  onSelect,
  onOtherMeal,
}: {
  idPrefix: string;
  tabs: DiaryTab<MealGroup>[];
  totalKcal: number;
  onSelect: (key: string) => void;
  onOtherMeal: () => void;
}) {
  const logged = tabs.filter((tab) => tab.status === "logged");

  return (
    <div className="grid content-start gap-4 pb-2 pt-1">
      <div className="grid gap-1.5">
        <h2 id={`${idPrefix}-title-resumen`} tabIndex={-1} className={cn(PANEL_TITLE_SIZES.xxl, PANEL_TITLE_CLASS, "line-clamp-none")}>
          <span className="block">Día</span>
          <span className="block">cerrado</span>
        </h2>
        <p className="flex min-h-11 items-center text-[15px] text-[var(--foreground-muted)]">
          {logged.length} {logged.length === 1 ? "comida" : "comidas"} · {Math.round(totalKcal)} kcal
        </p>
      </div>

      <ul aria-label="Comidas del día" className="border-y border-[var(--border)]">
        {logged.map((tab) => (
          <li key={tab.key} className="border-b border-[var(--border)] last:border-b-0">
            <button
              type="button"
              onClick={() => onSelect(tab.key)}
              className="pressable flex min-h-[60px] w-full items-center gap-3 text-left outline-none focus-visible:shadow-[var(--focus-glow)]"
            >
              <span className="grid min-w-0 flex-1 gap-0.5">
                <span className="truncate font-display text-[15px] font-semibold text-[var(--foreground)]">{tab.label}</span>
                <span className="truncate text-[13px] text-[var(--foreground-muted)]">
                  {tab.meal ? formatMealFoods(tab.meal) : ""}
                </span>
              </span>
              <span className="shrink-0 font-mono text-[15px] tabular-nums text-[var(--foreground)]">
                {tab.kcal}
                <span className="ml-1 font-sans text-[12px] text-[var(--foreground-muted)]">kcal</span>
              </span>
              <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-[var(--foreground-muted)]" />
            </button>
          </li>
        ))}
      </ul>

      <button type="button" onClick={onOtherMeal} className={NEUTRAL_BUTTON_CLASS}>
        <Plus aria-hidden="true" className="size-[18px]" />
        Otra comida
      </button>
    </div>
  );
}
