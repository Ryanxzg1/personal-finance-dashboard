// Service Worker for Browser Notifications
self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Notifikasi Buku Kas';
  const options = {
    body: data.body || 'Ada pembaruan untuk Anda.',
    icon: '/icon.svg',
    badge: '/icon.svg',
    ...data.options
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Listener untuk notifikasi lokal yang dipicu dari thread utama
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    self.registration.showNotification(title, {
      icon: '/icon.svg',
      badge: '/icon.svg',
      ...options
    });
  }
});
