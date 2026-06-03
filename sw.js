// Remember - Service Worker v6 - Web Push + Network-first HTML
const SW_VERSION = 6;

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(clients.claim()));

// Garante que o HTML sempre vem da rede (evita cache antigo do PWA)
self.addEventListener('fetch', (e) => {
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
  }
});

// Recebe push do servidor (app fechado)
self.addEventListener('push', (e) => {
  let data = { title: '🔔 Remember', body: 'Você tem um lembrete!' };
  if (e.data) {
    try { data = JSON.parse(e.data.text()); } catch { data.body = e.data.text(); }
  }
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'remember-' + Date.now(),
      requireInteraction: true,
      vibrate: [300, 100, 300],
      renotify: true,
      silent: false,
    })
  );
});

// Fallback: mensagem local do app
self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'SHOW_NOTIFICATION') {
    e.waitUntil(
      self.registration.showNotification(e.data.title, {
        body: e.data.body,
        tag: e.data.tag || 'remember',
        requireInteraction: true,
        vibrate: [300, 100, 300],
        renotify: true,
      })
    );
  }
});

// Clique na notificação abre o app
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});
