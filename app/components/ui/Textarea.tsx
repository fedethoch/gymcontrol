import * as React from "react";

import { cn } from "@/app/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      // En un sheet, arrastrar sobre el campo (mover el cursor, seleccionar) no mueve el sheet.
      data-vaul-no-drag=""
      className={cn(
        "flex min-h-28 w-full rounded-xl border border-[var(--border)] bg-[var(--card-alt)] px-3 py-2 text-base text-[var(--foreground)] outline-none transition-[border-color,box-shadow,background-color,opacity] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] placeholder:text-[#6e7788] focus:border-[var(--accent)] focus:shadow-[var(--focus-glow)] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none md:text-sm",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
