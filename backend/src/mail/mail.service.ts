import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import sgMail from '@sendgrid/mail';

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
  }

  private isMailEnabled(): boolean {
    return this.config.get<string>('MAIL_ENABLED')?.trim().toLowerCase() === 'true';
  }

  async sendEmail(
    to: string,
    subject: string,
    html?: string,
    templateId?: string,
    dynamicTemplateData?: Record<string, any>,
  ) {
    if (!this.isMailEnabled()) {
      this.logger.log(
        `Email sending is disabled (MAIL_ENABLED is not "true"); skipping email to ${to} (subject: ${subject})`,
      );
      return;
    }

    const msg: any = {
      to,
      from: this.from,
      subject,
    };

    if (templateId) {
      msg.templateId = templateId;
      if (dynamicTemplateData) msg.dynamic_template_data = dynamicTemplateData;
    } else if (html) {
      msg.html = html;
    } else {
      msg.text = subject;
    }

    try {
      await sgMail.send(msg);
      this.logger.log(`Email sent to ${to} (subject: ${subject})`);
    } catch (error) {
      this.logger.error(
        `Error sending email to ${to} (subject: ${subject})`,
        error as any,
      );
      throw error;
    }
  }
}