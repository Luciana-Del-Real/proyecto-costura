// @vitest-environment jsdom
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// The sidebar only needs `user` + `logout` from auth; everything else (router,
// icons) is real. This mirrors how the student shell consumes the context.
const mocks = vi.hoisted(() => ({
  user: { name: 'Lucía Gómez', role: 'USER' },
  logout: vi.fn(),
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: mocks.user, logout: mocks.logout }),
}));

import StudentSidebar from './StudentSidebar';

const renderSidebar = (path = '/dashboard') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <StudentSidebar />
    </MemoryRouter>,
  );

// Drives the lifted drawer state the way Layout does (navbar trigger opens,
// sidebar closes).
function DrawerHarness() {
  const [open, setOpen] = useState(false);
  return (
    <MemoryRouter>
      <button type="button" onClick={() => setOpen(true)}>abrir drawer</button>
      <StudentSidebar open={open} onClose={() => setOpen(false)} />
    </MemoryRouter>
  );
}

describe('StudentSidebar', () => {
  it('renders every student nav item', () => {
    const { getByRole } = renderSidebar();
    ['Inicio', 'Cursos', 'Patrones', 'Eventos', 'Recomendaciones', 'Mis cursos'].forEach(
      (label) => {
        expect(getByRole('link', { name: label })).toBeTruthy();
      },
    );
  });

  it('does not repeat Favoritos or Perfil (they live in the navbar dropdown)', () => {
    const { queryByRole } = renderSidebar();
    expect(queryByRole('link', { name: 'Favoritos' })).toBeNull();
    expect(queryByRole('link', { name: 'Perfil' })).toBeNull();
  });

  it('marks the active item for the current route', () => {
    const { getByRole } = renderSidebar('/mis-cursos');
    expect(getByRole('link', { name: 'Mis cursos' }).getAttribute('aria-current')).toBe('page');
    expect(getByRole('link', { name: 'Inicio' }).getAttribute('aria-current')).toBeNull();
  });

  it('keeps the item active on nested routes', () => {
    const { getByRole } = renderSidebar('/cursos/moldería-basica');
    expect(getByRole('link', { name: 'Cursos' }).getAttribute('aria-current')).toBe('page');
  });

  it('does not mark the dashboard index active on child routes', () => {
    const { getByRole } = renderSidebar('/eventos');
    expect(getByRole('link', { name: 'Inicio' }).getAttribute('aria-current')).toBeNull();
  });

  it('keeps the desktop rail free of logout (it lives in the navbar menu)', () => {
    const { queryByRole } = renderSidebar();
    expect(queryByRole('button', { name: 'Cerrar sesión' })).toBeNull();
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
    fireEvent.click(within(dialog).getByRole('link', { name: 'Mis cursos' }));

    expect(queryByRole('dialog')).toBeNull();
  });

  it('logs out from the drawer and closes it', () => {
    const { getByText, getByRole, queryByRole } = render(<DrawerHarness />);
    fireEvent.click(getByText('abrir drawer'));

    const dialog = getByRole('dialog');
    expect(within(dialog).getByText('Lucía Gómez')).toBeTruthy();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cerrar sesión' }));

    expect(mocks.logout).toHaveBeenCalledTimes(1);
    expect(queryByRole('dialog')).toBeNull();
  });
});
