/**
 * Lógica pura del orden de las comidas del día.
 * Sin imports a propósito: se testea con `node --test` (tests/unit/meal-order.test.mjs).
 */

/** Tipos que el home muestra siempre, en su orden habitual. */
export const DEFAULT_DAY_MEAL_TYPES = ["desayuno", "almuerzo", "merienda", "cena"] as const;

/** Inserta `id` justo después de `afterId`; `null` = al principio; `afterId` inexistente = al final. */
export function insertAfter(ids: string[], id: string, afterId: string | null): string[] {
  const rest = ids.filter((current) => current !== id);

  if (afterId === null) {
    return [id, ...rest];
  }

  const index = rest.indexOf(afterId);

  if (index === -1) {
    return [...rest, id];
  }

  return [...rest.slice(0, index + 1), id, ...rest.slice(index + 1)];
}

/** Intercambia `id` con su vecino. En los extremos devuelve el mismo orden. */
export function moveInOrder(ids: string[], id: string, direction: "up" | "down"): string[] {
  const index = ids.indexOf(id);
  const target = direction === "up" ? index - 1 : index + 1;

  if (index === -1 || target < 0 || target >= ids.length) {
    return ids;
  }

  const next = [...ids];
  [next[index], next[target]] = [next[target], next[index]];

  return next;
}

/**
 * Última comida registrada cuyo tipo va antes que `type` en el día (para sugerir dónde ubicar una
 * comida nueva). Snacks no tienen rango: una comida nueva de tipo snack va al final.
 */
export function suggestAfterMealId(meals: Array<{ id: string; type: string }>, type: string): string | null | undefined {
  const rank = rankOf(type);

  if (rank === -1) {
    return undefined;
  }

  const firstLater = meals.findIndex((meal) => rankOf(meal.type) > rank);

  if (firstLater === -1) {
    return undefined;
  }

  return firstLater === 0 ? null : meals[firstLater - 1].id;
}

export type DayMealRow<T> =
  | { kind: "meal"; key: string; type: string; meal: T }
  | { kind: "empty"; key: string; type: string };

/**
 * Filas del home: cada comida registrada en su orden, más un lugar vacío para cada tipo por defecto
 * sin registrar, ubicado antes de la primera comida de un tipo posterior (si no hay, al final).
 */
export function buildDayMealRows<T extends { id: string; type: string }>(meals: T[]): DayMealRow<T>[] {
  const rows: DayMealRow<T>[] = meals.map((meal) => ({ kind: "meal", key: meal.id, type: meal.type, meal }));

  for (const type of DEFAULT_DAY_MEAL_TYPES) {
    if (meals.some((meal) => meal.type === type)) {
      continue;
    }

    const rank = rankOf(type);
    const index = rows.findIndex((row) => rankOf(row.type) > rank);
    const empty: DayMealRow<T> = { kind: "empty", key: `empty-${type}`, type };

    if (index === -1) {
      rows.push(empty);
    } else {
      rows.splice(index, 0, empty);
    }
  }

  return rows;
}

function rankOf(type: string): number {
  return (DEFAULT_DAY_MEAL_TYPES as readonly string[]).indexOf(type);
}
