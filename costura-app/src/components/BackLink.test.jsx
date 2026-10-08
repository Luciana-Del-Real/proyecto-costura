// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import BackLink from './BackLink';

describe('BackLink', () => {
  it('renders a router Link with the default "← Volver" copy and the shared classes', () => {
    const { container } = render(
      <MemoryRouter>
        <BackLink to="/cursos" />
      </MemoryRouter>,
    );
    const link = screen.getByRole('link', { name: '← Volver' });
    expect(link.getAttribute('href')).toBe('/cursos');
    expect(link.tagName).toBe('A');
    expect(link.className).toContain('text-primary');
    expect(link.className).toContain('text-sm');
    expect(link.className).toContain('hover:text-primary-hover');
    expect(link.className).toContain('inline-flex');
    expect(link.className).toContain('items-center');
    expect(link.className).toContain('gap-1');
    expect(link.className).toContain('mb-4');
    expect(container.firstChild).toBe(link);
  });

  it('renders custom children and appends className', () => {
    render(
      <MemoryRouter>
        <BackLink to="/mis-cursos" className="lg:mb-6">← Volver a mis cursos</BackLink>
      </MemoryRouter>,
    );
    const link = screen.getByRole('link', { name: '← Volver a mis cursos' });
    expect(link.className).toContain('lg:mb-6');
    expect(link.getAttribute('href')).toBe('/mis-cursos');
  });
});