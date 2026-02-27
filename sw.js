// Service Worker

const CACHE_NAME = 'maastodata-cache-v1';
const PRECACHE_ASSETS = [
    'index.html',
    'manifest.json',
    'styles.css',
    'script.js',
];

// Install event: Cache all the specified assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).
            then((cache) => cache.addAll(PRECACHE_ASSETS))
    );
});

// Fetch event: Network-first strategy for dynamic content
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Cache the response
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseClone);
                });
                return response;
            })
            .catch(() => caches.match(event.request))
    );
});

// Clear old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.filter((cacheName) => {
                    return cacheName !== CACHE_NAME;
                }).map((cacheName) => {
                    return caches.delete(cacheName);
                })
            );
        })
    );
});