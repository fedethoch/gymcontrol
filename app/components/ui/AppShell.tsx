"use client";

import type { ReactNode } from "react";
import { MotionConfig } from "framer-motion";

import { cn } from "@/app/lib/utils";

type AppShellProps = {
  children: ReactNode;
  className?: string;
};

export function AppShell({ children, className }: AppShellProps) {
  return (
    <MotionConfig reducedMotion="user">
      <div className={cn("app-shell", className)}>{children}</div>
    </MotionConfig>
  );
}
