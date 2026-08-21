import { ConfigService } from '@nestjs/config';

/**
 * Single fail-fast source of truth for the JWT signing secret.
 *
 * The app MUST NOT boot with an empty, missing, or fallback secret: a publicly
 * known signing key would allow forging tokens. Every consumer (JwtModule,
 * JwtStrategy, reset-token HMAC) resolves the secret through this helper so the
 * value is validated once, at startup.
 */
export function jwtSecret(config: ConfigService): string {
  const secret = config.get<string>('JWT_SECRET');
  if (!secret || secret.trim().length === 0) {
    throw new Error(
      'JWT_SECRET environment variable is not set. Refusing to boot with an empty or insecure default secret. ' +
        'Set a strong JWT_SECRET in the backend .env file before starting the API.',
    );
  }
  return secret;
}

/**
 * Full options object for JwtModule.registerAsync, reusing the validated secret.
 */
export function jwtConfig(config: ConfigService) {
  return {
    secret: jwtSecret(config),
    signOptions: {
      expiresIn: config.get<string>('JWT_EXPIRATION') || '24h',
    },
  };
}
