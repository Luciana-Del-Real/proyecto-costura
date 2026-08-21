import 'reflect-metadata';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { jwtConfig, jwtSecret } from '../src/config/jwt.config';

/**
 * 5.1 — auth-admin-security spec: "boot fails fast without JWT_SECRET,
 * succeeds with it".
 *
 * The fail-fast contract lives in `jwt.config.ts`: every boot path
 * (JwtModule.registerAsync factory and JwtStrategy constructor) resolves the
 * secret through `jwtSecret()`, which throws when the variable is missing or
 * blank.
 *
 * Determinism note: a real `ConfigService` reads `process.env` before its
 * internal values, and `ConfigModule.forRoot` pushes the backend `.env` file
 * into `process.env` at import time — so an in-memory `new ConfigService({})`
 * cannot represent an "absent" secret. The tests therefore inject minimal
 * config stubs that model exactly the two boot scenarios from the spec: a
 * config that yields no secret (fail fast) and one that yields one (boot).
 *
 * DB-free: PrismaService is replaced with a stub whose lifecycle hooks never
 * touch PostgreSQL.
 */
describe('5.1 JWT boot contract', () => {
  const emptyConfig = { get: () => undefined } as unknown as ConfigService;
  const secretConfig = {
    get: (key: string) =>
      ({ JWT_SECRET: 'test-secret', JWT_EXPIRATION: '1h' })[key] ?? undefined,
  } as unknown as ConfigService;

  it('jwtSecret fails fast when the config yields no JWT_SECRET', () => {
    expect(() => jwtSecret(emptyConfig)).toThrow(/JWT_SECRET/);
  });

  it('jwtSecret fails fast when JWT_SECRET is blank', () => {
    const blankConfig = {
      get: (key: string) => (key === 'JWT_SECRET' ? '   ' : undefined),
    } as unknown as ConfigService;
    expect(() => jwtSecret(blankConfig)).toThrow(/JWT_SECRET/);
  });

  it('jwtConfig returns the configured secret when set', () => {
    expect(jwtConfig(secretConfig)).toEqual({
      secret: 'test-secret',
      signOptions: { expiresIn: '1h' },
    });
  });

  it('boot fails fast when JWT_SECRET is absent (module graph rejects)', async () => {
    await expect(
      Test.createTestingModule({ imports: [AppModule] })
        .overrideProvider(ConfigService)
        .useValue(emptyConfig)
        .compile(),
    ).rejects.toThrow(/JWT_SECRET/);
  });

  it('boots the HTTP app with JWT_SECRET and guards protected routes', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(ConfigService)
      .useValue(secretConfig)
      .overrideProvider(PrismaService)
      .useValue({ $connect: jest.fn(), $disconnect: jest.fn() })
      .compile();

    const app = moduleRef.createNestApplication();
    app.setGlobalPrefix('/api');
    await app.init();

    // An unauthenticated request to a protected route answers 401: the app
    // booted, the JWT guard is wired, and no database was needed.
    await request(app.getHttpServer()).get('/api/users/u-1').expect(401);

    await app.close();
  });
});