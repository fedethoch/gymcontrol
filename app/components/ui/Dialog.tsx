"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

import { cn } from "@/app/lib/utils";

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogContent({
  className,
  children,
  open,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & { open: boolean }) {
  return (
    <AnimatePresence>
      {open ? (
        <DialogPortal forceMount>
          <DialogPrimitive.Overlay asChild forceMount>
            <motion.div
              data-slot="dialog-overlay"
              className="fixed inset-0 z-50 bg-[#02040a]/80"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            />
          </DialogPrimitive.Overlay>
          <DialogPrimitive.Content asChild forceMount {...props}>
            <motion.div
              data-slot="dialog-content"
              className={cn(
                "fixed left-1/2 top-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[min(42rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-[var(--border)] bg-[#080b10] shadow-[0_24px_60px_rgba(0,0,0,0.5)] outline-none",
                className,
              )}
              style={{ x: "-50%", y: "-50%" }}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
              {children}
              <DialogPrimitive.Close className="absolute right-4 top-4 rounded-lg p-1 text-[#8f98a9] transition-colors hover:bg-[var(--card-alt)] hover:text-white">
                <X className="size-4" />
                <span className="sr-only">Cerrar</span>
              </DialogPrimitive.Close>
            </motion.div>
          </DialogPrimitive.Content>
        </DialogPortal>
      ) : null}
    </AnimatePresence>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-1.5 px-5 py-4 text-left", className)}
      {...props}
    />
  );
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("font-display text-xl font-semibold text-white", className)}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-sm leading-6 text-[var(--foreground-muted)]", className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
