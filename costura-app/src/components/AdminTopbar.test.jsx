// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';

// The topbar renders the admin identity and logout from auth.
const mocks = vi.hoisted(() => ({
  user: { name: 'Daiana Pérez', role: 'ADMIN' },
  logout: vi.fn(),
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: mocks.user, logout: mocks.logout }),
}));

import AdminTopbar from './AdminTopbar';

// The topbar renders the notification bell, which reads this context.
vi.mock('../context/NotificationsContext', () => ({
  useNotifications: () => ({
    notifications: [],
    unreadCount: 0,
    notificationsLoading: false,
    notificationsError: null,
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
    deleteNotification: vi.fn(),
  }),
}));

// Renders the current path so logout navigation can be asserted.
function LocationProbe() {
  const { pathname } = useLocation();
  return <span data-testid="location">{pathname}</span>;
}

const renderTopbar = (props = {}) =>
  render(
    <MemoryRouter initialEntries={['/admin']}>
      <AdminTopbar {...props} />
      <LocationProbe />
    </MemoryRouter>,
  );

describe('AdminTopbar', () => {
  it('renders the brand logo', () => {
    const { getByAltText } = renderTopbar();
    const logo = getByAltText('Creative Education Studio');
    expect(logo.tagName).toBe('IMG');
    expect(logo.getAttribute('src')).toBe('/Images/Logo%20sin%20Slogan.png');
  });

  it('renders the institution name in full without truncating', () => {
    const { container } = renderTopbar();
    const brand = [...container.querySelectorAll('span')].find((el) =>
      el.textContent.includes('Creative Education Studio'),
    );
    expect(brand).toBeTruthy();
    expect(brand.textContent).toBe('Creative Education Studio');
    expect(brand.className).not.toContain('truncate');
  });

  it('exposes the mobile menu trigger', () => {
    const onMenuClick = vi.fn();
    const { getByRole } = renderTopbar({ onMenuClick });
    fireEvent.click(getByRole('button', { name: 'Abrir menú de navegación' }));
    expect(onMenuClick).toHaveBeenCalledTimes(1);
  });

  it('renders the admin identity and logout next to the bell', () => {
    const { getByText, getByRole } = renderTopbar();

    const name = getByText('Daiana Pérez');
    expect(name.className).toContain('text-primary');
    expect(name.className).toContain('text-xs');
    expect(name.className).toContain('font-semibold');

    const role = getByText('Administradora');
    expect(role.className).toContain('uppercase');

    const logoutButton = getByRole('button', { name: 'Salir' });
    expect(logoutButton.className).toContain('btn-primary');
    expect(logoutButton.className).toContain('text-xs');
  });

  it('logs out and returns home from the topbar', () => {
    const { getByRole, getByTestId } = renderTopbar();

    expect(getByTestId('location').textContent).toBe('/admin');
    fireEvent.click(getByRole('button', { name: 'Salir' }));

    expect(mocks.logout).toHaveBeenCalledTimes(1);
    expect(getByTestId('location').textContent).toBe('/');
  });
});
