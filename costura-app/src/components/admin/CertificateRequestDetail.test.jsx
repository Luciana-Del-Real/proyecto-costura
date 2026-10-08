// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import CertificateRequestDetail from './CertificateRequestDetail';

vi.mock('../../utils/media', () => ({ getImageUrl: (u) => u }));

// El backend todavía devuelve `comments` en el detalle, pero esta vista es solo
// para corroborar EVIDENCIAS: el requisito es que NO muestre los comentarios.
const detail = {
  request: { id: 'r1', status: 'PENDING', createdAt: '2026-01-01T00:00:00Z', sentAt: null },
  student: { id: 'u1', name: 'Ana', email: 'ana@test.local' },
  course: { id: 'c1', title: 'Costura' },
  lessons: [
    {
      id: 'l1',
      title: 'Lección 1',
      order: 1,
      completed: true,
      evidenceImage: '/uploads/progress/a.jpg',
      evidenceNote: 'muestra lista',
    },
  ],
  comments: [
    {
      id: 'x1',
      message: 'COMENTARIO QUE NO DEBE APARECER',
      parentId: null,
      createdAt: '2026-01-02T00:00:00Z',
      user: { id: 'u1', name: 'Ana', role: 'ALUMNO' },
      lesson: { id: 'l1', title: 'Lección 1', order: 1 },
    },
  ],
};

describe('CertificateRequestDetail', () => {
  it('muestra la evidencia de la lección y NO los comentarios', async () => {
    const getDetail = vi.fn().mockResolvedValue(detail);

    render(<CertificateRequestDetail requestId="r1" getDetail={getDetail} onClose={() => {}} />);

    expect(await screen.findByText(/Lección 1/)).toBeTruthy();
    expect(screen.getByText('muestra lista')).toBeTruthy();
    expect(screen.queryByText('COMENTARIO QUE NO DEBE APARECER')).toBeNull();
    expect(screen.queryByText(/Comentarios de la alumna/)).toBeNull();
  });
});
