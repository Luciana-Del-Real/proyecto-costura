import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useAuth, onBeforeLogout } from './AuthContext';
import { createPushSubscription, deletePushSubscription } from '../services/api';
import { isServiceWorkerSupported } from '../utils/serviceWorkerRegistration';
import PushConsentBanner from '../components/PushConsentBanner';
import {
  base64UrlToUint8Array,
  clearDeviceRecord,
  getVapidPublicKey,
  isPushApiAvailable,
  markConsentDismissed,
  readDeviceRecord,
  subscriptionRecord,
  wasConsentDismissed,
  writeDeviceRecord,
} from './pushHelpers';

/**
 * PushProvider (WU4 — pwa-installability spec, "Gesture-Wired Consent and
 * Subscribe" + "Login Upsert Reconciliation" + "Best-Effort Logout
 * Unsubscribe"). Vive inmediatamente bajo AuthProvider y orquesta SOLO el
 * ciclo de vida de la suscripción push del dispositivo:
 *
 * - nunca pide permiso al montar (el banner es el único camino y requiere
 *   gesto del usuario);
 * - al iniciar sesión reconcilia: upsertea la suscripción existente (sana
 *   endpoints huérfanos de un logout corrido), re-suscribe en silencio si el
 *   permiso ya está concedido, o muestra el banner si está en 'default';
 * - al cerrar sesión hace un DELETE best-effort con el token capturado antes
 *   de que AuthContext limpie sessionStorage (listener pre-clear);
 * - si el permiso se revoca en el navegador, desuscribe y limpia el backend.
 */
const PushContext = createContext(null);

async function currentRegistration() {
  if (!isServiceWorkerSupported()) return null;
  try {
    return await navigator.serviceWorker.ready;
  } catch {
    return null;
  }
}

async function currentSubscription(registration) {
  try {
    return await registration.pushManager.getSubscription();
  } catch {
    return null;
  }
}

