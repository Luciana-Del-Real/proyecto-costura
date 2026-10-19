// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

/**
 * Dashboard: el "Ver todos →" de cada sección vive DENTRO del <header> de la
 * sección, en la misma fila que el subtítulo, no en una fila suelta debajo.
 */
const mocks = vi.hoisted(() => ({
  courses: [],
  loading: false,
  purchases: [],
}));

vi.mock('../context/CourseCatalogContext', () => ({
  useCourseCatalog: () => ({ courses: mocks.courses, loading: mocks.loading }),
}));

vi.mock('../context/PurchaseContext', () => ({
  usePurchases: () => ({ purchases: mocks.purchases }),
}));

vi.mock('../components/CourseCard', () => ({
  default: ({ course }) => <div>{course.title}</div>,
}));

import Dashboard from './Dashboard';

function renderPage() {
  return render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>,
  );
}

describe('Dashboard — Ver todos dentro del header de la sección', () => {
  beforeEach(() => {
    mocks.loading = false;
    mocks.courses = [
      { id: 'c1', title: 'Curso propio', lessons: [] },
      { id: 'c2', title: 'Curso sugerido', lessons: [] },
    ];
    mocks.purchases = [];
  });

  it('renders the Mis cursos link inside the section header pointing to /mis-cursos', () => {
    mocks.purchases = ['c1'];
    renderPage();

    const header = screen.getByRole('heading', { name: 'Mis cursos' }).closest('header');
    const link = screen.getByRole('link', { name: 'Ver todos →' });

    expect(header).not.toBeNull();
    expect(header.contains(link)).toBe(true);
    expect(link.getAttribute('href')).toBe('/mis-cursos');
  });

  it('renders the Cursos disponibles link inside the section header pointing to /cursos', () => {
    renderPage();

    const header = screen.getByRole('heading', { name: 'Cursos disponibles' }).closest('header');
    const link = screen.getByRole('link', { name: 'Ver todos →' });

    expect(header).not.toBeNull();
    expect(header.contains(link)).toBe(true);
    expect(link.getAttribute('href')).toBe('/cursos');
  });

  it('keeps the same top margin as the other tabs between the header and the cards', () => {
    renderPage();

    // La card mockeada cuelga de la grilla, que a su vez cuelga del contenedor
    // con el margen. Las otras pestañas con grilla usan mt-6: el Dashboard
    // tiene que manter la misma distancia entre la linea rosa y las cards.
    const card = screen.getByText('Curso sugerido');
    const grid = card.parentElement;
    const wrapper = grid?.parentElement;

    expect(wrapper?.className).toContain('mt-6');
  });
});
