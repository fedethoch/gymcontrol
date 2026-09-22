"use client";

import { useEffect } from "react";

import { getCurrentPushSubscription, getPushSupport, postPushSubscription } from "@/app/lib/push-client";

const LAST_SYNC_KEY = "gymcontrol:push-sync:v1";
const SYNC_EVERY_MS = 24 * 60 * 60 * 1000;

function readLastSync() {
  try {
    return Number(window.localStorage.getItem(LAST_SYNC_KEY) ?? 0);
  } catch {
    return 0;
  }
}

function writeLastSync(value: number) {
  try {
    window.localStorage.setItem(LAST_SYNC_KEY, String(value));
  } catch {
    // Sin almacenamiento: se vuelve a sincronizar en la próxima carga.
  }
}

/**
 * Repara la suscripción de este dispositivo una vez por día: el push service puede rotar el endpoint
 * y el server borra los que responden 404/410. Solo con sesión y permiso ya concedido; nunca pide permiso.
 */
export function PushRuntime() {
  useEffect(() => {
    if (
      process.env.NODE_ENV !== "production" ||
      getPushSupport() !== "supported" ||
      Notification.permission !== "granted" ||
      Date.now() - readLastSync() < SYNC_EVERY_MS
    ) {
      return;
    }

    getCurrentPushSubscription()
      .then((subscription) => (subscription ? postPushSubscription(subscription) : false))
      .then((ok) => {
        if (ok) {
          writeLastSync(Date.now());
        }
      })
      .catch(() => undefined);
  }, []);

  return null;
}
