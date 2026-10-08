// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { useEffect } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider, useAuth, onBeforeLogout } from './AuthContext';

/**
 * pwa-installability spec — "Best-Effort Logout Unsubscribe":
 * el DELETE de la suscripción push en logout corre ANTES de que la sesión se
 * limpie. Este test prueba el contrato de timing en AuthContext: los
 * listeners de onBeforeLogout se invocan con sessionStorage todavía intacto,
 * así el token existe para autenticar un request best-effort.
 */
const mocks = vi.hoisted(() => ({
  post: vi.fn(),
  patch: vi.fn(),
}));

vi.mock('../services/api', () => ({ post: mocks.post, patch: mocks.patch }));

let capturedToken = null;

function Harness() {
  const { user, login, logout } = useAuth();

  useEffect(() => {
    if (!user) return undefined;
    return onBeforeLogout(() => {
      capturedToken = sessionStorage.getItem('costura_token');
    });
  }, [user]);

  return (
    <div>
      <span data-testid="user">{user ? user.id : ''}</span>
      <button id="login" onClick={() => login('ana@test.local', 'secreto')}>login</button>
      <button id="logout" onClick={() => logout()}>logout</button>
    </div>
  );
}

let root;

async function renderApp() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root.render(
      <AuthProvider>
        <Harness />
      </AuthProvider>,
    );
  });
  await act(async () => {}); // el efecto de boot termina el loading
}

describe('AuthContext logout pre-clear listeners (push logout race)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedToken = null;
    sessionStorage.clear();
    mocks.post.mockResolvedValue({
      token: 'tok-123',
      user: { id: 'u1', name: 'Ana', email: 'ana@test.local', role: 'ALUMNO' },
    });
  });

  afterEach(async () => {
    if (root) await act(async () => root.unmount());
    root = null;
    document.body.innerHTML = '';
  });

  it('fires listeners while the token is still in sessionStorage', async () => {
    await renderApp();

    await act(async () => {
      document.body.querySelector('#login').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await act(async () => {});
    expect(sessionStorage.getItem('costura_token')).toBe('tok-123');

    await act(async () => {
      document.body.querySelector('#logout').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await act(async () => {});

    // El listener vio el token ANTES de que logout limpiara la sesión.
    expect(capturedToken).toBe('tok-123');
    expect(sessionStorage.getItem('costura_token')).toBeNull();
    expect(document.body.querySelector('[data-testid="user"]').textContent).toBe('');
  });

  it('unsubscribes the listener when the user logs out', async () => {
    await renderApp();
    await act(async () => {
      document.body.querySelector('#login').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await act(async () => {});
    expect(sessionStorage.getItem('costura_token')).toBe('tok-123');

    // Primer logout: la sesión se limpia y el efecto desregistra el listener.
    await act(async () => {
      document.body.querySelector('#logout').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await act(async () => {});
    expect(sessionStorage.getItem('costura_token')).toBeNull();

    // Un logout posterior (ya sin sesión) no debe volver a invocar el
    // listener; se reinicia la captura DESPUÉS del primer logout y se espera
    // que el segundo no la vuelva a llenar.
    capturedToken = null;
    await act(async () => {
      document.body.querySelector('#logout').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await act(async () => {});
    expect(capturedToken).toBeNull();
  });
});
