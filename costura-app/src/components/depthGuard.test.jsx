import { describe, expect, it, vi, beforeAll, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

/**
 * Depth guard — "no box surface nested inside another box surface".
 *
 * Invariant (from the ui-flat-redesign verify report): a page root must be a
 * plain layout container, and box surfaces (the `card-glow`/`card-flat`
 * family) must never
 * appear inside another box surface. Nested boxes are the "card inside card"
 * visual regression this suite guards against.
 *
 * What counts as a BOX (surface): any div whose class string contains
 * `card-glow` or `card-flat` (this covers `card-glow`, `card-glow-soft`
 * and `card-flat`).
 *
 * What does NOT count as a box:
 *   - chips / pills / status badges        (spans with rounded-full)
 *   - progress bars and their tracks       (bg-gray-100 / bg-bg-soft rounded-full)
 *   - notification rows                    (<li> with border, e.g. NotificationsInbox)
 *   - input / select borders               (<input>/<select> elements)
 *   - plain layout containers              (max-w-* / px-* / py-* without card-glow)
 *   - transient alert banners              (bg-*-soft rounded-xl, e.g. the
 *     NotificationsInbox error state) — alerts are feedback, not layout nesting.
 *
 * Note: the NotificationsInbox ERROR state intentionally renders a card-flat
 * alert inside its card-flat panel; the views below exercise the normal list
 * state, which has no nested box.
 *
 * Each view is rendered to static markup (node env, no DOM) with its contexts
 * mocked, following the Profile.test.jsx pattern. Effects do not run, so pages
 * render their initial state: AdminUsers starts on an internal `loading` gate
 * that only effects can clear, so it is not covered here. AdminSales and
 * AdminRequests render their data-backed shells; the revenue chart needs an
 * effect-driven fetch and is exercised indirectly via the detail/summary boxes.
 *
 * Additionally, for pages that use the standard root container, the exact
 * duplicated class string `max-w-6xl mx-auto px-1 py-1` must appear exactly
 * once — this guards the Task 1 fix (nested duplicate page wrappers).
 */

const mocks = vi.hoisted(() => ({
  user: { id: 'u1', name: 'Ana', email: 'ana@test.local', country: 'AR', role: 'USER' },
  courses: [],
  purchases: [],
  pendingPurchases: [],
  purchaseRecords: [],
  getAllPurchases: async () => [],
  getPendingRequests: async () => [],
  getProgress: () => 0,
  isFavorite: () => false,
  notifications: [],
  unreadCount: 0,
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: mocks.user, updateUser: vi.fn() }),
}));

vi.mock('../context/PurchaseContext', () => ({
  usePurchases: () => ({
    purchaseRecords: mocks.purchaseRecords,
    purchases: mocks.purchases,
    pendingPurchases: mocks.pendingPurchases,
    purchasesLoading: false,
    purchasesError: null,
    hasCourse: (id) => mocks.purchases.includes(id),
    isPending: (id) => mocks.pendingPurchases.includes(id),
    requestPurchase: vi.fn(),
    approvePurchase: vi.fn(),
    denyPurchase: vi.fn(),
    getAllPurchases: mocks.getAllPurchases,
    getPendingRequests: mocks.getPendingRequests,
  }),
}));

vi.mock('../context/CourseCatalogContext', () => ({
  useCourseCatalog: () => ({ courses: mocks.courses, addCourse: vi.fn(), updateCourse: vi.fn() }),
}));

vi.mock('../context/ProgressContext', () => ({
  useProgress: () => ({ getProgress: mocks.getProgress }),
}));

vi.mock('../context/FavoritesContext', () => ({
  useFavorites: () => ({ isFavorite: mocks.isFavorite, toggleFavorite: vi.fn() }),
}));

vi.mock('../context/DialogContext', () => ({
  useDialog: () => ({ confirmDialog: vi.fn(), alertDialog: vi.fn() }),
}));

