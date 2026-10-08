// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import AdminTopbar from './AdminTopbar';

const renderTopbar = (props = {}) =>
  render(
    <MemoryRouter>
      <AdminTopbar {...props} />
    </MemoryRouter>,
  );

describe('AdminTopbar', () => {
  it('renders the brand logo', () => {
    const { getByAltText } = renderTopbar();
    const logo = getByAltText('Creative Education Studio');
    expect(logo.tagName).toBe('IMG');
    expect(logo.getAttribute('src')).toBe('/Images/Logo%20sin%20Slogan.png');
  });

  it('renders the institution name in full without truncating', () => {
    const { container } = renderTopbar();
    const brand = [...container.querySelectorAll('span')].find((el) =>
      el.textContent.includes('Creative Education Studio'),
    );
    expect(brand).toBeTruthy();
    expect(brand.textContent).toBe('Creative Education Studio');
    expect(brand.className).not.toContain('truncate');
  });

  it('exposes the mobile menu trigger', () => {
    const onMenuClick = vi.fn();
    const { getByRole } = renderTopbar({ onMenuClick });
    fireEvent.click(getByRole('button', { name: 'Abrir menú de navegación' }));
    expect(onMenuClick).toHaveBeenCalledTimes(1);
  });
});
