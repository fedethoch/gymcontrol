"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsLeft, ChevronsRight, LogOut, Menu } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/app/components/ui/Badge";
import { Button } from "@/app/components/ui/Button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/app/components/ui/Sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/app/components/ui/Tooltip";
import { cn } from "@/app/lib/utils";

import {
  resolveShellRouteMeta,
  shellNavigationGroups,
  shellUtilityLinks,
  type ShellRouteMeta,
} from "./navigation-config";

type PrimaryNavigationProps = {
  isAuthenticated: boolean;
  role: "admin" | "user" | null;
};

function isActivePath(pathname: string, href: string) {
  return resolveShellRouteMeta(pathname).href === href;
}

type NavigationLinkProps = {
  item: ShellRouteMeta;
  pathname: string;
  collapsed: boolean;
  onNavigate: () => void;
};

function NavigationLink({
  item,
  pathname,
  collapsed,
  onNavigate,
}: NavigationLinkProps) {
  const active = isActivePath(pathname, item.href);
  const Icon = item.icon;

  const link = (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors duration-200",
        active
          ? "border-[#4b348d] bg-[#231846] text-white shadow-[0_8px_24px_rgba(58,31,119,0.18)]"
          : "border-transparent bg-transparent text-[#b6bfd2] hover:border-[#25203f] hover:bg-[#121423] hover:text-white",
        collapsed &&
          "justify-center rounded-xl px-0 py-2.5 hover:border-[#25203f]",
      )}
    >
      {active && !collapsed ? (
        <span className="absolute inset-y-2.5 left-0 w-0.5 rounded-r-full bg-[#8f63ff]" />
      ) : null}
      <span
        className={cn(
          "relative z-10 grid size-9 shrink-0 place-items-center rounded-lg border transition-colors",
          active
            ? "border-[#5430a9] bg-[#171026] text-[#9b73ff]"
            : "border-[#20263a] bg-[#101320] text-[#aeb8cf] group-hover:border-[#2b3250] group-hover:text-white",
        )}
      >
        <Icon className="size-4" />
      </span>
      {collapsed ? null : (
        <span className="relative z-10 min-w-0 truncate font-display text-sm font-semibold tracking-normal">
          {item.label}
        </span>
      )}
    </Link>
  );

  if (!collapsed) {
    return link;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">
        <p className="font-semibold">{item.label}</p>
        <p className="mt-1 text-[11px] text-[#a8b1c6]">{item.description}</p>
      </TooltipContent>
    </Tooltip>
  );
}

type NavigationPanelProps = {
  pathname: string;
  collapsed: boolean;
  isAuthenticated: boolean;
  role: "admin" | "user" | null;
  onNavigate: () => void;
};

