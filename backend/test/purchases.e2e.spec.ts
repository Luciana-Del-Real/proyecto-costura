import 'reflect-metadata';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { NotificationsService } from '../src/notifications/notifications.service';
import { PurchasesService } from '../src/purchases/purchases.service';
import { Role, PurchaseStatus } from '../src/common/enums';

type UserRow = {
  id: string;
  email: string;
  name: string;
  role: Role;
  active: boolean;
  createdAt: string;
};

type PurchaseRow = {
  id: string;
  userId: string;
  courseId: string;
  status: PurchaseStatus;
  deletedAt: string | null;
  createdAt: string;
  total: number;
};

/**
 * 2026-08-24-functional-bugfixes design (archive) — approve/reject/re-approve
 * lifecycle + ownership over real HTTP (supertest):
 * - PATCH /purchases/:id/approve is admin-only (403 for ALUMNO), accepts
 *   PENDING|REJECTED, flips the store to APPROVED and emits the
 *   'Acceso desbloqueado' notification inside the transaction.
 * - PATCH /purchases/:id/reject is admin-only, accepts PENDING|APPROVED and
 *   emits NO notification.
 * - GET /purchases/:id is JWT-only with an owner-or-admin IDOR rule:
 *   200 for the owner and an admin, 403 for a foreign user, 401 anonymous,
 *   404 for an unknown id.
 *
 * DB-free: PrismaService is stubbed with a mutable in-memory purchase store so
 * status transitions are observable; NotificationsService is stubbed to assert
 * the notification contract without touching the DB.
 */
