import type { ReactNode } from "react";

import { SurfaceCard } from "../ui/SurfaceCard";

type PlaceholderPanelProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

export function PlaceholderPanel({
  eyebrow,
  title,
  description,
  children,
}: PlaceholderPanelProps) {
  return (
    <SurfaceCard className="p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#a9b3c7]">
        {eyebrow}
      </p>
      <h3 className="font-display mt-2 text-xl font-semibold tracking-[-0.04em] text-white">
        {title}
      </h3>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--foreground-muted)]">
        {description}
      </p>
      <div className="mt-5">{children}</div>
    </SurfaceCard>
  );
}
