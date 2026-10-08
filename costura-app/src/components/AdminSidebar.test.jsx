// @vitest-environment jsdom
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// The sidebar only needs `user` + `logout` from auth; everything else (router,
// icons) is real. This mirrors how the shell consumes the context.
const mocks = vi.hoisted(() => ({
  user: { name: 'Daiana Pérez', role: 'ADMIN' },
  logout: vi.fn(),
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: mocks.user, logout: mocks.logout }),
}));

import AdminSidebar from './AdminSidebar';

const renderSidebar = (path = '/admin') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <AdminSidebar />
    </MemoryRouter>,
  );

// Drives the lifted drawer state the way AdminLayout does (topbar trigger
// opens, sidebar closes).
function DrawerHarness() {
  const [open, setOpen] = useState(false);
  return (
    <MemoryRouter>
      <button type="button" onClick={() => setOpen(true)}>abrir drawer</button>
      <AdminSidebar open={open} onClose={() => setOpen(false)} />
    </MemoryRouter>
  );
}

describe('AdminSidebar', () => {
  it('renders the grouped sections with small labels', () => {
    const { getByText } = renderSidebar();
    ['Panel', 'Catálogo', 'Alumnas', 'Operaciones'].forEach((label) => {
      expect(getByText(label)).toBeTruthy();
    });
  });

  it('renders every grouped nav item', () => {
    const { getByRole } = renderSidebar();
    ['Inicio', 'Cursos', 'Patrones', 'Eventos', 'Usuarios', 'Certificados', 'Solicitudes', 'Ventas'].forEach(
      (label) => {
        expect(getByRole('link', { name: label })).toBeTruthy();
      },
    );
  });

  it('renders the institution name in full without truncating', () => {
    const { container } = renderSidebar();
    const brand = [...container.querySelectorAll('span')].find((el) =>
      el.textContent.includes('Creative Education Studio'),
    );
    expect(brand).toBeTruthy();
    expect(brand.className).not.toContain('truncate');
  });

  it('marks the active item for the current route', () => {
    const { getByRole } = renderSidebar('/admin/cursos');
    expect(getByRole('link', { name: 'Cursos' }).getAttribute('aria-current')).toBe('page');
    expect(getByRole('link', { name: 'Ventas' }).getAttribute('aria-current')).toBeNull();
  });

  it('keeps the item active on nested routes', () => {
    const { getByRole } = renderSidebar('/admin/patrones/editar/3');
    expect(getByRole('link', { name: 'Patrones' }).getAttribute('aria-current')).toBe('page');
  });

  it('does not mark the dashboard index active on child routes', () => {
    const { getByRole } = renderSidebar('/admin/ventas');
    expect(getByRole('link', { name: 'Inicio' }).getAttribute('aria-current')).toBeNull();
  });

  it('opens and closes the mobile drawer', () => {
    const { getByText, getByRole, queryByRole } = render(<DrawerHarness />);
    expect(queryByRole('dialog')).toBeNull();

    fireEvent.click(getByText('abrir drawer'));
    expect(getByRole('dialog')).toBeTruthy();

    fireEvent.click(getByRole('button', { name: 'Cerrar menú' }));
    expect(queryByRole('dialog')).toBeNull();
  });

  it('closes the drawer when a nav link is picked', () => {
    const { getByText, getByRole, queryByRole } = render(<DrawerHarness />);
    fireEvent.click(getByText('abrir drawer'));

    const dialog = getByRole('dialog');
    fireEvent.click(within(dialog).getByRole('link', { name: 'Ventas' }));

    expect(queryByRole('dialog')).toBeNull();
  });
});
