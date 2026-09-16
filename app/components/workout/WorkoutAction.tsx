"use client";

import { Check, CloudOff, LoaderCircle } from "lucide-react";

import { Button } from "@/app/components/ui/Button";
import { cn } from "@/app/lib/utils";

const RING_RADIUS = 31;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

/** Z3b · marcar la serie actual, debajo de los steppers (único CTA emerald mientras se entrena). */
export function SetDoneButton({ label, onDone }: { label: string; onDone: () => void }) {
  return (
    <Button type="button" onClick={onDone} className="h-14 w-full rounded-2xl text-base font-bold">
      <Check aria-hidden="true" className="size-5" strokeWidth={3} />
      {label}
    </Button>
  );
}

/** Descanso: ocupa el lugar de los steppers y el CTA, con el anillo y la próxima serie. */
export function RestCard({
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
    <ActionCard>
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
        <ActionButton onClick={onAdd}>+15 s</ActionButton>
        <ActionButton onClick={onSkip}>Saltar</ActionButton>
      </div>

      {nextLabel ? (
        <p className="border-t border-[var(--border)] pt-2.5 text-[13px] text-[var(--foreground-muted)]">
          Sigue: <b className="font-mono font-medium text-[var(--foreground)]">{nextLabel}</b>
        </p>
      ) : null}
    </ActionCard>
  );
}

/** Confirmación de terminar con series pendientes, inline en el lugar de la acción (nunca dialog). */
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
    <ActionCard>
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
        <ActionButton onClick={onCancel}>Seguir</ActionButton>
        <ActionButton onClick={onConfirm} disabled={finishing}>
          {finishing ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : null}
          Terminar
        </ActionButton>
      </div>
    </ActionCard>
  );
}

function ActionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid gap-3 rounded-[24px] border border-[var(--border-strong)] bg-[var(--card-alt)] p-4">
      {children}
    </div>
  );
}

function ActionButton({
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
