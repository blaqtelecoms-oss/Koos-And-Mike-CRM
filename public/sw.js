// Service Worker for Web Push Notifications
self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'New Lead!';
  const options = {
    body: data.body || 'A new lead has been received.',
    icon: 'https://media.base44.com/images/public/69ba4650f213ea0fa82b95fb/fab77c211_KMLogo.png',
    badge: 'https://media.base44.com/images/public/69ba4650f213ea0fa82b95fb/fab77c211_KMLogo.png',
    vibrate: [200, 100, 200, 100, 200],
    tag: 'new-lead',
    renotify: true,
    data: {
      url: data.url || '/Leads'
    }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const url = event.notification.data?.url || '/Leads';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (const client of clientList) {
        if (client.url.includes('/Leads') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
