// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CommentThread from './CommentThread';

const student = { id: 'u1', name: 'Alumna Test', role: 'STUDENT' };
const teacher = { id: 'u2', name: 'Profe Test', role: 'ADMIN' };

const q1 = { id: 'q1', message: 'Pregunta uno', user: student, parentId: null, createdAt: '2024-01-01T10:00:00Z' };
const r1 = { id: 'r1', message: 'Respuesta admin', user: teacher, parentId: 'q1', createdAt: '2024-01-02T10:00:00Z' };
const r1a = { id: 'r1a', message: 'Respuesta anidada', user: student, parentId: 'r1', createdAt: '2024-01-03T10:00:00Z' };

const labels = {
  admin: 'Profesora',
  author: 'Vos',
  reply: 'Responder',
  cancel: 'Cancelar',
  send: 'Enviar',
  placeholder: 'Escribí tu respuesta...',
};

const onReply = vi.fn().mockResolvedValue(true);

describe('CommentThread', () => {
  it('recursively nests replies under their parent question', () => {
    const { container } = render(
      <CommentThread items={[q1, r1, r1a]} onReply={onReply} labels={labels} />,
    );
    expect(container.textContent).toContain('Pregunta uno');
    expect(container.textContent).toContain('Respuesta admin');
    expect(container.textContent).toContain('Respuesta anidada');
    // Two nested levels (reply + nested reply) carry the indent/border class.
    expect(container.querySelectorAll('.border-l-2').length).toBe(2);
  });

  it('uses the supplied labels and the author slot', () => {
    const { container } = render(
      <CommentThread items={[q1, r1]} onReply={onReply} labels={labels} />,
    );
    expect(container.textContent).toContain('Profesora');
    expect(container.textContent).toContain('Vos');
    expect(container.textContent).toContain('Alumna Test');
  });

  it('supports an author function and a date flag for admin rows', () => {
    const adminLabels = {
      ...labels,
      author: (c) => c.user?.name || 'Alumna',
      date: true,
    };
    const { container } = render(
      <CommentThread items={[q1, r1]} onReply={onReply} labels={adminLabels} />,
    );
    // Author function applies to non-admin rows (student name), admin rows use labels.admin.
    expect(container.textContent).toContain('Alumna Test');
    expect(container.textContent).toContain('Profesora');
    expect(container.textContent).toMatch(/2024/);
  });

  it('renders the badge slot without hardcoding admin chrome', () => {
    const adminLabels = {
      ...labels,
      author: (c) => c.user?.name || 'Alumna',
      badge: (c) => <span data-testid={`badge-${c.id}`}>Respondida</span>,
    };
    const { container } = render(
      <CommentThread items={[q1, r1]} onReply={onReply} labels={adminLabels} />,
    );
    expect(container.querySelector('[data-testid="badge-q1"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="badge-r1"]')).toBeTruthy();
  });

  it('gates reply controls with canReply', () => {
    const { container, rerender } = render(
      <CommentThread items={[q1]} onReply={onReply} labels={labels} canReply={false} />,
    );
    expect(container.textContent).not.toContain('Responder');
    rerender(<CommentThread items={[q1]} onReply={onReply} labels={labels} />);
    expect(container.textContent).toContain('Responder');
  });

  it('disables the send button while replySending is true', () => {
    render(
      <CommentThread items={[q1]} onReply={onReply} labels={labels} replySending />,
    );
    fireEvent.click(screen.getByText('Responder'));
    expect(screen.getByText('Enviar').disabled).toBe(true);
  });

  it('renders the image picker with preview and fires onRemove', () => {
    const onRemove = vi.fn();
    render(
      <CommentThread
        items={[q1]}
        onReply={onReply}
        labels={labels}
        image={{ preview: 'blob:fake', onChange: vi.fn(), onRemove }}
      />,
    );
    fireEvent.click(screen.getByText('Responder'));
    expect(screen.getByText('Adjuntar imagen')).toBeTruthy();
    expect(screen.getByAltText('Vista previa').getAttribute('src')).toBe('blob:fake');
    fireEvent.click(screen.getByLabelText('Quitar imagen'));
    expect(onRemove).toHaveBeenCalled();
  });

  it('does not call onReply for an empty or whitespace-only message', async () => {
    const reply = vi.fn().mockResolvedValue(true);
    render(<CommentThread items={[q1]} onReply={reply} labels={labels} />);
    fireEvent.click(screen.getByText('Responder'));
    const textarea = screen.getByPlaceholderText('Escribí tu respuesta...');
    fireEvent.change(textarea, { target: { value: '   ' } });
    fireEvent.click(screen.getByText('Enviar'));
    expect(reply).not.toHaveBeenCalled();
  });

  it('calls onReply with the comment, trimmed message and image file, then closes on success', async () => {
    const reply = vi.fn().mockResolvedValue(true);
    render(<CommentThread items={[q1]} onReply={reply} labels={labels} />);
    fireEvent.click(screen.getByText('Responder'));
    fireEvent.change(screen.getByPlaceholderText('Escribí tu respuesta...'), { target: { value: '  Hola  ' } });
    fireEvent.click(screen.getByText('Enviar'));
    await waitFor(() => expect(reply).toHaveBeenCalledWith(q1, 'Hola', null));
    // Success clears the draft and closes the inline form.
    await waitFor(() => expect(screen.queryByPlaceholderText('Escribí tu respuesta...')).toBeNull());
  });

  it('keeps the draft open when onReply fails', async () => {
    const reply = vi.fn().mockResolvedValue(false);
    render(<CommentThread items={[q1]} onReply={reply} labels={labels} />);
    fireEvent.click(screen.getByText('Responder'));
    fireEvent.change(screen.getByPlaceholderText('Escribí tu respuesta...'), { target: { value: 'Hola' } });
    fireEvent.click(screen.getByText('Enviar'));
    await waitFor(() => expect(reply).toHaveBeenCalled());
    expect(screen.getByPlaceholderText('Escribí tu respuesta...').value).toBe('Hola');
  });
});