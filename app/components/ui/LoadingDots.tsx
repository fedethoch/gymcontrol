import { cn } from "@/app/lib/utils";

type LoadingDotsProps = {
  className?: string;
};

export function LoadingDots({ className }: LoadingDotsProps) {
  return (
    <span
      aria-hidden="true"
      className={cn("inline-flex items-center gap-1", className)}
    >
      <span className="size-1.5 rounded-full bg-current opacity-45 motion-dot" />
      <span className="size-1.5 rounded-full bg-current opacity-65 motion-dot [animation-delay:90ms]" />
      <span className="size-1.5 rounded-full bg-current opacity-85 motion-dot [animation-delay:180ms]" />
    </span>
  );
}
