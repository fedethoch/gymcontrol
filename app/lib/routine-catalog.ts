// Lógica pura del catálogo mobile (DESIGN.md §16). Solo importa `routine-metadata` (sin dependencias): se testea con `node --test`.
import {
  ROUTINE_DIFFICULTIES,
  ROUTINE_DIFFICULTY_LABELS,
  ROUTINE_OBJECTIVES,
  ROUTINE_OBJECTIVE_LABELS,
  type RoutineDifficulty,
  type RoutineObjective,
} from "@/app/lib/routine-metadata";

export type SavedStatus = "active" | "saved";
export type DayOption = "all" | number;
export type LevelFilter = RoutineDifficulty | "all";
export type ObjectiveFilter = RoutineObjective | "all";
export type CatalogSort = "recent" | "name" | "items";

export const CATALOG_SORTS: ReadonlyArray<{ value: CatalogSort; label: string }> = [
  { value: "recent", label: "Más recientes" },
  { value: "name", label: "Nombre A–Z" },
  { value: "items", label: "Más ejercicios" },
];

/** Lo que el catálogo mobile necesita de una plantilla, sin días ni ejercicios. */
export type CatalogRoutine = {
  id: string;
  name: string;
  displayName: string;
  description: string;
  imageUrl: string;
  difficulty: RoutineDifficulty;
  objective: RoutineObjective;
  dayCount: number;
  itemCount: number;
  seriesCount: number;
};

export type CatalogFilters = {
  query: string;
  days: DayOption;
  level: LevelFilter;
  objective: ObjectiveFilter;
};

type TemplateLike = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  difficulty: RoutineDifficulty;
  objective: RoutineObjective;
  days: ReadonlyArray<{ items: ReadonlyArray<{ series: number }> }>;
};

const MAX_WEEK_DAYS = 7;

export function toCatalogRoutine(template: TemplateLike): CatalogRoutine {
  let itemCount = 0;
  let seriesCount = 0;
  for (const day of template.days) {
    itemCount += day.items.length;
    for (const item of day.items) seriesCount += item.series;
  }

  return {
    id: template.id,
    name: template.name,
    displayName: displayRoutineName(template.name),
    description: template.description,
    imageUrl: template.imageUrl,
    difficulty: template.difficulty,
    objective: template.objective,
    dayCount: template.days.length,
    itemCount,
    seriesCount,
  };
}

/** "Arnold Split 6 dias" → "Arnold Split 6 días". Solo palabras completas: "Media" o "Diaspora" no cambian. */
export function displayRoutineName(name: string): string {
  return name.replace(/\b([dD])([iI])([aA][sS]?)\b/g, (_, d: string, i: string, rest: string) => {
    return `${d}${i === "I" ? "Í" : "í"}${rest}`;
  });
}

/** Minúsculas y sin tildes, para comparar búsquedas. */
export function normalizeSearch(text: string): string {
  return text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

export function searchTokens(query: string): string[] {
  return normalizeSearch(query).split(/\s+/).filter(Boolean);
}

/** Todas las palabras de la búsqueda tienen que aparecer en el nombre o la descripción. */
export function matchesQuery(routine: Pick<CatalogRoutine, "displayName" | "description">, query: string): boolean {
  const tokens = searchTokens(query);
  if (tokens.length === 0) return true;
  const haystack = normalizeSearch(`${routine.displayName} ${routine.description}`);
  return tokens.every((token) => haystack.includes(token));
}

/** Parte `text` en tramos marcados según la búsqueda, conservando tildes y mayúsculas del original. */
export function highlightSegments(text: string, query: string): Array<{ text: string; match: boolean }> {
  const tokens = searchTokens(query);
  if (tokens.length === 0 || text.length === 0) return [{ text, match: false }];

  // Cada carácter normalizado apunta al tramo del original que lo generó.
  let normalized = "";
  const starts: number[] = [];
  const ends: number[] = [];
  let offset = 0;
  for (const char of text) {
    const piece = normalizeSearch(char);
    for (let index = 0; index < piece.length; index++) {
      starts.push(offset);
      ends.push(offset + char.length);
    }
    normalized += piece;
    offset += char.length;
  }

  const ranges: Array<[number, number]> = [];
  for (const token of tokens) {
    let from = 0;
    let found = normalized.indexOf(token, from);
    while (found !== -1) {
      ranges.push([starts[found], ends[found + token.length - 1]]);
      from = found + 1;
      found = normalized.indexOf(token, from);
    }
  }
  if (ranges.length === 0) return [{ text, match: false }];

  ranges.sort((left, right) => left[0] - right[0]);
  const merged: Array<[number, number]> = [];
  for (const range of ranges) {
    const last = merged.at(-1);
    if (last && range[0] <= last[1]) {
      last[1] = Math.max(last[1], range[1]);
    } else {
      merged.push([range[0], range[1]]);
    }
  }

  const segments: Array<{ text: string; match: boolean }> = [];
  let cursor = 0;
  for (const [start, end] of merged) {
    if (start > cursor) segments.push({ text: text.slice(cursor, start), match: false });
    segments.push({ text: text.slice(start, end), match: true });
    cursor = end;
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor), match: false });
  return segments;
}

