"use client";

import type { ComponentProps, ReactNode } from "react";

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/app/components/ui/Drawer";
import { cn } from "@/app/lib/utils";

/** Tocar un toast (por ejemplo su "Deshacer") no cuenta como tocar afuera: el sheet queda abierto. */
function keepOpenOnToast(event: { target: EventTarget | null; preventDefault: () => void }) {
  const target = event.target as Element | null;
  if (target?.closest?.("[data-sonner-toaster]")) event.preventDefault();
}

/**
 * Bottom sheet del registro mobile: título a la izquierda, cuerpo con scroll y pie opcional.
 */
export function RegistroSheet({
  open,
  onOpenChange,
  title,
  description,
  eyebrow,
  headerAction,
  footer,
  className,
  bodyClassName,
  onEscapeKeyDown,
  fallbackFocus,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description: string;
  eyebrow?: ReactNode;
  headerAction?: ReactNode;
  footer?: ReactNode;
  className?: string;
  bodyClassName?: string;
  onEscapeKeyDown?: ComponentProps<typeof DrawerContent>["onEscapeKeyDown"];
  /** Dónde poner el foco al cerrar si lo que abrió el sheet ya no existe (se borró). */
  fallbackFocus?: () => HTMLElement | null;
  children: ReactNode;
}) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent
        className={cn("max-h-[85dvh]", className)}
        onPointerDownOutside={keepOpenOnToast}
        onInteractOutside={keepOpenOnToast}
        onEscapeKeyDown={onEscapeKeyDown}
        onCloseAutoFocus={(event) => {
          const target = fallbackFocus?.();
          if (target) {
            event.preventDefault();
            target.focus();
          }
        }}
      >
        <DrawerHeader className="flex-row items-start gap-3 px-5 pb-3 pt-3 text-left group-data-[vaul-drawer-direction=bottom]/drawer-content:text-left">
          <div className="grid min-w-0 flex-1 gap-1">
            {eyebrow ? (
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--foreground-muted)]">
                {eyebrow}
              </p>
            ) : null}
            <DrawerTitle className="text-left font-display text-[1.375rem] font-bold leading-tight tracking-[-0.02em] [overflow-wrap:anywhere]">
              {title}
            </DrawerTitle>
            <DrawerDescription className="sr-only">{description}</DrawerDescription>
          </div>
          {headerAction}
        </DrawerHeader>

        <div className={cn("min-h-0 flex-1 overflow-y-auto overscroll-contain px-5", bodyClassName)}>{children}</div>

        {footer ? (
          <DrawerFooter className="gap-2 border-t border-[var(--border)] px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3">
            {footer}
          </DrawerFooter>
        ) : (
          <div aria-hidden="true" className="shrink-0 pb-[max(1.25rem,env(safe-area-inset-bottom))]" />
        )}
      </DrawerContent>
    </Drawer>
  );
}
