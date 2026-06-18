"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { BookOpen, Calendar, LayoutDashboard, Menu, Shield, UtensilsCrossed, X } from "lucide-react";
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
  const shouldReduceMotion = useReducedMotion();

  if (pathname.startsWith("/auth")) {
    return null;
  }

  const tabs = role === "admin" ? ADMIN_TABS : isAuthenticated ? USER_TABS : GUEST_TABS;
  const iconTransition = shouldReduceMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 520, damping: 36, mass: 0.65 };

  return (
    <nav
      aria-label="Navegación inferior"
      className="mobile-tab-bar fixed inset-x-0 bottom-0 z-40 overflow-hidden border-t border-[#161d2b]/80 bg-[rgba(5,7,11,0.92)] shadow-[0_-18px_48px_rgba(0,0,0,0.36)] backdrop-blur-xl lg:hidden"
    >
      <div className="mobile-tab-bar-grid grid h-full grid-cols-5">
        {tabs.map((tab) => {
          const active = resolveShellRouteMeta(pathname).href === tab.href;
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-label={tab.label}
              aria-current={active ? "page" : undefined}
              className={cn(
                "mobile-tab-bar-item group flex flex-col items-center justify-end px-1 text-[10px] font-semibold leading-none transition-colors",
                "duration-200 motion-reduce:duration-0",
                active ? "text-[#b995ff]" : "text-[#8a93ad]",
              )}
            >
              <motion.span
                className="mobile-tab-icon-shell"
                animate={
                  active && !shouldReduceMotion
                    ? { scale: 1.06, rotate: -2, opacity: 1 }
                    : { scale: 1, rotate: 0, opacity: active ? 1 : 0.82 }
                }
                whileTap={{ scale: shouldReduceMotion ? 1 : 0.94 }}
                transition={iconTransition}
              >
                <Icon
                  className={cn(
                    "mobile-tab-bar-icon size-6 text-current transition-colors motion-reduce:transition-none",
                    "duration-200 motion-reduce:duration-0",
                  )}
                />
              </motion.span>
              <span className="mobile-tab-label transition-colors duration-200 motion-reduce:duration-0">
                {tab.label}
              </span>
            </Link>
          );
        })}

        <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              aria-label="Mas"
              aria-expanded={moreOpen}
              className={cn(
                "mobile-tab-bar-item group flex flex-col items-center justify-end px-1 text-[10px] font-semibold leading-none transition-colors",
                "duration-200 motion-reduce:duration-0",
                moreOpen ? "text-[#b995ff]" : "text-[#8a93ad]",
              )}
            >
              <motion.span
                className="mobile-tab-icon-shell"
                animate={
                  moreOpen && !shouldReduceMotion
                    ? { scale: 1.06, rotate: 2, opacity: 1 }
                    : { scale: 1, rotate: 0, opacity: moreOpen ? 1 : 0.82 }
                }
                whileTap={{ scale: shouldReduceMotion ? 1 : 0.94 }}
                transition={iconTransition}
              >
                <Menu
                  className={cn(
                    "mobile-tab-bar-icon absolute size-6 text-current transition-all motion-reduce:transition-none",
                    "duration-200 motion-reduce:duration-0",
                    moreOpen ? "scale-75 opacity-0 rotate-45" : "scale-100 opacity-100 rotate-0",
                  )}
                />
                <X
                  className={cn(
                    "mobile-tab-bar-icon absolute size-6 text-current transition-all motion-reduce:transition-none",
                    "duration-200 motion-reduce:duration-0",
                    moreOpen ? "scale-100 opacity-100 rotate-0" : "scale-75 opacity-0 -rotate-45",
                  )}
                />
              </motion.span>
              <span className="mobile-tab-label transition-colors duration-200 motion-reduce:duration-0">
                Mas
              </span>
            </button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="mobile-more-sheet w-[min(17rem,72vw)] border-r-[#171d31] bg-[linear-gradient(180deg,#090c14_0%,#05070d_100%)] p-0"
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
