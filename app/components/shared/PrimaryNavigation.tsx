"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsLeft, ChevronsRight } from "lucide-react";
import { useState } from "react";

import { Button } from "@/app/components/ui/Button";
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
  shellSecondaryLinks,
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
        "group relative flex items-center gap-3 rounded-xl border px-3 py-2 transition-colors duration-200",
        active
          ? "border-[#4b348d] bg-[#231846] text-white shadow-[0_8px_24px_rgba(58,31,119,0.18)]"
          : "border-transparent bg-transparent text-[#b6bfd2] hover:border-[#25203f] hover:bg-[#121423] hover:text-white",
        collapsed &&
          "justify-center rounded-xl px-0 py-2 hover:border-[#25203f]",
      )}
    >
      {active && !collapsed ? (
        <span className="absolute inset-y-2.5 left-0 w-0.5 rounded-r-full bg-[#8f63ff]" />
      ) : null}
      <span
        className={cn(
          "relative z-10 grid size-8 shrink-0 place-items-center rounded-lg border transition-colors",
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

export function NavigationPanel({
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

  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col text-white",
        collapsed ? "px-3 py-3" : "px-5 py-3",
      )}
    >
      <div className={cn("flex items-center", collapsed ? "justify-center" : "gap-3")}>
        <Link href="/" onClick={onNavigate} className="flex min-w-0 items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-2xl">
            <Image
              src="/logo/logo.png"
              alt="GymControl"
              width={40}
              height={40}
              className="size-full object-contain p-1"
              priority
              unoptimized
            />
          </span>
          {collapsed ? null : (
            <span className="min-w-0">
              <span className="font-display block truncate text-lg font-semibold tracking-normal text-white">
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
          "min-h-0 flex-1 overflow-y-auto",
          collapsed ? "mt-4 space-y-3" : "mt-5 space-y-4",
        )}
      >
        {visibleNavigationGroups.map((group, index) => (
          <section key={group.title}>
            {collapsed ? null : (
              <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.26em] text-[#8a64ee]">
                {group.title}
              </p>
            )}
            <div className={cn(collapsed ? "space-y-1.5" : "mt-2 space-y-1.5")}>
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
              <div className="mt-4 h-px bg-[linear-gradient(90deg,transparent,rgba(94,78,139,0.5),transparent)]" />
            ) : null}
          </section>
        ))}
      </nav>

      {visibleUtilityLinks.length > 0 ? (
        <div className={cn(collapsed ? "mt-3 space-y-1.5" : "mt-4 space-y-1.5")}>
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

      <div className={cn("mt-auto", collapsed ? "pt-3" : "pt-3")}>
        {isAuthenticated
          ? shellSecondaryLinks.map((item) => (
              <NavigationLink
                key={item.href}
                item={item}
                pathname={pathname}
                collapsed={collapsed}
                onNavigate={onNavigate}
              />
            ))
          : null}
      </div>
    </div>
  );
}

export function PrimaryNavigation({
  isAuthenticated,
  role,
}: PrimaryNavigationProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  if (pathname.startsWith("/auth")) {
    return null;
  }

  return (
    <TooltipProvider>
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
