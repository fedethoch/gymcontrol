"use client";

import Link from "next/link";
import { CalendarDays, Check, ChevronRight, LogIn } from "lucide-react";
import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";

import {
  activateRoutineFromCatalogAction,
  saveRoutineFromCatalogAction,
} from "@/app/catalogo/rutinas/[id]/actions";
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
};

function SubmitButton({ className, pendingLabel, children }: { className: string; pendingLabel: string; children: ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-disabled={pending} className={className}>
      {pending ? pendingLabel : children}
    </button>
  );
}

/** Formulario de la acción principal según el estado. `compact` = versión de la barra superior. */
function ActionControl({ context, compact }: { context: ActionContext; compact: boolean }) {
  const size = compact ? SMALL : BIG;

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
        <form action={saveRoutineFromCatalogAction} className={compact ? "shrink-0" : undefined}>
          <input type="hidden" name="routineTemplateId" value={context.routineId} />
          <input type="hidden" name="intent" value="use" />
          <SubmitButton className={cn(size, PRIMARY)} pendingLabel="Guardando…">
            {compact ? "Usar" : "Usar esta rutina"}
          </SubmitButton>
        </form>
      );
    case "saved":
      return (
        <form action={activateRoutineFromCatalogAction} className={compact ? "shrink-0" : undefined}>
          <input type="hidden" name="routineTemplateId" value={context.routineId} />
          <input type="hidden" name="savedRoutineId" value={context.savedRoutineId ?? ""} />
          <SubmitButton className={cn(size, PRIMARY)} pendingLabel="Activando…">
            <Check aria-hidden="true" className="size-4" strokeWidth={2.6} />
            {compact ? "Activar" : "Activar rutina"}
          </SubmitButton>
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
