"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import type { DiaryActions } from "@/app/components/registro/diary-actions";
import type { MealGroup, MealLogItem } from "@/app/lib/meal-logs";
import {
  findAddedItem,
  findCreatedMeal,
  resolveAfterMealId,
  resolveTargetMeal,
  resolveTypeChange,
  resolveUndo,
  targetKey,
  targetMealSpec,
  type AddTarget,
  type UndoRecord,
} from "@/app/lib/meal-diary";
import type { FoodMeasure, MealItemInput, MealType } from "@/app/lib/nutrition-types";
import type { MealLogActionResult } from "@/app/nutricion/registro/actions";

/** Errores que indican que la pantalla quedó vieja: se muestran y se recarga el día. */
const STALE_MESSAGES = [
  "Las comidas del día cambiaron",
  "La comida ya no existe",
  "Ese alimento ya no está en la comida",
];

export type AddResult = UndoRecord & { kcal: number };

/**
 * Mutaciones del registro mobile. Todas pasan por una cola: cada una ve el resultado de la anterior,
 * así dos agregados seguidos no crean dos comidas ni calculan el lugar con datos viejos.
 */
export function useDiaryActions({
  logDate,
  meals,
  onMealsChange,
  actions,
  onMealCreated,
}: {
  logDate: string;
  meals: MealGroup[];
  onMealsChange: (meals: MealGroup[]) => void;
  actions: DiaryActions;
  onMealCreated: (mealId: string) => void;
}) {
  const queueRef = useRef<Promise<unknown>>(Promise.resolve());
  const latestMealsRef = useRef(meals);
  // Destino ("slot:merienda", "new:…") → comida que se creó para él en esta pantalla.
  const createdRef = useRef(new Map<string, string>());
  const toastIdsRef = useRef(new Set<string | number>());
  const [pending, setPending] = useState<ReadonlySet<string>>(new Set());

  useEffect(() => {
    latestMealsRef.current = meals;
  }, [meals]);

  useEffect(() => {
    const toastIds = toastIdsRef.current;
    return () => {
      for (const id of toastIds) toast.dismiss(id);
    };
  }, []);

  function enqueue<T>(key: string, task: () => Promise<T>): Promise<T> {
    setPending((current) => new Set(current).add(key));
    const run = queueRef.current.then(task, task);
    queueRef.current = run.catch(() => undefined);

    return run.finally(() => {
      setPending((current) => {
        const next = new Set(current);
        next.delete(key);
        return next;
      });
    });
  }

  function apply(meals: MealGroup[]) {
    latestMealsRef.current = meals;
    onMealsChange(meals);
  }

  async function refresh() {
    try {
      const result = await actions.refresh({ logDate });
      if (result.ok) apply(result.log.meals);
    } catch {
      // Sin conexión: queda lo que se ve hasta el próximo intento.
    }
  }

  /** Corre una acción, aplica el día que devuelve y avisa los errores. `null` si no se guardó. */
  async function run(request: () => Promise<MealLogActionResult>): Promise<MealGroup[] | null> {
    let result: MealLogActionResult;

    try {
      result = await request();
    } catch {
      toast.error(navigator.onLine ? "No se pudo guardar. Probá de nuevo." : "Sin conexión: no se guardó.");
      return null;
    }

    if (!result.ok) {
      toast.error(result.message);

      if (STALE_MESSAGES.some((message) => result.message.startsWith(message))) {
        await refresh();
      }

      return null;
    }

    apply(result.log.meals);
    return result.log.meals;
  }

  function addItem(target: AddTarget, item: MealItemInput): Promise<AddResult | null> {
    return enqueue(targetKey(target), async () => {
      const current = latestMealsRef.current;
      const match = item.kind === "food" ? { kind: "food" as const, id: item.foodId } : { kind: "recipe" as const, id: item.recipeId };
      const existing = resolveTargetMeal(target, current, createdRef.current);

      if (existing) {
        const beforeItems = new Set(existing.items.map((candidate) => candidate.id));
        const after = await run(() => actions.addItem({ logDate, mealId: existing.id, item }));
        const meal = after?.find((candidate) => candidate.id === existing.id) ?? null;
        const added = findAddedItem(beforeItems, meal, match);
        return meal && added ? { mealId: meal.id, itemId: added.id, createdMeal: false, kcal: added.kcal } : null;
      }

      if (target.kind === "meal") {
        toast.error("La comida ya no existe. Actualizamos el día.");
        await refresh();
        return null;
      }

      const spec = targetMealSpec(target);
      const beforeIds = new Set(current.map((meal) => meal.id));
      const after = await run(() =>
        actions.createMeal({
          logDate,
          name: spec.name,
          type: spec.type,
          afterMealId: resolveAfterMealId(current, spec.type),
          items: [item],
        }),
      );
      const created = after ? findCreatedMeal(beforeIds, after, spec) : null;
      const added = created?.items[0];

      if (!created || !added) return null;

      createdRef.current.set(targetKey(target), created.id);
      onMealCreated(created.id);
      return { mealId: created.id, itemId: added.id, createdMeal: true, kcal: added.kcal };
    });
  }

  function undo(record: UndoRecord) {
    return enqueue(`undo:${record.itemId}`, async () => {
      const action = resolveUndo(latestMealsRef.current, record);
      if (!action) return false;

      const after =
        action.kind === "delete-meal"
          ? await run(() => actions.deleteMeal({ logDate, mealId: action.mealId }))
          : await run(() => actions.deleteItem({ logDate, itemId: action.itemId }));

      return after !== null;
    });
  }

  /** Aviso con "Deshacer" para lo que se agregó fuera del sheet. */
  function toastAdded(message: string, record: UndoRecord) {
    const id = toast.success(message, {
      duration: 6000,
      action: { label: "Deshacer", onClick: () => void undo(record) },
      onDismiss: () => toastIdsRef.current.delete(id),
      onAutoClose: () => toastIdsRef.current.delete(id),
    });
    toastIdsRef.current.add(id);
  }

  function updateItem(itemId: string, measure: FoodMeasure, quantity: number) {
    return enqueue(`item:${itemId}`, async () =>
      (await run(() => actions.updateItem({ logDate, itemId, measure, quantity }))) !== null,
    );
  }

  /** Quita un alimento; si era el único, borra la comida entera. */
  function removeItem(item: MealLogItem, meal: MealGroup) {
    return enqueue(`item:${item.id}`, async () => {
      const onlyItem = meal.items.length === 1 && meal.items[0].id === item.id;
      const after = onlyItem
        ? await run(() => actions.deleteMeal({ logDate, mealId: meal.id }))
        : await run(() => actions.deleteItem({ logDate, itemId: item.id }));
      return after !== null;
    });
  }

  function deleteMeal(mealId: string) {
    return enqueue(`meal:${mealId}`, async () =>
      (await run(() => actions.deleteMeal({ logDate, mealId }))) !== null,
    );
  }

  function moveMeal(mealId: string, direction: "up" | "down") {
    return enqueue(`meal:${mealId}`, async () =>
      (await run(() => actions.moveMeal({ logDate, mealId, direction }))) !== null,
    );
  }

  function renameMeal(mealId: string, name: string) {
    return enqueue(`meal:${mealId}`, async () =>
      (await run(() => actions.updateMeal({ logDate, mealId, name }))) !== null,
    );
  }

  function changeMealType(meal: MealGroup, type: MealType) {
    return enqueue(`meal:${meal.id}`, async () =>
      (await run(() => actions.updateMeal({ logDate, mealId: meal.id, ...resolveTypeChange(meal, type) }))) !== null,
    );
  }

  return {
    pending,
    addItem,
    undo,
    toastAdded,
    updateItem,
    removeItem,
    deleteMeal,
    moveMeal,
    renameMeal,
    changeMealType,
  };
}
