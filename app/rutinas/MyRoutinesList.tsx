"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  activateSavedRoutineAction,
  deactivateSavedRoutineAction,
  deleteSavedRoutineAction,
} from "@/app/rutinas/actions";
import { Button } from "@/app/components/ui/Button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/app/components/ui/Drawer";

export type MyRoutineRow = {
  id: string;
  displayName: string;
  meta: string;
  isActive: boolean;
};

type RowAction = "activate" | "deactivate" | "delete";

/** Rutinas guardadas con activar, desactivar y eliminar. Una fila por rutina, acción en la fila. */
export function MyRoutinesList({ routines }: { routines: MyRoutineRow[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function run(routine: MyRoutineRow, action: RowAction) {
    setPendingId(routine.id);

    startTransition(async () => {
      const result =
        action === "activate"
          ? await activateSavedRoutineAction(routine.id)
          : action === "deactivate"
            ? await deactivateSavedRoutineAction(routine.id)
            : await deleteSavedRoutineAction(routine.id);

      setPendingId(null);
      setConfirmDeleteId(null);

      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      toast.success(
        action === "activate"
          ? `${routine.displayName} es tu rutina activa.`
          : action === "deactivate"
            ? "Rutina desactivada."
            : "Rutina eliminada. Tu historial de entrenamientos se conserva.",
      );
      router.refresh();
    });
  }

  return (
    <ul className="grid border-y border-[var(--border)]">
      {routines.map((routine) => {
        const isPending = pendingId === routine.id;

        if (confirmDeleteId === routine.id) {
          return (
            <li
              key={routine.id}
              className="grid gap-3 border-b border-[var(--border)] py-3 last:border-b-0"
            >
              <p className="text-sm text-[var(--foreground)]">
                ¿Eliminar <strong>{routine.displayName}</strong>? Tu historial de entrenamientos se
                conserva.
              </p>
              <div className="flex gap-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setConfirmDeleteId(null)}>
                  Cancelar
                </Button>
                <Button
                  type="button"
                  className="flex-1 bg-[var(--danger)] text-white hover:bg-[var(--danger)]/90"
                  disabled={isPending}
                  onClick={() => run(routine, "delete")}
                >
                  Eliminar
                </Button>
              </div>
            </li>
          );
        }

        return (
          <li
            key={routine.id}
            className="flex min-h-16 items-center gap-3 border-b border-[var(--border)] py-2 last:border-b-0"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-base font-semibold text-[var(--foreground)]">
                {routine.displayName}
              </p>
              <p className="truncate text-[13px] text-[var(--foreground-muted)]">
                {routine.isActive ? <span className="font-semibold text-[var(--accent-bright)]">Activa · </span> : null}
                {routine.meta}
              </p>
            </div>
            <Button
              type="button"
              variant={routine.isActive ? "ghost" : "outline"}
              className="shrink-0"
              disabled={isPending}
              onClick={() => run(routine, routine.isActive ? "deactivate" : "activate")}
            >
              {routine.isActive ? "Desactivar" : "Activar"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-11 shrink-0"
              aria-label={`Eliminar ${routine.displayName}`}
              disabled={isPending}
              onClick={() => setConfirmDeleteId(routine.id)}
            >
              <Trash2 className="size-4" />
            </Button>
          </li>
        );
      })}
    </ul>
  );
}

/** Acceso a "Mis rutinas" desde la semana activa: fila con acción que abre un bottom sheet. */
export function MyRoutinesSheet({ routines }: { routines: MyRoutineRow[] }) {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <button
          type="button"
          className="pressable flex min-h-14 w-full items-center justify-between gap-3 border-y border-[var(--border)] text-left"
        >
          <span>
            <span className="block font-display text-base font-semibold text-[var(--foreground)]">
              Mis rutinas
            </span>
            <span className="block text-[13px] text-[var(--foreground-muted)]">
              {routines.length === 1 ? "1 guardada" : `${routines.length} guardadas`} · cambiar o eliminar
            </span>
          </span>
          <ChevronRight aria-hidden="true" className="size-5 text-[var(--foreground-muted)]" />
        </button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[85dvh]">
        <DrawerHeader className="px-5 pb-2 text-left group-data-[vaul-drawer-direction=bottom]/drawer-content:text-left">
          <DrawerTitle className="text-xl font-bold tracking-[-0.02em]">Mis rutinas</DrawerTitle>
          <DrawerDescription>Elegí cuál usar esta semana.</DrawerDescription>
        </DrawerHeader>
        <div className="overflow-y-auto px-5">
          <MyRoutinesList routines={routines} />
        </div>
        <DrawerFooter className="px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <Button asChild variant="outline" className="h-12">
            <Link href="/catalogo">Explorar catálogo</Link>
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
