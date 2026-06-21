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
