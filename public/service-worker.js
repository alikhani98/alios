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
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await cache.addAll(shellUrls);

      try {
        const manifestUrl = new URL("precache-manifest.json", scopeUrl).href;
        const response = await fetch(manifestUrl);
        if (response.ok) {
          const manifest = await response.json();
          if (Array.isArray(manifest.chunks)) {
            await cache.addAll(manifest.chunks);
          }
        }
      } catch {
        // Runtime caching still covers chunks after first successful request.
      }
    })
  );
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

function isRecord(value) {
  return typeof value === "object" && value !== null;
}

function parsePushPayload(value) {
  if (!isRecord(value) || typeof value.title !== "string" || value.title.trim() === "") {
    return null;
  }

  const optionalFields = ["body", "url", "taskId", "focusId"];
  for (const field of optionalFields) {
    if (
      value[field] !== undefined &&
      (typeof value[field] !== "string" || value[field].trim() === "")
    ) {
      return null;
    }
  }

  if (value.version !== undefined && typeof value.version !== "number") {
    return null;
  }

  return {
    ...(typeof value.version === "number" ? { version: value.version } : {}),
    title: value.title.trim(),
    ...(typeof value.body === "string" ? { body: value.body } : {}),
    ...(typeof value.url === "string" ? { url: value.url } : {}),
    ...(typeof value.taskId === "string" ? { taskId: value.taskId } : {}),
    ...(typeof value.focusId === "string" ? { focusId: value.focusId } : {}),
  };
}

function getNotificationUrl(payload) {
  const scopeUrl = new URL(self.registration.scope);
  const focusId = payload.focusId || payload.taskId;

  if (payload.url) {
    if (payload.url.startsWith("#")) {
      return new URL(`./${payload.url}`, scopeUrl).href;
    }

    if (payload.url.startsWith("/#/")) {
      return new URL(`.${payload.url}`, scopeUrl).href;
    }

    const resolvedUrl = new URL(payload.url, scopeUrl);
    return resolvedUrl.origin === self.location.origin
      ? resolvedUrl.href
      : scopeUrl.href;
  }

  if (focusId) {
    const query = new URLSearchParams({ focusId });
    return new URL(`./#/today?${query.toString()}`, scopeUrl).href;
  }

  return new URL("./#/", scopeUrl).href;
}

self.addEventListener("push", (event) => {
  event.waitUntil(
    (async () => {
      if (!event.data) {
        return;
      }

      let rawPayload;
      try {
        rawPayload = event.data.json();
      } catch {
        return;
      }

      const payload = parsePushPayload(rawPayload);
      if (!payload) {
        return;
      }

      const notificationOptions = {
        body: payload.body,
        data: {
          url: getNotificationUrl(payload),
          taskId: payload.taskId,
          focusId: payload.focusId,
        },
      };

      await self.registration.showNotification(
        payload.title,
        notificationOptions
      );
    })()
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const scopeUrl = new URL(self.registration.scope);
  const targetUrl =
    event.notification.data?.url ?? new URL("./#/", scopeUrl).href;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(
      (clientList) => {
        for (const client of clientList) {
          if ("focus" in client && client.url.startsWith(self.location.origin)) {
            return client.navigate(targetUrl).then(() => client.focus());
          }
        }

        return self.clients.openWindow(targetUrl);
      }
    )
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
            const responseForCache = response.clone();
            void caches.open(CACHE_NAME).then((cache) => cache.put(indexUrl, responseForCache));
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
            const responseForCache = response.clone();
            void caches.open(CACHE_NAME).then((cache) => cache.put(request, responseForCache));
          }

          return response;
        })
    )
  );
});
