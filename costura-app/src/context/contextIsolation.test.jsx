// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { FavoritesProvider, useFavorites } from './FavoritesContext';
import { NotificationsProvider, useNotifications } from './NotificationsContext';

/**
 * 5.6 — favorites-notifications-integration spec, "No cross-domain coupling":
 * when one domain context updates, the other domain's state stays untouched.
 *
 * Both providers are mounted together and a favorites mutation (remove a
 * favorite) and a notifications mutation (mark as read) are driven through the
 * real provider logic; each assertion checks that the sibling domain did not
 * change.
 */
const mocks = vi.hoisted(() => ({
  user: { id: 'u1', name: 'Ana', email: 'ana@test.local', role: 'ALUMNO' },
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  del: vi.fn(),
}));

vi.mock('./AuthContext', () => ({ useAuth: () => ({ user: mocks.user }) }));
vi.mock('../services/api', () => ({
  get: mocks.get,
  post: mocks.post,
  patch: mocks.patch,
  del: mocks.del,
}));

function BothHarness() {
  const { favorites, toggleFavorite } = useFavorites();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  return (
    <div>
      <span data-testid="favs">{favorites.join(',')}</span>
      <span data-testid="notes">{notifications.map((n) => n.id).join(',')}</span>
      <span data-testid="unread">{unreadCount}</span>
      <button id="toggle-fav" onClick={() => toggleFavorite('c1')}>
        toggle favorite
      </button>
      <button id="read-note" onClick={() => markAsRead('n1')}>
        read notification
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
        <NotificationsProvider>
          <BothHarness />
        </NotificationsProvider>
      </FavoritesProvider>,
    );
  });
  await act(async () => {}); // flush remaining microtasks of the mount fetches
  return { container };
}

describe('5.6 Cross-domain context isolation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.user = { id: 'u1', name: 'Ana', email: 'ana@test.local', role: 'ALUMNO' };
    mocks.get.mockImplementation((path) => {
      if (path === '/favorites') {
        return Promise.resolve([{ courseId: 'c1', course: { id: 'c1' } }]);
      }
      if (path === '/notifications') {
        return Promise.resolve([{ id: 'n1', read: false, title: 'N1', message: 'm' }]);
      }
      if (path === '/notifications/unread-count') {
        return Promise.resolve({ unreadCount: 1 });
      }
      return Promise.resolve([]);
    });
    mocks.post.mockResolvedValue({});
    mocks.patch.mockResolvedValue({});
    mocks.del.mockResolvedValue({});
  });

  afterEach(async () => {
    for (const root of roots) await act(async () => root.unmount());
    roots.length = 0;
    document.body.innerHTML = '';
  });

  it('mounts both domains with independent state', async () => {
    const { container } = await renderApp();

    expect(container.querySelector('[data-testid="favs"]').textContent).toBe('c1');
    expect(container.querySelector('[data-testid="notes"]').textContent).toBe('n1');
    expect(container.querySelector('[data-testid="unread"]').textContent).toBe('1');
  });

  it('updating favorites leaves the notifications state untouched', async () => {
    const { container } = await renderApp();
    const notes = container.querySelector('[data-testid="notes"]');

    await act(async () => {
      container
        .querySelector('#toggle-fav')
        .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(container.querySelector('[data-testid="favs"]').textContent).toBe('');
    expect(mocks.del).toHaveBeenCalledWith('/favorites/courses/c1');
    expect(notes.textContent).toBe('n1'); // notifications untouched
    expect(container.querySelector('[data-testid="unread"]').textContent).toBe('1');
  });

  it('updating notifications leaves the favorites state untouched', async () => {
    const { container } = await renderApp();

    await act(async () => {
      container
        .querySelector('#read-note')
        .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(mocks.patch).toHaveBeenCalledWith('/notifications/n1/read', {});
    expect(container.querySelector('[data-testid="favs"]').textContent).toBe('c1'); // favorites untouched
    expect(container.querySelector('[data-testid="notes"]').textContent).toBe('n1'); // read in place
    expect(container.querySelector('[data-testid="unread"]').textContent).toBe('0');
  });
});