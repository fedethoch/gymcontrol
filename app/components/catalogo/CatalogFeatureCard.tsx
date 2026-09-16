import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { RoutineCoverImage } from "@/app/components/shared/RoutineCoverImage";
import { buttonVariants } from "@/app/components/ui/Button";
import { dayCountLabel, type CatalogRoutine, type SavedStatus } from "@/app/lib/routine-catalog";
import { ROUTINE_DIFFICULTY_LABELS, ROUTINE_OBJECTIVE_LABELS } from "@/app/lib/routine-metadata";
import { cn } from "@/app/lib/utils";

/**
 * Card grande del catálogo (DESIGN.md §16.3). Toda la card es un solo link; el CTA es visual.
 * `ctaTone` decide el único emerald de la pantalla (`featureCtaTone`).
 */
export function CatalogFeatureCard({
  routine,
  status,
  ctaTone,
  className,
}: {
  routine: CatalogRoutine;
  status: SavedStatus | null;
  ctaTone: "primary" | "neutral";
  className?: string;
}) {
  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-[20px] border border-[var(--border)] bg-[var(--card)]",
        className,
      )}
    >
      <div className="relative h-[170px] shrink-0 overflow-hidden">
        <RoutineCoverImage imageUrl={routine.imageUrl} sizes="(max-width: 1023px) 92vw, 1px" tone="card" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(18,24,36,0)_35%,var(--card)_100%)]" />
      </div>

      <div className="relative -mt-7 flex flex-1 flex-col gap-2.5 px-4 pb-4">
        {/* En pantallas angostas se parte entre segmentos, nunca a mitad de uno. */}
        <p className="flex w-fit max-w-full flex-wrap items-center gap-x-1.5 gap-y-0.5 rounded-[14px] border border-white/15 bg-[rgba(5,7,11,0.72)] px-2.5 py-1 text-xs font-semibold leading-5 text-white">
          {status === "active" ? (
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
              <span aria-hidden="true" className="size-[7px] rounded-full bg-[var(--accent-bright)]" />
              Tu rutina activa ·
            </span>
          ) : null}
          <span className="whitespace-nowrap">
            {ROUTINE_DIFFICULTY_LABELS[routine.difficulty]} · {dayCountLabel(routine.dayCount)}
          </span>
        </p>
        <h3 className="font-display text-[1.375rem] font-bold leading-tight tracking-[-0.02em] text-[var(--foreground)]">
          {routine.displayName}
        </h3>
        <p className="text-[13px] text-[var(--foreground-muted)]">
          {ROUTINE_OBJECTIVE_LABELS[routine.objective]} · {routine.itemCount} ejercicios · {routine.seriesCount} series
        </p>
        <span
          aria-hidden="true"
          className={cn(
            "mt-auto flex h-14 w-full items-center justify-center gap-2 rounded-2xl transition-[background-color,transform] duration-200 group-active:scale-[0.985] motion-reduce:transition-none motion-reduce:group-active:scale-100",
            ctaTone === "primary"
              ? cn(buttonVariants(), "h-14 w-full rounded-2xl text-base font-bold group-hover:bg-[var(--accent-strong)]")
              : "bg-white/10 text-[15px] font-semibold text-white group-hover:bg-white/15",
          )}
        >
          Ver rutina
          <ArrowRight className="size-4" />
        </span>
      </div>

      <Link
        href={`/catalogo/rutinas/${routine.id}`}
        aria-label={`Ver rutina ${routine.displayName}`}
        className="absolute inset-0 z-10 rounded-[20px] outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--accent),var(--focus-glow)]"
      />
    </article>
  );
}
