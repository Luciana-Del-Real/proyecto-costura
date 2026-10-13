import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { extname } from 'path';

export type UploadableFile = {
  fieldname: string;
  originalname: string;
  mimetype?: string;
  buffer: Buffer;
};

/**
 * Durable object storage backed by Supabase Storage.
 *
 * Uploads go through the Storage REST API using Node's global `fetch` (no extra
 * dependency). The database stores the absolute public URL this service returns,
 * so uploaded files survive the ephemeral filesystem of the hosting platform.
 * When the credentials are missing the service fails loudly: there is no silent
 * fallback to the local disk.
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly supabaseUrl: string;
  private readonly serviceRoleKey: string;
  private readonly bucket: string;

  constructor(private readonly config: ConfigService) {
    this.supabaseUrl = (this.config.get<string>('SUPABASE_URL') ?? '')
      .trim()
      .replace(/\/+$/, '');
    this.serviceRoleKey = (
      this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    ).trim();
    this.bucket =
      (this.config.get<string>('SUPABASE_STORAGE_BUCKET') ?? '').trim() ||
      'uploads';
  }

  get isConfigured(): boolean {
    return Boolean(this.supabaseUrl && this.serviceRoleKey);
  }

  /**
   * Uploads a file and returns its absolute public URL. The object name is
   * generated here with the same scheme the old multer filenames used:
   * `<folder>/<fieldname>-<timestamp>-<random><ext>`.
   */
  async upload(folder: string, file: UploadableFile): Promise<string> {
    if (!this.isConfigured) {
      const message =
        'Supabase Storage no está configurado: faltan SUPABASE_URL y/o ' +
        'SUPABASE_SERVICE_ROLE_KEY. No se puede guardar el archivo.';
      this.logger.error(message);
      throw new Error(message);
    }

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const objectName = `${folder}/${file.fieldname}-${uniqueSuffix}${extname(
      file.originalname,
    )}`;
    const endpoint = `${this.supabaseUrl}/storage/v1/object/${this.bucket}/${objectName}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.serviceRoleKey}`,
        apikey: this.serviceRoleKey,
        'Content-Type': file.mimetype || 'application/octet-stream',
      },
      body: file.buffer,
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(
        `Supabase Storage rechazó la subida (${response.status}): ${detail}`,
      );
    }

    return `${this.supabaseUrl}/storage/v1/object/public/${this.bucket}/${objectName}`;
  }
}
