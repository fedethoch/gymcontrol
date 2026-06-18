"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
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
  const shouldReduceMotion = useReducedMotion();

  if (pathname.startsWith("/auth")) {
    return null;
  }

  const tabs = role === "admin" ? ADMIN_TABS : isAuthenticated ? USER_TABS : GUEST_TABS;
  const springTransition = shouldReduceMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 420, damping: 34, mass: 0.8 };

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
                "mobile-tab-bar-item group flex flex-col items-center justify-center px-1 text-[10px] font-semibold leading-none transition-colors duration-200",
                active ? "text-white" : "text-[#8a93ad] hover:text-white",
              )}
            >
              {active ? (
                <motion.span
                  layoutId="mobile-tab-active-pill"
                  className="mobile-tab-active-pill"
                  transition={springTransition}
                />
              ) : null}
              <motion.span
                className="mobile-tab-icon-shell"
                animate={
                  active && !shouldReduceMotion
                    ? { y: -3, scale: 1.08 }
                    : { y: 0, scale: 1 }
                }
                whileTap={shouldReduceMotion ? undefined : { scale: 0.92, y: 1 }}
                transition={springTransition}
              >
                <Icon
                  className={cn(
                    "mobile-tab-bar-icon size-6 transition-colors duration-200 motion-reduce:transition-none",
                    active ? "text-[var(--accent-bright)]" : "text-current",
                  )}
                />
              </motion.span>
              <AnimatePresence initial={false}>
                {active ? (
                  <motion.span
                    key={tab.href}
                    className="mobile-tab-label"
                    initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 4 }}
                    animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                    exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 3 }}
                    transition={{ duration: shouldReduceMotion ? 0 : 0.16, ease: "easeOut" }}
                  >
                    {tab.label}
                  </motion.span>
                ) : null}
              </AnimatePresence>
              {!active ? <span className="sr-only">{tab.label}</span> : null}
            </Link>
          );
        })}

        <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              aria-label="Mas"
              className="mobile-tab-bar-item group flex flex-col items-center justify-center px-1 text-[10px] font-semibold leading-none text-[#8a93ad] transition-colors duration-200 hover:text-white"
            >
              <motion.span
                className="mobile-tab-icon-shell"
                whileTap={shouldReduceMotion ? undefined : { scale: 0.92, y: 1 }}
                transition={springTransition}
              >
                <Menu className="mobile-tab-bar-icon size-6 transition-colors duration-200 motion-reduce:transition-none" />
              </motion.span>
              <span className="sr-only">Mas</span>
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
