"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  createContext,
  useEffect,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { Bell, Flame, User } from "lucide-react";

import { cn } from "@/app/lib/utils";

import { resolveShellRouteMeta } from "./navigation-config";

export type MobileHeaderBadge = {
  label: string;
  ariaLabel?: string;
  tone?: "default" | "warm";
};

type MobileHeaderState = {
  badge: MobileHeaderBadge | null;
  setBadge: (badge: MobileHeaderBadge | null) => void;
};

const MobileHeaderContext = createContext<MobileHeaderState | null>(null);

function useMobileHeaderState() {
  const context = useContext(MobileHeaderContext);

  if (!context) {
    throw new Error("MobileHeader must be used inside MobileHeaderStateProvider.");
  }

  return context;
}

export function MobileHeaderStateProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [badge, setBadge] = useState<MobileHeaderBadge | null>(null);

  return (
    <MobileHeaderContext.Provider value={{ badge, setBadge }}>
      {children}
    </MobileHeaderContext.Provider>
  );
}

export function MobileHeaderBadgeSync({
  badge,
}: {
  badge: MobileHeaderBadge | null;
}) {
  const { setBadge } = useMobileHeaderState();

  useEffect(() => {
    setBadge(badge);

    return () => setBadge(null);
  }, [badge, setBadge]);

  return null;
}

type MobileHeaderProps = {
  isAuthenticated: boolean;
  role: "admin" | "user" | null;
  displayName: string | null;
};

function resolveMobileArea(pathname: string) {
  const currentRoute = resolveShellRouteMeta(pathname);

  if (pathname.startsWith("/rutinas") || pathname.startsWith("/catalogo")) {
    return "Entrenamiento";
  }

  if (
    pathname.startsWith("/nutricion") ||
    pathname.startsWith("/alimentos") ||
    pathname.startsWith("/recetas")
  ) {
    return "Nutrición";
  }

  if (pathname.startsWith("/admin")) {
    return "Gestión";
  }

  if (pathname.startsWith("/configuracion")) {
    return "Perfil y cuenta";
  }

  return currentRoute.eyebrow || currentRoute.label;
}

export function MobileHeader({
  isAuthenticated,
  role,
  displayName,
}: MobileHeaderProps) {
  const pathname = usePathname();
  const { badge } = useMobileHeaderState();

  // Home, semana activa y registro del día traen su propio encabezado (DESIGN.md §6.1 / §10 / §11 / §12).
  if (
    pathname.startsWith("/auth") ||
    pathname === "/" ||
    pathname === "/rutinas" ||
    pathname === "/rutinas/dia" ||
    // Alimentos: título con buscador (DESIGN.md §13).
    pathname === "/alimentos" ||
    // Registro de comidas: día, racha y "Tu día" (DESIGN.md §14).
    pathname === "/nutricion/registro" ||
    // Catálogo: barra con buscar y filtros (DESIGN.md §16). El detalle conserva el header.
    pathname === "/catalogo" ||
    // Configuración: fila de identidad con el estado del guardado (DESIGN.md §15).
    pathname === "/configuracion"
  ) {
    return null;
  }

  const greeting = displayName ? `Hola, ${displayName}` : "Hola";
  const area = resolveMobileArea(pathname);
  const profileLabel =
    role === "admin" ? "Ir a configuración de administrador" : "Ir a configuración";
  const streakBadge = badge ?? {
    label: "Racha",
    ariaLabel: "Racha actual",
    tone: "warm" as const,
  };
  const profileClasses =
    "grid size-11 shrink-0 place-items-center rounded-xl border border-[var(--border)] bg-[var(--card)]/90 text-[var(--foreground-muted)] transition-[background-color,border-color,color,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-[var(--accent)] hover:text-white active:scale-[0.96] motion-reduce:transition-none motion-reduce:active:scale-100";

  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-30 bg-[var(--workspace)] px-4 pb-2.5 pt-[calc(0.625rem+env(safe-area-inset-top))] lg:hidden">
      <div className="pointer-events-auto flex min-w-0 items-center gap-3">
        {isAuthenticated ? (
          <Link href="/configuracion" aria-label={profileLabel} className={profileClasses}>
            <User className="size-4" />
          </Link>
        ) : (
          <span
            aria-hidden="true"
            className={`${profileClasses} pointer-events-none opacity-80`}
          >
            <User className="size-4" />
          </span>
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-sm font-semibold leading-tight text-white">
            {greeting}
          </p>
          <p className="truncate text-xs leading-tight text-[var(--foreground-muted)]">{area}</p>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            aria-label="Notificaciones"
            className="grid size-11 place-items-center rounded-xl bg-[var(--card)]/90 text-[var(--foreground-muted)] transition-[background-color,color,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[var(--card-hover)] hover:text-white active:scale-[0.96] motion-reduce:transition-none motion-reduce:active:scale-100"
          >
            <Bell className="size-3.5" />
          </button>
          <span
            aria-label={streakBadge.ariaLabel ?? streakBadge.label}
            className={cn(
              "inline-flex h-11 items-center gap-1 rounded-xl bg-[var(--card)]/90 px-2.5 font-display text-xs font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--card-hover)]",
              "duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
            )}
          >
            <Flame
              className={cn(
                "size-3.5 shrink-0",
                streakBadge.tone === "warm" ? "text-[#ff9a75]" : "text-[var(--accent-bright)]",
              )}
            />
            <span className="leading-none">{streakBadge.label}</span>
          </span>
        </div>
      </div>
    </header>
  );
}
