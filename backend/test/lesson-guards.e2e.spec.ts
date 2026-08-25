import 'reflect-metadata';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
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
 * 2026-08-24-functional-bugfixes design (archive) — lesson content paywall
 * over real HTTP (supertest):
 * - GET /lessons/:id and GET /courses/:courseId/lessons answer 401 without a
 *   JWT, 403 for learners without an APPROVED purchase, and 200 for an owner
 *   with an APPROVED purchase or for an ADMIN.
 * - The deny -> 403 / re-approve -> 200 flow is encoded end-to-end: an admin
 *   rejection flips the purchase status and immediately blocks the owner, and
 *   a later approval restores access.
 *
 * DB-free: PrismaService is stubbed with a mutable in-memory purchase store;
 * the paywall predicate (assertCourseAccess) reads status APPROVED +
 * deletedAt null from that store.
 */
describe('lesson content guards (HTTP level)', () => {
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

  const lesson = {
    id: 'l-1',
    title: 'Lección 1',
    description: 'First lesson',
    duration: 10,
    order: 1,
    videoUrl: 'https://example.com/l1.mp4',
    pdf: null,
    courseId: 'c-1',
    attachments: [],
  };

  const purchaseSeed: Record<string, PurchaseRow> = {
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
    'p-pending': {
      id: 'p-pending',
      userId: 'u-other',
      courseId: 'c-1',
      status: PurchaseStatus.PENDING,
      deletedAt: null,
      createdAt: new Date().toISOString(),
      total: 100,
    },
  };

  // Mutable store: reassigned in beforeEach so each test observes a clean
  // initial state while the reject/approve flow mutates rows in-place.
  let purchases: Record<string, PurchaseRow>;

  const prismaMock = {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    // approvePurchase runs its whole body inside $transaction; the
    // implementation is wired below (after the object literal) so the mock
    // can pass itself back as the tx client without a circular type
    // inference under ts-jest strict.
    $transaction: jest.fn(),
    user: {
      findUnique: jest.fn((args: any) => users[args.where.id] ?? null),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    course: {
      findUnique: jest.fn(() => course),
      findMany: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    lesson: {
      findUnique: jest.fn(() => lesson),
      findMany: jest.fn(() => [lesson]),
      update: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
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
    lessonProgress: {
      upsert: jest.fn((args: any) => ({
        userId: args.create.userId,
        lessonId: args.create.lessonId,
        completed: false,
      })),
      findMany: jest.fn(),
    },
    notification: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      create: jest.fn(() => ({ id: 'n-new' })),
    },
  };

  // Wire the transaction runner after the literal: pass the mock itself back
  // as the tx client so tx.purchase/tx.lesson/tx.lessonProgress and
  // NotificationsService.createNotification(..., tx) all resolve.
  prismaMock.$transaction.mockImplementation(async (fn: any) => fn(prismaMock));

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
  });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(ConfigService)
      .useValue(secretConfig)
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('/api');
    await app.init();
    jwt = app.get(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /lessons/l-1 returns 401 without a token', async () => {
    const res = await request(app.getHttpServer()).get('/api/lessons/l-1');

    expect(res.status).toBe(401);
  });

  it('GET /lessons/l-1 returns 403 for a learner with only a PENDING purchase', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/lessons/l-1')
      .set('Authorization', bearer('u-other'));

    expect(res.status).toBe(403);
    expect(res.body.statusCode).toBe(403);
  });

  it('GET /lessons/l-1 returns 200 for a learner with an APPROVED purchase', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/lessons/l-1')
      .set('Authorization', bearer('u-owner'));

    expect(res.status).toBe(200);
    expect(res.body.id).toBe('l-1');
  });

  it('GET /lessons/l-1 returns 200 for an admin', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/lessons/l-1')
      .set('Authorization', bearer('u-admin'));

    expect(res.status).toBe(200);
    expect(res.body.id).toBe('l-1');
  });

  it('GET /courses/c-1/lessons returns 401 without a token', async () => {
    const res = await request(app.getHttpServer()).get('/api/courses/c-1/lessons');

    expect(res.status).toBe(401);
  });

  it('GET /courses/c-1/lessons returns 200 with the lesson list for an approved owner', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/courses/c-1/lessons')
      .set('Authorization', bearer('u-owner'));

    expect(res.status).toBe(200);
    expect(res.body.lessons).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: 'l-1' })]),
    );
  });

  it('GET /courses/c-1/lessons returns 403 for a learner without an approved purchase', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/courses/c-1/lessons')
      .set('Authorization', bearer('u-other'));

    expect(res.status).toBe(403);
    expect(res.body.statusCode).toBe(403);
  });

  it('deny blocks content and re-approve restores it for the owner', async () => {
    // Approved -> owner can read the lesson.
    const before = await request(app.getHttpServer())
      .get('/api/lessons/l-1')
      .set('Authorization', bearer('u-owner'));
    expect(before.status).toBe(200);

    // Admin rejects -> store flips to REJECTED -> the guard blocks.
    const reject = await request(app.getHttpServer())
      .patch('/api/purchases/p-approved/reject')
      .set('Authorization', bearer('u-admin'));
    expect(reject.status).toBe(200);
    expect(purchases['p-approved'].status).toBe(PurchaseStatus.REJECTED);

    const denied = await request(app.getHttpServer())
      .get('/api/lessons/l-1')
      .set('Authorization', bearer('u-owner'));
    expect(denied.status).toBe(403);
    expect(denied.body.statusCode).toBe(403);

    // Admin re-approves -> store flips back to APPROVED -> access restored.
    const approve = await request(app.getHttpServer())
      .patch('/api/purchases/p-approved/approve')
      .set('Authorization', bearer('u-admin'));
    expect(approve.status).toBe(200);
    expect(purchases['p-approved'].status).toBe(PurchaseStatus.APPROVED);

    const restored = await request(app.getHttpServer())
      .get('/api/lessons/l-1')
      .set('Authorization', bearer('u-owner'));
    expect(restored.status).toBe(200);
    expect(restored.body.id).toBe('l-1');
  });
});