"use client";

import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";

import { resolvePanelSelection, type PanelSelection } from "@/app/lib/meal-diary";
import type { MealType } from "@/app/lib/nutrition-types";

const subscribeNothing = () => () => {};

type Selection = PanelSelection & { signature: string };

/**
 * Panel elegido del registro, seguido por clave (no por índice): sobrevive a comidas creadas,
 * borradas, reordenadas y al resumen del día cerrado. El carrusel es scroll-snap horizontal
 * (mismo mecanismo que `RoutineWeekView`) y su alto sigue al panel visible.
 */
export function useDiaryPager({
  panelKeys,
  initialKey,
  nextKey,
  typeOfKey,
}: {
  panelKeys: string[];
  initialKey: string;
  nextKey: string | null;
  typeOfKey: (key: string) => MealType | null;
}) {
  const pagerRef = useRef<HTMLDivElement>(null);
  const settleTimer = useRef<number | undefined>(undefined);
  // Índice hacia el que va un scroll suave: mientras dure, la alineación no lo corta.
  const navigatingRef = useRef<number | null>(null);
  const latestRef = useRef({ panelKeys, typeOfKey });
  // Antes de hidratar solo se pinta el panel inicial: sin salto desde el primero.
  const mounted = useSyncExternalStore(subscribeNothing, () => true, () => false);
  const signature = panelKeys.join("|");

  const [selection, setSelection] = useState<Selection>(() => {
    const key = panelKeys.includes(initialKey) ? initialKey : (panelKeys[0] ?? initialKey);
    return { signature, key, type: typeOfKey(key), index: Math.max(0, panelKeys.indexOf(key)) };
  });
  const [height, setHeight] = useState<number | null>(null);
  // Panel a seguir apenas aparezca (la comida recién creada llega en el render siguiente).
  const [followKey, setFollowKey] = useState<string | null>(null);

  let current = selection;

  if (followKey !== null && panelKeys.includes(followKey)) {
    current = { signature, key: followKey, type: typeOfKey(followKey), index: panelKeys.indexOf(followKey) };
    setSelection(current);
    setFollowKey(null);
  } else if (selection.signature !== signature) {
    current = { signature, ...resolvePanelSelection(panelKeys, selection, { nextKey, typeOfKey }) };
    setSelection(current);
  }

  const selectedIndex = current.index;
  const selectedKey = current.key;

  useEffect(() => {
    latestRef.current = { panelKeys, typeOfKey };
  });

  useLayoutEffect(() => {
    const pager = pagerRef.current;
    if (!mounted || !pager || navigatingRef.current === selectedIndex) return;
    pager.scrollLeft = selectedIndex * pager.clientWidth;
  }, [mounted, signature, selectedIndex]);

  useEffect(() => {
    const panel = pagerRef.current?.querySelector<HTMLElement>(`[data-panel-key="${CSS.escape(selectedKey)}"]`);
    if (!mounted || !panel) return;

    const observer = new ResizeObserver(([entry]) => {
      setHeight(Math.ceil(entry.target.getBoundingClientRect().height));
    });
    observer.observe(panel);
    return () => observer.disconnect();
  }, [mounted, signature, selectedKey]);

  useEffect(() => () => window.clearTimeout(settleTimer.current), []);

  function goTo(key: string) {
    const index = panelKeys.indexOf(key);
    if (index < 0) return;

    setSelection({ signature, key, type: typeOfKey(key), index });

    const pager = pagerRef.current;
    if (!pager) return;

    const left = index * pager.clientWidth;
    if (Math.abs(pager.scrollLeft - left) < 2) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      navigatingRef.current = null;
      pager.scrollLeft = left;
      return;
    }

    navigatingRef.current = index;
    pager.scrollTo({ left, behavior: "smooth" });
  }

  function onScroll() {
    window.clearTimeout(settleTimer.current);
    settleTimer.current = window.setTimeout(() => {
      navigatingRef.current = null;
      const pager = pagerRef.current;
      const { panelKeys: keys, typeOfKey: typeOf } = latestRef.current;
      if (!pager || pager.clientWidth === 0 || keys.length === 0) return;

      const index = Math.min(keys.length - 1, Math.max(0, Math.round(pager.scrollLeft / pager.clientWidth)));
      const key = keys[index];

      setSelection((previous) =>
        previous.key === key && previous.index === index
          ? previous
          : { signature: keys.join("|"), key, type: typeOf(key), index },
      );
    }, 90);
  }

  return {
    pagerRef,
    mounted,
    selectedKey,
    selectedIndex,
    height,
    onScroll,
    /** Desliza hasta el panel (sin animación con reduced-motion). */
    goTo,
    /** Va al panel en cuanto exista (sin animación): para una comida que se acaba de crear. */
    follow: setFollowKey,
  };
}
