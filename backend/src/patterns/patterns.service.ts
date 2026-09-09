import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AttachmentsService } from '../attachments/attachments.service';
import { CreatePatternDto } from './dto/create-pattern.dto';
import { UpdatePatternDto } from './dto/update-pattern.dto';

const patternInclude = {
  // PDFs adicionales del patrón; el PDF principal queda en `archivo`.
  attachments: { orderBy: { createdAt: 'asc' } },
} as const;

@Injectable()
export class PatternsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly attachmentsService: AttachmentsService,
  ) {}

  findAll() {
    return this.prisma.pattern.findMany({
      orderBy: { createdAt: 'asc' },
      include: patternInclude,
    });
  }

  async findOne(id: string) {
    const pattern = await this.prisma.pattern.findUnique({
      where: { id },
      include: patternInclude,
    });
    if (!pattern) {
      throw new NotFoundException('Patrón no encontrado');
    }
    return pattern;
  }

  create(dto: CreatePatternDto) {
    return this.prisma.pattern.create({
      data: {
        ...dto,
        // El controller garantiza que archivo está seteado antes de llegar acá
        // (BadRequestException si no viene el PDF en el POST).
        archivo: dto.archivo as string,
      },
    });
  }

  // Solo pisa imagen/archivo si vienen en el DTO; si el campo llega
  // undefined, Prisma conserva el valor existente.
  update(id: string, dto: UpdatePatternDto) {
    return this.prisma.pattern.update({
      where: { id },
      data: { ...dto },
    });
  }

  // Consistente con courses: borra la fila pero NO los archivos del disco.
  async delete(id: string) {
    await this.findOne(id);
    return this.prisma.pattern.delete({
      where: { id },
      select: { id: true, titulo: true },
    });
  }

  addAttachments(patternId: string, files: Express.Multer.File[]) {
    return this.attachmentsService.createManyForPattern(patternId, files);
  }

  // Elimina SOLO adjuntos que pertenezcan a este patrón: verifica la
  // propiedad antes de borrar, a diferencia del DELETE /attachments/:id
  // genérico que usan cursos/lecciones. El borrado físico del archivo lo
  // delega en AttachmentsService (misma lógica que cursos y lecciones).
  async deleteAttachment(patternId: string, attachmentId: string) {
    const attachment = await this.prisma.attachment.findUnique({
      where: { id: attachmentId },
    });
    if (!attachment || attachment.patternId !== patternId) {
      throw new NotFoundException('Adjunto no encontrado');
    }
    return this.attachmentsService.delete(attachmentId);
  }

  // Borra el PDF principal (`archivo`) de un patrón. El patrón queda sin PDF
  // principal (solo attachments si los tiene). No toca archivos del disco,
  // consistente con el resto del módulo.
  async deletePrimaryPdf(patternId: string) {
    const pattern = await this.findOne(patternId);
    if (!pattern.archivo) {
      throw new NotFoundException('El patrón no tiene PDF principal');
    }
    return this.prisma.pattern.update({
      where: { id: patternId },
      data: { archivo: null },
    });
  }
}