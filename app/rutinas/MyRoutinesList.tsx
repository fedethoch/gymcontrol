"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, ChevronRight, Ellipsis, Pencil, Power, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import {
  activateSavedRoutineAction,
  deactivateSavedRoutineAction,
  deleteSavedRoutineAction,
  renameSavedRoutineAction,
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
import { cn } from "@/app/lib/utils";

export type MyRoutineRow = {
  id: string;
  displayName: string;
  meta: string;
  isActive: boolean;
};

type RowAction = "activate" | "deactivate" | "delete";

/**
 * Rutinas guardadas con activar, desactivar y eliminar. Una fila por rutina, acción en la fila.
 * `withMenu` (sheet de la semana activa mobile, DESIGN.md §12): tocar la fila la activa y "…" abre
 * renombrar, activar/desactivar y eliminar inline.
 */
export function MyRoutinesList({ routines, withMenu = false }: { routines: MyRoutineRow[]; withMenu?: boolean }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [, startTransition] = useTransition();

  function run(routine: MyRoutineRow, action: RowAction) {
    setPendingId(routine.id);
    setMenuId(null);

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

  function startRename(routine: MyRoutineRow) {
    setMenuId(null);
    setDraft(routine.displayName);
    setRenamingId(routine.id);
  }

  function confirmRename(routine: MyRoutineRow) {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === routine.displayName) {
      setRenamingId(null);
      return;
    }

    setPendingId(routine.id);
    startTransition(async () => {
      const result = await renameSavedRoutineAction(routine.id, trimmed);
      setPendingId(null);

      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      setRenamingId(null);
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

        if (withMenu) {
          if (renamingId === routine.id) {
            return (
              <li key={routine.id} className="flex min-h-[68px] items-center gap-2 border-b border-[var(--border)] py-2 last:border-b-0">
                <label htmlFor={`rename-${routine.id}`} className="sr-only">
                  Nombre de la rutina
                </label>
                <input
                  id={`rename-${routine.id}`}
                  autoFocus
                  value={draft}
                  maxLength={80}
                  disabled={isPending}
                  onChange={(event) => setDraft(event.target.value)}
                  onFocus={(event) => event.currentTarget.select()}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") confirmRename(routine);
                    if (event.key === "Escape") setRenamingId(null);
                  }}
                  className="h-11 min-w-0 flex-1 rounded-[10px] border border-[var(--accent)] bg-[var(--card-alt)] px-3 font-display text-base font-semibold text-[var(--foreground)] outline-none focus-visible:shadow-[var(--focus-glow)]"
                />
                <Button
                  type="button"
                  size="icon"
                  className="size-11 shrink-0 rounded-full"
                  aria-label="Guardar nombre"
                  disabled={isPending}
                  onClick={() => confirmRename(routine)}
                >
                  <Check className="size-4" strokeWidth={3} />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-11 shrink-0 rounded-full"
                  aria-label="Cancelar"
                  disabled={isPending}
                  onClick={() => setRenamingId(null)}
                >
                  <X className="size-4" />
                </Button>
              </li>
            );
          }

          const menuOpen = menuId === routine.id;

          return (
            <li key={routine.id} className="border-b border-[var(--border)] last:border-b-0">
              <div className="flex min-h-[68px] items-center gap-2">
                <button
                  type="button"
                  disabled={isPending || routine.isActive}
                  onClick={() => run(routine, "activate")}
                  aria-label={routine.isActive ? `${routine.displayName}, rutina activa` : `Activar ${routine.displayName}`}
                  className="pressable flex min-h-14 min-w-0 flex-1 items-center gap-3 rounded-xl text-left outline-none focus-visible:shadow-[var(--focus-glow)] disabled:cursor-default"
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "grid size-6 shrink-0 place-items-center rounded-full border-2",
                      routine.isActive
                        ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-foreground)]"
                        : "border-[var(--border-strong)]",
                    )}
                  >
                    {routine.isActive ? <Check className="size-3.5" strokeWidth={3.2} /> : null}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-display text-base font-semibold text-[var(--foreground)]">
                      {routine.displayName}
                    </span>
                    <span className="block truncate text-[13px] text-[var(--foreground-muted)]">
                      {routine.isActive ? <span className="font-semibold text-[var(--accent-bright)]">Activa · </span> : null}
                      {routine.meta}
                    </span>
                  </span>
                </button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-11 shrink-0 rounded-full"
                  aria-label={`Opciones de ${routine.displayName}`}
                  aria-expanded={menuOpen}
                  disabled={isPending}
                  onClick={() => setMenuId(menuOpen ? null : routine.id)}
                >
                  <Ellipsis className="size-5" />
                </Button>
              </div>
              {menuOpen ? (
                <div className="mb-3 ml-9 grid overflow-hidden rounded-[14px] border border-[var(--border-strong)] bg-[var(--card-alt)]">
                  <button
                    type="button"
                    onClick={() => startRename(routine)}
                    className="pressable flex min-h-12 items-center gap-2.5 px-3.5 text-left text-[15px] font-medium text-[var(--foreground)]"
                  >
                    <Pencil aria-hidden="true" className="size-4 text-[var(--foreground-muted)]" />
                    Renombrar
                  </button>
                  <button
                    type="button"
                    onClick={() => run(routine, routine.isActive ? "deactivate" : "activate")}
                    className="pressable flex min-h-12 items-center gap-2.5 border-t border-[var(--border)] px-3.5 text-left text-[15px] font-medium text-[var(--foreground)]"
                  >
                    <Power aria-hidden="true" className="size-4 text-[var(--foreground-muted)]" />
                    {routine.isActive ? "Desactivar" : "Activar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuId(null);
                      setConfirmDeleteId(routine.id);
                    }}
                    className="pressable flex min-h-12 items-center gap-2.5 border-t border-[var(--border)] px-3.5 text-left text-[15px] font-medium text-[#fda4af]"
                  >
                    <Trash2 aria-hidden="true" className="size-4" />
                    Eliminar
                  </button>
                </div>
              ) : null}
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
