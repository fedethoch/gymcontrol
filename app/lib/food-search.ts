/** Minúsculas y sin tildes: "Maíz" y "maiz" matchean igual. */
export function normalizeSearchText(value: string) {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

/** 0 = no coincide. Más alto = más relevante (nombre exacto > empieza con > palabra que empieza con > contiene). */
function scoreName(name: string, query: string) {
  const normalizedName = normalizeSearchText(name);

  if (normalizedName === query) return 100;
  if (normalizedName.startsWith(query)) return 80;

  const words = normalizedName.split(/[\s,()/-]+/).filter(Boolean);

  if (words.some((word) => word.startsWith(query))) return 60;

  const queryWords = query.split(/\s+/).filter(Boolean);

  if (queryWords.length > 1 && queryWords.every((queryWord) => words.some((word) => word.startsWith(queryWord)))) {
    return 50;
  }

  return normalizedName.includes(query) ? 30 : 0;
}

/**
 * Filtra y ordena por relevancia. `boost` suma puntos (ej. alimentos propios o frecuentes);
 * a igual puntaje gana el nombre más corto.
 */
export function searchByName<T extends { name: string }>(
  items: T[],
  query: string,
  options: { limit?: number; boost?: (item: T) => number } = {},
): T[] {
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) {
    return [];
  }

  const ranked = items
    .map((item, index) => ({ item, index, score: scoreName(item.name, normalizedQuery) }))
    .filter((entry) => entry.score > 0)
    .map((entry) => ({ ...entry, score: entry.score + (options.boost?.(entry.item) ?? 0) }))
    .sort((left, right) => right.score - left.score || left.item.name.length - right.item.name.length || left.index - right.index)
    .map((entry) => entry.item);

  return options.limit ? ranked.slice(0, options.limit) : ranked;
}
