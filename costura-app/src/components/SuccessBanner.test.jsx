// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import SuccessBanner from './SuccessBanner';

describe('SuccessBanner', () => {
  it('renders the check mark and the message with the shared banner classes', () => {
    const { container } = render(<SuccessBanner>Guardado correctamente</SuccessBanner>);
    const banner = screen.getByRole('status');
    expect(container.firstChild).toBe(banner);
    expect(banner.className).toContain('bg-primary-soft');
    expect(banner.className).toContain('text-success');
    expect(banner.className).toContain('text-sm');
    expect(banner.className).toContain('rounded-xl');
    expect(banner.className).toContain('px-4');
    expect(banner.className).toContain('py-3');
    expect(banner.className).toContain('mb-4');
    expect(banner.className).toContain('items-start');
    expect(banner.className).toContain('gap-2');
    expect(banner.querySelector('span[aria-hidden="true"]')?.textContent).toBe('✓');
    expect(banner.textContent).toContain('Guardado correctamente');
  });

  it('appends className and renders arbitrary children', () => {
    render(<SuccessBanner className="mt-2">Cambios guardados correctamente</SuccessBanner>);
    const banner = screen.getByRole('status');
    expect(banner.className).toContain('mt-2');
    expect(banner.textContent).toContain('Cambios guardados correctamente');
  });
});