export function parseLevelFilter(value: string): LevelFilter {
  return (ROUTINE_DIFFICULTIES as readonly string[]).includes(value) ? (value as RoutineDifficulty) : "all";
}

export function parseObjectiveFilter(value: string): ObjectiveFilter {
  return (ROUTINE_OBJECTIVES as readonly string[]).includes(value) ? (value as RoutineObjective) : "all";
}

export function parseCatalogSort(value: string): CatalogSort {
  return CATALOG_SORTS.some((sort) => sort.value === value) ? (value as CatalogSort) : "recent";
}

export function filterCatalog<T extends CatalogRoutine>(list: readonly T[], filters: CatalogFilters): T[] {
  return list.filter(
    (routine) =>
      (filters.days === "all" || routine.dayCount === filters.days) &&
      (filters.level === "all" || routine.difficulty === filters.level) &&
      (filters.objective === "all" || routine.objective === filters.objective) &&
      matchesQuery(routine, filters.query),
  );
}

/** Orden estable. "recent" respeta el orden de entrada (la base las trae por `created_at` desc). */
export function sortCatalog<T extends CatalogRoutine>(list: readonly T[], sort: CatalogSort): T[] {
  const copy = [...list];
  if (sort === "name") {
    copy.sort((left, right) =>
      left.displayName.localeCompare(right.displayName, "es", { sensitivity: "base", numeric: true }),
    );
  } else if (sort === "items") {
    copy.sort((left, right) => right.itemCount - left.itemCount);
  }
  return copy;
}

/** Cantidades de días que tienen rutinas con el nivel y objetivo elegidos (la búsqueda no cuenta). */
export function availableDayCounts(
  list: readonly CatalogRoutine[],
  filters: Pick<CatalogFilters, "level" | "objective">,
): number[] {
  const counts = new Set<number>();
  for (const routine of filterCatalog(list, { query: "", days: "all", ...filters })) {
    if (routine.dayCount >= 1 && routine.dayCount <= MAX_WEEK_DAYS) counts.add(routine.dayCount);
  }
  return [...counts].sort((left, right) => left - right);
}

export function resolveDayOption(value: DayOption, available: readonly number[]): DayOption {
  return value === "all" || available.includes(value) ? value : "all";
}

/** La cantidad disponible más cercana por debajo y por arriba de `days`. */
export function neighborDayCounts(available: readonly number[], days: number): number[] {
  const lower = available.filter((count) => count < days).at(-1);
  const higher = available.find((count) => count > days);
  return [lower, higher].filter((count): count is number => count !== undefined);
}

/** Cuántas rutinas quedan por opción de un grupo, con los demás filtros aplicados. */
export function optionCounts(
  list: readonly CatalogRoutine[],
  filters: CatalogFilters,
  group: "level" | "objective",
): Record<string, number> {
  const base = filterCatalog(list, { ...filters, [group]: "all" });
  const keys: readonly string[] = group === "level" ? ROUTINE_DIFFICULTIES : ROUTINE_OBJECTIVES;
  return Object.fromEntries(
    keys.map((key) => [
      key,
      base.filter((routine) => (group === "level" ? routine.difficulty : routine.objective) === key).length,
    ]),
  );
}

/** La primera rutina de cada nivel, de principiante a avanzado. */
export function pickLevelFeatured<T extends CatalogRoutine>(list: readonly T[]): T[] {
  return ROUTINE_DIFFICULTIES.map((level) => list.find((routine) => routine.difficulty === level)).filter(
    (routine): routine is T => routine !== undefined,
  );
}

export function sharedLevel(list: readonly CatalogRoutine[]): RoutineDifficulty | null {
  const first = list[0];
  if (!first) return null;
  return list.every((routine) => routine.difficulty === first.difficulty) ? first.difficulty : null;
}

/** Un solo emerald por pantalla: la card actual, salvo que ya sea tu rutina activa. */
export function featureCtaTone({
  isCurrent,
  status,
}: {
  isCurrent: boolean;
  status: SavedStatus | null;
}): "primary" | "neutral" {
  return isCurrent && status !== "active" ? "primary" : "neutral";
}

