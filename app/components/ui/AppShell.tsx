import type { ReactNode } from "react";

import { cn } from "@/app/lib/utils";

type AppShellProps = {
  children: ReactNode;
  className?: string;
};

export function AppShell({ children, className }: AppShellProps) {
  return <div className={cn("app-shell", className)}>{children}</div>;
}
