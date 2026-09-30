"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import {
  addCustomSupplementAction,
  deleteSupplementAction,
  saveSupplementAction,
} from "@/app/configuracion/actions";
import { mergeWithPresets, type Supplement } from "@/app/lib/supplements";

const AUTOSAVE_DELAY_MS = 800;

/** Un común se identifica por su clave (puede no tener fila todavía); un propio, por su id. */
export function supplementKey(item: Supplement): string {
  return item.presetKey ?? item.id ?? item.name;
}

/**
 * Lista de S8 (DESIGN.md §15.2): marcar y el switch del aviso guardan al toque; la hora a los 800 ms y al
 * cerrar. Los guardados de una misma fila van en orden (el primero crea la fila, los siguientes la actualizan).
 * Si el server falla, la fila vuelve a lo último guardado.
 */
export function useSupplements(initial: Supplement[]) {
  const [items, setItems] = useState(() => mergeWithPresets(initial));
  const itemsRef = useRef(items);
  const savedRef = useRef(new Map(items.map((item) => [supplementKey(item), item])));
  const chainsRef = useRef(new Map<string, Promise<void>>());
  const timersRef = useRef(new Map<string, number>());

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const replace = useCallback((key: string, next: Supplement | null) => {
    setItems((current) => {
      const updated = next
        ? current.map((item) => (supplementKey(item) === key ? next : item))
        : current.filter((item) => supplementKey(item) !== key);
      itemsRef.current = updated;
      return updated;
    });
  }, []);

  const persist = useCallback(
    (key: string) => {
      const timer = timersRef.current.get(key);
      if (timer) {
        window.clearTimeout(timer);
        timersRef.current.delete(key);
      }

      const previous = chainsRef.current.get(key) ?? Promise.resolve();
      const next = previous.then(async () => {
        const item = itemsRef.current.find((candidate) => supplementKey(candidate) === key);
        if (!item) return;

        try {
          const result = await saveSupplementAction({
            id: item.id,
            presetKey: item.presetKey,
            active: item.active,
            reminderEnabled: item.reminderEnabled,
            reminderTime: item.reminderTime,
          });

          if (!result.ok) throw new Error(result.message);

          const latest = itemsRef.current.find((candidate) => supplementKey(candidate) === key) ?? item;
          const withId = { ...latest, id: result.supplement.id };
          savedRef.current.set(key, { ...item, id: result.supplement.id });
          if (latest.id !== withId.id) replace(key, withId);
        } catch (error) {
          toast.error(error instanceof Error && error.message ? error.message : "No se pudo guardar el suplemento.");
          const saved = savedRef.current.get(key);
          if (saved) replace(key, saved);
        }
      });

      chainsRef.current.set(key, next);
    },
    [replace],
  );

  const patch = useCallback(
    (key: string, changes: Partial<Supplement>) => {
      const item = itemsRef.current.find((candidate) => supplementKey(candidate) === key);
      if (!item) return;
      replace(key, { ...item, ...changes });
    },
    [replace],
  );

  const toggleActive = useCallback(
    (key: string) => {
      const item = itemsRef.current.find((candidate) => supplementKey(candidate) === key);
      if (!item) return;
      patch(key, { active: !item.active });
      persist(key);
    },
    [patch, persist],
  );

  const setReminderEnabled = useCallback(
    (key: string, reminderEnabled: boolean) => {
      patch(key, { reminderEnabled });
      persist(key);
    },
    [patch, persist],
  );

  const setReminderTime = useCallback(
    (key: string, reminderTime: string) => {
      patch(key, { reminderTime });
      const timer = timersRef.current.get(key);
      if (timer) window.clearTimeout(timer);
      timersRef.current.set(
        key,
        window.setTimeout(() => persist(key), AUTOSAVE_DELAY_MS),
      );
    },
    [patch, persist],
  );

  /** Guarda ya las horas pendientes (al cerrar el sheet). */
  const flush = useCallback(() => {
    for (const key of [...timersRef.current.keys()]) persist(key);
  }, [persist]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      for (const timer of timers.values()) window.clearTimeout(timer);
    };
  }, []);

  /** "Agregar otro": devuelve el error para mostrarlo junto al campo, o `null` si entró. */
  const addCustom = useCallback(
    async (name: string): Promise<string | null> => {
      const result = await addCustomSupplementAction(name).catch(() => null);

      if (!result) return "No se pudo agregar.";
      if (!result.ok) return result.message;

      const added = result.supplement;
      const key = supplementKey(added);
      savedRef.current.set(key, added);
      setItems((current) => {
        const exists = current.some((item) => supplementKey(item) === key);
        const updated = exists
          ? current.map((item) => (supplementKey(item) === key ? added : item))
          : [...current, added];
        itemsRef.current = updated;
        return updated;
      });

      return null;
    },
    [],
  );

  const remove = useCallback(
    (key: string) => {
      const index = itemsRef.current.findIndex((candidate) => supplementKey(candidate) === key);
      const item = itemsRef.current[index];
      if (!item?.id || item.presetKey) return;

      replace(key, null);
      void deleteSupplementAction(item.id)
        .then((result) => {
          if (!result.ok) throw new Error(result.message);
          savedRef.current.delete(key);
        })
        .catch((error) => {
          toast.error(error instanceof Error && error.message ? error.message : "No se pudo borrar el suplemento.");
          setItems((current) => {
            const updated = [...current.slice(0, index), item, ...current.slice(index)];
            itemsRef.current = updated;
            return updated;
          });
        });
    },
    [replace],
  );

  const activeCount = useMemo(() => items.filter((item) => item.active).length, [items]);

  return { items, activeCount, toggleActive, setReminderEnabled, setReminderTime, flush, addCustom, remove };
}

export type SupplementsForm = ReturnType<typeof useSupplements>;
