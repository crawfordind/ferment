// Ferment Tracker service worker — app-shell precache + runtime caching.
// Bump CACHE to invalidate old caches on deploy.
const CACHE = "ferment-v1";
const PRECACHE = [
  "/",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

function cachePut(request, response) {
  const copy = response.clone();
  caches.open(CACHE).then((cache) => cache.put(request, copy));
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // Never cache API/dynamic data — the app serves these from IndexedDB offline.
  if (url.pathname.startsWith("/api/")) return;

  // App-shell navigation: network-first, fall back to cache then the shell.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => cachePut(request, res))
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match("/")),
        ),
    );
    return;
  }

  // Static assets: stale-while-revalidate.
  const isAsset =
    url.pathname.startsWith("/_next/") ||
    url.pathname.startsWith("/icons/") ||
    /\.(?:png|jpe?g|svg|webp|gif|ico|woff2?|ttf|css|js)$/.test(url.pathname);

  if (isAsset) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const network = fetch(request)
          .then((res) => cachePut(request, res))
          .catch(() => cached);
        return cached || network;
      }),
    );
  }
});
