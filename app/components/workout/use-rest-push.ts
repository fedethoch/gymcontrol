"use client";

import { useEffect, useRef } from "react";

import { getCurrentPushSubscription, getPushSupport } from "@/app/lib/push-client";
import { decideRestPush, REST_CANCEL_BEFORE_END_MS } from "@/app/lib/rest-push";

type RestForPush = { endsAt: number; next: string | null } | null;

/**
 * Aviso de fin del descanso (DESIGN.md §6.4 y §11.3): sigue al timer de la pantalla y programa, reprograma
 * (+15 s) o cancela (Saltar, fin, salir) el push del server. Solo si este dispositivo tiene avisos activados.
 * Los pedidos van con `keepalive`: el celu se puede bloquear apenas se marca la serie.
 */
export function useRestPush({
  endsAt,
  next,
  enabled,
  savedRoutineId,
  dayOrder,
}: {
  /** Fin del descanso en curso (ms epoch del celu) o `null` sin descanso. */
  endsAt: number | null;
  /** Texto de la próxima serie; `null` si ya no queda ninguna (no hace falta avisar). */
  next: string | null;
  enabled: boolean;
  savedRoutineId: string;
  dayOrder: number;
}) {
  const endpointRef = useRef<string | null>(null);
  const scheduledEndsAtRef = useRef<number | null>(null);
  const tokenRef = useRef<string | null>(null);
  const restRef = useRef<RestForPush>(null);
  const syncRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    if (!enabled || getPushSupport() !== "supported" || Notification.permission !== "granted") {
      return;
    }

    let cancelled = false;

    void getCurrentPushSubscription().then((subscription) => {
      if (!cancelled) endpointRef.current = subscription?.endpoint ?? null;
    });

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  useEffect(() => {
    restRef.current = endsAt === null ? null : { endsAt, next };

    function schedule(current: { endsAt: number; next: string | null }) {
      scheduledEndsAtRef.current = current.endsAt;
      tokenRef.current = null;
      const stillCurrent = () => scheduledEndsAtRef.current === current.endsAt;

      void fetch("/api/push/rest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: endpointRef.current,
          endsAt: current.endsAt,
          sentAt: Date.now(),
          savedRoutineId,
          dayOrder,
          next: current.next,
        }),
        keepalive: true,
      })
        .then(async (response) => {
          if (!response.ok) {
            if (stillCurrent()) scheduledEndsAtRef.current = null;
            return;
          }

          const data = (await response.json()) as { token?: string };
          if (stillCurrent()) tokenRef.current = data.token ?? null;
        })
        .catch(() => {
          if (stillCurrent()) scheduledEndsAtRef.current = null;
        });
    }

    function cancel() {
      const token = tokenRef.current;
      scheduledEndsAtRef.current = null;
      tokenRef.current = null;

      void fetch("/api/push/rest", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(token ? { token } : {}),
        keepalive: true,
      }).catch(() => undefined);
    }

    function sync() {
      if (!endpointRef.current) {
        return;
      }

      const current = restRef.current;
      const action = decideRestPush({
        rest: current,
        scheduledEndsAt: scheduledEndsAtRef.current,
        visible: document.visibilityState === "visible",
        canVibrate: "vibrate" in navigator,
        now: Date.now(),
      });

      if (action === "schedule" && current) {
        schedule(current);
      } else if (action === "cancel") {
        cancel();
      }
    }

    syncRef.current = sync;
    sync();

    // Android: cerca del fin, con la app a la vista, avisa la pantalla (vibra) y se cancela el push.
    const nearEnd =
      endsAt !== null && "vibrate" in navigator
        ? window.setTimeout(sync, Math.max(0, endsAt - REST_CANCEL_BEFORE_END_MS - Date.now()))
        : undefined;

    return () => window.clearTimeout(nearEnd);
  }, [endsAt, next, savedRoutineId, dayOrder]);

  useEffect(() => {
    // Al ocultarse la app se vuelve a mirar: si se había cancelado cerca del fin, se reprograma.
    const onVisibility = () => syncRef.current();

    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      // Salir del entreno: el timer se va con la pantalla, el aviso también.
      restRef.current = null;
      syncRef.current();
    };
  }, []);
}
