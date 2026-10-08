// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

/**
 * Patrones: filtro por tipo (Todos / De pago / Gratis), con el mismo estilo que
 * el filtro de nivel de cursos. Un patrón es "de pago" cuando el backend lo
 * marca con `esPago` (precioARS/precioAUD > 0).
 */
const mocks = vi.hoisted(() => ({ patterns: [] }));

vi.mock('../services/api', () => ({
  get: vi.fn(async () => mocks.patterns),
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: null }),
}));

vi.mock('../utils/media', () => ({
  getImageUrl: (p) => p,
}));

vi.mock('../components/PageHeader', () => ({
  default: ({ title, subtitle }) => (
    <header>
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </header>
  ),
}));

import PatronesGratis from './PatronesGratis';

const freePattern = {
  id: 'f1',
  titulo: 'Molde Gratis',
  descripcion: 'un molde gratis',
  esPago: false,
  archivo: '/uploads/free.pdf',
};

const paidPattern = {
  id: 'p1',
  titulo: 'Molde Premium',
  descripcion: 'un molde de pago',
  esPago: true,
  precioARS: 5000,
  precioAUD: 10,
  archivo: null,
};

function renderPage() {
  return render(
    <MemoryRouter>
      <PatronesGratis />
    </MemoryRouter>,
  );
}

describe('PatronesGratis — filtro por tipo', () => {
  beforeEach(() => {
    mocks.patterns = [freePattern, paidPattern];
  });

  it('ofrece los filtros Todos / De pago / Gratis y filtra el listado', async () => {
    renderPage();

    // Por defecto (Todos) se ven ambos patrones.
    expect(await screen.findByText('Molde Gratis')).toBeTruthy();
    expect(screen.getByText('Molde Premium')).toBeTruthy();

    // Los tres filtros existen como botones.
    const todosBtn = screen.getByRole('button', { name: 'Todos' });
    const pagoBtn = screen.getByRole('button', { name: 'De pago' });
    const gratisBtn = screen.getByRole('button', { name: 'Gratis' });

    // Gratis -> solo el patrón gratuito.
    fireEvent.click(gratisBtn);
    await waitFor(() => expect(screen.queryByText('Molde Premium')).toBeNull());
    expect(screen.getByText('Molde Gratis')).toBeTruthy();

    // De pago -> solo el patrón de pago.
    fireEvent.click(pagoBtn);
    await waitFor(() => expect(screen.queryByText('Molde Gratis')).toBeNull());
    expect(screen.getByText('Molde Premium')).toBeTruthy();

    // Todos -> vuelven a verse ambos.
    fireEvent.click(todosBtn);
    await waitFor(() => expect(screen.getByText('Molde Gratis')).toBeTruthy());
    expect(screen.getByText('Molde Premium')).toBeTruthy();
  });
});
