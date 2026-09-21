"use client";

import Link from "next/link";
import { CalendarDays, Check, ChevronRight, LogIn } from "lucide-react";
import { useFormStatus } from "react-dom";
import { useId, type ReactNode } from "react";

import {
  activateRoutineFromCatalogAction,
  saveRoutineFromCatalogAction,
} from "@/app/catalogo/rutinas/[id]/actions";
import { TrainingDaysButton, type TrainingDaysChoice } from "@/app/components/rutinas/TrainingDaysSheet";
import type { DetailState } from "@/app/lib/routine-detail";
import { cn } from "@/app/lib/utils";

const LOGIN_HREF = "/auth/login?reason=auth-required";

const BIG = "pressable flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-base font-bold outline-none focus-visible:shadow-[var(--focus-glow)] disabled:opacity-70";
const SMALL = "pressable inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full px-4 text-[14px] font-bold outline-none focus-visible:shadow-[var(--focus-glow)] disabled:opacity-70";
const PRIMARY = "bg-[var(--accent)] text-[var(--accent-foreground)] hover:bg-[var(--accent-strong)]";
const NEUTRAL = "bg-white/10 font-semibold text-white hover:bg-white/15";

export type ActionContext = {
  state: DetailState;
  routineId: string;
  savedRoutineId: string | null;
  archivedHref: string;
  dayCount: number;
  /** Activar pide los días de entreno (rutinas de 1 a 6 días); `null` = se activa directo. */
  schedule: TrainingDaysChoice | null;
};

function SubmitButton({ className, pendingLabel, children }: { className: string; pendingLabel: string; children: ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-disabled={pending} className={className}>
      {pending ? pendingLabel : children}
    </button>
  );
}

/**
 * Botón que envía el form. Si la rutina pide días, primero abre el selector y el sheet envía el form
 * (queda dentro del `<form>` en el árbol de React, así el botón del sheet ve el estado de envío).
 */
function StartButton({
  formId,
  schedule,
  className,
  confirmLabel,
  pendingLabel,
  children,
}: {
  formId: string;
  schedule: TrainingDaysChoice | null;
  className: string;
  confirmLabel: string;
  pendingLabel: string;
  children: ReactNode;
}) {
  if (!schedule) {
    return (
      <SubmitButton className={className} pendingLabel={pendingLabel}>
        {children}
      </SubmitButton>
    );
  }

  return (
    <TrainingDaysButton
      className={className}
      choice={schedule}
      confirmLabel={confirmLabel}
      pendingLabel={pendingLabel}
      submit={{ formId }}
    >
      {children}
    </TrainingDaysButton>
  );
}

/** Formulario de la acción principal según el estado. `compact` = versión de la barra superior. */
function ActionControl({ context, compact }: { context: ActionContext; compact: boolean }) {
  const size = compact ? SMALL : BIG;
  const formId = useId();

  switch (context.state) {
    case "guest":
      return (
        <Link href={LOGIN_HREF} className={cn(size, PRIMARY)}>
          {compact ? null : <LogIn aria-hidden="true" className="size-4" />}
          {compact ? "Entrar" : "Entrá para usarla"}
        </Link>
      );
    case "new":
      return (
        <form id={formId} action={saveRoutineFromCatalogAction} className={compact ? "shrink-0" : undefined}>
          <input type="hidden" name="routineTemplateId" value={context.routineId} />
          <input type="hidden" name="intent" value="use" />
          <StartButton
            formId={formId}
            schedule={context.schedule}
            className={cn(size, PRIMARY)}
            confirmLabel="Usar rutina"
            pendingLabel="Guardando…"
          >
            {compact ? "Usar" : "Usar esta rutina"}
          </StartButton>
        </form>
      );
    case "saved":
      return (
        <form id={formId} action={activateRoutineFromCatalogAction} className={compact ? "shrink-0" : undefined}>
          <input type="hidden" name="routineTemplateId" value={context.routineId} />
          <input type="hidden" name="savedRoutineId" value={context.savedRoutineId ?? ""} />
          <StartButton
            formId={formId}
            schedule={context.schedule}
            className={cn(size, PRIMARY)}
            confirmLabel="Activar rutina"
            pendingLabel="Activando…"
          >
            <Check aria-hidden="true" className="size-4" strokeWidth={2.6} />
            {compact ? "Activar" : "Activar rutina"}
          </StartButton>
        </form>
      );
    case "active":
      return (
        <Link href="/rutinas" className={cn(size, NEUTRAL)}>
          {compact ? null : <CalendarDays aria-hidden="true" className="size-4" />}
          Ver mi semana
          {compact ? <ChevronRight aria-hidden="true" className="size-4" /> : null}
        </Link>
      );
    case "archived":
      return (
        <Link href={context.archivedHref} className={cn(size, NEUTRAL)}>
          Ver rutinas de {context.dayCount} días
          <ChevronRight aria-hidden="true" className="size-4" />
        </Link>
      );
  }
}

/** Z3 · acción principal en el flujo, debajo de la portada (DESIGN.md §19.2). */
export function DetailAction({ context }: { context: ActionContext }) {
  return (
    <div data-detail-action="" className="grid gap-3">
      {context.state === "archived" ? (
        <p className="text-[15px] leading-snug text-[var(--foreground-muted)]">
          Esta rutina salió del catálogo y ya no se puede guardar.
        </p>
      ) : null}
      <ActionControl context={context} compact={false} />
      {context.state === "saved" ? (
        <Link
          href="/rutinas"
          className="pressable mx-auto flex h-11 items-center px-3 text-[14px] font-medium text-[var(--foreground)] outline-none focus-visible:shadow-[var(--focus-glow)]"
        >
          Ver en Mis rutinas
        </Link>
      ) : null}
    </div>
  );
}

/** La misma acción en chico, para la barra compacta. */
export function CompactDetailAction({ context }: { context: ActionContext }) {
  return <ActionControl context={context} compact />;
}
