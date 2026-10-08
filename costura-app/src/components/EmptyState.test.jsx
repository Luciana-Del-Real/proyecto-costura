// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Heart, Search } from 'lucide-react';
import EmptyState from './EmptyState';

describe('EmptyState', () => {
  it('card (default) renders a flat card with icon, title and description', () => {
    const { container } = render(<EmptyState icon={Heart} title="Nada por acá" description="Volvé pronto." />);
    const card = container.firstChild;
    expect(card.className).toContain('card-flat');
    expect(card.className).toContain('text-center');
    expect(card.className).toContain('py-16');
    expect(screen.getByText('Nada por acá').className).toContain('font-display');
    expect(screen.getByText('Volvé pronto.').className).toContain('text-text-ink');
    const icon = container.querySelector('svg');
    expect(icon.getAttribute('class')).toContain('w-12');
    expect(icon.getAttribute('class')).toContain('text-primary');
  });

  it('plain renders centred content without a card surface', () => {
    const { container } = render(<EmptyState variant="plain" title="Sin cursos" />);
    const block = container.firstChild;
    expect(block.className).toContain('py-20');
    expect(block.className).not.toContain('card-flat');
  });

  it('compact renders a tight centred block with icon and ghost action, no card', () => {
    const onClick = vi.fn();
    const { container } = render(
      <EmptyState
        variant="compact"
        icon={Search}
        title="Sin resultados para tu búsqueda."
        action={{ label: 'Limpiar búsqueda', onClick, variant: 'ghost' }}
      />,
    );
    const block = container.firstChild;
    expect(block.className).toContain('flex');
    expect(block.className).toContain('gap-3');
    expect(block.className).toContain('py-6');
    expect(block.className).not.toContain('card-flat');
    const icon = container.querySelector('svg');
    expect(icon.getAttribute('class')).toContain('w-10');
    expect(icon.getAttribute('class')).toContain('text-primary');
    const button = screen.getByRole('button', { name: 'Limpiar búsqueda' });
    expect(button.className).toContain('btn-ghost');
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('inline renders a single small paragraph, using the title as fallback', () => {
    const { container } = render(<EmptyState variant="inline" title="Sin consultas todavía." />);
    expect(container.firstChild.tagName).toBe('P');
    expect(container.firstChild.className).toContain('text-sm');
    expect(container.firstChild.className).toContain('text-text-ink');
    expect(container.textContent).toBe('Sin consultas todavía.');
  });

  it('inline supports the accent tone', () => {
    const { container } = render(<EmptyState variant="inline" title="Nada" tone="accent" />);
    expect(container.firstChild.className).toContain('text-accent');
  });

  it('renders a router Link action', () => {
    render(
      <MemoryRouter>
        <EmptyState title="Sin favoritos" action={{ label: 'Explorar cursos', to: '/cursos' }} />
      </MemoryRouter>,
    );
    const link = screen.getByRole('link', { name: 'Explorar cursos' });
    expect(link.getAttribute('href')).toBe('/cursos');
    expect(link.className).toContain('btn-primary');
  });

  it('renders a button action and calls onClick', () => {
    const onClick = vi.fn();
    render(<EmptyState title="Sin resultados" action={{ label: 'Limpiar búsqueda', onClick, variant: 'ghost' }} />);
    const button = screen.getByRole('button', { name: 'Limpiar búsqueda' });
    expect(button.className).toContain('btn-ghost');
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders no action when none is provided', () => {
    render(<EmptyState icon={Search} title="Sin resultados" />);
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.queryByRole('link')).toBeNull();
  });
});
