// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { PushProvider, usePush } from './PushContext';
import PushConsentBanner from '../components/PushConsentBanner';

/**
 * WU4 — pwa-installability spec. jsdom no implementa Notification ni
 * PushManager ni navigator.serviceWorker: el archivo mockea las tres APIs del
 * navegador (spec requirement "jsdom Test Constraints") y cubre el ciclo de
 * vida completo: no-logged-in, consentimiento por gesto, upsert heal en login,
 * DELETE best-effort en logout y revocación de permiso.
 *
 * PushManager se stubbea como global (clase vacía): jsdom no lo expone y el
 * guard de capacidad de PushProvider (typeof window.PushManager) lo exige
 * para habilitar el flujo, igual que un browser real en contexto seguro.
 */
const TEST_VAPID_PUBLIC =
  'BNnpAj_Qmy-Bwi5Ri3SyLLtPzaFtjDulAwu8Bu74MvmDcPav_a0u7ZEq3nWZLN5LpLonVnAJwB29Muff7B_83gQ';

const FIXTURE_ENDPOINT = 'https://push.example.com/send/abc123';

const auth = vi.hoisted(() => {
  const listeners = new Set();
  return {
    user: null,
    onBeforeLogout(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    emitBeforeLogout() {
      for (const listener of [...listeners]) listener();
    },
  };
});

const api = vi.hoisted(() => ({
  createPushSubscription: vi.fn(),
  deletePushSubscription: vi.fn(),
}));

vi.mock('./AuthContext', () => ({
  useAuth: () => ({ user: auth.user }),
  onBeforeLogout: auth.onBeforeLogout,
}));
vi.mock('../services/api', () => ({
  createPushSubscription: api.createPushSubscription,
  deletePushSubscription: api.deletePushSubscription,
}));

function makeSubscription() {
  return {
    endpoint: FIXTURE_ENDPOINT,
    toJSON: () => ({
      endpoint: FIXTURE_ENDPOINT,
      keys: { p256dh: 'p256dh-key', auth: 'auth-key' },
    }),
  };
}

let registration;
let notificationPermission;
let requestPermission;
let permissionChangeHandler;

function installPushBrowserState(existing = null) {
  registration = {
    pushManager: {
      getSubscription: vi.fn().mockResolvedValue(existing),
      subscribe: vi.fn().mockResolvedValue(makeSubscription()),
      unsubscribe: vi.fn().mockResolvedValue(true),
    },
  };
  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    value: { ready: Promise.resolve(registration) },
  });
  permissionChangeHandler = null;
  Object.defineProperty(navigator, 'permissions', {
    configurable: true,
    value: {
      query: vi.fn(() =>
        Promise.resolve({
          addEventListener: (_type, cb) => {
            permissionChangeHandler = cb;
          },
          removeEventListener: vi.fn(),
        }),
      ),
    },
  });
  // jsdom no implementa PushManager; el guard del provider (isPushApiAvailable)
  // requiere el constructor global como en un browser real de contexto seguro.
  vi.stubGlobal('PushManager', class PushManager {});
  vi.stubGlobal('Notification', {
    get permission() {
      return notificationPermission;
    },
    requestPermission,
  });
}

const USER = { id: 'u1', name: 'Ana', role: 'ALUMNO' };

function Harness() {
  const { subscribed, bannerOpen, busy, enablePush, dismissConsent } = usePush();
  return (
    <div>
      <span data-testid="subscribed">{String(subscribed)}</span>
      <span data-testid="busy">{String(busy)}</span>
      <span data-testid="banner-open">{String(bannerOpen)}</span>
      <button id="enable" onClick={() => enablePush()}>enable</button>
      <button id="dismiss" onClick={() => dismissConsent()}>dismiss</button>
    </div>
  );
}

const roots = [];

async function renderApp() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  roots.push(root);
  await act(async () => {
    root.render(
      <PushProvider>
        <Harness />
      </PushProvider>,
    );
  });
  await act(async () => {}); // flush microtasks del reconcile de montaje
  return { container, root };
}

async function rerender(root) {
  await act(async () => {
    root.render(
      <PushProvider>
        <Harness />
      </PushProvider>,
    );
  });
  await act(async () => {});
}

function banner() {
  return document.body.querySelector('[data-testid="push-consent-banner"]');
}

function subscribeArg() {
  return registration.pushManager.subscribe.mock.calls[0][0];
}

