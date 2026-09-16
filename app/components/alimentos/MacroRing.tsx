import { splitMacroKcal, type MacroGrams } from "@/app/lib/food-catalog";
import { MACRO_COLORS } from "@/app/lib/nutrition-style";

const STROKE = 4.5;
const GAP = 1.5;
const MACRO_KEYS = ["protein", "carbs", "fat"] as const;

/** Anillo con el % de kcal de cada macro (dato, no acento: DESIGN.md §13.1 Z5). Decorativo: la fila ya lo dice en texto. */
export function MacroRing({ macros, size = 32 }: { macros: MacroGrams; size?: number }) {
  const { kcal, total } = splitMacroKcal(macros);
  const center = size / 2;
  const radius = (size - STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  const segments: { key: (typeof MACRO_KEYS)[number]; length: number; offset: number }[] = [];
  let offset = 0;

  if (total > 0) {
    for (const key of MACRO_KEYS) {
      const length = (kcal[key] / total) * circumference;

      if (length > 0.5) {
        segments.push({ key, length, offset });
      }

      offset += length;
    }
  }

  const gap = segments.length > 1 ? GAP : 0;

  return (
    <svg aria-hidden="true" width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0 -rotate-90">
      <circle cx={center} cy={center} r={radius} fill="none" stroke="var(--card-alt)" strokeWidth={STROKE} />
      {segments.map((segment) => (
        <circle
          key={segment.key}
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={MACRO_COLORS[segment.key]}
          strokeWidth={STROKE}
          strokeDasharray={`${Math.max(0, segment.length - gap)} ${circumference}`}
          strokeDashoffset={-segment.offset}
        />
      ))}
    </svg>
  );
}
