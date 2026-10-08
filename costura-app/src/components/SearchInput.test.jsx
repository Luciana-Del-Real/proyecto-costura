// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SearchInput from './SearchInput';

describe('SearchInput', () => {
  const MAGNIFIER_PATH = 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z';

  it('renders the grey pill input inside a relative wrapper with the magnifier icon', () => {
    const { container } = render(<SearchInput value="" onChange={() => {}} placeholder="Buscar..." />);
    const wrapper = container.firstChild;
    expect(wrapper.tagName).toBe('DIV');
    expect(wrapper.className).toContain('relative');

    const iconPath = container.querySelector('svg path');
    expect(iconPath.getAttribute('d')).toBe(MAGNIFIER_PATH);
    const iconSvg = iconPath.closest('svg');
    expect(iconSvg.getAttribute('class')).toContain('text-primary');
    expect(iconSvg.getAttribute('class')).toContain('absolute');

    const input = screen.getByPlaceholderText('Buscar...');
    expect(input.className).toContain('rounded-full');
    expect(input.className).toContain('border-gray-300');
    expect(input.className).toContain('pl-10');
    expect(input.className).toContain('shadow-sm');
    expect(input.className).toContain('w-full');
  });

  it('puts caller className on the wrapper and inputClassName on the input', () => {
    const { container } = render(
      <SearchInput value="" onChange={() => {}} placeholder="..." className="w-full md:w-72" inputClassName="font-medium" />,
    );
    expect(container.firstChild.className).toContain('w-full md:w-72');
    expect(screen.getByPlaceholderText('...').className).toContain('font-medium');
  });

  it('forwards value, placeholder and onChange to the input', () => {
    const onChange = vi.fn();
    render(<SearchInput value="hola" onChange={onChange} placeholder="Buscar curso..." />);
    const input = screen.getByPlaceholderText('Buscar curso...');
    expect(input.value).toBe('hola');
    expect(input.getAttribute('type')).toBe('text');
    fireEvent.change(input, { target: { value: 'molderia' } });
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});