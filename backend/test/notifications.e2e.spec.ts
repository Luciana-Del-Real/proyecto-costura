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

/**
 * 5.3 — access-control-ownership spec over real HTTP (supertest):
 * notification read (`PATCH :id/read`) and delete (`DELETE :id`) return 403
 * for a non-owner, 200 for the owner, and 200 for an admin.
 *
 * Complements the PR 3 service-level specs (notifications.service.spec.ts) by
 * proving the status codes across the full HTTP stack with real JWTs.
 * DB-free: PrismaService is stubbed.
 */
describe('5.3 notification read/delete ownership (HTTP level)', () => {
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

  const notification = {
    id: 'n-1',
    userId: 'u-owner',
    title: 'Test',
    message: 'Hello',
    read: false,
  };

  const prismaMock = {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    user: {
      findUnique: jest.fn((args: any) => users[args.where.id] ?? null),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    notification: {
      findUnique: jest.fn((args: any) =>
        args.where.id === notification.id ? notification : null,
      ),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(() => ({ ...notification, read: true })),
      updateMany: jest.fn(),
      delete: jest.fn(() => notification),
      create: jest.fn(),
    },
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

  it('PATCH /notifications/:id/read returns 200 for the owner', async () => {
    const res = await request(app.getHttpServer())
      .patch('/api/notifications/n-1/read')
      .set('Authorization', bearer('u-owner'));

    expect(res.status).toBe(200);
    expect(res.body.read).toBe(true);
  });

  it('PATCH /notifications/:id/read returns 403 for a non-owner', async () => {
    const res = await request(app.getHttpServer())
      .patch('/api/notifications/n-1/read')
      .set('Authorization', bearer('u-other'));

    expect(res.status).toBe(403);
    expect(res.body.statusCode).toBe(403);
  });

  it('PATCH /notifications/:id/read returns 200 for an admin', async () => {
    const res = await request(app.getHttpServer())
      .patch('/api/notifications/n-1/read')
      .set('Authorization', bearer('u-admin'));

    expect(res.status).toBe(200);
    expect(res.body.read).toBe(true);
  });

  it('DELETE /notifications/:id returns 200 for the owner', async () => {
    const res = await request(app.getHttpServer())
      .delete('/api/notifications/n-1')
      .set('Authorization', bearer('u-owner'));

    expect(res.status).toBe(200);
    expect(res.body.id).toBe('n-1');
  });

  it('DELETE /notifications/:id returns 403 for a non-owner', async () => {
    const res = await request(app.getHttpServer())
      .delete('/api/notifications/n-1')
      .set('Authorization', bearer('u-other'));

    expect(res.status).toBe(403);
    expect(res.body.statusCode).toBe(403);
  });

  it('DELETE /notifications/:id returns 401 without a token', async () => {
    const res = await request(app.getHttpServer()).delete(
      '/api/notifications/n-1',
    );

    expect(res.status).toBe(401);
  });
});