export function countLabel(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function routineCountLabel(count: number): string {
  return countLabel(count, "rutina", "rutinas");
}

export function dayCountLabel(count: number): string {
  return countLabel(count, "día", "días");
}

export function weekSplit(days: number): { train: number; rest: number; label: string } {
  const train = Math.min(MAX_WEEK_DAYS, Math.max(0, Math.round(days)));
  const rest = MAX_WEEK_DAYS - train;
  const restLabel = rest === 0 ? "sin descanso" : countLabel(rest, "descanso", "descansos");
  return { train, rest, label: `${countLabel(train, "entreno", "entrenos")} · ${restLabel}` };
}

export function resultsHeading(count: number, days: DayOption): string {
  if (count === 0) return days === "all" ? "Sin rutinas" : `Sin rutinas de ${dayCountLabel(days)}`;
  if (days !== "all") return `${routineCountLabel(count)} de ${dayCountLabel(days)}`;
  return count === 1 ? routineCountLabel(1) : `Las ${count} rutinas`;
}

export function catalogResultLabel(count: number): string {
  return `Ver ${routineCountLabel(count)}`;
}

export function catalogAnnouncement({
  searching,
  query,
  count,
  days,
}: {
  searching: boolean;
  query: string;
  count: number;
  days: DayOption;
}): string {
  const trimmed = query.trim();
  if (!searching) return resultsHeading(count, days);
  if (!trimmed) return routineCountLabel(count);
  if (count === 0) return `Sin resultados para ${trimmed}`;
  return `${countLabel(count, "resultado", "resultados")} para ${trimmed}`;
}

export function emptyResultsMessage({
  query,
  level,
  objective,
  countWithoutFilters,
}: {
  query: string;
  level: LevelFilter;
  objective: ObjectiveFilter;
  countWithoutFilters: number;
}): string {
  const parts: string[] = [];
  if (level !== "all") parts.push(`nivel ${ROUTINE_DIFFICULTY_LABELS[level].toLowerCase()}`);
  if (objective !== "all") parts.push(`objetivo ${ROUTINE_OBJECTIVE_LABELS[objective].toLowerCase()}`);
  const scope = parts.length > 0 ? ` de ${parts.join(" y ")}` : "";
  const trimmed = query.trim();
  const first = trimmed ? `Ninguna rutina${scope} incluye "${trimmed}".` : `No hay rutinas${scope}.`;
  const hasFilters = parts.length > 0;
  return hasFilters && countWithoutFilters > 0 ? `${first} Sin filtros hay ${countWithoutFilters}.` : first;
}

/** Teclado de un radiogroup (patrón WAI-ARIA): flechas con vuelta, Home y End. */
export function nextRadioIndex(key: string, index: number, count: number): number | null {
  if (count <= 0) return null;
  switch (key) {
    case "ArrowRight":
    case "ArrowDown":
      return (index + 1) % count;
    case "ArrowLeft":
    case "ArrowUp":
      return (index - 1 + count) % count;
    case "Home":
      return 0;
    case "End":
      return count - 1;
    default:
      return null;
  }
}

/** Posición continua (0…n-1) de `position` entre los centros medidos de los ítems. */
export function fractionalIndex(centers: readonly number[], position: number): number {
  if (centers.length <= 1) return 0;
  if (position <= centers[0]) return 0;
  const last = centers.length - 1;
  if (position >= centers[last]) return last;
  for (let index = 0; index < last; index++) {
    const start = centers[index];
    const end = centers[index + 1];
    if (position >= start && position < end) {
      return index + (end > start ? (position - start) / (end - start) : 0);
    }
  }
  return last;
}

/** Slide actual de un carrusel con snap: el más cercano, o el último si ya no se puede scrollear más. */
export function carouselIndex(snapOffsets: readonly number[], scrollLeft: number, maxScroll: number): number {
  if (snapOffsets.length === 0 || maxScroll <= 0) return 0;
  if (scrollLeft >= maxScroll - 1) return snapOffsets.length - 1;
  let best = 0;
  for (let index = 1; index < snapOffsets.length; index++) {
    if (Math.abs(snapOffsets[index] - scrollLeft) < Math.abs(snapOffsets[best] - scrollLeft)) best = index;
  }
  return best;
}

const GLYPH_STEPS = {
  number: [7, 2.75, 1.75],
  word: [3.25, 1.25, 1],
} as const;

const NEAR_COLOR = "var(--foreground-subtle)";
/** `--border-strong` solo da 1.7:1 sobre el fondo; mezclado con subtle queda en ≥3:1 (texto grande). */
const FAR_COLOR = "color-mix(in oklab, var(--foreground-subtle) 70%, var(--border-strong))";

function round4(value: number) {
  return Math.round(value * 10000) / 10000;
}

/** Escala y color de un glifo de la rueda según su distancia (en ítems) al centro. */
export function wheelGlyph(distance: number, kind: "number" | "word"): { scale: number; color: string } {
  const d = Math.abs(distance);
  const [base, near, far] = GLYPH_STEPS[kind];
  const nearScale = near / base;
  const farScale = far / base;

  if (d >= 2) return { scale: round4(farScale), color: FAR_COLOR };
  if (d >= 1) {
    const t = d - 1;
    const color = t === 0 ? NEAR_COLOR : `color-mix(in oklab, ${NEAR_COLOR} ${Math.round((1 - t) * 100)}%, ${FAR_COLOR})`;
    return { scale: round4(nearScale + (farScale - nearScale) * t), color };
  }
  const color =
    d === 0 ? "var(--foreground)" : `color-mix(in oklab, var(--foreground) ${Math.round((1 - d) * 100)}%, ${NEAR_COLOR})`;
  return { scale: round4(1 + (nearScale - 1) * d), color };
}
