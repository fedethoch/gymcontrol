import Link from "next/link";
import { ChevronRight, Play } from "lucide-react";

import { Button } from "@/app/components/ui/Button";
import type { DockAction } from "@/app/lib/routine-week";
import { cn } from "@/app/lib/utils";

/** Z4 · acción del día dentro del panel, debajo de las stats (DESIGN.md §12.1). */
export function DayAction({ action, href }: { action: DockAction; href: string }) {
  return (
    <div data-day-action="" className="grid gap-2">
      {action.note ? (
        <p role="status" className="text-center text-[13px] text-[var(--foreground-muted)]">
          {action.note}
        </p>
      ) : null}
      {action.tone === "primary" ? (
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

/** Misma acción en tamaño compacto, para la barra que aparece arriba al scrollear. */
export function CompactDayAction({ action, href }: { action: DockAction; href: string }) {
  const primary = action.tone === "primary";

  return (
    <Link
      href={href}
      className={cn(
        "pressable inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full px-4 text-[14px] font-bold outline-none focus-visible:shadow-[var(--focus-glow)]",
        primary
          ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
          : "bg-white/10 font-semibold text-white hover:bg-white/15",
      )}
    >
      {primary ? <Play aria-hidden="true" className="size-3.5 fill-current" /> : null}
      {action.label}
      {primary ? null : <ChevronRight aria-hidden="true" className="size-4" />}
    </Link>
  );
}
