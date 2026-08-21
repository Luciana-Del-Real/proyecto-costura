import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

/**
 * 5.4 — profile-purchase-history spec: Profile renders the real backend
 * purchase history (non-empty list) and shows an empty state when there are
 * no purchases (no mock data).
 *
 * Node environment, no DOM: the component is rendered to a static markup
 * string with the context boundary mocked. Only APPROVED records are "real"
 * purchases, so pending-only histories must show the empty state too.
 */
const mocks = vi.hoisted(() => ({
  user: { id: 'u1', name: 'Ana', email: 'ana@test.local', country: 'AR' },
  purchaseRecords: [],
  purchasesLoading: false,
  purchasesError: null,
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: mocks.user, updateUser: vi.fn() }),
}));

vi.mock('../context/PurchaseContext', () => ({
  usePurchases: () => ({
    purchaseRecords: mocks.purchaseRecords,
    purchasesLoading: mocks.purchasesLoading,
    purchasesError: mocks.purchasesError,
  }),
}));

vi.mock('../utils/media', () => ({
  getImageUrl: (img) => (img ? `/uploads/${img}` : null),
}));

import Profile from './Profile';

describe('5.4 Profile purchase history', () => {
  beforeEach(() => {
    mocks.user = { id: 'u1', name: 'Ana', email: 'ana@test.local', country: 'AR' };
    mocks.purchaseRecords = [];
    mocks.purchasesLoading = false;
    mocks.purchasesError = null;
  });

  it('renders a non-empty list of real purchases from the backend', () => {
    mocks.purchaseRecords = [
      {
        id: 'p1',
        status: 'APPROVED',
        total: 12000,
        createdAt: '2026-08-01T10:00:00.000Z',
        course: { title: 'Curso de Corte y Confección', level: 'Inicial', image: 'corte.jpg', priceARS: 12000 },
      },
      {
        id: 'p2',
        status: 'APPROVED',
        total: 15000,
        createdAt: '2026-08-02T10:00:00.000Z',
        course: { title: 'Moldería Avanzada', level: 'Intermedio', image: 'molderia.jpg', priceARS: 15000 },
      },
    ];

    const html = renderToStaticMarkup(<Profile />);

    expect(html).toContain('Curso de Corte y Confección');
    expect(html).toContain('Moldería Avanzada');
    expect(html).toContain('Total invertido');
    expect(html).not.toContain('Todavía no realizaste ninguna compra.');
  });

  it('renders the empty state when the user has no purchases (no mock data)', () => {
    const html = renderToStaticMarkup(<Profile />);

    expect(html).toContain('Todavía no realizaste ninguna compra.');
    expect(html).not.toContain('Total invertido');
  });

  it('treats pending-only records as an empty history (only APPROVED purchases are real)', () => {
    mocks.purchaseRecords = [
      {
        id: 'p3',
        status: 'PENDING',
        total: 9000,
        course: { title: 'Curso Pendiente', level: 'Inicial' },
      },
    ];

    const html = renderToStaticMarkup(<Profile />);

    expect(html).toContain('Todavía no realizaste ninguna compra.');
    expect(html).not.toContain('Curso Pendiente');
  });
});