// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

/**
 * Recomendaciones: tarjetas públicas estilo patrón. Lo que se prueba acá es el
 * contrato de la tarjeta — título/descripción, link normalizado a https://
 * abierto en otra pestaña y el estado sin link — más el estado vacío.
 */
const mocks = vi.hoisted(() => ({ recommendations: [] }));

vi.mock('../services/api', () => ({
  listPublicRecommendations: vi.fn(async () => mocks.recommendations),
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

import Recommendations from './Recommendations';

function renderPage() {
  return render(
    <MemoryRouter>
      <Recommendations />
    </MemoryRouter>,
  );
}

describe('Recommendations — tarjetas públicas', () => {
  beforeEach(() => {
    mocks.recommendations = [
      { id: 'r1', title: 'Taladro', description: 'un taladro', image: null, link: 'taladro.test' },
      { id: 'r2', title: 'Sin link', description: 'sin enlace', image: '/uploads/recommendations/x.png', link: null },
    ];
  });

  it('muestra el título y la descripción de cada recomendación', async () => {
    renderPage();

    expect(await screen.findByText('Taladro')).toBeTruthy();
    expect(screen.getByText('un taladro')).toBeTruthy();
    expect(screen.getByText('Sin link')).toBeTruthy();
  });

  it('normaliza el link sin esquema a https:// y abre en otra pestaña', async () => {
    renderPage();

    const cta = await screen.findByRole('link', { name: 'Ver más' });

    expect(cta.getAttribute('href')).toBe('https://taladro.test');
    expect(cta.getAttribute('target')).toBe('_blank');
    expect(cta.getAttribute('rel')).toBe('noreferrer');
  });

  it('sin link muestra el botón deshabilitado "Sin enlace"', async () => {
    mocks.recommendations = [
      { id: 'r1', title: 'Solo título', description: 'algo', image: null, link: null },
    ];

    renderPage();

    expect(await screen.findByText('Sin enlace')).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Ver más' })).toBeNull();
  });

  it('muestra el estado vacío cuando no hay recomendaciones', async () => {
    mocks.recommendations = [];

    renderPage();

    expect(await screen.findByText('Todavía no hay recomendaciones cargadas')).toBeTruthy();
  });
});
