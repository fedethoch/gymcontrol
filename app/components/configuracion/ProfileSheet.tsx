"use client";

import { useRef, type ReactNode } from "react";

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/app/components/ui/Drawer";

/** Bottom sheet de /configuracion (DESIGN.md §15.2): título a la izquierda y "Listo" a la derecha. */
export function ProfileSheet({
  open,
  onOpenChange,
  title,
  description,
  leading,
  closeLabel = "Listo",
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** Solo para lectores de pantalla. */
  description: string;
  /** Flecha atrás o ícono antes del título. */
  leading?: ReactNode;
  /** `null` oculta el botón de cierre (el sheet trae sus propias acciones). */
  closeLabel?: string | null;
  children: ReactNode;
}) {
  // vaul no mueve el foco al abrir; al cerrar, el foco vuelve a la fila que abrió el sheet.
  const returnFocusRef = useRef<HTMLElement | null>(null);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent
        className="max-h-[85dvh]"
        onOpenAutoFocus={() => {
          returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        }}
        onCloseAutoFocus={(event) => {
          const target = returnFocusRef.current;
          if (target?.isConnected && target !== document.body) {
            event.preventDefault();
            target.focus({ preventScroll: true });
          }
        }}
      >
        <DrawerHeader className="flex-row items-center gap-2 px-5 pb-1 pt-2 text-left group-data-[vaul-drawer-direction=bottom]/drawer-content:text-left md:text-left">
          {leading}
          <DrawerTitle className="min-w-0 flex-1 truncate text-[1.375rem] font-bold leading-tight tracking-[-0.02em]">
            {title}
          </DrawerTitle>
          <DrawerDescription className="sr-only">{description}</DrawerDescription>
          {closeLabel ? (
            <DrawerClose className="pressable -mr-2 inline-flex min-h-11 shrink-0 items-center rounded-lg px-2 text-[15px] font-semibold text-[var(--accent-bright)] outline-none hover:text-[var(--accent-strong)] focus-visible:shadow-[var(--focus-glow)]">
              {closeLabel}
            </DrawerClose>
          ) : null}
        </DrawerHeader>
        <div className="min-h-0 overflow-y-auto px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">{children}</div>
      </DrawerContent>
    </Drawer>
  );
}

/** Aviso sin red dentro de un sheet (DESIGN.md §6.3): los controles quedan deshabilitados. */
export function OfflineNote() {
  return (
    <p role="status" className="mt-4 text-[13px] leading-snug text-[var(--warning)]">
      Sin conexión: volvé a intentar cuando tengas red.
    </p>
  );
}
