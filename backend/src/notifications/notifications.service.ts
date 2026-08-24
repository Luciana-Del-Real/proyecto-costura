import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { Principal, isOwnerOrAdmin } from '../common/principal';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async getUserNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, read: false },
    });
    return { unreadCount: count };
  }

  async markAsRead(notificationId: string, principal: Principal) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (!isOwnerOrAdmin(principal, notification.userId)) {
      throw new ForbiddenException(
        'Access denied. You can only manage your own notifications.',
      );
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }

  async deleteNotification(notificationId: string, principal: Principal) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (!isOwnerOrAdmin(principal, notification.userId)) {
      throw new ForbiddenException(
        'Access denied. You can only manage your own notifications.',
      );
    }

    return this.prisma.notification.delete({
      where: { id: notificationId },
    });
  }

  // Crea una notificación dentro de la transacción del llamador cuando se
  // pasa un `tx`, o contra el cliente global cuando no. Así los flujos que
  // combinan estado + notificación (ej. aprobación de compra) son atómicos.
  async createNotification(
    userId: string,
    title: string,
    message: string,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return client.notification.create({
      data: {
        userId,
        title,
        message,
        read: false,
      },
    });
  }
}
