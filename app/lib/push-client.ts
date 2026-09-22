// Avisos push del lado del navegador (DESIGN.md §6.4): soporte, suscripción de este dispositivo y
// llamadas a /api/push/*. Sin estado propio: lo usan PushRuntime, usePushDevice, SignOutForm y el descanso.

export type PushSupport = "supported" | "needs_install" | "unsupported";

function isAppleMobile() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in window.navigator && (window.navigator as { standalone?: boolean }).standalone === true)
  );
}

/** En iPhone los avisos solo existen con la app instalada en la pantalla de inicio (iOS 16.4+). */
export function getPushSupport(): PushSupport {
  const hasApis = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

  if (hasApis) {
    return "supported";
  }

  return isAppleMobile() && !isStandalone() ? "needs_install" : "unsupported";
}

export function getVapidPublicKey() {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
}

function urlBase64ToUint8Array(value: string) {
  const padded = `${value}${"=".repeat((4 - (value.length % 4)) % 4)}`.replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded);

  return Uint8Array.from(raw, (char) => char.charCodeAt(0));
}

/** Registro del service worker. Solo existe en producción (PwaRuntime). */
export async function getPushRegistration(timeoutMs = 4_000) {
  if (!("serviceWorker" in navigator)) {
    return null;
  }

  const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs));

  return Promise.race([navigator.serviceWorker.ready, timeout]);
}

export async function getCurrentPushSubscription() {
  const registration = await getPushRegistration();

  return registration ? registration.pushManager.getSubscription() : null;
}

export async function subscribeThisDevice(registration: ServiceWorkerRegistration) {
  const existing = await registration.pushManager.getSubscription();

  if (existing) {
    return existing;
  }

  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(getVapidPublicKey()),
  });
}

export async function postPushSubscription(subscription: PushSubscription) {
  const json = subscription.toJSON();
  const response = await fetch("/api/push/subscription", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      endpoint: json.endpoint,
      keys: { p256dh: json.keys?.p256dh, auth: json.keys?.auth },
      userAgent: navigator.userAgent.slice(0, 400),
    }),
  });

  return response.ok;
}

/** Borra la suscripción de este dispositivo en el server y en el navegador (desactivar, cerrar sesión). */
export async function forgetThisDevice() {
  const subscription = await getCurrentPushSubscription();

  if (!subscription) {
    return;
  }

  await fetch("/api/push/subscription", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint: subscription.endpoint }),
    keepalive: true,
  }).catch(() => undefined);
  await subscription.unsubscribe().catch(() => false);
}

/** Versión del service worker activo (`SW_VERSION` en public/sw.js). `null` si no responde. */
export async function getServiceWorkerVersion(registration: ServiceWorkerRegistration, timeoutMs = 3_000) {
  const worker = registration.active;

  if (!worker) {
    return null;
  }

  return new Promise<string | null>((resolve) => {
    const timer = setTimeout(() => {
      navigator.serviceWorker.removeEventListener("message", onMessage);
      resolve(null);
    }, timeoutMs);

    function onMessage(event: MessageEvent) {
      if (event.data?.type !== "gc:version") {
        return;
      }

      clearTimeout(timer);
      navigator.serviceWorker.removeEventListener("message", onMessage);
      resolve(typeof event.data.version === "string" ? event.data.version : null);
    }

    navigator.serviceWorker.addEventListener("message", onMessage);
    navigator.serviceWorker.startMessages();
    worker.postMessage({ type: "gc:version" });
  });
}
