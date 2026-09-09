// Helpers puros del ciclo de vida de push (PushContext). Viven fuera de React
// para que la codificación/almacenamiento sean testeables en aislamiento y el
// provider solo orqueste efectos y estado.

export const PUSH_STORAGE_PREFIX = 'costura_push_';

/** Clave de localStorage del último registro de suscripción del usuario. */
export function deviceRecordKey(userId) {
  return `${PUSH_STORAGE_PREFIX}record_${userId}`;
}

/** Clave de localStorage que recuerda que el usuario ya descartó el banner. */
export function consentDismissKey(userId) {
  return `${PUSH_STORAGE_PREFIX}dismiss_${userId}`;
}

/**
 * Clave pública VAPID. Se lee en runtime (no al importar) para que los tests
 * puedan stubearla por caso con vi.stubEnv; Vite la reemplaza por el objeto de
 * entorno en build. Vacía si no está configurada.
 */
export function getVapidPublicKey() {
  return import.meta.env.VITE_VAPID_PUBLIC_KEY || '';
}

/**
 * Convierte la clave pública VAPID (base64url, sin padding) al Uint8Array que
 * exige PushManager.subscribe({ applicationServerKey }).
 */
export function base64UrlToUint8Array(base64Url) {
  const padding = '='.repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = `${base64Url}${padding}`.replace(/-/g, '+').replace(/_/g, '/');
  const raw = globalThis.atob(base64);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

/**
 * Reduce un PushSubscription del navegador al DTO que espera el backend
 * (POST /push-subscriptions). `toJSON()` ya entrega las claves en base64url
 * sin padding, que es el formato que web-push acepta.
 */
export function subscriptionRecord(subscription) {
  const json = typeof subscription.toJSON === 'function' ? subscription.toJSON() : {};
  const keys = (json && json.keys) || {};
  const record = {
    endpoint: subscription.endpoint,
    keys: { p256dh: keys.p256dh || '', auth: keys.auth || '' },
  };
  if (typeof navigator !== 'undefined' && navigator.userAgent) {
    record.userAgent = navigator.userAgent;
  }
  return record;
}

/**
 * True solo cuando el browser puede suscribir push de verdad: navegador con
 * Notification/PushManager, service worker disponible y clave pública VAPID
 * configurada. La clave ausente (entorno sin .env) desactiva todo el flujo en
 * lugar de romper la app.
 */
export function isPushApiAvailable(publicKey) {
  return Boolean(publicKey)
    && typeof window !== 'undefined'
    && typeof window.Notification !== 'undefined'
    && typeof window.PushManager !== 'undefined'
    && typeof navigator !== 'undefined'
    && 'serviceWorker' in navigator;
}

export function readDeviceRecord(userId) {
  try {
    const raw = localStorage.getItem(deviceRecordKey(userId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function writeDeviceRecord(userId, record) {
  try {
    localStorage.setItem(deviceRecordKey(userId), JSON.stringify(record));
  } catch { /* almacenamiento no disponible (modo privado) */ }
}

export function clearDeviceRecord(userId) {
  try {
    localStorage.removeItem(deviceRecordKey(userId));
  } catch { /* noop */ }
}

export function wasConsentDismissed(userId) {
  try {
    return localStorage.getItem(consentDismissKey(userId)) === '1';
  } catch {
    return false;
  }
}

export function markConsentDismissed(userId) {
  try {
    localStorage.setItem(consentDismissKey(userId), '1');
  } catch { /* noop */ }
}
