import { Plus } from "lucide-react";

/** Z1 · título de la pantalla, conteo y "+" neutro para crear (DESIGN.md §13.1). */
export function FoodsHeader({ meta, onCreate }: { meta: string; onCreate?: () => void }) {
  return (
    <header className="flex items-end justify-between gap-3 pt-2">
      <div className="min-w-0">
        <h1 className="font-display text-[2rem] font-bold leading-[1.1] tracking-[-0.03em] text-[var(--foreground)]">
          Alimentos
        </h1>
        <p className="mt-1 font-mono text-[0.8125rem] tabular-nums text-[var(--foreground-muted)]">{meta}</p>
      </div>
      {onCreate ? (
        <button
          type="button"
          onClick={onCreate}
          aria-label="Crear alimento"
          className="pressable grid size-11 shrink-0 place-items-center rounded-full bg-[var(--card-alt)] text-[var(--accent-bright)] outline-none hover:bg-[var(--card-hover)] focus-visible:shadow-[var(--focus-glow)]"
        >
          <Plus aria-hidden="true" className="size-5" />
        </button>
      ) : null}
    </header>
  );
}
