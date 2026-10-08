// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

vi.mock('../services/api', () => ({
  get: vi.fn(),
  post: vi.fn(),
  postForm: vi.fn(),
}));

import { get, post, postForm } from '../services/api';
import useAdminComments from './useAdminComments';

const student1 = { id: 'u1', name: 'Alumna Uno', role: 'STUDENT' };
const student2 = { id: 'u3', name: 'Otra Alumna', role: 'STUDENT' };
const teacher = { id: 'u2', name: 'Profe', role: 'ADMIN' };
const lessonA = { id: 'l1', title: 'Lección A', course: { id: 'c1', title: 'Curso Uno' } };
const lessonB = { id: 'l2', title: 'Lección B', course: { id: 'c1', title: 'Curso Uno' } };

const q1 = { id: 'q1', message: 'Pregunta 1', user: student1, parentId: null, lesson: lessonA, createdAt: '2024-01-01T10:00:00.000Z' };
const q3 = { id: 'q3', message: 'Pregunta 3', user: student1, parentId: null, lesson: lessonA, createdAt: '2024-01-02T10:00:00.000Z' };
const q2 = { id: 'q2', message: 'Pregunta 2', user: student1, parentId: null, lesson: lessonB, createdAt: '2024-01-03T10:00:00.000Z' };
const r2 = { id: 'r2', message: 'Respuesta admin', user: teacher, parentId: 'q2', lesson: lessonB, createdAt: '2024-01-04T10:00:00.000Z' };
const q4 = { id: 'q4', message: 'Pregunta 4', user: student2, parentId: null, lesson: lessonA, createdAt: '2024-01-05T10:00:00.000Z' };

const allComments = [q1, q2, r2, q3, q4];

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useAdminComments', () => {
  it('fetches /admin/comments and exposes the raw items plus course options', async () => {
    get.mockResolvedValue(allComments);
    const { result } = renderHook(() => useAdminComments());

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(get).toHaveBeenCalledWith('/admin/comments'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.items).toEqual(allComments);
    expect(result.current.courseOptions).toEqual([{ id: 'c1', title: 'Curso Uno' }]);
    expect(result.current.filters).toEqual({ course: 'all', student: '' });
    expect(result.current.error).toBe(false);
  });

  it('partitions unanswered FIFO and answered reverse by createdAt', async () => {
    get.mockResolvedValue(allComments);
    const { result } = renderHook(() => useAdminComments());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.unanswered.map(({ q }) => q.id)).toEqual(['q1', 'q3', 'q4']);
    expect(result.current.answered.map(({ q }) => q.id)).toEqual(['q2']);
  });

  it('filters by course and by student name', async () => {
    get.mockResolvedValue(allComments);
    const { result } = renderHook(() => useAdminComments());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.setStudentFilter('Otra'));
    expect(result.current.unanswered.map(({ q }) => q.id)).toEqual(['q4']);
    expect(result.current.answered).toEqual([]);

    act(() => result.current.setStudentFilter(''));
    act(() => result.current.setCourseFilter('nope'));
    expect(result.current.unanswered).toEqual([]);
    expect(result.current.answered).toEqual([]);
  });

  it('sends a JSON reply and refreshes the list', async () => {
    get.mockResolvedValue(allComments);
    post.mockResolvedValue({ id: 'new' });
    const { result } = renderHook(() => useAdminComments());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.reply('l1', 'q1', 'Hola', null);
    });

    expect(post).toHaveBeenCalledWith('/lessons/l1/comments', { message: 'Hola', parentId: 'q1' });
    expect(postForm).not.toHaveBeenCalled();
    expect(get).toHaveBeenCalledTimes(2); // initial fetch + refresh
  });

  it('sends a FormData reply when an image file is present', async () => {
    get.mockResolvedValue(allComments);
    postForm.mockResolvedValue({ id: 'new' });
    const { result } = renderHook(() => useAdminComments());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const file = new File(['x'], 'a.jpg', { type: 'image/jpeg' });
    await act(async () => {
      await result.current.reply('l2', 'q2', 'Con imagen', file);
    });

    expect(post).not.toHaveBeenCalled();
    expect(postForm).toHaveBeenCalledWith('/lessons/l2/comments', expect.any(FormData));
    const formData = postForm.mock.calls[0][1];
    expect(formData.get('message')).toBe('Con imagen');
    expect(formData.get('parentId')).toBe('q2');
    expect(formData.get('image')).toBe(file);
    expect(get).toHaveBeenCalledTimes(2);
  });

  it('surfaces fetch errors in the error flag', async () => {
    get.mockRejectedValue(new Error('network'));
    const { result } = renderHook(() => useAdminComments());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe(true);
    expect(result.current.items).toEqual([]);
  });
});