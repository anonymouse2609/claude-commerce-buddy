const STATIC_CACHE = 'static-cache-v3';
const API_CACHE = 'api-cache-v3';

// Assets to cache on install (app shell)
const staticAssets = [
  '/',
  '/index.html',
  '/robots.txt',
  // Add other static assets as needed
];

// Install event - cache app shell
self.addEventListener('install', event => {
  console.log('Service Worker installing.');
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => {
      return cache.addAll(staticAssets);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker activating.');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== STATIC_CACHE && cacheName !== API_CACHE) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - handle requests
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Handle static assets (same origin) - cache-first strategy
  if (url.origin === location.origin) {
    event.respondWith(
      caches.match(event.request).then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request).then(fetchResponse => {
          // Cache successful responses
          if (fetchResponse.status === 200) {
            const responseClone = fetchResponse.clone();
            caches.open(STATIC_CACHE).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return fetchResponse;
        });
      })
    );
  } else {
    // Handle API calls and external resources - network-first strategy
    event.respondWith(
      fetch(event.request).then(response => {
        // Cache successful API responses
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(API_CACHE).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      }).catch(() => {
        // Network failed, try cache
        return caches.match(event.request);
      })
    );
  }
});