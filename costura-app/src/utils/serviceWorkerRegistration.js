/**
 * PWA service worker registration (WU3 — pwa-installability spec,
 * "Service Worker Registration").
 *
 * Registering /sw.js is idempotent per scope: the browser keeps the existing
 * worker and updates it in the background when the file changes, so calling
 * it on every boot is safe and is what lets push work after a fresh load.
 *
 * The guard matters in tests: jsdom does not implement navigator.serviceWorker
 * and node has no navigator at all, so boot code must never assume it exists.
 */
const SW_URL = `${import.meta.env.BASE_URL}sw.js`;

export function isServiceWorkerSupported() {
  return typeof navigator !== 'undefined' && 'serviceWorker' in navigator;
}

export function registerServiceWorker() {
  if (!isServiceWorkerSupported()) {
    return Promise.resolve(false);
  }
  // Registration must never break app boot: browsers can reject it on
  // insecure origins (push itself stays unavailable there — localhost and
  // HTTPS are the only contexts where registration succeeds).
  return navigator.serviceWorker
    .register(SW_URL)
    .then(() => true, () => false);
}
