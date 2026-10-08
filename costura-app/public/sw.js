/**
 * Service worker — push notifications + notification clicks (WU3).
 *
 * Scope: push delivery and click-through only. Deliberately NO fetch handler
 * and NO caching: this change is about web push, and a precache strategy
 * would serve stale builds during development.
 */
const NOTIFICATION_ICON = '/icons/icon-192.png';

/** Resolve app-relative links (/admin#consultas, /curso/:id#lesson-<id>)
 * against the service worker scope origin; absolute URLs pass through. */
function toAbsoluteUrl(pathOrUrl) {
  return new URL(pathOrUrl, self.registration.scope).href;
}

self.addEventListener('install', () => {
  // Do not wait for old tabs to close before the new worker takes over.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Take control of open clients so a notification click can focus them.
  event.waitUntil(clients.claim());
});

self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = {};
  }
  const title = payload.title || 'Nueva notificación';
  const options = {
    body: payload.body || '',
    icon: NOTIFICATION_ICON,
    badge: NOTIFICATION_ICON,
    data: { url: payload.url || '/' },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = toAbsoluteUrl(
    (event.notification.data && event.notification.data.url) || '/',
  );

  event.waitUntil(
    (async () => {
      const windows = await clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });
      const targetPath = new URL(targetUrl).pathname;
      const existing = windows.find(
        (client) => new URL(client.url).pathname === targetPath,
      );
      if (existing) {
        try {
          await existing.navigate(targetUrl);
          return existing.focus();
        } catch {
          // The client rejected the navigation; open a fresh window instead.
        }
      }
      return clients.openWindow(targetUrl);
    })(),
  );
});
