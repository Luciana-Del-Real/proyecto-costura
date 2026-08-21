/**
 * Jest configuration for the NestJS backend (costura-api).
 *
 * Uses ts-jest to compile TypeScript under the same strict compiler options as
 * `backend/tsconfig.json`, but without its `rootDir`/`include` restrictions so
 * test files living in `test/` can import modules from `src/`.
 */
/** @type {import('jest').Config} */
module.exports = {
  rootDir: '.',
  testEnvironment: 'node',
  moduleFileExtensions: ['js', 'json', 'ts'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: {
          module: 'commonjs',
          target: 'ES2022',
          lib: ['ES2022'],
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
          forceConsistentCasingInFileNames: true,
          resolveJsonModule: true,
          emitDecoratorMetadata: true,
          experimentalDecorators: true,
        },
      },
    ],
  },
  testMatch: ['<rootDir>/test/**/*.spec.ts'],
};
