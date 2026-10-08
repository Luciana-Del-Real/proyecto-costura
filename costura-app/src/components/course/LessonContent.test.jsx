// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('../../services/api', () => ({
  API_BASE_URL: 'http://localhost:3000/api',
  get: vi.fn(),
  patchForm: vi.fn(),
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'u1', name: 'Alumna' } }),
}));

vi.mock('../../context/PurchaseContext', () => ({
  usePurchases: () => ({ purchases: ['c1'] }),
}));

import { get, patchForm } from '../../services/api';
import { ProgressProvider } from '../../context/ProgressContext';
import LessonContent from './LessonContent';

const lesson = {
  id: 'l1',
  courseId: 'c1',
  title: 'Lección 1',
  duration: '12 min',
  description: 'Descripción de la lección',
};

function renderContent(overrides = {}) {
  return render(
    <ProgressProvider>
      <LessonContent
        lesson={lesson}
        idx={0}
        total={2}
        completed={false}
        comments={null}
        draft=""
        sendingFor={null}
        onComplete={vi.fn()}
        onSendComment={vi.fn()}
        onDraftChange={vi.fn()}
        onNext={vi.fn()}
        canComplete={true}
        {...overrides}
      />
    </ProgressProvider>,
  );
}

function pickEvidenceImage(file) {
  const input = screen.getByTestId('lesson-evidence-form').querySelector('input[type="file"]');
  fireEvent.change(input, { target: { files: [file] } });
}

beforeEach(() => {
  vi.clearAllMocks();
  get.mockResolvedValue({ lessons: [] });
  patchForm.mockResolvedValue({ id: 'p1', lesson: { id: 'l1' } });
  URL.createObjectURL = vi.fn(() => 'blob:preview');
  URL.revokeObjectURL = vi.fn();
});

describe('LessonContent evidence flow', () => {
  it('blocks the complete action until an image is chosen', () => {
    renderContent();
    const submit = screen.getByRole('button', { name: /marcar como completada/i });
    expect(submit.disabled).toBe(true);
  });

  it('sends the multipart completion request with the image and note once an image is chosen', async () => {
    renderContent();
    const file = new File(['x'], 'muestra.jpg', { type: 'image/jpeg' });

    pickEvidenceImage(file);

    const submit = screen.getByRole('button', { name: /marcar como completada/i });
    await waitFor(() => expect(submit.disabled).toBe(false));

    fireEvent.change(screen.getByPlaceholderText(/nota opcional/i), { target: { value: '  Hecha  ' } });
    fireEvent.click(submit);

    await waitFor(() => expect(patchForm).toHaveBeenCalledWith('/progress/lessons/l1', expect.any(FormData)));
    const formData = patchForm.mock.calls[0][1];
    expect(formData.get('completed')).toBe('true');
    expect(formData.get('image')).toBe(file);
    expect(formData.get('note')).toBe('Hecha');
  });

  it('shows the completion error inline without crashing', async () => {
    patchForm.mockRejectedValue(new Error('Debés adjuntar una imagen de la muestra para completar la lección.'));
    renderContent();
    pickEvidenceImage(new File(['x'], 'muestra.jpg', { type: 'image/jpeg' }));

    const submit = screen.getByRole('button', { name: /marcar como completada/i });
    await waitFor(() => expect(submit.disabled).toBe(false));
    fireEvent.click(submit);

    expect(await screen.findByText(/Debés adjuntar una imagen de la muestra/i)).toBeTruthy();
  });
});
