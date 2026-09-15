import Link from "next/link";
import { Bell, Flame, User } from "lucide-react";

import { cn } from "@/app/lib/utils";

/** Z1 · saludo del home mobile. Reemplaza al MobileHeader en "/". */
export function HomeGreeting({ displayName, streak }: { displayName: string | null; streak: number }) {
  const firstName = displayName?.trim().split(/\s+/)[0] || null;

  return (
    <div className="flex items-center gap-3">
      <Link
        href="/configuracion"
        aria-label="Ir a configuración"
        className={cn(
          "pressable grid size-11 shrink-0 place-items-center rounded-full bg-[var(--card-alt)] font-display text-base font-bold text-[var(--foreground)] ring-2 ring-offset-2 ring-offset-[var(--background)]",
          firstName ? "ring-[var(--accent)]" : "ring-[var(--border-strong)]",
        )}
      >
        {firstName ? (
          firstName.charAt(0).toUpperCase()
        ) : (
          <User aria-hidden="true" className="size-4 text-[var(--foreground-muted)]" />
        )}
      </Link>

      <div className="min-w-0 flex-1">
        <p className="text-sm leading-tight text-[var(--foreground-muted)]">
          {firstName ? "Hola," : "Bienvenido a"}
        </p>
        <p className="truncate font-display text-2xl font-bold leading-tight tracking-[-0.02em] text-[var(--foreground)]">
          {firstName ?? "GymControl"}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          aria-label="Notificaciones"
          className="pressable grid size-11 place-items-center rounded-full border border-[var(--border)] bg-[var(--card)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
        >
          <Bell aria-hidden="true" className="size-[18px]" />
        </button>
        {streak > 0 ? (
          <span className="inline-flex h-11 items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--card)] px-3.5 font-display text-sm font-bold tabular-nums text-[var(--foreground)]">
            <Flame aria-hidden="true" className="size-4 text-[#ff9a75]" />
            {streak}
            <span className="sr-only">{streak === 1 ? "día de racha" : "días de racha"}</span>
          </span>
        ) : null}
      </div>
    </div>
  );
}