vi.mock('../context/NotificationsContext', () => ({
  useNotifications: () => ({
    notifications: mocks.notifications,
    unreadCount: mocks.unreadCount,
    notificationsLoading: false,
    notificationsError: null,
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
    deleteNotification: vi.fn(),
  }),
}));

vi.mock('../utils/media', () => ({
  getImageUrl: (img) => (img ? `/uploads/${img}` : null),
}));

vi.mock('../services/api', () => ({
  API_BASE_URL: 'http://localhost:3000/api',
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  del: vi.fn(),
  postForm: vi.fn(),
  putForm: vi.fn(),
  downloadFile: vi.fn(),
}));

import Profile from '../pages/Profile';
import MyCourses from '../pages/MyCourses';
import Dashboard from '../pages/Dashboard';
import Checkout from '../pages/Checkout';
import AdminSales from '../pages/admin/AdminSales';
import AdminRequests from '../pages/admin/AdminRequests';
import AdminCourseForm from '../pages/admin/AdminCourseForm';
import CourseCard from './CourseCard';
import NotificationsInbox from './NotificationsInbox';

// Dashboard renders WelcomeToast, which reads sessionStorage on first render.
beforeAll(() => {
  globalThis.sessionStorage = { getItem: () => null, removeItem: () => {}, setItem: () => {} };
});

beforeEach(() => {
  mocks.user = { id: 'u1', name: 'Ana', email: 'ana@test.local', country: 'AR', role: 'USER' };
  mocks.courses = [];
  mocks.purchases = [];
  mocks.pendingPurchases = [];
  mocks.purchaseRecords = [];
  mocks.getAllPurchases = async () => [];
  mocks.getPendingRequests = async () => [];
  mocks.getProgress = () => 0;
  mocks.isFavorite = () => false;
  mocks.notifications = [];
  mocks.unreadCount = 0;
});

const BOX_TOKENS = ['card-glow', 'card-flat', 'card-glow-fixed'];
// Exact class string of the page root container (Task 1 regression target).
const PAGE_ROOT_TOKEN = 'max-w-6xl mx-auto px-1 py-1';

/**
 * Returns the opening tags of box divs that are nested inside another box div.
 * Tracks the div open/close stack (React always emits paired <div>...</div>)
 * and flags any box div opened while a box div is still open above it.
 */
function findNestedBoxes(html, tokens = BOX_TOKENS) {
  const tagRe = /<\/?div\b[^>]*>/g;
  const stack = [];
  const violations = [];
  let m;
  while ((m = tagRe.exec(html)) !== null) {
    const tag = m[0];
    if (tag.startsWith('</')) {
      stack.pop();
    } else {
      const isBox = tokens.some((t) => tag.includes(t));
      if (isBox && stack.includes(true)) violations.push(tag);
      stack.push(isBox);
    }
  }
  return violations;
}

function countRootContainers(html) {
  return html.split(PAGE_ROOT_TOKEN).length - 1;
}

function expectNoNestedBoxes(html, label) {
  const violations = findNestedBoxes(html);
  expect(violations, `${label} must not nest a box surface inside another box surface`).toEqual([]);
}

const course = (id, overrides = {}) => ({
  id,
  title: `Curso ${id}`,
  description: 'Descripción del curso',
  image: 'portada.jpg',
  instructor: 'Daiana',
  level: 'Inicial',
  priceARS: 12000,
  priceAUD: 120,
  lessons: [
    { id: 'l1', title: 'Lección 1', duration: '10 min' },
    { id: 'l2', title: 'Lección 2', duration: '12 min' },
  ],
  ...overrides,
});

