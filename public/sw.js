/* Overrool — service worker: app shell + corpus precaching, network-first with cache fallback. */
const CACHE = 'overrool-v3';
const PRECACHE = ['/', '/index.html', '/manifest.webmanifest', '/data/indian_cases.json', '/data/scenarios.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // never intercept BYOK API traffic
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (!res.ok) return res;
        if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/data/')) {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy));
        }
        return res;
      })
      .catch(() =>
        caches.match(req).then((hit) =>
          hit || (req.mode === 'navigate' ? caches.match('/index.html') : Promise.resolve(null))
        )
      )
  );
});