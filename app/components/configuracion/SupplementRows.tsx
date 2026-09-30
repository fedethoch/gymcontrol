import { ChevronRight, Pill } from "lucide-react";

import { HomeSectionHeader } from "@/app/components/home/HomeSectionHeader";

/** Z3a · Suplementos: una fila con la cantidad marcada que abre S8 (DESIGN.md §15.1). */
export function SupplementRows({ activeCount, onOpen }: { activeCount: number; onOpen: () => void }) {
  return (
    <section aria-labelledby="supplements-title" className="flex flex-col gap-3">
      <HomeSectionHeader id="supplements-title" title="Suplementos" />
      <div className="border-t border-[var(--border)]">
        <button
          type="button"
          onClick={onOpen}
          className="flex min-h-[52px] w-full items-center gap-3 border-b border-[var(--border)] py-2.5 text-left outline-none transition-colors active:bg-[var(--card)] focus-visible:shadow-[var(--focus-glow)]"
        >
          <Pill aria-hidden="true" className="size-[18px] shrink-0 text-[var(--foreground-muted)]" />
          <span className="flex-1 text-[15px] font-medium text-[var(--foreground)]">Tus suplementos</span>
          <span className="text-[15px] text-[var(--foreground-muted)]">
            {activeCount > 0 ? `${activeCount} ${activeCount === 1 ? "activo" : "activos"}` : "Elegir"}
          </span>
          <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-[var(--foreground-subtle)]" />
        </button>
      </div>
    </section>
  );
}
