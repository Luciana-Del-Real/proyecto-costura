import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AttachmentsService } from '../attachments/attachments.service';
import { CreatePatternDto } from './dto/create-pattern.dto';
import { UpdatePatternDto } from './dto/update-pattern.dto';
import { PurchaseStatus } from '../common/enums';
import { Principal } from '../common/principal';

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

  // Catálogo público con acceso condicional: un patrón de pago SOLO expone
  // su PDF (archivo + attachments) a quien tiene la compra aprobada (o al
  // admin). Para el resto queda con el PDF oculto, y se agregan campos
  // auxiliares (esPago, hasAccess, purchaseStatus) para que el frontend
  // muestre el estado correcto (Gratis / De pago / Pendiente / Descargar).
  async findAllPublic(principal?: Principal) {
    const patterns = await this.prisma.pattern.findMany({
      orderBy: { createdAt: 'asc' },
      include: patternInclude,
    });
    const userId = principal?.id;
    const isAdmin = principal?.role === 'ADMIN';

    const owned = new Set<string>();
    const pending = new Set<string>();
    if (userId) {
      const purchases = await this.prisma.patternPurchase.findMany({
        where: { userId, deletedAt: null },
        select: { patternId: true, status: true },
      });
      for (const p of purchases) {
        if (p.status === PurchaseStatus.APPROVED) owned.add(p.patternId);
        else if (p.status === PurchaseStatus.PENDING) pending.add(p.patternId);
      }
    }

    return patterns.map((p) => {
      const esPago = p.precioARS > 0 || p.precioAUD > 0;
      const hasAccess = !esPago || isAdmin || owned.has(p.id);
      return {
        ...p,
        esPago,
        hasAccess,
        purchaseStatus: userId
          ? owned.has(p.id)
            ? PurchaseStatus.APPROVED
            : pending.has(p.id)
              ? PurchaseStatus.PENDING
              : null
          : null,
        archivo: hasAccess ? p.archivo : null,
        attachments: hasAccess ? p.attachments : [],
      };
    });
  }

  findAll() {
    return this.prisma.pattern.findMany({
      orderBy: { createdAt: 'asc' },
      include: patternInclude,
    });
  }

  // Detalle para la vista (checkout de patrón de pago y admin): mismo acceso
  // condicional que findAllPublic (el PDF de un patrón de pago solo se
  // expone con compra aprobada o siendo admin).
  async findOnePublic(id: string, principal?: Principal) {
    const pattern = await this.prisma.pattern.findUnique({
      where: { id },
      include: patternInclude,
    });
    if (!pattern) {
      throw new NotFoundException('Patrón no encontrado');
    }

    const userId = principal?.id;
    const isAdmin = principal?.role === 'ADMIN';
    let owned = false;
    let pending = false;
    if (userId && !isAdmin) {
      const purchase = await this.prisma.patternPurchase.findUnique({
        where: { userId_patternId: { userId, patternId: id } },
        select: { status: true },
      });
      owned = purchase?.status === PurchaseStatus.APPROVED;
      pending = purchase?.status === PurchaseStatus.PENDING;
    } else if (isAdmin) {
      owned = true;
    }

    const esPago = pattern.precioARS > 0 || pattern.precioAUD > 0;
    const hasAccess = !esPago || owned;
    return {
      ...pattern,
      esPago,
      hasAccess,
      purchaseStatus: userId
        ? owned
          ? PurchaseStatus.APPROVED
          : pending
            ? PurchaseStatus.PENDING
            : null
        : null,
      archivo: hasAccess ? pattern.archivo : null,
      attachments: hasAccess ? pattern.attachments : [],
    };
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