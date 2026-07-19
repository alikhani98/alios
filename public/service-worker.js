const CACHE_NAME = "alios-shell-v1";
const CACHE_PREFIX = "alios-shell-";
const scopeUrl = new URL(self.registration.scope);
const indexUrl = new URL("index.html", scopeUrl).href;
const fallbackUrl = new URL("./", scopeUrl).href;
const shellUrls = [
  fallbackUrl,
  indexUrl,
  new URL("manifest.webmanifest", scopeUrl).href,
  new URL("icons/icon-192.svg", scopeUrl).href,
  new URL("icons/icon-512.svg", scopeUrl).href,
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(shellUrls)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((cacheName) => cacheName.startsWith(CACHE_PREFIX))
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => caches.delete(cacheName))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(request.url);

  if (requestUrl.origin !== scopeUrl.origin || !requestUrl.pathname.startsWith(scopeUrl.pathname)) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            void caches.open(CACHE_NAME).then((cache) => cache.put(indexUrl, response.clone()));
          }

          return response;
        })
        .catch(async () => (await caches.match(indexUrl)) ?? caches.match(fallbackUrl))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(
      (cachedResponse) =>
        cachedResponse ??
        fetch(request).then((response) => {
          if (response.ok && requestUrl.pathname !== new URL("service-worker.js", scopeUrl).pathname) {
            void caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
          }

          return response;
        })
    )
  );
});
