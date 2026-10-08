// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CalendarHeart } from 'lucide-react';
import ErrorState from './ErrorState';

describe('ErrorState', () => {
  it('card (default) renders the default AlertTriangle with title and description', () => {
    const { container } = render(
      <ErrorState title="No se pudo cargar" description="Verificá tu conexión." />,
    );
    const card = container.firstChild;
    expect(card.className).toContain('card-flat');
    expect(card.className).toContain('py-16');
    expect(screen.getByText('No se pudo cargar')).toBeTruthy();
    expect(screen.getByText('Verificá tu conexión.')).toBeTruthy();
    const icon = container.querySelector('svg');
    expect(icon.getAttribute('class')).toContain('w-12');
  });

  it('card accepts a custom icon', () => {
    const { container } = render(<ErrorState icon={CalendarHeart} title="No se pudieron cargar los eventos" />);
    expect(container.querySelector('svg')).toBeTruthy();
    expect(container.textContent).toContain('No se pudieron cargar los eventos');
  });

  it('banner renders a danger-token alert box', () => {
    render(<ErrorState variant="banner" description="Ocurrió un error" />);
    const banner = screen.getByRole('alert');
    expect(banner.className).toContain('bg-danger/10');
    expect(banner.className).toContain('border-danger/30');
    expect(banner.className).toContain('text-danger');
    expect(banner.className).toContain('rounded-xl');
    expect(banner.textContent).toContain('Ocurrió un error');
    expect(banner.querySelector('svg')).toBeTruthy();
  });

  it('inline renders a single small danger paragraph', () => {
    const { container } = render(<ErrorState variant="inline" description="No se pudieron cargar las consultas." />);
    expect(container.firstChild.tagName).toBe('P');
    expect(container.firstChild.className).toContain('text-sm');
    expect(container.firstChild.className).toContain('text-danger');
  });

  it('renders a router Link action', () => {
    render(
      <MemoryRouter>
        <ErrorState title="Error" action={{ label: 'Volver', to: '/mis-cursos' }} />
      </MemoryRouter>,
    );
    const link = screen.getByRole('link', { name: 'Volver' });
    expect(link.getAttribute('href')).toBe('/mis-cursos');
  });

  it('renders a button action and calls onClick', () => {
    const onClick = vi.fn();
    render(<ErrorState title="Error" description="Algo falló" action={{ label: 'Reintentar', onClick }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
