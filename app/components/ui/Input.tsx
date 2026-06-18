import * as React from "react";

import { cn } from "@/app/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--card-alt)] px-3 py-2 text-base text-[var(--foreground)] outline-none transition-[border-color,box-shadow,background-color,opacity] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] placeholder:text-[#6e7788] focus:border-[var(--accent)] focus:shadow-[0_0_0_4px_rgba(124,58,237,0.16)] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none md:text-sm",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
