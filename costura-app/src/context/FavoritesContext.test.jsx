// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { FavoritesProvider, useFavorites } from './FavoritesContext';

/**
 * 5.5 — favorites-notifications-integration spec, favorites half:
 * - "Toggle persists": an authenticated toggle goes through the backend and
 *   the local state only changes after the backend confirms (no local
 *   mutation on a pending/failed write).
 * - "Unauthenticated toggle rejected": an anonymous toggle performs no API
 *   call and no local mutation, and surfaces an error.
 *
 * jsdom is required here (provider behavior needs a real render with
 * effects); the backend API and AuthContext are mocked at the module boundary.
 */
const mocks = vi.hoisted(() => ({
  user: { id: 'u1', name: 'Ana', email: 'ana@test.local', role: 'ALUMNO' },
  get: vi.fn(),
  post: vi.fn(),
  del: vi.fn(),
}));

vi.mock('./AuthContext', () => ({ useAuth: () => ({ user: mocks.user }) }));
vi.mock('../services/api', () => ({ get: mocks.get, post: mocks.post, del: mocks.del }));

let toggleTarget = 'c2';

function Harness() {
  const { favorites, favoritesError, toggleFavorite } = useFavorites();
  return (
    <div>
      <span data-testid="favs">{favorites.join(',')}</span>
      <span data-testid="err">{favoritesError || ''}</span>
      <button id="toggle" onClick={() => toggleFavorite(toggleTarget)}>
        toggle
      </button>
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
      <FavoritesProvider>
        <Harness />
      </FavoritesProvider>,
    );
  });
  await act(async () => {}); // flush remaining microtasks of the mount fetch
  return { container };
}

describe('5.5 Favorites toggle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    toggleTarget = 'c2';
    mocks.user = { id: 'u1', name: 'Ana', email: 'ana@test.local', role: 'ALUMNO' };
    mocks.get.mockResolvedValue([{ courseId: 'c1', course: { id: 'c1' } }]);
    mocks.post.mockResolvedValue({});
    mocks.del.mockResolvedValue({});
  });

  afterEach(async () => {
    for (const root of roots) await act(async () => root.unmount());
    roots.length = 0;
    document.body.innerHTML = '';
  });

  it('loads favorites from the backend on mount', async () => {
    const { container } = await renderApp();

    expect(container.querySelector('[data-testid="favs"]').textContent).toBe('c1');
    expect(mocks.get).toHaveBeenCalledWith('/favorites');
  });

  it('persists an add through the backend and only then updates local state', async () => {
    const { container } = await renderApp();
    const favs = container.querySelector('[data-testid="favs"]');
    expect(favs.textContent).toBe('c1');

    let postResolve;
    mocks.post.mockReturnValue(
      new Promise((resolve) => {
        postResolve = resolve;
      }),
    );

    await act(async () => {
      container
        .querySelector('#toggle')
        .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    // Backend has not confirmed yet: no local mutation.
    expect(favs.textContent).toBe('c1');
    expect(mocks.post).toHaveBeenCalledWith('/favorites/courses/c2', {});

    await act(async () => {
      postResolve({});
    });

    // Only after the backend confirms does the state change.
    expect(favs.textContent).toBe('c1,c2');
  });

  it('persists a removal through the backend DELETE', async () => {
    toggleTarget = 'c1';
    const { container } = await renderApp();
    const favs = container.querySelector('[data-testid="favs"]');
    expect(favs.textContent).toBe('c1');

    await act(async () => {
      container
        .querySelector('#toggle')
        .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(mocks.del).toHaveBeenCalledWith('/favorites/courses/c1');
    expect(favs.textContent).toBe('');
  });

  it('rejects an unauthenticated toggle: no API call and no local mutation', async () => {
    mocks.user = null;
    const { container } = await renderApp();
    const favs = container.querySelector('[data-testid="favs"]');
    const err = container.querySelector('[data-testid="err"]');
    expect(favs.textContent).toBe('');

    await act(async () => {
      container
        .querySelector('#toggle')
        .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(mocks.post).not.toHaveBeenCalled();
    expect(mocks.del).not.toHaveBeenCalled();
    expect(favs.textContent).toBe('');
    expect(err.textContent).toMatch(/iniciar sesión/i);
  });
});