export function PushProvider({ children }) {
  const { user } = useAuth();

  const [subscribed, setSubscribed] = useState(false);
  const [bannerOpen, setBannerOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  // Refs: los listeners de logout/permiso no se re-registran por render y
  // siempre leen el último usuario/suscripción.
  const userRef = useRef(user);
  const recordRef = useRef(null);
  const registrationRef = useRef(null);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  /** Adopta una suscripción existente: espejo local + POST upsert (heal). */
  const adoptSubscription = useCallback((activeUser, subscription) => {
    const record = subscriptionRecord(subscription);
    recordRef.current = record;
    writeDeviceRecord(activeUser.id, record);
    setSubscribed(true);
    setBannerOpen(false);
    // Best-effort: si el upsert falla (red, 401/403), el próximo login o la
    // próxima reconciliación reintenta sobre el mismo endpoint.
    createPushSubscription(record).catch((error) => {
      console.error('Push: no se pudo registrar la suscripción (se reintenta en el próximo inicio de sesión):', error);
    });
  }, []);

  /**
   * Garantiza una suscripción activa para el usuario: adopta la existente o
   * crea una nueva. Solo se invoca cuando el permiso ya está concedido (el
   * flujo del banner exige el gesto antes de llegar acá).
   */
  const ensureSubscription = useCallback(async (activeUser) => {
    const publicKey = getVapidPublicKey();
    if (!isPushApiAvailable(publicKey)) return null;
    const registration = await currentRegistration();
    if (!registration) return null;
    registrationRef.current = registration;
    const existing = await currentSubscription(registration);
    if (existing) {
      adoptSubscription(activeUser, existing);
      return existing;
    }
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64UrlToUint8Array(publicKey),
    });
    if (!subscription) return null;
    adoptSubscription(activeUser, subscription);
    return subscription;
  }, [adoptSubscription]);

  /** Reconciliación por cambio de usuario (login/logout). */
  const reconcile = useCallback(async (activeUser) => {
    if (!activeUser) {
      recordRef.current = null;
      registrationRef.current = null;
      setSubscribed(false);
      setBannerOpen(false);
      setBusy(false);
      return;
    }
    const publicKey = getVapidPublicKey();
    if (!isPushApiAvailable(publicKey)) {
      // Sin clave VAPID (entorno sin .env) el flujo se desactiva sin romper.
      setSubscribed(false);
      setBannerOpen(false);
      return;
    }
    const permission = window.Notification.permission;
    if (permission === 'denied') {
      setSubscribed(false);
      setBannerOpen(false);
      return;
    }
    const registration = await currentRegistration();
    if (!registration) {
      setSubscribed(false);
      setBannerOpen(false);
      return;
    }
    registrationRef.current = registration;
    const existing = await currentSubscription(registration);
    if (existing) {
      // Upsert heal: reemplaza la fila vieja que pudo quedar de un logout
      // corrido (el backend upsertea por endpoint).
      adoptSubscription(activeUser, existing);
      return;
    }
    if (permission === 'granted') {
      // Re-suscripción silenciosa: el permiso ya fue concedido, no requiere
      // gesto. Cubre el dispositivo que quedó sin suscripción local.
      try {
        await ensureSubscription(activeUser);
      } catch (error) {
        console.error('Push: no se pudo re-suscribir automáticamente:', error);
      }
      return;
    }
    // permission === 'default': el banner es el único camino para preguntar y
    // solo aparece si el usuario no lo descartó antes (no re-pester).
    setSubscribed(false);
    setBannerOpen(!wasConsentDismissed(activeUser.id));
  }, [adoptSubscription, ensureSubscription]);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (cancelled) return undefined;
      return reconcile(user);
    });
    return () => {
      cancelled = true;
    };
  }, [reconcile, user]);

  /** Pedido de permiso desde el gesto del banner ("Activar"). */
  const enablePush = useCallback(async () => {
    const activeUser = userRef.current;
    if (!activeUser || !isPushApiAvailable(getVapidPublicKey())) return false;
    setBusy(true);
    try {
      const permission = await window.Notification.requestPermission();
      if (permission === 'granted') {
        await ensureSubscription(activeUser);
        return true;
      }
      // denied (o default tras el prompt): no insistimos; el banner recuerda
      // el descarte y no vuelve a aparecer en este navegador.
      markConsentDismissed(activeUser.id);
      setBannerOpen(false);
      return false;
    } catch (error) {
      console.error('Push: no se pudo activar las notificaciones:', error);
      return false;
    } finally {
      setBusy(false);
    }
  }, [ensureSubscription]);

  /** Descarte explícito del banner ("Ahora no"). */
  const dismissConsent = useCallback(() => {
    const activeUser = userRef.current;
    if (activeUser) markConsentDismissed(activeUser.id);
    setBannerOpen(false);
  }, []);

  // Logout: DELETE best-effort disparado ANTES de que AuthContext limpie la
  // sesión (los listeners de onBeforeLogout corren primero), así el token que
  // inyecta api.js todavía existe y el pedido sale autenticado. Si falla, el
  // upsert del próximo login sana el endpoint huérfano.
  useEffect(() => {
    if (!user) return undefined;
    return onBeforeLogout(() => {
      const loggedUser = userRef.current;
      const record = recordRef.current || readDeviceRecord(user.id);
      if (!loggedUser || !record || !record.endpoint) return;
      deletePushSubscription(record.endpoint)
        .then(() => clearDeviceRecord(loggedUser.id))
        .catch((error) => {
          console.error('Push: DELETE best-effort en logout falló (lo sana el próximo login):', error);
        });
    });
  }, [user]);

  // Revocación de permiso desde el navegador: la suscripción queda inválida,
  // así que limpiamos el backend y el estado local. Un re-grant en sesión
  // restaura la suscripción en silencio.
  useEffect(() => {
    if (!user || !isPushApiAvailable(getVapidPublicKey())) return undefined;
    if (typeof navigator === 'undefined' || !('permissions' in navigator)) {
      return undefined;
    }
    let permissionStatus = null;
    let cancelled = false;
    const onPermissionChange = async () => {
      const permission = window.Notification.permission;
      if (permission === 'denied') {
        const record = recordRef.current;
        recordRef.current = null;
        setSubscribed(false);
        setBannerOpen(false);
        if (record && record.endpoint) {
          deletePushSubscription(record.endpoint).catch(() => {
            // El próximo login re-sincroniza; nada que sanear acá.
          });
        }
        const registration = registrationRef.current || (await currentRegistration());
        if (registration && registration.pushManager) {
          try {
            await registration.pushManager.unsubscribe();
          } catch { /* la suscripción ya no existe */ }
        }
      } else if (permission === 'granted' && userRef.current) {
        try {
          await ensureSubscription(userRef.current);
        } catch (error) {
          console.error('Push: no se pudo restaurar la suscripción tras re-grant:', error);
        }
      }
    };
    navigator.permissions
      .query({ name: 'notifications' })
      .then((status) => {
        if (cancelled) return;
        permissionStatus = status;
        status.addEventListener('change', onPermissionChange);
      })
      .catch(() => { /* Permissions API no disponible: sin listener */ });
    return () => {
      cancelled = true;
      if (permissionStatus) {
        permissionStatus.removeEventListener('change', onPermissionChange);
      }
    };
  }, [ensureSubscription, user]);

  return (
    <PushContext.Provider
      value={{ subscribed, bannerOpen, busy, enablePush, dismissConsent }}
    >
      {children}
      <PushConsentBanner
        open={bannerOpen}
        busy={busy}
        onEnable={enablePush}
        onDismiss={dismissConsent}
      />
    </PushContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const usePush = () => useContext(PushContext);
