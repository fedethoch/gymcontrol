import { Check, Plus } from "lucide-react";

import { LoadingDots } from "@/app/components/ui/LoadingDots";
import type { Amount, PickerOption } from "@/app/lib/meal-amounts";
import { cn } from "@/app/lib/utils";

export type QuickRow = {
  key: string;
  option: PickerOption;
  amount: Amount;
  /** "190 g", "2 u", "1 porción". */
  amountLabel: string;
  kcal: number;
};

/** "Tus frecuentes": el "+" agrega con la última cantidad usada, sin pasos (N-D3). */
export function FrequentRows({
  headingId,
  rows,
  pendingKeys,
  addedKeys,
  onQuickAdd,
  onSearch,
}: {
  headingId: string;
  rows: QuickRow[];
  pendingKeys: ReadonlySet<string>;
  addedKeys: ReadonlySet<string>;
  onQuickAdd: (row: QuickRow) => void;
  onSearch: () => void;
}) {
  return (
    <section aria-labelledby={headingId} className="grid gap-1">
      <div className="flex min-h-11 items-center justify-between gap-3">
        <h3 id={headingId} className="font-display text-[1.0625rem] font-semibold leading-tight text-[var(--foreground)]">
          Tus frecuentes
        </h3>
        <button
          type="button"
          onClick={onSearch}
          className="pressable -mr-2 inline-flex min-h-11 items-center rounded-lg px-2 text-sm font-semibold text-[var(--accent-bright)] outline-none focus-visible:shadow-[var(--focus-glow)]"
        >
          Buscar
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="border-t border-[var(--border)] pt-3 text-sm text-[var(--foreground-muted)]">
          Lo que más registres va a aparecer acá, a un toque.
        </p>
      ) : (
        <ul className="border-t border-[var(--border)]">
          {rows.map((row) => {
            const isPending = pendingKeys.has(row.key);
            const isAdded = addedKeys.has(row.key);

            return (
              <li
                key={row.key}
                className="flex min-h-14 items-center gap-3 border-b border-[var(--border)] py-1.5 last:border-b-0"
              >
                <span className="grid min-w-0 flex-1 gap-0.5">
                  <span className="truncate text-[15px] font-medium text-[var(--foreground)]">{row.option.name}</span>
                  <span className="truncate font-mono text-[13px] tabular-nums text-[var(--foreground-muted)]">
                    {row.amountLabel} · {row.kcal} kcal
                  </span>
                </span>
                <button
                  type="button"
                  data-quick-key={row.key}
                  onClick={() => onQuickAdd(row)}
                  disabled={isPending}
                  aria-label={`Agregar ${row.amountLabel} de ${row.option.name}`}
                  className={cn(
                    "pressable grid size-11 shrink-0 place-items-center rounded-full text-[var(--accent-bright)] outline-none focus-visible:shadow-[var(--focus-glow)] disabled:cursor-wait",
                    isAdded ? "bg-[rgba(16,185,129,0.16)]" : "bg-[var(--card-alt)] hover:bg-[var(--card-hover)]",
                  )}
                >
                  {isPending ? (
                    <LoadingDots />
                  ) : isAdded ? (
                    <Check aria-hidden="true" className="motion-pop-in size-[18px]" strokeWidth={2.5} />
                  ) : (
                    <Plus aria-hidden="true" className="size-[18px]" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
