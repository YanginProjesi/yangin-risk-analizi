// Service Worker for PWA - Offline Support
const CACHE_NAME = 'yangin-risk-v2';
const urlsToCache = [
  '/',
  '/static/index.html',
  '/static/styles.css',
  '/static/script.js',
  'https://yangin-risk-analizi.onrender.com/icon-192.png',
  'https://yangin-risk-analizi.onrender.com/icon-512.png',
  '/manifest.json'
];

// Install event - Cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Cache açıldı');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('Service Worker: Cache hatası', error);
      })
  );
  self.skipWaiting(); // Activate immediately
});

// Activate event - Clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Eski cache siliniyor', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim(); // Take control immediately
});

// Fetch event - Serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // API isteklerini network'ten al (cache'leme)
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // Network hatası durumunda offline mesajı
          return new Response(
            JSON.stringify({ error: 'Offline - İnternet bağlantısı yok' }),
            {
              headers: { 'Content-Type': 'application/json' }
            }
          );
        })
    );
    return;
  }

  // Diğer istekler için cache-first strategy
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache'de varsa cache'den döndür
        if (response) {
          return response;
        }
        // Cache'de yoksa network'ten al ve cache'le
        return fetch(event.request).then((response) => {
          // Geçerli response kontrolü
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          // Response'u clone'la (stream sadece bir kez okunabilir)
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return response;
        });
      })
      .catch(() => {
        // Her iki durumda da hata varsa offline sayfası göster
        if (event.request.destination === 'document') {
          return caches.match('/static/index.html');
        }
      })
  );
});

// Background sync (optional - for future use)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(
      // Background sync işlemleri buraya eklenebilir
      console.log('Background sync: Veri senkronizasyonu')
    );
  }
});

// Push notification (optional - for future use)
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Yeni yangın uyarısı!',
    icon: 'https://yangin-risk-analizi.onrender.com/icon-192.png',
    badge: 'https://yangin-risk-analizi.onrender.com/icon-192.png',
    vibrate: [200, 100, 200],
    tag: 'yangin-uyarisi'
  };
  
  event.waitUntil(
    self.registration.showNotification('Yangın Risk Analizi', options)
  );
});

