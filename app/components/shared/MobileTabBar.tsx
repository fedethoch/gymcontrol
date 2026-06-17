"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BookOpen, Calendar, LayoutDashboard, Menu, Shield, UtensilsCrossed } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/app/components/ui/Sheet";
import { cn } from "@/app/lib/utils";
import { NavigationPanel } from "./PrimaryNavigation";
import { resolveShellRouteMeta } from "./navigation-config";

type TabItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const USER_TABS: TabItem[] = [
  { href: "/", label: "Inicio", icon: LayoutDashboard },
  { href: "/rutinas", label: "Rutina", icon: Calendar },
  { href: "/nutricion/registro", label: "Nutrición", icon: UtensilsCrossed },
  { href: "/catalogo", label: "Catálogo", icon: BookOpen },
];

const ADMIN_TABS: TabItem[] = [
  { href: "/admin", label: "Admin", icon: Shield },
  { href: "/admin/ejercicios", label: "Ejercicios", icon: LayoutDashboard },
  { href: "/admin/rutinas", label: "Rutinas", icon: Calendar },
  { href: "/admin/alimentos", label: "Alimentos", icon: UtensilsCrossed },
];

const GUEST_TABS: TabItem[] = [
  { href: "/", label: "Inicio", icon: LayoutDashboard },
  { href: "/catalogo", label: "Catálogo", icon: BookOpen },
  { href: "/alimentos", label: "Alimentos", icon: UtensilsCrossed },
  { href: "/recetas", label: "Recetas", icon: Calendar },
];

type MobileTabBarProps = {
  isAuthenticated: boolean;
  role: "admin" | "user" | null;
};

export function MobileTabBar({ isAuthenticated, role }: MobileTabBarProps) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  if (pathname.startsWith("/auth")) {
    return null;
  }

  const tabs = role === "admin" ? ADMIN_TABS : isAuthenticated ? USER_TABS : GUEST_TABS;

  return (
    <nav
      aria-label="Navegación inferior"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[#171d31] bg-[linear-gradient(180deg,#0a0d16_0%,#05070d_100%)] pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <div className="grid min-h-[4rem] grid-cols-5">
        {tabs.map((tab) => {
          const active = resolveShellRouteMeta(pathname).href === tab.href;
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-1 py-2 text-[11px] font-semibold leading-none transition-colors",
                active ? "text-[var(--accent-bright)]" : "text-[#8a93ad] hover:text-white",
              )}
            >
              <Icon className="size-5" />
              {tab.label}
            </Link>
          );
        })}

        <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              className="flex flex-col items-center justify-center gap-1 px-1 py-2 text-[11px] font-semibold leading-none text-[#8a93ad] transition-colors hover:text-white"
            >
              <Menu className="size-5" />
              Más
            </button>
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
              onNavigate={() => setMoreOpen(false)}
            />
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
