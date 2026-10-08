// @vitest-environment jsdom
import { describe, expect, it, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import Modal from './Modal';

// Modal portals into document.body; RTL's official cleanup unmounts both the
// render container and the portal subtrees (nuking body.innerHTML manually
// would desync React's reconciler bookkeeping).
afterEach(cleanup);

describe('Modal', () => {
  it('renders nothing when closed', () => {
    const { container } = render(<Modal open={false} onClose={() => {}} title="Título" />);
    expect(container.firstChild).toBeNull();
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });

  it('renders title, subtitle, children and footer in the body-level dialog', () => {
    render(
      <Modal
        open
        onClose={() => {}}
        title="Detalle"
        subtitle="ana@test.local"
        footer={<button type="button">Acción</button>}
      >
        <p>Cuerpo del modal</p>
      </Modal>,
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeTruthy();
    expect(dialog.parentElement).toBe(document.body); // portal directo a <body>
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.getAttribute('aria-label')).toBe('Detalle');
    expect(screen.getByText('Detalle')).toBeTruthy();
    expect(screen.getByText('ana@test.local')).toBeTruthy();
    expect(screen.getByText('Cuerpo del modal')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Acción' })).toBeTruthy();
  });

  it('applies the size class for sm, md and lg', () => {
    const { rerender } = render(<Modal open title="x" size="sm" />);
    expect(document.querySelector('.max-w-sm')).toBeTruthy();
    rerender(<Modal open title="x" size="md" />);
    expect(document.querySelector('.max-w-lg')).toBeTruthy();
    rerender(<Modal open title="x" size="lg" />);
    expect(document.querySelector('.max-w-2xl')).toBeTruthy();
  });

  it('defaults to md and applies the zIndex to the overlay', () => {
    const { rerender } = render(<Modal open title="x" />);
    expect(document.querySelector('.max-w-lg')).toBeTruthy();
    expect(screen.getByRole('dialog').style.zIndex).toBe('100');
    rerender(<Modal open title="x" zIndex={50} />);
    expect(screen.getByRole('dialog').style.zIndex).toBe('50');
  });

  it('calls onClose when the overlay (backdrop) is clicked', () => {
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose} title="x">
        <p>cuerpo</p>
      </Modal>,
    );
    const dialog = screen.getByRole('dialog');
    const overlay = dialog.firstChild;
    fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes on Escape', () => {
    const onClose = vi.fn();
    render(<Modal open onClose={onClose} title="x" />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not attach the Escape listener while closed', () => {
    const onClose = vi.fn();
    render(<Modal open={false} onClose={onClose} title="x" />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('focuses the close button on open', () => {
    render(<Modal open title="x" />);
    const close = screen.getByRole('button', { name: 'Cerrar' });
    expect(document.activeElement).toBe(close);
  });

  it('unmounts the portal when open becomes false', () => {
    const { rerender } = render(<Modal open title="x" />);
    expect(screen.getByRole('dialog')).toBeTruthy();
    rerender(<Modal open={false} title="x" />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});