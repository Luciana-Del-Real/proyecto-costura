// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import LoadingState from './LoadingState';

describe('LoadingState', () => {
  it('section (default) renders the default 🧵 with a pulse and py-24 block', () => {
    const { container } = render(<LoadingState />);
    const status = screen.getByRole('status');
    expect(status.className).toContain('py-24');
    expect(container.querySelector('.animate-pulse')?.textContent).toBe('🧵');
  });

  it('page renders a min-h-screen gate and shows the label under the emoji', () => {
    const { container } = render(<LoadingState size="page" label="Cargando la app..." />);
    const status = screen.getByRole('status');
    expect(status.className).toContain('min-h-screen');
    expect(container.textContent).toContain('Cargando la app...');
    expect(container.querySelector('.animate-pulse')?.textContent).toBe('🧵');
  });

  it('inline renders the default Cargando... text row', () => {
    const { container } = render(<LoadingState size="inline" />);
    const status = screen.getByRole('status');
    expect(status.className).toContain('text-sm');
    expect(status.className).toContain('text-accent');
    expect(status.textContent).toBe('Cargando...');
    expect(container.querySelector('.animate-pulse')).toBeNull();
  });

  it('inline accepts a custom label', () => {
    render(<LoadingState size="inline" label="Cargando eventos..." />);
    expect(screen.getByRole('status').textContent).toBe('Cargando eventos...');
  });

  it('accepts a custom emoji', () => {
    const { container } = render(<LoadingState size="section" emoji="🎉" />);
    expect(container.querySelector('.animate-pulse')?.textContent).toBe('🎉');
  });

  it('is announced with role status and an aria-label', () => {
    render(<LoadingState />);
    const status = screen.getByRole('status');
    expect(status.getAttribute('aria-live')).toBe('polite');
    expect(status.getAttribute('aria-label')).toBe('Cargando');
  });
});
