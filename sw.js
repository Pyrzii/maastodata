// MaastoData Service Worker
// Mahdollistaa offline-käytön ja nopeuttaa sovellusta

const CACHE_NAME = 'maastodata-v1';
const URLS_TO_CACHE = [
  '/index.html',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Inconsolata:wght@400;500;600&family=Lato:wght@300;400;500;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js'
];

// Asennus: tallenna tärkeimmät tiedostot välimuistiin
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(URLS_TO_CACHE).catch(err => {
        console.log('Cache warning (some external resources may not cache):', err);
      });
    })
  );
  self.skipWaiting();
});

// Aktivointi: poista vanhat välimuistit
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Haku: käytä välimuistia jos verkko ei ole saatavilla
self.addEventListener('fetch', event => {
  // Karttatiilille: network-first (ajantasaiset kartat kun verkko on)
  if (event.request.url.includes('tile.openstreetmap.org')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Muille: cache-first (nopea, toimii offline)
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Jos offline eikä välimuistissa — palautetaan index.html
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
