import 'reflect-metadata';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { Role } from '../src/common/enums';

type UserRow = {
  id: string;
  email: string;
  name: string;
  role: Role;
  active: boolean;
  createdAt: string;
};

type SubscriptionRow = {
  id: string;
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string | null;
};

/**
 * WU1 HTTP-level specs for POST/DELETE /api/push-subscriptions:
 * authenticated upsert returns 201; unauthenticated requests return 401;
 * DELETE returns 204 for the owner, 403 for a non-owner, and 404 when the
 * endpoint is absent. DB-free: PrismaService is stubbed with an in-memory map.
 */
describe('push-subscriptions endpoints (HTTP level)', () => {
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
  };

  const rows = new Map<string, SubscriptionRow>();
  let nextId = 1;

  const prismaMock = {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    user: {
      findUnique: jest.fn((args: any) => users[args.where.id] ?? null),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    pushSubscription: {
      upsert: jest.fn(({ where, update, create }: any) => {
        const existing = rows.get(where.endpoint);
        const row = existing ? { ...existing, ...update } : create;
        if (!existing) {
          row.id = `sub-${nextId++}`;
          row.createdAt = new Date().toISOString();
          row.updatedAt = new Date().toISOString();
        }
        rows.set(where.endpoint, row);
        return Promise.resolve(row);
      }),
      findUnique: jest.fn(({ where }: any) => rows.get(where.endpoint) ?? null),
      delete: jest.fn(({ where }: any) => {
        const row = rows.get(where.endpoint);
        rows.delete(where.endpoint);
        return Promise.resolve(row);
      }),
      findMany: jest.fn(),
    },
  };

  // Deterministic boot config: models "JWT_SECRET is set" regardless of the
  // ambient process.env / .env. VAPID keys fall back to test defaults under
  // NODE_ENV=test (see push-notifications/vapid.config.ts).
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

  const endpoint = 'https://push.example.com/device-1';
  const validPayload = {
    endpoint,
    keys: { p256dh: 'p256dh-key', auth: 'auth-secret' },
    userAgent: 'Mozilla/5.0',
  };

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

  beforeEach(() => {
    rows.clear();
  });

  it('POST /push-subscriptions returns 201 and stores the subscription', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/push-subscriptions')
      .set('Authorization', bearer('u-owner'))
      .send(validPayload);

    expect(res.status).toBe(201);
    expect(res.body.endpoint).toBe(endpoint);
    expect(res.body.userId).toBe('u-owner');
    expect(rows.get(endpoint)).toBeDefined();
  });

  it('POST /push-subscriptions upserts the same endpoint instead of duplicating', async () => {
    const first = await request(app.getHttpServer())
      .post('/api/push-subscriptions')
      .set('Authorization', bearer('u-owner'))
      .send(validPayload);
    const second = await request(app.getHttpServer())
      .post('/api/push-subscriptions')
      .set('Authorization', bearer('u-owner'))
      .send(validPayload);

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(rows.size).toBe(1);
  });

  it('POST /push-subscriptions returns 401 without a token', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/push-subscriptions')
      .send(validPayload);

    expect(res.status).toBe(401);
  });

  it('DELETE /push-subscriptions/:endpoint returns 204 for the owner', async () => {
    await request(app.getHttpServer())
      .post('/api/push-subscriptions')
      .set('Authorization', bearer('u-owner'))
      .send(validPayload);

    const res = await request(app.getHttpServer())
      .delete(`/api/push-subscriptions/${encodeURIComponent(endpoint)}`)
      .set('Authorization', bearer('u-owner'));

    expect(res.status).toBe(204);
    expect(rows.has(endpoint)).toBe(false);
  });

  it('DELETE /push-subscriptions/:endpoint returns 403 for a non-owner', async () => {
    await request(app.getHttpServer())
      .post('/api/push-subscriptions')
      .set('Authorization', bearer('u-owner'))
      .send(validPayload);

    const res = await request(app.getHttpServer())
      .delete(`/api/push-subscriptions/${encodeURIComponent(endpoint)}`)
      .set('Authorization', bearer('u-other'));

    expect(res.status).toBe(403);
    expect(res.body.statusCode).toBe(403);
    expect(rows.has(endpoint)).toBe(true);
  });

  it('DELETE /push-subscriptions/:endpoint returns 404 for an absent endpoint', async () => {
    const res = await request(app.getHttpServer())
      .delete(
        `/api/push-subscriptions/${encodeURIComponent('https://push.example.com/missing')}`,
      )
      .set('Authorization', bearer('u-owner'));

    expect(res.status).toBe(404);
    expect(res.body.statusCode).toBe(404);
  });

  it('DELETE /push-subscriptions/:endpoint returns 401 without a token', async () => {
    const res = await request(app.getHttpServer()).delete(
      `/api/push-subscriptions/${encodeURIComponent(endpoint)}`,
    );

    expect(res.status).toBe(401);
  });
});