describe('PushProvider — subscription lifecycle (pwa-installability spec)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Los mocks de la capa api devuelven promesas como los métodos reales de
    // api.js; PushContext encadena .then/.catch sobre ellos.
    api.createPushSubscription.mockResolvedValue({});
    api.deletePushSubscription.mockResolvedValue();
    notificationPermission = 'default';
    requestPermission = vi.fn().mockResolvedValue('granted');
    auth.user = USER;
    vi.stubEnv('VITE_VAPID_PUBLIC_KEY', TEST_VAPID_PUBLIC);
    localStorage.clear();
    sessionStorage.clear();
    installPushBrowserState();
  });

  afterEach(async () => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    for (const root of roots) await act(async () => root.unmount());
    roots.length = 0;
    document.body.innerHTML = '';
  });

  it('does not prompt nor subscribe when there is no authenticated user', async () => {
    auth.user = null;
    const { container } = await renderApp();

    expect(container.querySelector('[data-testid="subscribed"]').textContent).toBe('false');
    expect(banner()).toBeNull();
    expect(requestPermission).not.toHaveBeenCalled();
    expect(registration.pushManager.subscribe).not.toHaveBeenCalled();
    expect(registration.pushManager.getSubscription).not.toHaveBeenCalled();
  });

  it('shows the Spanish banner for default permission without prompting on boot', async () => {
    await renderApp();

    expect(banner()).not.toBeNull();
    const text = banner().textContent;
    expect(text).toContain('Activa las notificaciones');
    expect(text).toContain('Recibe avisos de respuestas, compras y novedades incluso sin estar en la página.');
    expect(text).toContain('Activar');
    expect(text).toContain('Ahora no');
    expect(text).toContain('Instala la aplicación en tu pantalla de inicio para recibir notificaciones.');
    expect(requestPermission).not.toHaveBeenCalled();
    expect(registration.pushManager.subscribe).not.toHaveBeenCalled();
  });

  it('accepting the banner requests permission and subscribes with the VAPID key', async () => {
    await renderApp();
    expect(banner()).not.toBeNull();

    await act(async () => {
      document.body
        .querySelector('[data-testid="push-consent-accept"]')
        .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await act(async () => {});

    expect(requestPermission).toHaveBeenCalledTimes(1);
    expect(registration.pushManager.subscribe).toHaveBeenCalledTimes(1);
    const options = subscribeArg();
    expect(options.userVisibleOnly).toBe(true);
    expect(options.applicationServerKey).toBeInstanceOf(Uint8Array);
    expect(options.applicationServerKey.length).toBe(65);

    expect(api.createPushSubscription).toHaveBeenCalledTimes(1);
    expect(api.createPushSubscription).toHaveBeenCalledWith({
      endpoint: FIXTURE_ENDPOINT,
      keys: { p256dh: 'p256dh-key', auth: 'auth-key' },
      userAgent: expect.any(String),
    });
    expect(banner()).toBeNull();
    expect(JSON.parse(localStorage.getItem('costura_push_record_u1')).endpoint).toBe(FIXTURE_ENDPOINT);
  });

  it('denying permission creates no subscription and does not ask again', async () => {
    requestPermission = vi.fn().mockResolvedValue('denied');
    installPushBrowserState(); // re-stub Notification con el nuevo mock
    await renderApp();

    await act(async () => {
      document.body
        .querySelector('[data-testid="push-consent-accept"]')
        .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await act(async () => {});

    expect(registration.pushManager.subscribe).not.toHaveBeenCalled();
    expect(api.createPushSubscription).not.toHaveBeenCalled();
    expect(banner()).toBeNull();
    expect(localStorage.getItem('costura_push_dismiss_u1')).toBe('1');

    // Logout y nuevo login del mismo usuario: el banner no vuelve a aparecer.
    auth.user = null;
    await rerender(document.body._rootContainer ?? roots[0]);
    auth.user = USER;
    await rerender(roots[0]);
    expect(banner()).toBeNull();
    expect(requestPermission).toHaveBeenCalledTimes(1);
  });

  it('dismissing with "Ahora no" never prompts and stays dismissed after remount', async () => {
    const { root } = await renderApp();
    expect(banner()).not.toBeNull();

    await act(async () => {
      document.body
        .querySelector('[data-testid="push-consent-dismiss"]')
        .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await act(async () => {});

    expect(requestPermission).not.toHaveBeenCalled();
    expect(banner()).toBeNull();

    await act(async () => root.unmount());
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root2 = createRoot(container);
    roots.push(root2);
    await act(async () => {
      root2.render(
        <PushProvider>
          <Harness />
        </PushProvider>,
      );
    });
    await act(async () => {});
    expect(banner()).toBeNull();
  });

  it('disables the whole flow without crashing when VITE_VAPID_PUBLIC_KEY is absent', async () => {
    vi.stubEnv('VITE_VAPID_PUBLIC_KEY', '');
    const { container } = await renderApp();

    expect(banner()).toBeNull();
    expect(requestPermission).not.toHaveBeenCalled();
    expect(registration.pushManager.subscribe).not.toHaveBeenCalled();
    expect(registration.pushManager.getSubscription).not.toHaveBeenCalled();
    expect(container.querySelector('[data-testid="busy"]').textContent).toBe('false');
  });

  it('upserts an existing subscription on login without prompting (upsert heal)', async () => {
    installPushBrowserState(makeSubscription());
    await renderApp();

    expect(api.createPushSubscription).toHaveBeenCalledTimes(1);
    expect(api.createPushSubscription).toHaveBeenCalledWith({
      endpoint: FIXTURE_ENDPOINT,
      keys: { p256dh: 'p256dh-key', auth: 'auth-key' },
      userAgent: expect.any(String),
    });
    expect(requestPermission).not.toHaveBeenCalled();
    expect(banner()).toBeNull();
  });

  it('fires a best-effort DELETE on logout with the token still present (pre-clear)', async () => {
    installPushBrowserState(makeSubscription());
    const { root } = await renderApp();
    expect(JSON.parse(localStorage.getItem('costura_push_record_u1')).endpoint).toBe(FIXTURE_ENDPOINT);

    await act(async () => {
      auth.emitBeforeLogout(); // AuthContext.logout corre estos listeners primero
      auth.user = null;
    });
    await rerender(root);
    await act(async () => {}); // resolución del DELETE

    expect(api.deletePushSubscription).toHaveBeenCalledTimes(1);
    // PushContext pasa el endpoint CRUDO: la URL-encoding del path es
    // responsabilidad exclusiva de api.deletePushSubscription (se prueba en
    // src/services/api.push.test.js). Acá el mock recibe el endpoint tal cual.
    expect(api.deletePushSubscription).toHaveBeenCalledWith(FIXTURE_ENDPOINT);
    // DELETE exitoso: el espejo local se limpia.
    expect(localStorage.getItem('costura_push_record_u1')).toBeNull();
  });

  it('swallows a failed logout DELETE and keeps the record for the next-login heal', async () => {
    installPushBrowserState(makeSubscription());
    api.deletePushSubscription.mockRejectedValueOnce(new Error('red caida'));
    const { root } = await renderApp();

    await act(async () => {
      auth.emitBeforeLogout();
      auth.user = null;
    });
    await rerender(root);
    await act(async () => {});

    expect(api.deletePushSubscription).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem('costura_push_record_u1')).not.toBeNull();
  });

  it('unsubscribes and cleans the backend when the browser permission is revoked', async () => {
    installPushBrowserState(makeSubscription());
    await renderApp();
    expect(api.createPushSubscription).toHaveBeenCalledTimes(1);

    notificationPermission = 'denied';
    await act(async () => {
      await permissionChangeHandler();
    });
    await act(async () => {});

    expect(api.deletePushSubscription).toHaveBeenCalledTimes(1);
    expect(registration.pushManager.unsubscribe).toHaveBeenCalledTimes(1);
    expect(banner()).toBeNull();
  });
});

describe('PushConsentBanner — presentational (exact Spanish copy)', () => {
  afterEach(async () => {
    for (const root of roots) await act(async () => root.unmount());
    roots.length = 0;
    document.body.innerHTML = '';
  });

  it('renders nothing when closed', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    roots.push(root);
    await act(async () => {
      root.render(<PushConsentBanner open={false} onEnable={() => {}} onDismiss={() => {}} />);
    });
    expect(banner()).toBeNull();
  });

  it('fires onEnable from "Activar" and onDismiss from "Ahora no"', async () => {
    const onEnable = vi.fn();
    const onDismiss = vi.fn();
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    roots.push(root);
    await act(async () => {
      root.render(<PushConsentBanner open busy={false} onEnable={onEnable} onDismiss={onDismiss} />);
    });

    const text = banner().textContent;
    expect(text).toContain('Activa las notificaciones');
    expect(text).toContain('Activar');
    expect(text).toContain('Ahora no');

    await act(async () => {
      document.body
        .querySelector('[data-testid="push-consent-dismiss"]')
        .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onDismiss).toHaveBeenCalledTimes(1);

    await act(async () => {
      document.body
        .querySelector('[data-testid="push-consent-accept"]')
        .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onEnable).toHaveBeenCalledTimes(1);
  });

  it('disables both buttons while busy', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    roots.push(root);
    await act(async () => {
      root.render(<PushConsentBanner open busy onEnable={() => {}} onDismiss={() => {}} />);
    });
    expect(document.body.querySelector('[data-testid="push-consent-accept"]').disabled).toBe(true);
    expect(document.body.querySelector('[data-testid="push-consent-dismiss"]').disabled).toBe(true);
  });
});
