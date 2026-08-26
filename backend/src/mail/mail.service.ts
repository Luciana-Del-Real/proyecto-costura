import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFileSync } from 'fs';
import { join } from 'path';
import sgMail from '@sendgrid/mail';
import { MailDataRequired } from '@sendgrid/helpers/classes/mail';

/**
 * Spanish-speaking countries, normalized (lowercase, no diacritics).
 * Used by resolveLocale to pick the reset-email language.
 */
const SPANISH_SPEAKING_COUNTRIES = new Set([
  'argentina', 'bolivia', 'chile', 'colombia', 'costa rica', 'cuba',
  'republica dominicana', 'ecuador', 'el salvador', 'guinea ecuatorial',
  'guatemala', 'honduras', 'mexico', 'nicaragua', 'panama', 'paraguay',
  'peru', 'espana', 'uruguay', 'venezuela',
]);

/** Currency codes used by the app as country aliases. */
const COUNTRY_CODE_TO_NAME: Record<string, string> = {
  ARS: 'argentina',
  AUD: 'australia',
};

/**
 * Resolves the email locale from a student's country value.
 * Accepts country names ("Argentina", "España") or the app's currency codes
 * ("ARS", "AUD"). Spanish-speaking countries resolve to `es`, everything else
 * to `en`, and a missing/blank country defaults to `es`.
 */
export function resolveLocale(country?: string | null): 'es' | 'en' {
  if (!country || !country.trim()) return 'es';

  const trimmed = country.trim();
  const code = COUNTRY_CODE_TO_NAME[trimmed.toUpperCase()];
  const normalized = (code ?? trimmed)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  return SPANISH_SPEAKING_COUNTRIES.has(normalized) ? 'es' : 'en';
}

/**
 * Transactional email delivery via SendGrid.
 *
 * Sending is env-gated and OFF by default: `MAIL_ENABLED` must be exactly
 * `true` for the service to attempt a send. Disabled sends are logged as
 * skipped; enabled sends that fail are logged and rethrown so callers can
 * never mistake a failed delivery for a successful one.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private from: string;
  private logoDataUri?: string;

  constructor(private config: ConfigService) {
    this.from =
      this.config.get<string>('SENDGRID_FROM') || 'no-reply@example.com';

    const apiKey = this.config.get<string>('SENDGRID_API_KEY');

    // Fail fast when the gate is open but the credential is missing:
    // misconfiguration must be loud, never silently hidden.
    if (this.isMailEnabled() && !apiKey) {
      throw new Error(
        'MAIL_ENABLED is set to true but SENDGRID_API_KEY is not set. ' +
          'Provide SENDGRID_API_KEY or disable MAIL_ENABLED.',
      );
    }

    if (apiKey) {
      sgMail.setApiKey(apiKey);
    }

    // Logo incrustado como data URI base64 directamente en el HTML del mail.
    // A diferencia de un attachment inline (cid:) o una URL remota, un data
    // URI viaja DENTRO del HTML: no depende de que el cliente de correo
    // cargue imágenes externas ni de autenticación del remitente (SPF/DKIM),
    // por lo que Gmail/Outlook lo muestran sin pedir "Mostrar imágenes".
    // Si el archivo no existe, el email se manda igual pero sin logo.
    try {
      const logoPath = join(__dirname, '..', '..', 'assets', 'logo.png');
      const logoBase64 = readFileSync(logoPath).toString('base64');
      this.logoDataUri = `data:image/png;base64,${logoBase64}`;
      this.logger.log('Logo cargado como data URI para los emails');
    } catch (err) {
      this.logger.warn(`Logo no disponible (${(err as Error).message})`);
    }
  }

  private isMailEnabled(): boolean {
    return this.config.get<string>('MAIL_ENABLED')?.trim().toLowerCase() === 'true';
  }

  /**
   * Reemplaza el marcador `cid:logo` del template por el data URI base64 del
   * logo. Si el logo no está disponible, elimina el <img> para no mostrar
   * una imagen rota.
   */
  private injectLogo(html: string): string {
    if (!this.logoDataUri) {
      return html.replace(/<img src="cid:logo"[^>]*>/g, '');
    }
    return html.replace(/src="cid:logo"/g, `src="${this.logoDataUri}"`);
  }

  async sendEmail(
    to: string,
    subject: string,
    html?: string,
    templateId?: string,
    dynamicTemplateData?: Record<string, unknown>,
  ) {
    if (!this.isMailEnabled()) {
      this.logger.log(
        `Email sending is disabled (MAIL_ENABLED is not "true"); skipping email to ${to} (subject: ${subject})`,
      );
      return;
    }

    const msg: MailDataRequired = templateId
      ? {
          to,
          from: this.from,
          subject,
          templateId,
          ...(dynamicTemplateData ? { dynamic_template_data: dynamicTemplateData } : {}),
        }
      : html
        ? {
            to,
            from: this.from,
            subject,
            // Reemplazar el marcador cid:logo por el data URI base64 incrustado
            // en el HTML (ver constructor). Si el logo no está disponible, se
            // quita el <img> para no dejar una imagen rota.
            html: `<meta charset="utf-8">${this.injectLogo(html)}`,
          }
        : { to, from: this.from, subject, text: subject };

    try {
      await sgMail.send(msg);
      this.logger.log(`Email sent to ${to} (subject: ${subject})`);
    } catch (error) {
      this.logger.error(
        `Error sending email to ${to} (subject: ${subject})`,
        error,
      );
      throw error;
    }
  }
}