const CACHE_NAME = "parknous-v5-20261017";

const STATIC_ASSETS = [
  "./manifest.json",
  "./favicon.png",
  "./icon-192.png",
  "./icon-512.jpg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );

  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );

  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const request = event.request;
  const url = new URL(request.url);

  // Μην πειράζουμε Firebase, Google Maps κλπ.
  if (url.origin !== self.location.origin) return;

  // HTML / page navigation:
  // ΠΡΩΤΑ network. Cache μόνο σαν fallback.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const clone = response.clone();

            caches.open(CACHE_NAME).then((cache) => {
              cache.put("./index.html", clone);
            });
          }

          return response;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_NAME);

          return (
            (await cache.match("./index.html")) ||
            Response.error()
          );
        })
    );

    return;
  }

  // Τα υπόλοιπα static assets μπορούν να είναι cache-first.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request).then((response) => {
        if (response && response.ok) {
          const clone = response.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, clone);
          });
        }

        return response;
      });
    })
  );
});
