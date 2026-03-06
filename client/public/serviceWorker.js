// client/public/serviceWorker.js

/* eslint-disable no-restricted-globals */
self.addEventListener('push', (event) => {
  let data = { title: 'VORA7', body: 'Nueva notificación de partido' };
  
  try {
      if (event.data) {
          data = event.data.json();
      }
  } catch (e) {
      console.error("Error parseando data push:", e);
  }

  const options = {
      body: data.body,
      icon: '/logo192.png', 
      badge: '/logo192.png',
      vibrate: [200, 100, 200],
      data: { url: data.url || '/player-home' }
  };

  event.waitUntil(
      self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
      // eslint-disable-next-line no-undef
      clients.openWindow(event.notification.data.url)
  );
});