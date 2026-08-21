import 'reflect-metadata';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * Smoke tests for the Jest + ts-jest + Supertest test runner.
 *
 * They intentionally avoid any database connection: `PrismaService` only calls
 * `$connect()` during `onModuleInit`, which `Test.compile()` does not trigger.
 * This keeps the suite green in CI without PostgreSQL.
 */
describe('AppModule smoke', () => {
  it('defines the application root module', () => {
    expect(AppModule).toBeDefined();
  });

  it('compiles the module graph without a database connection', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    expect(moduleRef.get(PrismaService)).toBeInstanceOf(PrismaService);

    await moduleRef.close();
  });
});
