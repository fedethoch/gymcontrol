"use client";

import { Check, CloudOff, List, LoaderCircle, TriangleAlert, X } from "lucide-react";

import { cn } from "@/app/lib/utils";
import type { SyncStatus } from "@/app/lib/workout-sync-queue";

/** Z1 · salida, progreso por ejercicio, lista del día y estado de guardado (DESIGN.md §11.1). */
export function WorkoutTopBar({
  fractions,
  doneSets,
  plannedSets,
  subtitle,
  status,
  hasStarted,
  exerciseCount,
  onExit,
  onOpenList,
  onRetry,
}: {
  fractions: number[];
  doneSets: number;
  plannedSets: number;
  subtitle: string;
  status: SyncStatus;
  hasStarted: boolean;
  exerciseCount: number;
  onExit: () => void;
  onOpenList: () => void;
  onRetry: () => void;
}) {
  return (
    <div className="grid gap-2.5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onExit}
          aria-label="Salir del entrenamiento"
          className="pressable grid size-11 shrink-0 place-items-center rounded-full border border-[var(--border-strong)] bg-[var(--card)] text-[var(--foreground)] outline-none focus-visible:shadow-[var(--focus-glow)]"
        >
          <X aria-hidden="true" className="size-5" />
        </button>

        <div
          role="progressbar"
          aria-label="Series hechas"
          aria-valuemin={0}
          aria-valuemax={plannedSets}
          aria-valuenow={doneSets}
          className="flex flex-1 gap-1"
        >
          {fractions.map((fraction, index) => (
            <span key={index} className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--border-strong)]">
              <span
                className="block h-full rounded-full bg-[var(--accent-bright)] transition-[width] duration-300"
                style={{ width: `${Math.round(fraction * 100)}%` }}
              />
            </span>
          ))}
        </div>

        <p className="shrink-0 font-mono text-[13px] tabular-nums text-[var(--foreground-muted)]">
          <b className="font-medium text-[var(--foreground)]">{doneSets}</b>/{plannedSets}
        </p>

        <button
          type="button"
          onClick={onOpenList}
          aria-label={`Ver los ${exerciseCount} ejercicios del día`}
          className="pressable relative grid size-11 shrink-0 place-items-center rounded-full border border-[var(--border-strong)] bg-[var(--card)] text-[var(--foreground)] outline-none focus-visible:shadow-[var(--focus-glow)]"
        >
          <List aria-hidden="true" className="size-5" />
          <span className="absolute -right-1 -top-1 rounded-full bg-[var(--foreground)] px-1.5 font-mono text-[10px] leading-4 text-[var(--background)]">
            {exerciseCount}
          </span>
        </button>
      </div>

      <div className="flex items-center justify-between gap-3 pl-[3.5rem] text-[12px]">
        <p className="truncate text-[var(--foreground-muted)]">{subtitle}</p>
        <SyncIndicator status={status} hasStarted={hasStarted} onRetry={onRetry} />
      </div>
    </div>
  );
}

export function SyncIndicator({
  status,
  hasStarted,
  onRetry,
  className,
}: {
  status: SyncStatus;
  hasStarted: boolean;
  onRetry: () => void;
  className?: string;
}) {
  if (status.state === "error") {
    return (
      <button
        type="button"
        onClick={onRetry}
        className={cn(
          "pressable inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--border-strong)] px-3 py-1 text-[12px] font-semibold text-[var(--danger)] outline-none focus-visible:shadow-[var(--focus-glow)]",
          className,
        )}
      >
        <TriangleAlert aria-hidden="true" className="size-3.5" />
        Reintentar
      </button>
    );
  }

  if (status.state === "offline") {
    return (
      <span className={cn("inline-flex shrink-0 items-center gap-1.5 font-semibold text-[var(--warning)]", className)}>
        <CloudOff aria-hidden="true" className="size-3.5" />
        Sin conexión
      </span>
    );
  }

  if (status.state === "pending" || status.state === "saving") {
    return (
      <span className={cn("inline-flex shrink-0 items-center gap-1.5 text-[var(--foreground-muted)]", className)}>
        <LoaderCircle aria-hidden="true" className="size-3.5 animate-spin" />
        Guardando
      </span>
    );
  }

  return hasStarted ? (
    <span className={cn("inline-flex shrink-0 items-center gap-1.5 text-[var(--foreground-muted)]", className)}>
      <Check aria-hidden="true" className="size-3.5 text-[var(--accent-bright)]" />
      Guardado
    </span>
  ) : null;
}