function NavigationPanel({
  pathname,
  collapsed,
  isAuthenticated,
  role,
  onNavigate,
}: NavigationPanelProps) {
  const visibleNavigationGroups = shellNavigationGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (item.section === "Admin") {
          return role === "admin";
        }

        if (item.section === "Usuario") {
          return item.href === "/catalogo" || isAuthenticated;
        }

        return true;
      }),
    }))
    .filter((group) => group.items.length > 0);

  const visibleUtilityLinks = isAuthenticated ? [] : shellUtilityLinks;
  const sessionLabel = isAuthenticated ? "SESIÓN ACTIVA" : "ACCESO DISPONIBLE";
  const sessionCopy = isAuthenticated
    ? role === "admin"
      ? "Sesión admin resuelta dentro del shell común."
      : "Sesión autenticada lista para dashboard y catálogo."
    : "Ingresá con email o Google para habilitar rutinas guardadas.";
  const sessionMonogram = isAuthenticated ? (role === "admin" ? "A" : "U") : "GC";
  const sessionMeta = isAuthenticated
    ? role === "admin"
      ? "Administrador"
      : "Usuario"
    : "Invitado";

  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col text-white",
        collapsed ? "px-3 py-3" : "px-5 py-4",
      )}
    >
      <div className={cn("flex items-center", collapsed ? "justify-center" : "gap-3")}>
        <Link href="/" onClick={onNavigate} className="flex min-w-0 items-center gap-3">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl border border-[#6d40ef] bg-[#6335e8] font-display text-base font-bold tracking-normal text-white shadow-[0_12px_28px_rgba(72,39,158,0.28)]">
            GC
          </span>
          {collapsed ? null : (
            <span className="min-w-0">
              <span className="font-display block truncate text-xl font-semibold tracking-normal text-white">
                GymControl
              </span>
              <span className="mt-1 block truncate text-[10px] font-semibold uppercase tracking-[0.24em] text-[#9199c8]">
                PANEL OPERATIVO
              </span>
            </span>
          )}
        </Link>
      </div>

      <nav
        aria-label="Navegación principal"
        className={cn(
          "min-h-0 flex-1 overflow-hidden",
          collapsed ? "mt-5 space-y-4" : "mt-7 space-y-6",
        )}
      >
        {visibleNavigationGroups.map((group, index) => (
          <section key={group.title}>
            {collapsed ? null : (
              <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.26em] text-[#8a64ee]">
                {group.title}
              </p>
            )}
            <div className={cn(collapsed ? "space-y-2" : "mt-3 space-y-2")}>
              {group.items.map((item) => (
                <NavigationLink
                  key={item.href}
                  item={item}
                  pathname={pathname}
                  collapsed={collapsed}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
            {index < visibleNavigationGroups.length - 1 && !collapsed ? (
              <div className="mt-5 h-px bg-[linear-gradient(90deg,transparent,rgba(94,78,139,0.5),transparent)]" />
            ) : null}
          </section>
        ))}
      </nav>

      {visibleUtilityLinks.length > 0 ? (
        <div className={cn(collapsed ? "mt-4 space-y-2" : "mt-5 space-y-2")}>
          {visibleUtilityLinks.map((item) => (
            <NavigationLink
              key={item.href}
              item={item}
              pathname={pathname}
              collapsed={collapsed}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      ) : null}

      <div className={cn("mt-auto", collapsed ? "space-y-3 pt-4" : "space-y-3 pt-5")}>
        <div
          className={cn(
            "relative overflow-hidden border border-[#171d31] bg-[#0b0e18] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]",
            collapsed ? "rounded-xl px-2 py-3" : "rounded-2xl px-4 py-4",
          )}
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.1),transparent_48%)]" />
          {collapsed ? (
            <div className="relative flex flex-col items-center gap-2">
              <span className="inline-flex size-2 rounded-full bg-[#7c4dff] shadow-[0_0_12px_rgba(109,64,239,0.65)]" />
              <span className="grid size-9 place-items-center rounded-full border border-[#23283b] bg-[#070910] font-display text-xs font-semibold text-white">
                {sessionMonogram}
              </span>
            </div>
          ) : (
            <div className="relative">
              <div className="flex items-center gap-2">
                <span className="inline-flex size-2 rounded-full bg-[#7c4dff] shadow-[0_0_12px_rgba(109,64,239,0.65)]" />
                <Badge
                  className="border-none bg-transparent px-0 py-0 text-[10px] tracking-[0.22em] text-[#8d67f2]"
                  variant="outline"
                >
                  {sessionLabel}
                </Badge>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <div className="relative">
                  <span className="grid size-10 place-items-center rounded-full border border-[#252b3f] bg-[#06080f] font-display text-sm font-semibold tracking-normal text-white">
                    {sessionMonogram}
                  </span>
                  <span className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-[#090b13] bg-[#7c4dff]" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-[#97a0c4]">
                    {sessionMeta}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#b5bdd3]">
                    {sessionCopy}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {isAuthenticated ? (
          <form action="/auth/signout" method="post">
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="submit"
                    variant="ghost"
                    className="h-11 w-full rounded-xl border border-[#3b2775] bg-[#1a1230] px-0 text-[#bda9ff] hover:border-[#4a3191] hover:bg-[#21173d] hover:text-white"
                  >
                    <LogOut className="size-4" />
                    <span className="sr-only">Cerrar sesión</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p className="font-semibold">Cerrar sesión</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <Button
                type="submit"
                variant="ghost"
                className="h-12 w-full justify-start rounded-xl border border-[#3b2775] bg-[#1a1230] px-3 text-white hover:border-[#4a3191] hover:bg-[#21173d] hover:text-white"
              >
                <span className="grid size-9 place-items-center rounded-lg border border-[#4a3191] bg-[#201641] text-[#a57dff]">
                  <LogOut className="size-4" />
                </span>
                <span className="font-display text-sm font-semibold tracking-normal">
                  Cerrar sesión
                </span>
              </Button>
            )}
          </form>
        ) : null}
      </div>
    </div>
  );
}

export function PrimaryNavigation({
  isAuthenticated,
  role,
}: PrimaryNavigationProps) {
  const pathname = usePathname();
  const currentRoute = resolveShellRouteMeta(pathname);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <TooltipProvider>
      <div className="border-b border-[#171d31] bg-[linear-gradient(180deg,#090c14_0%,#060810_100%)] px-4 py-3 lg:hidden">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl border border-[#6d40ef] bg-[#6335e8] font-display text-sm font-bold tracking-normal text-white shadow-[0_10px_24px_rgba(72,39,158,0.28)]">
              GC
            </span>
            <span className="min-w-0">
              <p className="truncate text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8f98bf]">
                GymControl
              </p>
              <p className="truncate font-display text-sm font-semibold tracking-normal text-white">
                {currentRoute.label}
              </p>
            </span>
          </Link>

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Abrir navegación"
                className="rounded-xl border border-[#1d2338] bg-[#0f121e] text-[#c4cbed] hover:border-[#302758] hover:bg-[#151929] hover:text-white"
              >
                <Menu className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="border-r-[#171d31] bg-[linear-gradient(180deg,#090c14_0%,#05070d_100%)] p-0"
            >
              <SheetHeader className="sr-only">
                <SheetTitle>GymControl</SheetTitle>
                <SheetDescription>
                  Navegación principal del shell de usuario y admin.
                </SheetDescription>
              </SheetHeader>
              <NavigationPanel
                pathname={pathname}
                collapsed={false}
                isAuthenticated={isAuthenticated}
                role={role}
                onNavigate={() => setMobileOpen(false)}
              />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <aside
        className={cn(
          "shell-sidebar hidden h-full shrink-0 border-r border-[#171d31] transition-[width] duration-300 lg:flex",
          collapsed ? "w-[88px]" : "w-[320px]",
        )}
      >
        <div className="flex min-h-0 w-full flex-col bg-[linear-gradient(180deg,#090c14_0%,#05070d_100%)]">
          <div
            className={cn(
              "flex pt-3",
              collapsed ? "justify-center px-3" : "justify-end px-4",
            )}
          >
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-9 rounded-xl border border-[#1d2338] bg-[#0f121e] text-[#aab4ca] hover:border-[#302758] hover:bg-[#151929] hover:text-white"
              aria-label={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
              onClick={() => setCollapsed((value) => !value)}
            >
              {collapsed ? (
                <ChevronsRight className="size-4" />
              ) : (
                <ChevronsLeft className="size-4" />
              )}
            </Button>
          </div>
          <NavigationPanel
            pathname={pathname}
            collapsed={collapsed}
            isAuthenticated={isAuthenticated}
            role={role}
            onNavigate={() => undefined}
          />
        </div>
      </aside>
    </TooltipProvider>
  );
}
