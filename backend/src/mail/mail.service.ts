import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Usar require dinámico para evitar fallo de compilación si la dependencia no está instalada
let sgMail: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  sgMail = require('@sendgrid/mail');
} catch (e) {
  sgMail = null;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private from: string;

  constructor(private config: ConfigService) {
    const apiKey = this.config.get<string>('SENDGRID_API_KEY');
    this.from = this.config.get<string>('SENDGRID_FROM') || 'no-reply@example.com';
    if (!apiKey || !sgMail) {
      this.logger.warn('SENDGRID_API_KEY not set or @sendgrid/mail missing; emails will be skipped.');
    } else {
      sgMail.setApiKey(apiKey);
    }
  }

  async sendEmail(
    to: string,
    subject: string,
    html?: string,
    templateId?: string,
    dynamicTemplateData?: Record<string, any>,
  ) {
    const apiKey = this.config.get<string>('SENDGRID_API_KEY');
    if (!apiKey || !sgMail) {
      this.logger.warn(`Skipping sendEmail to ${to}: SENDGRID_API_KEY not configured or @sendgrid/mail not installed`);
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
      this.logger.debug(`Email sent to ${to}`);
    } catch (error) {
      this.logger.error('Error sending email', error as any);
      throw error;
    }
  }
}
