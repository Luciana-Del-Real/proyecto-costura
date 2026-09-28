import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PurchaseStatus } from '../common/enums';
import { NotificationsService } from '../notifications/notifications.service';

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
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const purchase = await tx.patternPurchase.create({
        data: {
          userId,
          patternId,
          status: PurchaseStatus.PENDING,
          total,
        },
        include: {
          pattern: true,
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
        pattern: true,
        user: {
          select: { id: true, email: true, name: true, country: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async approve(id: string) {
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const purchase = await tx.patternPurchase.findUnique({
        where: { id },
        include: { pattern: true, user: true },
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
        include: { pattern: true },
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