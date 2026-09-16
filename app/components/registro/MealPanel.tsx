import { ChevronRight, MoreHorizontal, Plus, Search } from "lucide-react";

import { FrequentRows, type QuickRow } from "@/app/components/registro/FrequentRows";
import { NEUTRAL_BUTTON_CLASS, PANEL_TITLE_CLASS, PANEL_TITLE_SIZES } from "@/app/components/registro/styles";
import { Button } from "@/app/components/ui/Button";
import { LoadingDots } from "@/app/components/ui/LoadingDots";
import { formatItemAmount } from "@/app/lib/meal-amounts";
import { titleScale, type DiaryTab } from "@/app/lib/meal-diary";
import type { MealGroup, MealLogItem } from "@/app/lib/meal-logs";
import { cn } from "@/app/lib/utils";

/**
 * Panel de una comida (DESIGN.md §14): nombre en Display XXL, meta, "Agregar" en línea y sus alimentos.
 * El CTA es emerald solo en la comida que sigue; en el resto es neutro.
 */
export function MealPanel({
  idPrefix,
  tab,
  meta,
  addLabel,
  primary,
  addPending,
  quick,
  onAdd,
  onQuickAdd,
  onSearch,
  onOpenItem,
  onOpenMenu,
}: {
  idPrefix: string;
  tab: DiaryTab<MealGroup>;
  meta: string;
  addLabel: string;
  primary: boolean;
  addPending: boolean;
  quick: { rows: QuickRow[]; pendingKeys: ReadonlySet<string>; addedKeys: ReadonlySet<string> } | null;
  onAdd: () => void;
  onQuickAdd: (row: QuickRow) => void;
  onSearch: () => void;
  onOpenItem: (item: MealLogItem) => void;
  onOpenMenu: () => void;
}) {
  const items = tab.meal?.items ?? [];
  const AddIcon = primary ? Search : Plus;

  return (
    <div className="grid content-start gap-4 pb-2 pt-1">
      <div className="grid gap-1.5">
        <h2 id={`${idPrefix}-title-${tab.key}`} tabIndex={-1} className={cn(PANEL_TITLE_SIZES[titleScale(tab.label)], PANEL_TITLE_CLASS)}>
          {tab.label}
        </h2>
        <div className="flex min-h-11 items-center justify-between gap-2">
          <p className="min-w-0 text-[15px] leading-snug text-[var(--foreground-muted)]">{meta}</p>
          {tab.meal ? (
            <button
              type="button"
              onClick={onOpenMenu}
              aria-haspopup="dialog"
              aria-label={`Opciones de ${tab.label}`}
              className="pressable -mr-2 grid size-11 shrink-0 place-items-center rounded-full text-[var(--foreground-muted)] outline-none hover:text-[var(--foreground)] focus-visible:shadow-[var(--focus-glow)]"
            >
              <MoreHorizontal aria-hidden="true" className="size-5" />
            </button>
          ) : null}
        </div>
      </div>

      {primary ? (
        <Button type="button" onClick={onAdd} className="h-14 w-full rounded-2xl text-base font-bold">
          {addPending ? <LoadingDots /> : <AddIcon aria-hidden="true" className="size-[18px]" />}
          {addLabel}
        </Button>
      ) : (
        <button type="button" onClick={onAdd} className={NEUTRAL_BUTTON_CLASS}>
          {addPending ? <LoadingDots /> : <AddIcon aria-hidden="true" className="size-[18px]" />}
          {addLabel}
        </button>
      )}

      {items.length > 0 ? (
        <ul aria-label={`Alimentos de ${tab.label}`} className="border-y border-[var(--border)]">
          {items.map((item) => (
            <li key={item.id} className="border-b border-[var(--border)] last:border-b-0">
              <button
                type="button"
                onClick={() => onOpenItem(item)}
                aria-haspopup="dialog"
                className="pressable flex min-h-[60px] w-full items-center gap-3 text-left outline-none focus-visible:shadow-[var(--focus-glow)]"
              >
                <span className="grid min-w-0 flex-1 gap-0.5">
                  <span className="truncate text-[15px] font-medium text-[var(--foreground)]">{item.name}</span>
                  <span className="font-mono text-[13px] tabular-nums text-[var(--foreground-muted)]">
                    {formatItemAmount(item, ",")}
                  </span>
                </span>
                <span className="shrink-0 font-mono text-[15px] tabular-nums text-[var(--foreground)]">
                  {item.kcal}
                  <span className="ml-1 font-sans text-[12px] text-[var(--foreground-muted)]">kcal</span>
                </span>
                <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-[var(--foreground-muted)]" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {quick ? (
        <FrequentRows
          headingId={`${idPrefix}-frequents-${tab.key}`}
          rows={quick.rows}
          pendingKeys={quick.pendingKeys}
          addedKeys={quick.addedKeys}
          onQuickAdd={onQuickAdd}
          onSearch={onSearch}
        />
      ) : null}
    </div>
  );
}
