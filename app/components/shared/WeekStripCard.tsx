import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type WeekStripCardProps = {
  icon: LucideIcon;
  label: string;
  subtitle: string;
  count: number;
  total?: number;
  children: ReactNode;
};

/** Tarjeta full-width con eyebrow, subtítulo, conteo y una tira semanal (children). */
export function WeekStripCard({
  icon: Icon,
  label,
  subtitle,
  count,
  total = 7,
  children,
}: WeekStripCardProps) {
  return (
    <div className="flex h-full flex-col gap-3 rounded-[14px] border border-[var(--border)] bg-[var(--card)] p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <Icon aria-hidden="true" className="size-3.5 shrink-0 text-[var(--accent-bright)]" />
          <span className="truncate text-[11px] font-bold uppercase tracking-[0.04em] text-[var(--foreground-muted)]">
            {label}
          </span>
        </div>
        <p className="shrink-0 text-xs font-semibold tabular-nums text-[var(--foreground-muted)]">
          <span className="text-[var(--foreground)]">{count}</span>
          {" / "}
          {total}
        </p>
      </div>
      <p className="-mt-1.5 text-xs text-[var(--foreground-muted)]">{subtitle}</p>
      <div className="flex flex-1 items-center pt-1">{children}</div>
    </div>
  );
}
