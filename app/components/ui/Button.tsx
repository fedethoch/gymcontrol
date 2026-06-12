import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/app/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-colors duration-200 outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--accent)] text-[var(--accent-foreground)] hover:bg-[var(--accent-strong)]",
        secondary:
          "bg-[var(--card-alt)] text-[var(--foreground)] hover:bg-[#1b2230]",
        outline:
          "border border-[var(--border-strong)] bg-[var(--card)] text-[var(--foreground)] hover:border-[var(--accent)] hover:bg-[var(--card-alt)]",
        ghost:
          "text-[var(--foreground-muted)] hover:bg-[var(--card-alt)] hover:text-[var(--foreground)]",
      },
      size: {
        default: "h-11 px-4 py-2.5",
        sm: "h-9 rounded-lg px-3 text-xs uppercase tracking-[0.12em]",
        lg: "h-12 px-5 text-sm",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
