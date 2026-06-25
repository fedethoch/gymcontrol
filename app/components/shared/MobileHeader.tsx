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
  detail?: string;
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

  if (pathname === "/") {
    return "Listo para entrenar hoy";
  }

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

function formatDisplayName(displayName: string | null) {
  if (!displayName) {
    return null;
  }

  return displayName.charAt(0).toUpperCase() + displayName.slice(1);
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

  const formattedName = formatDisplayName(displayName);
  const greeting = formattedName ? `Hola, ${formattedName}` : "Hola";
  const area = resolveMobileArea(pathname);
  const profileLabel =
    role === "admin" ? "Ir a configuración de administrador" : "Ir a configuración";
  const streakBadge = badge ?? {
    label: "Racha",
    ariaLabel: "Racha actual",
    tone: "warm" as const,
  };
  const badgeLabel = streakBadge.label === "Sin racha" ? "0 dias" : streakBadge.label;
  const badgeDetail =
    streakBadge.detail ?? (streakBadge.label === "Sin racha" ? "Inicia tu racha" : null);
  const badgeTone =
    streakBadge.label === "Sin racha" ? "warm" : streakBadge.tone;

  const profileClasses =
    "grid size-10 shrink-0 place-items-center rounded-xl border border-[#2a3348] bg-[#101522]/90 text-[#b2bdd4] transition-[background-color,border-color,color,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-[#4b348d] hover:text-white active:scale-[0.96] motion-reduce:transition-none motion-reduce:active:scale-100";

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
          <p className="truncate text-xs leading-tight text-[#96a1bc]">{area}</p>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            aria-label="Notificaciones"
            className="grid size-[2.125rem] place-items-center rounded-xl bg-[#131827]/90 text-[#b2bdd4] transition-[background-color,color,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#171d2f] hover:text-white active:scale-[0.96] motion-reduce:transition-none motion-reduce:active:scale-100"
          >
            <Bell className="size-3.5" />
          </button>
          <span
            aria-label={streakBadge.ariaLabel ?? streakBadge.label}
            className={cn(
              "inline-flex min-h-[2.125rem] items-center gap-1 rounded-xl bg-[#131827]/90 px-2.5 py-1 font-display text-xs font-semibold text-[#d8deeb] transition-colors hover:bg-[#171d2f]",
              "duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
            )}
          >
            <Flame
              className={cn(
                "size-3.5 shrink-0",
                badgeTone === "warm" ? "text-[#ff9a75]" : "text-[#b995ff]",
              )}
            />
            <span className="grid gap-0.5 leading-none">
              <span>{badgeLabel}</span>
              {badgeDetail && (
                <span className="text-[9px] font-medium text-[#8f98ad]">
                  {badgeDetail}
                </span>
              )}
            </span>
          </span>
        </div>
      </div>
    </header>
  );
}
