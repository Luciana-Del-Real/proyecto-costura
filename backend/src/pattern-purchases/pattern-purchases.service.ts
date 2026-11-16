import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PurchaseStatus } from '../common/enums';
import { NotificationsService } from '../notifications/notifications.service';

// Proyección segura del patrón dentro de una compra: solo metadata de catálogo.
// NUNCA `archivo` (URL pública del PDF de pago) ni `attachments`: el contenido
// se sirve únicamente por el endpoint del patrón, que valida `hasAccess`.
const purchasePatternSelect = {
  id: true,
  titulo: true,
  descripcion: true,
  nivel: true,
  categoria: true,
  imagen: true,
  precioARS: true,
  precioAUD: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} as const;

// Solicitudes de compra de patrones de pago, mismas reglas que las compras
// de cursos: la alumna solicita (PENDING), el admin aprueba (APPROVED) y se
// desbloquea el PDF; rechazar (REJECTED) es reversible.
@Injectable()
export class PatternPurchasesService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async requestPurchase(userId: string, patternId: string) {
    const pattern = await this.prisma.pattern.findUnique({
      where: { id: patternId },
    });
    if (!pattern) {
      throw new NotFoundException('Patrón no encontrado');
    }

    const esPago = pattern.precioARS > 0 || pattern.precioAUD > 0;
    if (!esPago) {
      throw new BadRequestException('Este patrón es gratis, no necesita compra');
    }

    const existing = await this.prisma.patternPurchase.findUnique({
      where: { userId_patternId: { userId, patternId } },
    });
    if (existing) {
      throw new BadRequestException('Ya solicitaste o compraste este patrón');
    }

    // Precio según la moneda de la compradora (igual que cursos).
    const buyer = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { country: true, name: true },
    });
    const total = buyer?.country === 'AUD' ? pattern.precioAUD : pattern.precioARS;

    // Solicitud + notificación a admins en la misma transacción (patrón de
    // compras de cursos).
    return this.prisma.runInTransaction(async (tx: Prisma.TransactionClient) => {
      const purchase = await tx.patternPurchase.create({
        data: {
          userId,
          patternId,
          status: PurchaseStatus.PENDING,
          total,
        },
        include: {
          pattern: { select: purchasePatternSelect },
          user: {
            select: { id: true, email: true, name: true, country: true },
          },
        },
      });

      await this.notificationsService.createNotificationsForAdmins(
        'Nueva solicitud de patrón',
        `La alumna ${buyer?.name ?? '...'} solicitó el patrón "${pattern.titulo}". Revisá la solicitud para darle acceso.`,
        tx,
        `/admin/solicitudes?highlight=${purchase.id}`,
      );

      return purchase;
    });
  }

  getPendingRequests() {
    return this.prisma.patternPurchase.findMany({
      where: { status: PurchaseStatus.PENDING, deletedAt: null },
      include: {
        pattern: { select: purchasePatternSelect },
        user: {
          select: { id: true, email: true, name: true, country: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  // Historial completo para el panel de ventas: mismas relaciones que las
  // pendientes, pero sin filtrar por estado (la página decide qué mostrar).
  getAllPurchases() {
    return this.prisma.patternPurchase.findMany({
      where: { deletedAt: null },
      include: {
        pattern: { select: purchasePatternSelect },
        user: {
          select: { id: true, email: true, name: true, country: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Historial de compras de patrones de una alumna: mismo criterio que el de
  // cursos (solo las suyas; el admin puede ver las de cualquiera).
  getUserPurchases(userId: string) {
    return this.prisma.patternPurchase.findMany({
      where: { userId, deletedAt: null },
      include: {
        pattern: { select: purchasePatternSelect },
        user: {
          select: { id: true, email: true, name: true, country: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approve(id: string) {
    return this.prisma.runInTransaction(async (tx: Prisma.TransactionClient) => {
      const purchase = await tx.patternPurchase.findUnique({
        where: { id },
        include: { pattern: { select: purchasePatternSelect }, user: true },
      });
      if (!purchase) {
        throw new NotFoundException('Solicitud de patrón no encontrada');
      }
      if (
        purchase.status !== PurchaseStatus.PENDING &&
        purchase.status !== PurchaseStatus.REJECTED
      ) {
        throw new BadRequestException(
          `No se puede aprobar una solicitud en estado ${purchase.status}`,
        );
      }

      const updated = await tx.patternPurchase.update({
        where: { id },
        data: { status: PurchaseStatus.APPROVED },
        include: { pattern: { select: purchasePatternSelect } },
      });

      await this.notificationsService.createNotification(
        purchase.userId,
        'Acceso desbloqueado',
        `Tu solicitud para el patrón "${purchase.pattern.titulo}" fue aprobada. Ya podés descargarlo.`,
        tx,
        '/patrones-gratis',
      );

      return updated;
    });
  }

  async reject(id: string) {
    const purchase = await this.prisma.patternPurchase.findUnique({
      where: { id },
    });
    if (!purchase) {
      throw new NotFoundException('Solicitud de patrón no encontrada');
    }
    if (
      purchase.status !== PurchaseStatus.PENDING &&
      purchase.status !== PurchaseStatus.APPROVED
    ) {
      throw new BadRequestException(
        `No se puede rechazar una solicitud en estado ${purchase.status}`,
      );
    }
    return this.prisma.patternPurchase.update({
      where: { id },
      data: { status: PurchaseStatus.REJECTED },
    });
  }
}