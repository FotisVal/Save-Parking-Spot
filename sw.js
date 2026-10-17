const CACHE_NAME = "parknous-annular-controller-v4-20261017";

const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./favicon.png",
  "./icon-192.png",
  "./icon-512.jpg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );

  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );

  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const request = event.request;
  const url = new URL(request.url);

  // Firebase, Google Maps και άλλα third-party requests
  // δεν περνούν από το ParkNous cache.
  if (url.origin !== self.location.origin) return;

  // Για το index:
  // εμφανίζουμε άμεσα την cached έκδοση και παράλληλα
  // κατεβάζουμε τη νεότερη για την επόμενη φόρτωση.
  if (request.mode === "navigate") {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match("./index.html");

        const networkPromise = fetch(request)
          .then((response) => {
            if (response && response.ok) {
              cache.put("./index.html", response.clone());
            }

            return response;
          })
          .catch(() => null);

        return cached || (await networkPromise) || Response.error();
      })
    );

    return;
  }

  // Για static αρχεία του ParkNous:
  // cache first.
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200) {
          return networkResponse;
        }

        const responseClone = networkResponse.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseClone);
        });

        return networkResponse;
      });
    })
  );
});