describe('depth guard: no box surface nested inside another box surface', () => {
  it('Profile keeps a single root container and one personal-info box', () => {
    mocks.purchaseRecords = [
      {
        id: 'p1',
        status: 'APPROVED',
        total: 12000,
        createdAt: '2026-08-01T10:00:00.000Z',
        course: { title: 'Corte y Confección', level: 'Inicial', image: 'corte.jpg', priceARS: 12000 },
      },
    ];

    const html = renderToStaticMarkup(<Profile />);

    expect(html).toContain('card-flat');
    expect(countRootContainers(html)).toBe(1);
    expectNoNestedBoxes(html, 'Profile');
  });

  it('MyCourses keeps one root container with course and notifications boxes as siblings', () => {
    mocks.courses = [course('c1')];
    mocks.purchases = ['c1'];
    mocks.getProgress = () => 42;

    const html = renderToStaticMarkup(
      <MemoryRouter>
        <MyCourses />
      </MemoryRouter>,
    );

    expect(html).toContain('card-flat');
    expect(html).toContain('Mis cursos');
    expect(countRootContainers(html)).toBe(1);
    expectNoNestedBoxes(html, 'MyCourses');
  });

  it('Dashboard keeps one root container with only sibling course cards', () => {
    mocks.courses = [course('c1'), course('c2', { id: 'c2', title: 'Moldería' })];
    mocks.purchases = ['c1'];

    const html = renderToStaticMarkup(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>,
    );

    // Con compras, el Dashboard muestra SOLO "Mis cursos" (sin sugerencias)
    expect(html).toContain('card-glow');
    expect(html).toContain('Mis cursos');
    expect(html).not.toContain('Moldería');
    expect(countRootContainers(html)).toBe(1);
    expectNoNestedBoxes(html, 'Dashboard');
  });

  it('Checkout renders the order summary as a single box (form state)', () => {
    mocks.courses = [course('c1')];

    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/checkout/c1']}>
        <Routes>
          <Route path="/checkout/:id" element={<Checkout />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(html).toContain('card-glow');
    expect(html).toContain('Resumen del pedido');
    expectNoNestedBoxes(html, 'Checkout');
  });

  it('AdminSales renders summary and detail boxes as siblings', () => {
    mocks.courses = [course('c1')];

    const html = renderToStaticMarkup(<AdminSales />);

    expect(html).toContain('card-flat');
    expect(html).toContain('Ingresos totales');
    expect(countRootContainers(html)).toBe(1);
    expectNoNestedBoxes(html, 'AdminSales');
  });

  it('AdminRequests keeps one root container and a single requests box', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/admin/solicitudes']}>
        <AdminRequests />
      </MemoryRouter>,
    );

    expect(html).toContain('card-flat');
    expect(html).toContain('Solicitudes pendientes');
    expect(countRootContainers(html)).toBe(1);
    expectNoNestedBoxes(html, 'AdminRequests');
  });

  it('AdminCourseForm (create mode) renders a single form box', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/admin/courses/new']}>
        <AdminCourseForm />
      </MemoryRouter>,
    );

    expect(html).toContain('card-flat');
    expect(html).toContain('Nuevo curso');
    expectNoNestedBoxes(html, 'AdminCourseForm');
  });

  it('CourseCard renders a single surface even with the progress panel', () => {
    mocks.purchases = ['c1'];
    mocks.getProgress = () => 45;

    const html = renderToStaticMarkup(
      <MemoryRouter>
        <CourseCard course={course('c1')} />
      </MemoryRouter>,
    );

    expect(html).toContain('card-glow');
    expect(html).toContain('45%');
    expectNoNestedBoxes(html, 'CourseCard');
  });

  it('NotificationsInbox renders list rows without nested boxes', () => {
    mocks.notifications = [
      { id: 'n1', title: 'Aprobada', message: 'Tu curso fue aprobado', createdAt: '2026-08-01T10:00:00.000Z', read: false },
      { id: 'n2', title: 'Bienvenida', message: 'Hola', createdAt: '2026-08-01T10:00:00.000Z', read: true },
    ];
    mocks.unreadCount = 1;

    const html = renderToStaticMarkup(<NotificationsInbox />);

    expect(html).toContain('card-flat');
    expect(html).toContain('Aprobada');
    expectNoNestedBoxes(html, 'NotificationsInbox');
  });
});