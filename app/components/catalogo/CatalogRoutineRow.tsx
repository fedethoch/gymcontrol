import Link from "next/link";
import { Check, ChevronRight } from "lucide-react";

import { RoutineCoverImage } from "@/app/components/shared/RoutineCoverImage";
import { highlightSegments, type CatalogRoutine, type SavedStatus } from "@/app/lib/routine-catalog";
import { ROUTINE_DIFFICULTY_LABELS, ROUTINE_OBJECTIVE_LABELS } from "@/app/lib/routine-metadata";
import { cn } from "@/app/lib/utils";

/** Lista de rutinas en filas, sin cajas (DESIGN.md §16.3). */
export function CatalogRoutineList({
  routines,
  statusById,
  query = "",
  className,
}: {
  routines: CatalogRoutine[];
  statusById: Record<string, SavedStatus>;
  query?: string;
  className?: string;
}) {
  return (
    <ol className={cn("border-y border-[var(--border)]", className)}>
      {routines.map((routine) => (
        <li key={routine.id} className="border-b border-[var(--border)] last:border-b-0">
          <CatalogRoutineRow routine={routine} status={statusById[routine.id] ?? null} query={query} />
        </li>
      ))}
    </ol>
  );
}

export function CatalogRoutineRow({
  routine,
  status,
  query = "",
}: {
  routine: CatalogRoutine;
  status: SavedStatus | null;
  query?: string;
}) {
  return (
    <Link
      href={`/catalogo/rutinas/${routine.id}`}
      className="pressable flex min-h-[92px] items-center gap-3.5 py-3 outline-none focus-visible:shadow-[var(--focus-glow)]"
    >
      <span className="relative size-16 shrink-0 overflow-hidden rounded-[14px] border border-[var(--border)] bg-[var(--card)]">
        <RoutineCoverImage imageUrl={routine.imageUrl} sizes="64px" tone="card" />
      </span>
      <span className="grid min-w-0 flex-1 gap-1">
        <span className="line-clamp-2 font-display text-[clamp(0.9375rem,4.4vw,1.0625rem)] font-semibold leading-snug tracking-[-0.01em] text-[var(--foreground)]">
          {highlightSegments(routine.displayName, query).map((segment, index) =>
            segment.match ? (
              <mark key={index} className="rounded-[3px] bg-[var(--accent)]/25 text-[var(--foreground)]">
                {segment.text}
              </mark>
            ) : (
              <span key={index}>{segment.text}</span>
            ),
          )}
        </span>
        <span className="truncate text-[13px] text-[var(--foreground-muted)]">
          {ROUTINE_DIFFICULTY_LABELS[routine.difficulty]} · {ROUTINE_OBJECTIVE_LABELS[routine.objective]} ·{" "}
          {routine.itemCount} ejercicios
        </span>
        {status === "active" ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--foreground)]">
            <span aria-hidden="true" className="size-[7px] rounded-full bg-[var(--accent)]" />
            Tu rutina activa
          </span>
        ) : status === "saved" ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--foreground-muted)]">
            <Check aria-hidden="true" className="size-3.5" strokeWidth={2.5} />
            Guardada
          </span>
        ) : null}
      </span>
      <ChevronRight aria-hidden="true" className="size-[18px] shrink-0 text-[var(--foreground-subtle)]" />
    </Link>
  );
}
