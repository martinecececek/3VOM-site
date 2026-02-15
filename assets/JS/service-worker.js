// Service Worker for Gallery Performance
// Provides offline support and faster repeat loads

const CACHE_NAME = '3vom-gallery-v1';
const STATIC_CACHE = '3vom-static-v1';

// Files to cache on install
const STATIC_ASSETS = [
   '/3VOM-site/',
   '/3VOM-site/css/styles.css',
   '/3VOM-site/src/data/gallery.json',
   '/3VOM-site/assets/JS/gallery.js',
   '/3VOM-site/assets/JS/lightbox.js',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
   event.waitUntil(
      caches.open(STATIC_CACHE)
         .then((cache) => {
            console.log('Service Worker: Caching static assets');
            return cache.addAll(STATIC_ASSETS).catch((err) => {
               console.log('Service Worker: Some assets failed to cache', err);
            });
         })
         .then(() => self.skipWaiting())
   );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
   event.waitUntil(
      caches.keys().then((cacheNames) => {
         return Promise.all(
            cacheNames.map((cacheName) => {
               if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE) {
                  console.log('Service Worker: Deleting old cache', cacheName);
                  return caches.delete(cacheName);
               }
            })
         );
      }).then(() => self.clients.claim())
   );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
   const { request } = event;
   const url = new URL(request.url);

   // Only handle same-origin requests
   if (url.origin !== location.origin) {
      return;
   }

   // Handle gallery images with network-first strategy (always get fresh)
   if (request.url.includes('/gallery-12-pics/')) {
      event.respondWith(
         fetch(request)
            .then((response) => {
               // Clone the response before caching
               const responseClone = response.clone();
               caches.open(CACHE_NAME).then((cache) => {
                  cache.put(request, responseClone);
               });
               return response;
            })
            .catch(() => {
               // If network fails, try cache
               return caches.match(request);
            })
      );
      return;
   }

   // Handle gallery.json with network-first (always fresh data)
   if (request.url.includes('gallery.json')) {
      event.respondWith(
         fetch(request)
            .then((response) => {
               const responseClone = response.clone();
               caches.open(CACHE_NAME).then((cache) => {
                  cache.put(request, responseClone);
               });
               return response;
            })
            .catch(() => {
               return caches.match(request);
            })
      );
      return;
   }

   // For everything else, use cache-first strategy
   event.respondWith(
      caches.match(request)
         .then((cachedResponse) => {
            if (cachedResponse) {
               return cachedResponse;
            }
            // Not in cache, fetch from network
            return fetch(request).then((response) => {
               // Don't cache non-successful responses
               if (!response || response.status !== 200 || response.type === 'error') {
                  return response;
               }

               const responseClone = response.clone();
               caches.open(CACHE_NAME).then((cache) => {
                  cache.put(request, responseClone);
               });

               return response;
            });
         })
   );
});
