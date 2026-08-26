// Service Worker mínimo para habilitar la instalación de la PWA.
// Cachea el "app shell" básico y sirve desde caché cuando no hay red.

const CACHE_NAME = 'lampsex-cache-v1';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './favicon-32.png',
  './favicon-192.png',
  './favicon-512.png',
  './favicon-180.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch(() => {
        // Si algún recurso no existe todavía en el servidor, no bloqueamos la instalación.
      })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Estrategia: red primero, con respaldo en caché (útil para contenido dinámico
// como fotos y datos de Firebase, evitando servir versiones muy desactualizadas).
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          // Solo cacheamos respuestas válidas del mismo origen (el app shell).
          if (response.ok && event.request.url.startsWith(self.location.origin)) {
            cache.put(event.request, copy);
          }
        });
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
