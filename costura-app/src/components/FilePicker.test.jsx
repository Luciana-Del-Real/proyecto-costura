// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import FilePicker from './FilePicker';

describe('FilePicker', () => {
  it('applies the shared class and accept/multiple attributes', () => {
    const { container } = render(<FilePicker accept=".pdf" multiple onChange={vi.fn()} />);
    const input = container.querySelector('input[type="file"]');
    expect(input).toBeTruthy();
    expect(input.className).toContain(
      'block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full',
    );
    expect(input.getAttribute('accept')).toBe('.pdf');
    expect(input.multiple).toBe(true);
  });

  it('fires onChange with the selected files', () => {
    const onChange = vi.fn();
    const { container } = render(<FilePicker onChange={onChange} />);
    const input = container.querySelector('input[type="file"]');
    const file = new File(['x'], 'a.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [file] } });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].target.files[0]).toBe(file);
  });

  it('renders the label string as a caption below the input', () => {
    const { container } = render(<FilePicker label="Subí tu PDF" onChange={vi.fn()} />);
    expect(container.textContent).toContain('Subí tu PDF');
  });

  it('renders children instead of the label when both are present', () => {
    const { container } = render(
      <FilePicker label="ignored" onChange={vi.fn()}>
        <span data-testid="custom-caption">Caption personalizado</span>
      </FilePicker>,
    );
    expect(container.querySelector('[data-testid="custom-caption"]')).toBeTruthy();
    expect(container.textContent).not.toContain('ignored');
  });
});
