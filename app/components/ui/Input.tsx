import * as React from "react";

import { cn } from "@/app/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--card-alt)] px-3 py-2 text-sm text-[var(--foreground)] outline-none transition-colors placeholder:text-[#6e7788] focus:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
