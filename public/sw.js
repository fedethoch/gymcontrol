const CACHE_NAME = "gymcontrol-shell-v3";
const IMAGE_CACHE_NAME = "gymcontrol-images-v1";

const STATIC_ASSETS = [
  "/favicon.ico",
  "/manifest.webmanifest",
  "/logo/logo-192.png",
  "/logo/logo-512.png",
  "/logo/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  const KNOWN_CACHES = [CACHE_NAME, IMAGE_CACHE_NAME];
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => !KNOWN_CACHES.includes(key))
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  if (
    url.origin !== self.location.origin ||
    request.headers.has("range") ||
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/auth/") ||
    url.pathname.includes("/supabase/")
  ) {
    return;
  }

  if (
    request.mode === "navigate" ||
    request.destination === "document" ||
    url.pathname.startsWith("/_next/data/")
  ) {
    return;
  }

  if (
    url.pathname.startsWith("/_next/static/") ||
    STATIC_ASSETS.includes(url.pathname)
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) {
          return cached;
        }

        return fetch(request).then((response) => {
          if (!response || response.status !== 200) {
            return response;
          }

          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        });
      }),
    );
    return;
  }

  // Stale-while-revalidate for optimized exercise images
  if (url.pathname.startsWith("/_next/image")) {
    event.respondWith(
      caches.open(IMAGE_CACHE_NAME).then((cache) =>
        cache.match(request).then((cached) => {
          const fetchAndUpdate = fetch(request).then((response) => {
            if (response && response.status === 200) {
              cache.put(request, response.clone());
            }
            return response;
          });
          return cached ?? fetchAndUpdate;
        }),
      ),
    );
  }
});

// Avisos push (DESIGN.md §6.4). El payload lo arma `buildPushPayload` (app/lib/notifications.ts).
// iOS revoca la suscripción si un push no muestra notificación: siempre se muestra una, aunque el payload venga roto.
const SW_VERSION = "2026-09-21.1";

function readPushPayload(event) {
  try {
    const data = event.data ? event.data.json() : null;
    return data && typeof data === "object" ? data : {};
  } catch {
    return {};
  }
}

function textOr(value, fallback) {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function sameOriginUrl(value) {
  try {
    const url = new URL(textOr(value, "/"), self.location.origin);
    return url.origin === self.location.origin ? url.href : `${self.location.origin}/`;
  } catch {
    return `${self.location.origin}/`;
  }
}

self.addEventListener("push", (event) => {
  const receivedAt = Date.now();
  const payload = readPushPayload(event);
  const tag = textOr(payload.tag, undefined);

  const shown = self.registration.showNotification(textOr(payload.title, "GymControl"), {
    body: textOr(payload.body, ""),
    tag,
    renotify: Boolean(tag),
    icon: "/logo/logo-192.png",
    lang: "es-AR",
    data: { url: sameOriginUrl(payload.url), kind: textOr(payload.kind, null) },
  });

  // Fin del descanso: cuánto tardó en llegar respecto del fin del timer (los dos con el reloj del celu).
  const measured =
    payload.kind === "rest_end" && typeof payload.token === "string" && typeof payload.endsAt === "number"
      ? fetch("/api/push/rest/ack", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: payload.token, deltaMs: Math.round(receivedAt - payload.endsAt) }),
          keepalive: true,
        }).catch(() => undefined)
      : Promise.resolve();

  event.waitUntil(Promise.all([shown, measured]));
});

async function openFromNotification(url) {
  const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });

  for (const client of windows) {
    try {
      const focused = await client.focus();
      focused.postMessage({ type: "gc:navigate", url });
      return;
    } catch {
      // No se pudo enfocar esa ventana: probar la siguiente o abrir una nueva.
    }
  }

  await self.clients.openWindow(url);
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(openFromNotification(sameOriginUrl(event.notification.data && event.notification.data.url)));
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "gc:version" && event.source) {
    event.source.postMessage({ type: "gc:version", version: SW_VERSION });
  }
});
