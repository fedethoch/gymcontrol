import Link from "next/link";
import { ChevronRight } from "lucide-react";

const NEUTRAL_BUTTON =
  "pressable inline-flex h-[52px] items-center justify-center gap-2 rounded-2xl px-5 text-[15px] font-semibold outline-none focus-visible:shadow-[var(--focus-glow)]";

/** Búsqueda + filtros sin coincidencias (DESIGN.md §16.2). */
export function CatalogNoResults({
  message,
  onRemoveFilters,
  onClearSearch,
}: {
  message: string;
  onRemoveFilters?: () => void;
  onClearSearch?: () => void;
}) {
  return (
    <div className="grid justify-items-start gap-3 pt-8">
      <h2 className="font-display text-[2.5rem] font-extrabold uppercase leading-[0.95] tracking-[-0.05em] text-[var(--foreground)]">
        Sin
        <br />
        resultados
      </h2>
      <p className="max-w-[32ch] text-[15px] leading-snug text-[var(--foreground-muted)]">{message}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {onRemoveFilters ? (
          <button type="button" onClick={onRemoveFilters} className={`${NEUTRAL_BUTTON} bg-white/10 text-white hover:bg-white/15`}>
            Quitar filtros
          </button>
        ) : null}
        {onClearSearch ? (
          <button
            type="button"
            onClick={onClearSearch}
            className={
              onRemoveFilters
                ? `${NEUTRAL_BUTTON} text-[var(--foreground)] hover:bg-white/5`
                : `${NEUTRAL_BUTTON} bg-white/10 text-white hover:bg-white/15`
            }
          >
            Borrar búsqueda
          </button>
        ) : null}
      </div>
    </div>
  );
}

/** Sin rutinas publicadas (DESIGN.md §16.2). */
export function CatalogEmpty() {
  return (
    <div className="grid justify-items-start gap-3.5 pt-[clamp(6rem,24svh,9.5rem)]">
      <p className="text-[13px] font-medium text-[var(--foreground-muted)]">Catálogo</p>
      <h1 className="font-display text-[clamp(2.75rem,14.5vw,3.625rem)] font-extrabold uppercase leading-[0.88] tracking-[-0.05em] text-white">
        Pronto
        <br />
        hay más
      </h1>
      <p className="max-w-[30ch] text-[15px] font-medium leading-snug text-white/80">
        Todavía no hay rutinas publicadas. Mientras tanto, podés revisar tu semana.
      </p>
      <Link href="/rutinas" className={`${NEUTRAL_BUTTON} mt-3 w-full bg-white/10 text-white hover:bg-white/15`}>
        Ir a Rutina
        <ChevronRight aria-hidden="true" className="size-4" />
      </Link>
    </div>
  );
}
