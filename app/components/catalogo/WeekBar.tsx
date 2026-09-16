import { weekSplit } from "@/app/lib/routine-catalog";
import { cn } from "@/app/lib/utils";

/** Z3 · semana partida en entrenos y descansos. Sin letras de días: la rutina no guarda días fijos (§16.1). */
export function WeekBar({ days, className }: { days: number; className?: string }) {
  const { train, label } = weekSplit(days);

  return (
    <div className={cn("grid gap-2", className)}>
      <div aria-hidden="true" className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: 7 }, (_, index) => (
          <span
            key={index}
            style={{ transitionDelay: `${index * 25}ms` }}
            className={cn(
              "h-2 rounded-full transition-colors duration-200 motion-reduce:transition-none",
              index < train ? "bg-[var(--foreground)]" : "bg-[var(--border)]",
            )}
          />
        ))}
      </div>
      <p className="text-center text-[13px] text-[var(--foreground-muted)]">{label}</p>
    </div>
  );
}
