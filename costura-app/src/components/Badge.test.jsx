// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import Badge from './Badge';

describe('Badge', () => {
  const BASE_SCALE = ['text-[10px]', 'font-bold', 'uppercase', 'tracking-wide', 'px-2', 'py-0.5', 'rounded-full', 'inline-flex', 'items-center'];

  it('neutral is the default tone and every badge carries the one size scale', () => {
    const { container } = render(<Badge>Sin responder</Badge>);
    const badge = container.firstChild;
    expect(badge.tagName).toBe('SPAN');
    for (const cls of BASE_SCALE) {
      expect(badge.className, cls).toContain(cls);
    }
    expect(badge.className).toContain('bg-bg-soft');
    expect(badge.className).toContain('text-text-ink');
    expect(badge.textContent).toBe('Sin responder');
  });

  it('renders children and appends className', () => {
    render(<Badge tone="primary" className="shrink-0">Pendiente</Badge>);
    const badge = screen.getByText('Pendiente');
    expect(badge.className).toContain('bg-primary-soft');
    expect(badge.className).toContain('text-primary');
    expect(badge.className).toContain('shrink-0');
  });

  it('maps every tone to its token classes', () => {
    const cases = {
      primary: ['bg-primary-soft', 'text-primary'],
      success: ['bg-success/10', 'text-success'],
      accent: ['bg-accent/10', 'text-accent'],
      danger: ['bg-danger/10', 'text-danger'],
      neutral: ['bg-bg-soft', 'text-text-ink'],
      outline: ['bg-white', 'border', 'border-border', 'text-text-ink'],
    };
    for (const [tone, tokens] of Object.entries(cases)) {
      const { container } = render(<Badge tone={tone}>x</Badge>);
      const cls = container.firstChild.className;
      for (const token of tokens) {
        expect(cls, `${tone} → ${token}`).toContain(token);
      }
    }
  });
});