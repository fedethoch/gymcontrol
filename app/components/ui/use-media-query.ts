"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Estado de una media query. Devuelve `null` en el servidor y durante la hidratación (todavía no se
 * sabe), así nada que dependa del ancho se abre por un instante en el tamaño equivocado.
 */
export function useMediaQuery(query: string): boolean | null {
  const subscribe = useCallback(
    (notify: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", notify);
      return () => list.removeEventListener("change", notify);
    },
    [query],
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => null,
  );
}
