import { cn } from "@/app/lib/utils";

const BAR_HEIGHTS = [6, 10, 14, 17, 20];

/** Medidor de actividad: 5 barras en tinta neutra (dato, no acento). `level` va de 0 a 4. */
export function ActivityMeter({ level }: { level: number }) {
  return (
    <span aria-hidden="true" className="flex h-5 items-end gap-[3px]">
      {BAR_HEIGHTS.map((height, index) => (
        <span
          key={height}
          className={cn(
            "w-1 rounded-sm",
            index <= level ? "bg-[var(--foreground)]" : "bg-[var(--border-strong)]",
          )}
          style={{ height }}
        />
      ))}
    </span>
  );
}
