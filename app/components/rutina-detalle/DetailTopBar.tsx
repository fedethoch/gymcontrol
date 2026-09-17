"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Bookmark, ChevronLeft, ChevronRight, Ellipsis, List, Power, Share2 } from "lucide-react";
import { toast } from "sonner";

import {
  activateRoutineFromCatalogAction,
  saveRoutineFromCatalogAction,
} from "@/app/catalogo/rutinas/[id]/actions";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/app/components/ui/Drawer";
import type { ActionContext } from "@/app/components/rutina-detalle/DetailAction";
import { cn } from "@/app/lib/utils";

const ROUND =
  "pressable grid size-11 shrink-0 place-items-center rounded-full border border-white/10 bg-[rgba(5,7,11,0.72)] text-[var(--foreground)] outline-none focus-visible:shadow-[var(--focus-glow)]";
const MENU_ROW =
  "pressable flex min-h-[52px] w-full items-center gap-3.5 border-b border-[var(--border)] text-left text-[15px] font-medium outline-none last:border-b-0 focus-visible:shadow-[var(--focus-glow)]";

function BookmarkSubmit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-label={pending ? "Guardando rutina" : "Guardar para después"}
      className={cn(ROUND, pending && "opacity-60")}
    >
      <Bookmark aria-hidden="true" className="size-5" />
    </button>
  );
}

function DeactivateSubmit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={cn(MENU_ROW, "text-[var(--danger)]")}>
      <Power aria-hidden="true" className="size-5" />
      {pending ? "Desactivando…" : "Desactivar rutina"}
    </button>
  );
}

/** Z1 · ← al catálogo, bookmark y "…" sobre la portada (DESIGN.md §19.1). */
export function DetailTopBar({
  backHref,
  name,
  context,
}: {
  backHref: string;
  name: string;
  context: ActionContext;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const { state } = context;
  const owned = state === "saved" || state === "active";

  async function share() {
    const url = window.location.href.split("?")[0];
    try {
      if (navigator.share) {
        await navigator.share({ title: name, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copiado.");
      }
      setMenuOpen(false);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      toast.error("No se pudo compartir. Copiá el link desde el navegador.");
    }
  }

  return (
    <div className="flex items-center justify-between gap-2 pt-1">
      <Link href={backHref} aria-label="Volver al catálogo" className={ROUND}>
        <ChevronLeft aria-hidden="true" className="size-5" />
      </Link>

      <div className="flex items-center gap-2">
        {state === "new" ? (
          <form action={saveRoutineFromCatalogAction}>
            <input type="hidden" name="routineTemplateId" value={context.routineId} />
            <input type="hidden" name="intent" value="save" />
            <BookmarkSubmit />
          </form>
        ) : null}
        {state === "saved" ? (
          <Link href="/rutinas" aria-label="Guardada. Ver en Mis rutinas" className={cn(ROUND, "text-[var(--accent-bright)]")}>
            <Bookmark aria-hidden="true" className="size-5 fill-current" />
          </Link>
        ) : null}

        <button
          ref={menuButtonRef}
          type="button"
          aria-label="Más opciones"
          aria-haspopup="dialog"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(true)}
          className={ROUND}
        >
          <Ellipsis aria-hidden="true" className="size-5" />
        </button>
      </div>

      <Drawer open={menuOpen} onOpenChange={setMenuOpen}>
        <DrawerContent
          className="max-h-[85dvh]"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            menuButtonRef.current?.focus();
          }}
        >
          <DrawerHeader className="px-5 pb-1 pt-3 text-left group-data-[vaul-drawer-direction=bottom]/drawer-content:text-left">
            <DrawerTitle className="text-xl font-bold tracking-[-0.02em]">{name}</DrawerTitle>
            <DrawerDescription className="sr-only">Opciones de la rutina</DrawerDescription>
          </DrawerHeader>
          <div className="px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            {owned ? (
              <Link href="/rutinas" className={MENU_ROW}>
                <List aria-hidden="true" className="size-5 text-[var(--foreground-muted)]" />
                <span className="flex-1">Ver en Mis rutinas</span>
                <ChevronRight aria-hidden="true" className="size-[18px] text-[var(--foreground-subtle)]" />
              </Link>
            ) : null}
            <button type="button" onClick={share} className={MENU_ROW}>
              <Share2 aria-hidden="true" className="size-5 text-[var(--foreground-muted)]" />
              Compartir
            </button>
            {state === "active" && context.savedRoutineId ? (
              <form action={activateRoutineFromCatalogAction} className="border-b border-[var(--border)] last:border-b-0">
                <input type="hidden" name="routineTemplateId" value={context.routineId} />
                <input type="hidden" name="savedRoutineId" value={context.savedRoutineId ?? ""} />
                <DeactivateSubmit />
              </form>
            ) : null}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