describe('purchase approve/reject/re-approve lifecycle + ownership (HTTP level)', () => {
  const users: Record<string, UserRow> = {
    'u-owner': {
      id: 'u-owner',
      email: 'owner@test.local',
      name: 'Owner',
      role: Role.ALUMNO,
      active: true,
      createdAt: new Date().toISOString(),
    },
    'u-other': {
      id: 'u-other',
      email: 'other@test.local',
      name: 'Other',
      role: Role.ALUMNO,
      active: true,
      createdAt: new Date().toISOString(),
    },
    'u-admin': {
      id: 'u-admin',
      email: 'admin@test.local',
      name: 'Admin',
      role: Role.ADMIN,
      active: true,
      createdAt: new Date().toISOString(),
    },
  };

  const course = {
    id: 'c-1',
    title: 'Curso de prueba',
    description: 'Test course',
    level: 'PRINCIPIANTE',
    priceARS: 100,
    priceAUD: 10,
    pdfGuide: null,
    attachments: [],
  };

  const lessons = [
    {
      id: 'l-1',
      title: 'Lección 1',
      description: 'First lesson',
      duration: 10,
      order: 1,
      videoUrl: 'https://example.com/l1.mp4',
      pdf: null,
      courseId: 'c-1',
      attachments: [],
    },
    {
      id: 'l-2',
      title: 'Lección 2',
      description: 'Second lesson',
      duration: 15,
      order: 2,
      videoUrl: 'https://example.com/l2.mp4',
      pdf: null,
      courseId: 'c-1',
      attachments: [],
    },
  ];

  const purchaseSeed: Record<string, PurchaseRow> = {
    'p-pending': {
      id: 'p-pending',
      userId: 'u-owner',
      courseId: 'c-1',
      status: PurchaseStatus.PENDING,
      deletedAt: null,
      createdAt: new Date().toISOString(),
      total: 100,
    },
    'p-approved': {
      id: 'p-approved',
      userId: 'u-owner',
      courseId: 'c-1',
      status: PurchaseStatus.APPROVED,
      deletedAt: null,
      createdAt: new Date().toISOString(),
      total: 100,
    },
    'p-rejected': {
      id: 'p-rejected',
      userId: 'u-owner',
      courseId: 'c-1',
      status: PurchaseStatus.REJECTED,
      deletedAt: null,
      createdAt: new Date().toISOString(),
      total: 100,
    },
    'p-foreign': {
      id: 'p-foreign',
      userId: 'u-other',
      courseId: 'c-1',
      status: PurchaseStatus.APPROVED,
      deletedAt: null,
      createdAt: new Date().toISOString(),
      total: 100,
    },
  };

  // Mutable store: reassigned in beforeEach so each test observes a clean
  // initial state while approve/reject flows mutate rows in-place.
  let purchases: Record<string, PurchaseRow>;

  const prismaMock = {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    // approvePurchase runs its whole body inside $transaction; the
    // implementation is wired below (after the object literal) so the mock
    // can pass itself back as the tx client without a circular type
    // inference under ts-jest strict.
    $transaction: jest.fn(),
    runInTransaction: jest.fn(),
    user: {
      findUnique: jest.fn((args: any) => users[args.where.id] ?? null),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    purchase: {
      findUnique: jest.fn((args: any) => {
        const row = purchases[args.where.id];
        return row ? { ...row, course, user: users[row.userId] } : null;
      }),
      findFirst: jest.fn((args: any) => {
        const w = args?.where ?? {};
        const row = Object.values(purchases).find(
          (p) =>
            (w.id === undefined || p.id === w.id) &&
            (w.userId === undefined || p.userId === w.userId) &&
            (w.courseId === undefined || p.courseId === w.courseId) &&
            (w.status === undefined || p.status === w.status) &&
            (w.deletedAt === undefined || p.deletedAt === null),
        );
        return row ? { ...row, course, user: users[row.userId] } : null;
      }),
      findMany: jest.fn(),
      update: jest.fn((args: any) => {
        const row = purchases[args.where.id];
        if (!row) return null;
        if (args.data?.status) row.status = args.data.status;
        return { ...row, course, user: users[row.userId] };
      }),
      create: jest.fn(),
      count: jest.fn(),
    },
    lesson: {
      findUnique: jest.fn(),
      findMany: jest.fn(() => lessons),
      update: jest.fn(),
      create: jest.fn(),
    },
    lessonProgress: {
      upsert: jest.fn((args: any) => ({
        userId: args.create.userId,
        lessonId: args.create.lessonId,
        completed: false,
      })),
      createMany: jest.fn(() => ({ count: 0 })),
      findMany: jest.fn(),
    },
    notification: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      create: jest.fn(),
    },
  };

  // Wire the transaction runner after the literal: pass the mock itself back
  // as the tx client so tx.purchase/tx.lesson/tx.lessonProgress and
  // NotificationsService.createNotification(..., tx) all resolve.
  prismaMock.runInTransaction.mockImplementation(async (fn: any) => fn(prismaMock));

  const notificationsStub = {
    createNotification: jest.fn().mockResolvedValue({ id: 'n-new' }),
  };

  // Deterministic boot config: models "JWT_SECRET is set" regardless of the
  // ambient process.env / .env (a real ConfigService reads process.env first).
  const secretConfig = {
    get: (key: string) => (key === 'JWT_SECRET' ? 'test-secret' : undefined),
  } as unknown as ConfigService;

  let app: INestApplication;
  let jwt: JwtService;

  const bearer = (id: string) =>
    `Bearer ${jwt.sign({
      sub: id,
      email: users[id].email,
      role: users[id].role,
    })}`;

  beforeEach(() => {
    purchases = JSON.parse(JSON.stringify(purchaseSeed));
    notificationsStub.createNotification.mockClear();
  });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(ConfigService)
      .useValue(secretConfig)
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .overrideProvider(NotificationsService)
      .useValue(notificationsStub)
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('/api');
    await app.init();
    jwt = app.get(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('PATCH /purchases/p-pending/approve returns 200 for an admin and unlocks access', async () => {
    const res = await request(app.getHttpServer())
      .patch('/api/purchases/p-pending/approve')
      .set('Authorization', bearer('u-admin'));

    expect(res.status).toBe(200);
    expect(res.body.status).toBe(PurchaseStatus.APPROVED);
    expect(purchases['p-pending'].status).toBe(PurchaseStatus.APPROVED);
    expect(notificationsStub.createNotification).toHaveBeenCalledWith(
      'u-owner',
      'Acceso desbloqueado',
      expect.stringContaining('aprobada'),
      expect.anything(), // tx client (the prisma mock, passed for atomicity)
      '/curso/c-1',
    );
  });

  it('PATCH /purchases/p-pending/approve returns 403 for a non-admin (ALUMNO)', async () => {
    const res = await request(app.getHttpServer())
      .patch('/api/purchases/p-pending/approve')
      .set('Authorization', bearer('u-owner'));

    expect(res.status).toBe(403);
    expect(res.body.statusCode).toBe(403);
  });

  it('PATCH /purchases/p-approved/approve returns 400 (already approved)', async () => {
    const res = await request(app.getHttpServer())
      .patch('/api/purchases/p-approved/approve')
      .set('Authorization', bearer('u-admin'));

    expect(res.status).toBe(400);
  });

  it('PATCH /purchases/p-rejected/approve returns 200 (re-approve restores)', async () => {
    const res = await request(app.getHttpServer())
      .patch('/api/purchases/p-rejected/approve')
      .set('Authorization', bearer('u-admin'));

    expect(res.status).toBe(200);
    expect(res.body.status).toBe(PurchaseStatus.APPROVED);
    expect(purchases['p-rejected'].status).toBe(PurchaseStatus.APPROVED);
  });

  it('PATCH /purchases/p-approved/reject returns 200 and emits NO notification', async () => {
    const res = await request(app.getHttpServer())
      .patch('/api/purchases/p-approved/reject')
      .set('Authorization', bearer('u-admin'));

    expect(res.status).toBe(200);
    expect(res.body.status).toBe(PurchaseStatus.REJECTED);
    expect(purchases['p-approved'].status).toBe(PurchaseStatus.REJECTED);
    expect(notificationsStub.createNotification).not.toHaveBeenCalled();
  });

  it('PATCH /purchases/p-rejected/reject returns 400 (already rejected)', async () => {
    const res = await request(app.getHttpServer())
      .patch('/api/purchases/p-rejected/reject')
      .set('Authorization', bearer('u-admin'));

    expect(res.status).toBe(400);
  });

  it('PATCH /purchases/p-foreign/reject returns 200 for an admin (may reject any)', async () => {
    const res = await request(app.getHttpServer())
      .patch('/api/purchases/p-foreign/reject')
      .set('Authorization', bearer('u-admin'));

    expect(res.status).toBe(200);
    expect(res.body.status).toBe(PurchaseStatus.REJECTED);
  });

  it('GET /purchases/p-approved returns 200 for the owner', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/purchases/p-approved')
      .set('Authorization', bearer('u-owner'));

    expect(res.status).toBe(200);
  });

  it('GET /purchases/p-approved returns 403 for a foreign user (IDOR closed)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/purchases/p-approved')
      .set('Authorization', bearer('u-other'));

    expect(res.status).toBe(403);
    expect(res.body.statusCode).toBe(403);
  });

  it('GET /purchases/p-approved returns 200 for an admin', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/purchases/p-approved')
      .set('Authorization', bearer('u-admin'));

    expect(res.status).toBe(200);
  });

  it('GET /purchases/p-approved returns 401 without a token', async () => {
    const res = await request(app.getHttpServer()).get('/api/purchases/p-approved');

    expect(res.status).toBe(401);
  });

  it('GET /purchases/nonexistent returns 404 for the owner', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/purchases/nonexistent')
      .set('Authorization', bearer('u-owner'));

    expect(res.status).toBe(404);
  });
});

