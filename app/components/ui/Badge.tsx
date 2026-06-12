import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/app/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]",
  {
    variants: {
      variant: {
        accent:
          "border-[#5b2ab3] bg-[#281a45] text-[#f4edff]",
        success:
          "border-[#255936] bg-[#13251a] text-[#d7f5df]",
        neutral:
          "border-[var(--border-strong)] bg-[var(--card-alt)] text-[var(--foreground-muted)]",
        outline:
          "border-[var(--border)] bg-transparent text-[var(--foreground)]",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  },
);

type BadgeProps = React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & {
    tone?: "accent" | "success" | "neutral";
  };

function Badge({ className, variant, tone, ...props }: BadgeProps) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant: variant ?? tone, className }))}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
