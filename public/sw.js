// Service Worker for Browser Notifications
self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Buku Kas Digital';
    const options = {
    body: data.body || 'Ada pembaruan transaksi untuk Anda.',
    icon: '/icon-pwa.png',
    badge: '/icon-pwa.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1'
    },
    ...data.options
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Listener untuk klik notifikasi
self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  // Cari tab yang sudah terbuka, jika ada beri fokus, jika tidak buka tab baru
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return clients.openWindow('/');
    })
  );
});

// Listener untuk notifikasi lokal
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
