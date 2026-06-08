const IS_LOCAL =
  self.location.hostname === "localhost" ||
  self.location.hostname === "127.0.0.1" ||
  self.location.hostname.endsWith(".local");

// On localhost, tear down any old worker/cache (Chrome can keep a stale SW from another project).
if (IS_LOCAL) {
  self.addEventListener("install", () => self.skipWaiting());

  self.addEventListener("activate", (event) => {
    event.waitUntil(
      (async () => {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
        await self.registration.unregister();
        // Do not call client.navigate() here — Chrome can reload endlessly on localhost.
      })()
    );
  });

  // Do not intercept requests during local development.
} else {
  const CACHE_NAME = "campus-canteen-v2";
  const SHELL_URLS = ["/", "/login", "/manifest.webmanifest"];

  self.addEventListener("install", (event) => {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_URLS))
    );
    self.skipWaiting();
  });

  self.addEventListener("activate", (event) => {
    event.waitUntil(
      caches.keys().then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
        )
      )
    );
    self.clients.claim();
  });

  /** Network-first for pages; never cache API. */
  self.addEventListener("fetch", (event) => {
    const url = new URL(event.request.url);
    if (url.pathname.startsWith("/api/")) return;
    if (event.request.method !== "GET") return;

    const isNavigation =
      event.request.mode === "navigate" ||
      event.request.destination === "document";

    if (isNavigation) {
      event.respondWith(
        fetch(event.request)
          .then((response) => {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
            return response;
          })
          .catch(() =>
            caches.match(event.request).then((r) => r ?? caches.match("/"))
          )
      );
      return;
    }

    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
  });
}
