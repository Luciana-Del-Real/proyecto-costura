import { ConfigService } from '@nestjs/config';

/**
 * VAPID credentials required to sign Web Push requests.
 * The private key MUST stay backend-only: it is never exposed through any
 * endpoint or bundled asset (see the VAPID Configuration Hygiene requirement).
 */
export type VapidConfig = {
  publicKey: string;
  privateKey: string;
  subject: string;
};

/** Injection token for the resolved VAPID configuration. */
export const VAPID_CONFIG = 'VAPID_CONFIG';

/**
 * Clearly-fake credentials used ONLY when running the test suite
 * (jest sets NODE_ENV=test). They keep the module graph bootable for specs
 * that override ConfigService, and are never used to actually send a push:
 * every web-push call is mocked in the test suite. The keypair below was
 * generated with `npx web-push generate-vapid-keys` and is throwaway — it is
 * NOT a production secret and must never be deployed as one.
 */
const TEST_VAPID: VapidConfig = {
  publicKey:
    'BNnpAj_Qmy-Bwi5Ri3SyLLtPzaFtjDulAwu8Bu74MvmDcPav_a0u7ZEq3nWZLN5LpLonVnAJwB29Muff7B_83gQ',
  privateKey: '-ANbh9x4vLG3ZmgPZpkytaw0qVnxZahxNOKzQ4V9DYQ',
  subject: 'mailto:push@test.local',
};

/**
 * Fail-fast loader for VAPID credentials, mirroring the JWT_SECRET pattern
 * (config/jwt.config.ts). The app MUST NOT boot in production with missing
 * or fallback VAPID keys: unsigned pushes would be rejected by push services.
 */
export function vapidConfig(config: ConfigService): VapidConfig {
  const publicKey = config.get<string>('VAPID_PUBLIC_KEY');
  const privateKey = config.get<string>('VAPID_PRIVATE_KEY');
  const subject = config.get<string>('VAPID_SUBJECT');

  if (publicKey && privateKey && subject) {
    return { publicKey, privateKey, subject };
  }

  if (process.env.NODE_ENV === 'test') {
    return TEST_VAPID;
  }

  throw new Error(
    'VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY and VAPID_SUBJECT environment variables must be set. ' +
      'Generate keys with `npx web-push generate-vapid-keys` and configure them in the backend .env file.',
  );
}