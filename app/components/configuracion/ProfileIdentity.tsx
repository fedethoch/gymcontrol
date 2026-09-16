"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence } from "framer-motion";
import { Check, TriangleAlert, User, WifiOff } from "lucide-react";

import type { ProfileSaveStatus } from "@/app/configuracion/useProfileForm";
import { fadeScale, motion } from "@/app/components/ui/motion";
import { cn } from "@/app/lib/utils";

/** Z1 · quién es y el estado del guardado (DESIGN.md §15.1). */
export function ProfileIdentity({
  displayName,
  email,
  onEditName,
  saveStatus,
  saveCount,
  online,
  onRetry,
}: {
  displayName: string;
  email: string | null;
  onEditName: () => void;
  saveStatus: ProfileSaveStatus;
  saveCount: number;
  online: boolean;
  onRetry: () => void;
}) {
  const name = displayName.trim();
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="flex min-h-14 items-center gap-3">
      <span
        aria-hidden="true"
        className={cn(
          "grid size-11 shrink-0 place-items-center rounded-full bg-[var(--card-alt)] font-display text-base font-bold text-[var(--foreground)] ring-2 ring-offset-2 ring-offset-[var(--background)]",
          name ? "ring-[var(--accent)]" : "ring-[var(--border-strong)]",
        )}
      >
        {initial || <User className="size-4 text-[var(--foreground-muted)]" />}
      </span>

      <button
        type="button"
        onClick={onEditName}
        aria-label={name ? `${name}. Editar nombre` : "Agregá tu nombre"}
        className="pressable grid min-h-11 min-w-0 flex-1 content-center rounded-lg text-left outline-none focus-visible:shadow-[var(--focus-glow)]"
      >
        {name ? (
          <span className="truncate font-display text-[1.0625rem] font-semibold leading-tight text-[var(--foreground)]">
            {name}
          </span>
        ) : (
          <span className="text-[15px] font-semibold text-[var(--accent-bright)]">Agregá tu nombre</span>
        )}
        {email ? <span className="truncate text-[13px] text-[var(--foreground-muted)]">{email}</span> : null}
      </button>

      <SaveIndicator status={saveStatus} saveCount={saveCount} online={online} onRetry={onRetry} />
    </div>
  );
}

function SaveIndicator({
  status,
  saveCount,
  online,
  onRetry,
}: {
  status: ProfileSaveStatus;
  saveCount: number;
  online: boolean;
  onRetry: () => void;
}) {
  let content: ReactNode = null;

  if (!online) {
    content = (
      <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--warning)]">
        <WifiOff aria-hidden="true" className="size-3.5" />
        Sin conexión
      </span>
    );
  } else if (status === "saving") {
    content = <span className="text-[13px] text-[var(--foreground-muted)]">Guardando…</span>;
  } else if (status === "error") {
    content = (
      <button
        type="button"
        onClick={onRetry}
        className="pressable -mr-2 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-[13px] font-semibold text-[var(--danger)] outline-none focus-visible:shadow-[var(--focus-glow)]"
      >
        <TriangleAlert aria-hidden="true" className="size-3.5" />
        No se guardó · Reintentar
      </button>
    );
  } else if (status === "saved") {
    content = <SavedBadge key={saveCount} />;
  }

  return (
    <div aria-live="polite" className="flex min-h-11 shrink-0 items-center">
      {content}
    </div>
  );
}

/** "Guardado" visible 2 s; se remonta con cada guardado (key). */
function SavedBadge() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timeout = window.setTimeout(() => setVisible(false), 2000);
    return () => window.clearTimeout(timeout);
  }, []);

  return (
    <AnimatePresence>
      {visible ? (
        <motion.span
          variants={fadeScale}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="inline-flex items-center gap-1 text-[13px] font-medium text-[var(--foreground-muted)]"
        >
          <Check aria-hidden="true" className="size-3.5 text-[var(--accent-bright)]" />
          Guardado
        </motion.span>
      ) : null}
    </AnimatePresence>
  );
}
