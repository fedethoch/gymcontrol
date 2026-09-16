"use client";

import { Check, CloudOff, List, LoaderCircle } from "lucide-react";

import { Button } from "@/app/components/ui/Button";
import { cn } from "@/app/lib/utils";

const RING_RADIUS = 31;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

/** Z5 · dock sticky sobre la bottom nav (mismo offset que `/rutinas`). */
export function WorkoutDock({ children }: { children: React.ReactNode }) {
  return (
    <div className="sticky bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-20 -mx-4 grid gap-2 bg-[linear-gradient(to_top,var(--background)_62%,rgba(5,7,11,0))] px-4 pb-1 pt-7">
      {children}
    </div>
  );
}

/** Forma normal: lista del día + marcar la serie actual (único CTA emerald mientras se entrena). */
export function SetDoneBar({
  label,
  exerciseCount,
  onOpenList,
  onDone,
}: {
  label: string;
  exerciseCount: number;
  onOpenList: () => void;
  onDone: () => void;
}) {
  return (
    <div className="flex gap-2.5">
      <button
        type="button"
        onClick={onOpenList}
        aria-label={`Ver los ${exerciseCount} ejercicios del día`}
        className="pressable relative grid size-14 shrink-0 place-items-center rounded-2xl border border-[var(--border-strong)] bg-[var(--card-alt)] text-[var(--foreground)] outline-none focus-visible:shadow-[var(--focus-glow)]"
      >
        <List aria-hidden="true" className="size-5" />
        <span className="absolute -right-1.5 -top-1.5 rounded-full bg-[var(--foreground)] px-1.5 font-mono text-[10px] text-[var(--background)]">
          {exerciseCount}
        </span>
      </button>
      <Button type="button" onClick={onDone} className="h-14 flex-1 rounded-2xl text-base font-bold">
        <Check aria-hidden="true" className="size-5" strokeWidth={3} />
        {label}
      </Button>
    </div>
  );
}

/** Forma de descanso (D-D4): el CTA se convierte en el anillo y adelanta la próxima serie. */
export function RestDock({
  remainingSeconds,
  totalSeconds,
  nextLabel,
  onAdd,
  onSkip,
}: {
  remainingSeconds: number;
  totalSeconds: number;
  nextLabel: string | null;
  onAdd: () => void;
  onSkip: () => void;
}) {
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = String(remainingSeconds % 60).padStart(2, "0");
  const progress = totalSeconds > 0 ? Math.min(1, Math.max(0, remainingSeconds / totalSeconds)) : 0;

  return (
    <DockCard>
      <div className="flex items-center gap-3.5">
        <svg viewBox="0 0 72 72" className="size-[72px] shrink-0" aria-hidden="true">
          <circle cx="36" cy="36" r={RING_RADIUS} fill="none" stroke="var(--border-strong)" strokeWidth="6" />
          <circle
            cx="36"
            cy="36"
            r={RING_RADIUS}
            fill="none"
            stroke="var(--accent-bright)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={RING_LENGTH}
            strokeDashoffset={RING_LENGTH * (1 - progress)}
            transform="rotate(-90 36 36)"
          />
        </svg>
        <p role="timer" aria-live="off" className="grid gap-1">
          <span className="font-display text-[3rem] font-bold leading-none tracking-[-0.04em] tabular-nums text-[var(--foreground)]">
            {minutes}:{seconds}
          </span>
          <span className="text-[13px] text-[var(--foreground-muted)]">descanso</span>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <DockButton onClick={onAdd}>+15 s</DockButton>
        <DockButton onClick={onSkip}>Saltar</DockButton>
      </div>

      {nextLabel ? (
        <p className="border-t border-[var(--border)] pt-2.5 text-[13px] text-[var(--foreground-muted)]">
          Sigue: <b className="font-mono font-medium text-[var(--foreground)]">{nextLabel}</b>
        </p>
      ) : null}
    </DockCard>
  );
}

/** Confirmación de terminar con series pendientes, inline en el dock (nunca dialog). */
export function FinishConfirm({
  doneSets,
  plannedSets,
  offline,
  finishing,
  onCancel,
  onConfirm,
}: {
  doneSets: number;
  plannedSets: number;
  offline: boolean;
  finishing: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <DockCard>
      <p className="text-[16px] font-medium text-[var(--foreground)]">
        Hiciste {doneSets} de {plannedSets} series. ¿Terminar igual?
      </p>
      {offline ? (
        <p className="flex items-center gap-2 text-[13px] text-[var(--warning)]">
          <CloudOff aria-hidden="true" className="size-4 shrink-0" />
          Se guarda en el teléfono y se sube al volver la conexión.
        </p>
      ) : null}
      <div className="grid grid-cols-2 gap-2">
        <DockButton onClick={onCancel}>Seguir</DockButton>
        <DockButton onClick={onConfirm} disabled={finishing}>
          {finishing ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : null}
          Terminar
        </DockButton>
      </div>
    </DockCard>
  );
}

function DockCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid gap-3 rounded-[24px] border border-[var(--border-strong)] bg-[var(--card-alt)] p-4 shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
      {children}
    </div>
  );
}

function DockButton({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "pressable inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[var(--border-strong)] text-[14px] font-medium text-[var(--foreground)] outline-none focus-visible:shadow-[var(--focus-glow)]",
        disabled && "opacity-60",
      )}
    >
      {children}
    </button>
  );
}
