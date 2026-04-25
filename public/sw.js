const CACHE_NAME = 'buku-kas-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/icon-pwa.png',
  '/sw.js'
];

// Tahap Instalasi: Simpan aset penting ke cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('PWA: Pre-caching assets');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Tahap Aktivasi: Hapus cache lama jika ada
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
      );
    })
  );
});

// Strategi Fetch: Ambil dari cache dulu, jika tidak ada baru ke jaringan
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// Listener untuk Notifikasi (Tetap dipertahankan)
self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Buku Kas Digital';
  const options = {
    body: data.body || 'Ada pembaruan transaksi untuk Anda.',
    icon: '/icon-pwa.png',
    badge: '/icon-pwa.png',
    vibrate: [100, 50, 100],
    ...data.options
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      if (clientList.length > 0) return clientList[0].focus();
      return clients.openWindow('/');
    })
  );
});

self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    self.registration.showNotification(title, {
      icon: '/icon-pwa.png',
      badge: '/icon-pwa.png',
      vibrate: [100, 50, 100],
      ...options
    });
  }
});
