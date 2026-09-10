import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  Optional,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { Principal, isOwnerOrAdmin } from '../common/principal';
import { Role } from '../common/enums';

/**
 * Fire-and-forget push dispatch seam (see design: "chokepoint injection").
 * Implementations map (userId, title, message, link) to a Web Push payload
 * (`{ title, body: message, data: { url: link } }`) and send one push per
 * recipient subscription. The dependency is OPTIONAL so existing direct
 * constructions (`new NotificationsService(prisma)`) keep compiling.
 */
export interface PushDispatcher {
  schedule(
    userId: string,
    title: string,
    message: string,
    link?: string,
  ): Promise<void>;
}

/**
 * DI token for `PushDispatcher`. The interface is a type alias erased at
 * runtime, so Nest cannot resolve it by type and needs an explicit token
 * (same lesson as VAPID_CONFIG in WU1).
 */
export const PUSH_DISPATCHER = 'PUSH_DISPATCHER';

/**
 * Optional localization metadata for a notification. `titleKey`/`messageKey`
 * are i18next keys (namespace included) and `params` their interpolation
 * values. Persisted alongside the Spanish `title`/`message` fallback so the
 * in-app bell can render in the viewer's language. Push dispatch deliberately
 * keeps using the Spanish text, so this is not part of the push payload.
 */
export interface NotificationTemplate {
  titleKey?: string;
  messageKey?: string;
  params?: Record<string, unknown>;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    @Optional()
    @Inject(PUSH_DISPATCHER)
    private readonly pushDispatcher?: PushDispatcher,
  ) {}

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
    link?: string,
    template?: NotificationTemplate,
  ) {
    const client = tx ?? this.prisma;
    const notification = await client.notification.create({
      data: {
        userId,
        title,
        message,
        read: false,
        ...(link ? { link } : {}),
        ...this.templateData(template),
      },
    });
    // Chokepoint: dispatch push after creation, deferred and fire-and-forget
    // (isolation contract — push can never break, delay or roll back creation).
    this.schedulePush(userId, title, message, link);
    return notification;
  }

  // Crea una notificación para cada ADMIN, dentro de la transacción del
  // llamador cuando se pasa un `tx` (mismo patrón que createNotification).
  // Devuelve cuántas notificaciones se crearon (nº de admins).
  async createNotificationsForAdmins(
    title: string,
    message: string,
    tx?: Prisma.TransactionClient,
    link?: string,
    template?: NotificationTemplate,
  ) {
    const client = tx ?? this.prisma;
    const admins = await client.user.findMany({
      where: { role: Role.ADMIN },
      select: { id: true },
    });
    for (const admin of admins) {
      await client.notification.create({
        data: {
          userId: admin.id,
          title,
          message,
          read: false,
          ...(link ? { link } : {}),
          ...this.templateData(template),
        },
      });
      // Admin fan-out: one deferred dispatch per created admin notification.
      this.schedulePush(admin.id, title, message, link);
    }
    return admins.length;
  }

  /**
   * Maps optional localization metadata to the notification create payload.
   * Absent fields are omitted so Spanish-only notifications keep their exact
   * stored shape (and payload assertions stay valid).
   */
  private templateData(template?: NotificationTemplate): {
    titleKey?: string;
    messageKey?: string;
    params?: Prisma.InputJsonValue;
  } {
    if (!template) {
      return {};
    }
    return {
      ...(template.titleKey ? { titleKey: template.titleKey } : {}),
      ...(template.messageKey ? { messageKey: template.messageKey } : {}),
      ...(template.params
        ? { params: template.params as Prisma.InputJsonValue }
        : {}),
    };
  }

  /**
   * Fire-and-forget push dispatch (isolation contract). setImmediate defers
   * the send past the caller's transaction commit — queueMicrotask could
   * precede it, and awaiting would block creation. Failures are logged and
   * swallowed, so send latency or errors can never reach the caller.
   */
  private schedulePush(
    userId: string,
    title: string,
    message: string,
    link?: string,
  ) {
    const dispatcher = this.pushDispatcher;
    if (!dispatcher) {
      return;
    }
    setImmediate(() => {
      void dispatcher.schedule(userId, title, message, link).catch((err) => {
        this.logger.error(`Push dispatch failed for user ${userId}`, err);
      });
    });
  }
}
