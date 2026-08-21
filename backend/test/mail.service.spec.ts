import sgMail from '@sendgrid/mail';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../src/mail/mail.service';

/**
 * Focused tests for tasks 3.3 + 3.4 (mail-service spec):
 * `@sendgrid/mail` is a static dependency, sending is env-gated and OFF by
 * default, and send failures are logged and propagated (never swallowed).
 * SendGrid is mocked; no real emails are ever sent.
 */
jest.mock('@sendgrid/mail', () => ({
  __esModule: true,
  default: {
    setApiKey: jest.fn(),
    send: jest.fn(),
  },
}));

function makeConfig(overrides: Record<string, string | undefined> = {}) {
  const values: Record<string, string | undefined> = {
    SENDGRID_FROM: 'no-reply@example.com',
    MAIL_ENABLED: undefined,
    SENDGRID_API_KEY: undefined,
    ...overrides,
  };
  return {
    get: jest.fn((key: string) => values[key]),
  } as unknown as ConfigService;
}

describe('MailService (MAIL_ENABLED gate + loud failures)', () => {
  const sendMock = sgMail.send as jest.Mock;
  const setApiKeyMock = sgMail.setApiKey as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('is disabled by default: skips sending without throwing and logs the skip', async () => {
    const service = new MailService(makeConfig());

    await service.sendEmail('alumno@grow.com', 'Hola', '<p>Hola</p>');

    expect(sendMock).not.toHaveBeenCalled();
  });

  it('does not send when MAIL_ENABLED is an unexpected value', async () => {
    const service = new MailService(
      makeConfig({ MAIL_ENABLED: '1', SENDGRID_API_KEY: 'key' }),
    );

    await service.sendEmail('alumno@grow.com', 'Hola');

    expect(sendMock).not.toHaveBeenCalled();
  });

  it('sends and logs success when MAIL_ENABLED is true and the API key is set', async () => {
    sendMock.mockResolvedValue([{ statusCode: 202 }, {}]);
    const service = new MailService(
      makeConfig({ MAIL_ENABLED: 'true', SENDGRID_API_KEY: 'sg-key' }),
    );

    await expect(
      service.sendEmail('alumno@grow.com', 'Asunto', '<p>Body</p>'),
    ).resolves.toBeUndefined();

    expect(setApiKeyMock).toHaveBeenCalledWith('sg-key');
    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'alumno@grow.com', subject: 'Asunto' }),
    );
  });

  it('propagates send failures loudly when sending is enabled', async () => {
    sendMock.mockRejectedValue(new Error('SendGrid 500'));
    const service = new MailService(
      makeConfig({ MAIL_ENABLED: 'true', SENDGRID_API_KEY: 'sg-key' }),
    );

    await expect(
      service.sendEmail('alumno@grow.com', 'Asunto'),
    ).rejects.toThrow('SendGrid 500');
  });

  it('fails fast at construction when enabled without an API key', () => {
    expect(
      () => new MailService(makeConfig({ MAIL_ENABLED: 'true' })),
    ).toThrow(/SENDGRID_API_KEY/);
  });
});