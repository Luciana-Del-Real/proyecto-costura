// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

const mocks = vi.hoisted(() => ({ hookValue: null }));

vi.mock('../../hooks/useAdminComments', () => ({
  default: () => mocks.hookValue,
}));

vi.mock('../../context/DialogContext', () => ({
  useDialog: () => ({ alertDialog: vi.fn(), confirmDialog: vi.fn().mockResolvedValue(true) }),
}));

import ConsultasSection from './ConsultasSection';

const studentA = { id: 'u1', name: 'Alumna Uno', role: 'STUDENT' };
const studentB = { id: 'u3', name: 'Otra Alumna', role: 'STUDENT' };
const course = { id: 'c1', title: 'Curso Uno' };
const lesson = { id: 'l1', title: 'Lección A' };

const questionA = { id: 'q1', message: 'Pregunta A', user: studentA, parentId: null, createdAt: '2024-01-01T10:00:00.000Z' };
const questionB = { id: 'q2', message: 'Pregunta B', user: studentB, parentId: null, createdAt: '2024-01-02T10:00:00.000Z' };

function buildHookValue() {
  return {
    items: [questionA, questionB],
    filters: { course: 'all', student: '' },
    setCourseFilter: vi.fn(),
    setStudentFilter: vi.fn(),
    courseOptions: [{ id: 'c1', title: 'Curso Uno' }],
    unanswered: [
      { student: studentA, course, lesson, q: questionA },
      { student: studentB, course, lesson, q: questionB },
    ],
    answered: [],
    loading: false,
    error: false,
    reply: vi.fn(),
    refresh: vi.fn(),
  };
}

beforeEach(() => {
  mocks.hookValue = buildHookValue();
});

describe('ConsultasSection student grouping', () => {
  it('puts two different students in two different sections', () => {
    render(<ConsultasSection />);

    const sectionA = screen.getByTestId('consulta-student-u1');
    const sectionB = screen.getByTestId('consulta-student-u3');
    expect(sectionA).toBeTruthy();
    expect(sectionB).toBeTruthy();

    // Each student's question stays inside their own section (no mixing).
    expect(sectionA.textContent).toContain('Pregunta A');
    expect(sectionA.textContent).not.toContain('Pregunta B');
    expect(sectionB.textContent).toContain('Pregunta B');
    expect(sectionB.textContent).not.toContain('Pregunta A');

    expect(screen.getAllByText('Alumna Uno').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Otra Alumna').length).toBeGreaterThan(0);
  });
});
