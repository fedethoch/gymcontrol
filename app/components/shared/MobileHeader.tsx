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

  if (pathname.startsWith("/dashboard") || pathname.startsWith("/catalogo")) {
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

  if (pathname.startsWith("/auth")) {
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
    "grid size-10 shrink-0 place-items-center rounded-xl border border-[#2a3348] bg-[#101522]/90 text-[#b2bdd4] transition-colors hover:border-[#4b348d] hover:text-white";

  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-30 px-4 pb-2.5 pt-[calc(0.625rem+env(safe-area-inset-top))] lg:hidden">
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
          <p className="truncate text-xs leading-tight text-[#96a1bc]">{area}</p>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            aria-label="Notificaciones"
            className="grid size-[2.125rem] place-items-center rounded-xl bg-[#131827]/90 text-[#b2bdd4] transition-colors hover:bg-[#171d2f] hover:text-white"
          >
            <Bell className="size-3.5" />
          </button>
          <span
            aria-label={streakBadge.ariaLabel ?? streakBadge.label}
            className={cn(
              "inline-flex h-[2.125rem] items-center gap-1 rounded-xl bg-[#131827]/90 px-2 font-display text-xs font-semibold text-[#d8deeb] transition-colors hover:bg-[#171d2f]",
            )}
          >
            <Flame
              className={cn(
                "size-3.5 shrink-0",
                streakBadge.tone === "warm" ? "text-[#ff9a75]" : "text-[#b995ff]",
              )}
            />
            <span className="leading-none">{streakBadge.label}</span>
          </span>
        </div>
      </div>
    </header>
  );
}
