import { MACRO_COLORS, MACRO_LABELS } from "@/app/lib/nutrition-style";
import type { Macros } from "@/app/lib/nutrition-types";
import { cn } from "@/app/lib/utils";

/**
 * Barra segmentada que representa la composicion calorica de protein/carb/fat.
 * Elemento distintivo de la seccion de nutricion: el ancho de cada segmento
 * es proporcional al aporte calorico real de cada macro (no a los gramos).
 */
export function MacroBar({
  macros,
  className,
  showLegend = true,
}: {
  macros: Macros;
  className?: string;
  showLegend?: boolean;
}) {
  const proteinKcal = macros.proteinG * 4;
  const carbsKcal = macros.carbsG * 4;
  const fatKcal = macros.fatG * 9;
  const totalKcal = Math.max(1, proteinKcal + carbsKcal + fatKcal);

  const segments = [
    { key: "protein" as const, kcal: proteinKcal, grams: macros.proteinG },
    { key: "carbs" as const, kcal: carbsKcal, grams: macros.carbsG },
    { key: "fat" as const, kcal: fatKcal, grams: macros.fatG },
  ];

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-[var(--card-alt)]">
        {segments.map((segment) =>
          segment.kcal > 0 ? (
            <div
              key={segment.key}
              style={{
                width: `${(segment.kcal / totalKcal) * 100}%`,
                backgroundColor: MACRO_COLORS[segment.key],
              }}
            />
          ) : null,
        )}
      </div>

      {showLegend ? (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--foreground-muted)]">
          {segments.map((segment) => (
            <span key={segment.key} className="inline-flex items-center gap-1.5">
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: MACRO_COLORS[segment.key] }}
                aria-hidden="true"
              />
              {MACRO_LABELS[segment.key]} <span className="text-white">{segment.grams}g</span>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
