import Link from "next/link";
import { ChevronRight, Play } from "lucide-react";

import { Button } from "@/app/components/ui/Button";
import type { DockAction } from "@/app/lib/routine-week";
import { cn } from "@/app/lib/utils";

/** Z4 · acción del día visible, sticky sobre la bottom nav (mismo offset que `/rutinas/dia`). */
export function StartDock({ action, href }: { action: DockAction; href: string }) {
  const primary = action.tone === "primary";

  return (
    <div
      className={cn(
        "sticky bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-20 -mx-4 grid gap-2 px-4 pb-1",
        action.note
          ? "bg-[linear-gradient(to_top,var(--background)_78%,rgba(5,7,11,0))] pt-10"
          : "bg-[linear-gradient(to_top,var(--background)_62%,rgba(5,7,11,0))] pt-7",
      )}
    >
      {action.note ? (
        <p role="status" className="text-center text-[13px] text-[var(--foreground-muted)]">
          {action.note}
        </p>
      ) : null}
      {primary ? (
        <Button asChild className="h-14 w-full rounded-2xl text-base font-bold">
          <Link href={href}>
            <Play aria-hidden="true" className="size-4 fill-current" />
            {action.label}
          </Link>
        </Button>
      ) : (
        <Link
          href={href}
          className="pressable flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-white/10 text-[15px] font-semibold text-white outline-none hover:bg-white/15 focus-visible:shadow-[var(--focus-glow)]"
        >
          {action.label}
          <ChevronRight aria-hidden="true" className="size-4" />
        </Link>
      )}
    </div>
  );
}
