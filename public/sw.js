// Minimal service worker: passthrough (no caching) agar aman dari stale,
// sekaligus memenuhi kriteria installable PWA.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  // sengaja passthrough ke network, tanpa cache
});
