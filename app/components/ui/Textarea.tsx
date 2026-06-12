import * as React from "react";

import { cn } from "@/app/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-28 w-full rounded-xl border border-[var(--border)] bg-[var(--card-alt)] px-3 py-2 text-sm text-[var(--foreground)] outline-none transition-colors placeholder:text-[#6e7788] focus:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
