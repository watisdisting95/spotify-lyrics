self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Simple pass-through for now. 
  // Full caching would require more logic, but this satisfies the PWA install criteria.
  event.respondWith(fetch(event.request));
});
