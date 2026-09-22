"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";

import {
  forgetThisDevice,
  getPushRegistration,
  getPushSupport,
  getServiceWorkerVersion,
  postPushSubscription,
  subscribeThisDevice,
  type PushSupport,
} from "@/app/lib/push-client";

/**
 * Estado de los avisos en ESTE dispositivo (DESIGN.md §6.4 y §15.2 S7).
 * `updating`: el service worker activo todavía es uno viejo sin avisos (recién deployado).
 */
export type PushDeviceStatus =
  | "loading"
  | "unsupported"
  | "needs_install"
  | "denied"
  | "updating"
  | "default"
  | "subscribed";

export type PushDevice = ReturnType<typeof usePushDevice>;

type WorkerState =
  | { phase: "pending" }
  | { phase: "missing" }
  | { phase: "ready"; version: string | null; endpoint: string | null };

function subscribeNothing() {
  return () => undefined;
}

/** El permiso se puede cambiar en Ajustes del sistema: se relee al volver a la app. */
function subscribeVisibility(onChange: () => void) {
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
}

function readPermission(): NotificationPermission | null {
  return "Notification" in window ? Notification.permission : null;
}

function describeDevice() {
  if (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) {
    return "este iPhone";
  }

  return /Android/i.test(navigator.userAgent) ? "este celu" : "este dispositivo";
}

function resolveStatus(
  support: PushSupport | null,
  permission: NotificationPermission | null,
  worker: WorkerState,
): PushDeviceStatus {
  if (support === null) return "loading";
  if (support !== "supported") return support;
  if (permission === "denied") return "denied";
  if (worker.phase === "pending") return "loading";
  if (worker.phase === "missing") return "unsupported";
  if (!worker.version) return "updating";

  return worker.endpoint && permission === "granted" ? "subscribed" : "default";
}

export function usePushDevice() {
  const support = useSyncExternalStore(subscribeNothing, getPushSupport, () => null);
  const permission = useSyncExternalStore(subscribeVisibility, readPermission, () => null);
  const deviceLabel = useSyncExternalStore(subscribeNothing, describeDevice, () => "este dispositivo");
  const [worker, setWorker] = useState<WorkerState>({ phase: "pending" });
  const [busy, setBusy] = useState<"enable" | "disable" | null>(null);
  // El registro se resuelve antes del tap: iOS exige pedir el permiso dentro del gesto, sin esperas previas.
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (support !== "supported") {
      return;
    }

    let cancelled = false;

    const load = async () => {
      const registration = await getPushRegistration();
      registrationRef.current = registration;

      if (!registration) {
        if (!cancelled) setWorker({ phase: "missing" });
        return;
      }

      const version = await getServiceWorkerVersion(registration);

      if (!version) {
        void registration.update().catch(() => undefined);
      }

      const subscription = await registration.pushManager.getSubscription();

      if (!cancelled) {
        setWorker({ phase: "ready", version, endpoint: subscription?.endpoint ?? null });
      }
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") void load();
    };
    const onControllerChange = () => void load();

    void load();
    document.addEventListener("visibilitychange", onVisible);
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, [support]);

  const status = resolveStatus(support, permission, worker);

  /** Tap en "Activar notificaciones": permiso → suscripción → alta en el server. */
  const enable = useCallback(async () => {
    const registration = registrationRef.current;

    if (!registration || busy) {
      return;
    }

    setBusy("enable");

    try {
      if ((await Notification.requestPermission()) !== "granted") {
        return;
      }

      const subscription = await subscribeThisDevice(registration);

      if (!(await postPushSubscription(subscription))) {
        toast.error("No se pudieron activar los avisos. Probá de nuevo.");
        return;
      }

      setWorker((current) =>
        current.phase === "ready" ? { ...current, endpoint: subscription.endpoint } : current,
      );
    } catch {
      toast.error("No se pudieron activar los avisos en este dispositivo.");
    } finally {
      setBusy(null);
    }
  }, [busy]);

  const disable = useCallback(async () => {
    if (busy) return;
    setBusy("disable");

    try {
      await forgetThisDevice();
      setWorker((current) => (current.phase === "ready" ? { ...current, endpoint: null } : current));
    } finally {
      setBusy(null);
    }
  }, [busy]);

  return {
    status,
    busy,
    swVersion: worker.phase === "ready" ? worker.version : null,
    deviceLabel,
    enable,
    disable,
  };
}
