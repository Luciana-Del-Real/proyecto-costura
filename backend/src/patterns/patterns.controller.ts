import { Controller, Get, Post, Put, Delete, Body, Param, Request, UseGuards, UseInterceptors, UploadedFiles, BadRequestException, Logger } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { mkdirSync } from 'fs';
import { PatternsService } from './patterns.service';
import { CreatePatternDto } from './dto/create-pattern.dto';
import { UpdatePatternDto } from './dto/update-pattern.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt.guard';
import { Principal } from '../common/principal';
import { NotificationsService } from '../notifications/notifications.service';

const uploadsDir = './uploads/patterns';
mkdirSync(uploadsDir, { recursive: true });

const storageOptions = {
  storage: diskStorage({
    destination: uploadsDir,
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`);
    },
  }),
};

// - imagen: portada (1 sola)
// - archivo: PDF principal del patrón, se mantiene por compatibilidad con la
//   galería pública (1 solo). El frontend ya no lo manda: unifica todo en `pdfs`.
// - pdfs: PDFs del patrón (múltiples). El primero se guarda como `archivo`
//   (PDF principal) y el resto como attachments.
const patternFileFields = FileFieldsInterceptor([
  { name: 'imagen', maxCount: 1 },
  { name: 'archivo', maxCount: 1 },
  { name: 'pdfs', maxCount: 10 },
], storageOptions);

type PatternFiles = {
  imagen?: Express.Multer.File[];
  archivo?: Express.Multer.File[];
  pdfs?: Express.Multer.File[];
};

// Separa los PDFs recibidos en [principal, adicionales]: el primer archivo
// (ya sea de `archivo` o de `pdfs`) es el PDF principal y el resto van como
// attachments. Devuelve el path del principal y la lista de adicionales.
function splitPdfs(files: PatternFiles): { archivoPath?: string; extraPdfs: Express.Multer.File[] } {
  const pdfs = files?.pdfs ?? [];
  if (files?.archivo?.length) {
    return {
      archivoPath: `/uploads/patterns/${files.archivo[0].filename}`,
      extraPdfs: pdfs,
    };
  }
  if (pdfs.length) {
    return {
      archivoPath: `/uploads/patterns/${pdfs[0].filename}`,
      extraPdfs: pdfs.slice(1),
    };
  }
  return { extraPdfs: [] };
}

@Controller('patterns')
export class PatternsController {
  private readonly logger = new Logger(PatternsController.name);

  constructor(
    private readonly patternsService: PatternsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // Público: el catálogo de patrones no requiere sesión (el PDF de patrones
  // de pago se oculta hasta que la alumna tenga la compra aprobada).
  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  findAll(@Request() req: { user?: Principal }) {
    return this.patternsService.findAllPublic(req.user);
  }

  // Detalle público con acceso condicional (el checkout de un patrón de pago
  // no expone el PDF; el admin sí lo ve completo para editar).
  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  findOne(@Param('id') id: string, @Request() req: { user?: Principal }) {
    return this.patternsService.findOnePublic(id, req.user);
  }

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @UseInterceptors(patternFileFields)
  async create(@Body() dto: CreatePatternDto, @UploadedFiles() files: PatternFiles) {
    const { archivoPath, extraPdfs } = splitPdfs(files);
    if (!archivoPath) {
      throw new BadRequestException('El archivo PDF es obligatorio');
    }
    if (files?.imagen) dto.imagen = `/uploads/patterns/${files.imagen[0].filename}`;
    dto.archivo = archivoPath;

    const pattern = await this.patternsService.create(dto);

    if (extraPdfs.length) {
      await this.patternsService.addAttachments(pattern.id, extraPdfs);
    }

    // Avisa a todas las alumnas del patrón nuevo. La notificación nunca debe
    // romper la creación: si falla, se loguea y la creación sigue. El mensaje
    // distingue patrón gratuito vs patrón de pago.
    try {
      const esPago = (pattern.precioARS ?? 0) > 0 || (pattern.precioAUD ?? 0) > 0;
      await this.notificationsService.createNotificationsForStudents(
        esPago ? 'Nuevo patrón de pago' : 'Nuevo patrón gratis',
        `${pattern.titulo} ya está disponible en Patrones. ¡${esPago ? 'Conocelo' : 'Descargalo'}!`,
        undefined,
        '/patrones-gratis',
      );
    } catch (err) {
      this.logger.warn('No se pudo notificar a las alumnas del nuevo patrón', err);
    }

    return this.patternsService.findOne(pattern.id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @UseInterceptors(patternFileFields)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePatternDto,
    @UploadedFiles() files: PatternFiles,
  ) {
    if (files?.imagen) dto.imagen = `/uploads/patterns/${files.imagen[0].filename}`;
    // En edición, el PDF principal NO se reemplaza con los nuevos: los pdfs
    // subidos se agregan como attachments adicionales. Para cambiar el
    // principal se usa el campo legacy `archivo` (el frontend actual no lo
    // manda; conserva el principal existente).
    if (files?.archivo?.length) dto.archivo = `/uploads/patterns/${files.archivo[0].filename}`;

    await this.patternsService.update(id, dto);

    const extraPdfs = files?.pdfs ?? [];
    if (extraPdfs.length) {
      await this.patternsService.addAttachments(id, extraPdfs);
    }

    return this.patternsService.findOne(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  delete(@Param('id') id: string) {
    return this.patternsService.delete(id);
  }

  // Scoped al patrón: solo se puede borrar un adjunto que realmente le
  // pertenezca (más seguro que el DELETE /attachments/:id genérico, que
  // usan cursos/lecciones y no verifica pertenencia).
  @Delete(':id/attachments/:attachmentId')
  @UseGuards(JwtAuthGuard, AdminGuard)
  deleteAttachment(@Param('id') id: string, @Param('attachmentId') attachmentId: string) {
    return this.patternsService.deleteAttachment(id, attachmentId);
  }

  // Borra el PDF principal del patrón (archivo). Permite dejar un patrón
  // sin PDF principal; los patrones actuales son datos de prueba.
  @Delete(':id/archivo')
  @UseGuards(JwtAuthGuard, AdminGuard)
  deletePrimaryPdf(@Param('id') id: string) {
    return this.patternsService.deletePrimaryPdf(id);
  }
}