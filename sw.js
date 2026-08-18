const CACHE_NAME = "parknous-v41";

const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./favicon.png",
  "./icon-192.png",
  "./icon-512.png",
  "./parknous_onlytext.svg",
  "./PARKNOUS_TXT.png",
  "./template_UI_parknous.png",
  "./phivimakes-logo-192.png",
  "./phivimakes-logo-256.webp",
  "./phivimakes-logo-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => Promise.allSettled(APP_SHELL.map((url) => cache.add(url)))));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.map((key) => key !== CACHE_NAME ? caches.delete(key) : null))));
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const request = event.request;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (request.mode === "navigate") {
    event.respondWith(fetch(request, { cache: "no-store" }).then((response) => {
      const responseClone = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put("./index.html", responseClone));
      return response;
    }).catch(async () => (await caches.match("./index.html")) || Response.error()));
    return;
  }
  event.respondWith(caches.match(request).then((cachedResponse) => {
    if (cachedResponse) return cachedResponse;
    return fetch(request).then((networkResponse) => {
      if (!networkResponse || networkResponse.status !== 200) return networkResponse;
      const responseClone = networkResponse.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
      return networkResponse;
    });
  }));
});