/**
 * Mimics Prisma's `select` at the mock boundary: only the keys present in the
 * projection survive. A regression back to `course: true` returns the whole
 * fixture (pdfGuide included) and the assertions catch it.
 */
const projectWith = (row: Record<string, unknown>, select: unknown) => {
  if (!select || typeof select !== 'object') return row;
  return Object.fromEntries(
    Object.keys(select as Record<string, boolean>)
      .filter((key) => key in row)
      .map((key) => [key, row[key]]),
  );
};

/**
 * Paywall regression (task: paywall-pdf-leaks): no course purchase response may
 * carry `course.pdfGuide`, the paid PDF guide URL. Approved students get it
 * from the protected lessons endpoint (GET /courses/:id/lessons), which checks
 * `assertCourseAccess`.
 */
describe('PurchasesService (paywall PDF projection)', () => {
  const courseFixture = {
    id: 'c1',
    title: 'Curso de costura',
    description: 'Curso de ejemplo',
    longDescription: 'Descripción larga',
    image: '/uploads/courses/c1.jpg',
    pdfGuide: '/uploads/courses/guia.pdf',
    priceARS: 15000,
    priceAUD: 25,
    level: 'PRINCIPIANTE',
    instructor: 'Ana',
    duration: '4 semanas',
    featured: false,
    rating: 5,
    students: 3,
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
    attachments: [{ id: 'att1', url: '/uploads/courses/extra.pdf' }],
  };

  const mockPrisma = {
    course: { findUnique: jest.fn() },
    user: { findUnique: jest.fn() },
    purchase: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
    runInTransaction: jest.fn(),
  };

  let service: PurchasesService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.course.findUnique.mockResolvedValue(courseFixture);
    mockPrisma.user.findUnique.mockResolvedValue({
      country: 'ARS',
      name: 'Ana',
    });
    mockPrisma.purchase.findUnique.mockResolvedValue(null);
    mockPrisma.purchase.findMany.mockResolvedValue([]);
    mockPrisma.purchase.create.mockImplementation((args: any) => ({
      id: 'p1',
      userId: 'u1',
      courseId: 'c1',
      status: PurchaseStatus.PENDING,
      total: 15000,
      course: projectWith(courseFixture, args.include.course.select),
    }));
    mockPrisma.runInTransaction.mockImplementation((fn: any) => fn(mockPrisma));

    service = new PurchasesService(
      mockPrisma as unknown as PrismaService,
      { createNotificationsForAdmins: jest.fn() } as never,
    );
  });

  it('requestPurchase selects the course without pdfGuide', async () => {
    const result = await service.requestPurchase('u1', { courseId: 'c1' });

    const arg = mockPrisma.purchase.create.mock.calls[0][0];
    expect(arg.include.course.select).toEqual(
      expect.objectContaining({ id: true, title: true, priceARS: true }),
    );
    expect(arg.include.course.select).not.toHaveProperty('pdfGuide');
    expect(arg.include.course.select).not.toHaveProperty('attachments');

    expect(result.course).not.toHaveProperty('pdfGuide');
    expect(result.course.title).toBe('Curso de costura');
  });

  it('getUserPurchases selects the course without pdfGuide', async () => {
    mockPrisma.purchase.findMany.mockImplementation((args: any) => [
      {
        id: 'p1',
        userId: 'u1',
        courseId: 'c1',
        status: PurchaseStatus.APPROVED,
        total: 15000,
        course: projectWith(courseFixture, args.include.course.select),
      },
    ]);

    const result = await service.getUserPurchases('u1');

    const arg = mockPrisma.purchase.findMany.mock.calls[0][0];
    expect(arg.include.course.select).not.toHaveProperty('pdfGuide');
    expect(arg.include.course.select).not.toHaveProperty('attachments');

    expect(result[0].course).not.toHaveProperty('pdfGuide');
    expect(result[0].course.image).toBe('/uploads/courses/c1.jpg');
  });

  it('getPurchaseById selects the course without pdfGuide', async () => {
    mockPrisma.purchase.findFirst.mockImplementation((args: any) => ({
      id: 'p1',
      userId: 'u1',
      courseId: 'c1',
      status: PurchaseStatus.APPROVED,
      total: 15000,
      course: projectWith(courseFixture, args.include.course.select),
    }));

    const result = await service.getPurchaseById('p1', {
      id: 'u1',
      role: Role.ALUMNO,
    });

    const arg = mockPrisma.purchase.findFirst.mock.calls[0][0];
    expect(arg.include.course.select).not.toHaveProperty('pdfGuide');

    expect(result.course).not.toHaveProperty('pdfGuide');
    expect(result.course.title).toBe('Curso de costura');
  });

  it('admin listings project the course without pdfGuide', async () => {
    await service.getPendingRequests();
    await service.getAllPurchases();

    for (const call of mockPrisma.purchase.findMany.mock.calls) {
      expect(call[0].include.course.select).not.toHaveProperty('pdfGuide');
      expect(call[0].include.course.select).not.toHaveProperty('attachments');
    }
  });
});