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
 * 5.2 — access-control-ownership spec over real HTTP (supertest):
 * `GET users/:id` returns 200 for the owner and for an admin, and 403 for a
 * non-owner with no data leak.
 *
 * Complements the PR 3 service-level specs (users.service.spec.ts) by proving
 * the status codes across the full stack: real JWTs signed with the validated
 * secret, Passport JwtStrategy validation, the controller, and the service
 * boundary. DB-free: PrismaService is stubbed.
 */
describe('5.2 GET users/:id (HTTP level)', () => {
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

  const prismaMock = {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    user: {
      findUnique: jest.fn((args: any) => users[args.where.id] ?? null),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
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

  it('returns 200 with the profile when the owner reads their own id', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/users/u-owner')
      .set('Authorization', bearer('u-owner'));

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: 'u-owner', email: 'owner@test.local' });
  });

  it('returns 403 with no data leak when a non-owner reads another profile', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/users/u-owner')
      .set('Authorization', bearer('u-other'));

    expect(res.status).toBe(403);
    expect(res.body.statusCode).toBe(403);
    expect(res.body.id).toBeUndefined();
  });

  it('returns 200 when an admin reads any profile', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/users/u-other')
      .set('Authorization', bearer('u-admin'));

    expect(res.status).toBe(200);
    expect(res.body.id).toBe('u-other');
  });

  it('returns 401 without a token', async () => {
    const res = await request(app.getHttpServer()).get('/api/users/u-owner');

    expect(res.status).toBe(401);
  });
});