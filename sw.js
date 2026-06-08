// Remember - Service Worker v7 - Alarme + Ações na notificação
const SW_VERSION = 7;

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(clients.claim()));

// HTML sempre da rede (evita cache antigo do PWA)
self.addEventListener('fetch', (e) => {
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
  }
});

// Recebe push do servidor (app fechado)
self.addEventListener('push', (e) => {
  let data = { title: '🔔 Lembrete', body: 'Você tem um lembrete!' };
  if (e.data) {
    try { data = JSON.parse(e.data.text()); } catch { data.body = e.data.text(); }
  }
  e.waitUntil(
    self.registration.showNotification(data.title || '🔔 Lembrete', {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: data.tag || ('alarm-' + Date.now()),
      requireInteraction: true,
      vibrate: [500, 200, 500, 200, 500, 200, 500],
      renotify: true,
      silent: false,
      data: { reminderId: data.reminderId || null, taskTitle: data.body, taskTime: data.time || '' },
      actions: [{ action: 'dismiss', title: '✓ Dispensar' }]
    })
  );
});

// Mensagem local do app (timer interno)
self.addEventListener('message', (e) => {
  if (!e.data) return;

  if (e.data.type === 'SHOW_NOTIFICATION') {
    e.waitUntil(
      self.registration.showNotification(e.data.title, {
        body: e.data.body,
        tag: e.data.tag || 'remember',
        requireInteraction: true,
        vibrate: [500, 200, 500, 200, 500, 200, 500],
        renotify: true,
        data: e.data.data || {},
        actions: [{ action: 'dismiss', title: '✓ Dispensar' }]
      })
    );
  }
});

// Clique na notificação
self.addEventListener('notificationclick', (e) => {
  const data = e.notification.data || {};
  e.notification.close();

  if (e.action === 'dismiss') {
    // Botão "Dispensar" → para alarme nos clientes abertos
    e.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
        list.forEach((c) => c.postMessage({ type: 'STOP_ALARM' }));
      })
    );
    return;
  }

  // Toque na notificação → abre app e exibe lembrete
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      const msg = { type: 'OPEN_REMINDER', reminderId: data.reminderId };
      for (const c of list) {
        c.postMessage(msg);
        if ('focus' in c) return c.focus();
      }
      const url = data.reminderId ? ('/?alarm=' + data.reminderId) : '/';
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

// Deslizar para fechar a notificação → para o alarme
self.addEventListener('notificationclose', (e) => {
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      list.forEach((c) => c.postMessage({ type: 'STOP_ALARM' }));
    })
  );
});
