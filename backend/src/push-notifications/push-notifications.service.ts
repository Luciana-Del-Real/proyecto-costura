import {
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import * as webpush from 'web-push';
import { PrismaService } from '../prisma/prisma.service';
import { Principal, isOwnerOrAdmin } from '../common/principal';
import { VAPID_CONFIG, VapidConfig } from './vapid.config';
import { CreatePushSubscriptionDto } from './dtos/create-push-subscription.dto';

/** Payload delivered to a device; the service worker maps `data.url` to a click target. */
export type PushPayload = {
  title: string;
  body: string;
  data?: { url?: string };
};

type StoredSubscription = {
  id: string;
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

/**
 * A push endpoint is considered expired when the push service answers 404
 * (unknown endpoint) or 410 (gone). The row must be pruned and fan-out must
 * continue with the remaining targets.
 */
function isExpiredSubscription(err: unknown): boolean {
  const statusCode = (err as { statusCode?: number }).statusCode;
  return statusCode === 404 || statusCode === 410;
}

@Injectable()
export class PushNotificationsService {
  private readonly logger = new Logger(PushNotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(VAPID_CONFIG) vapid: VapidConfig,
  ) {
    webpush.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey);
  }

  /**
   * Upserts a subscription keyed by its globally unique endpoint. The owner
   * and keys are refreshed on every call, which also heals a raced logout:
   * re-subscribing to an endpoint previously owned by another session simply
   * re-assigns the row instead of failing on the unique constraint.
   */
  async upsertSubscription(userId: string, dto: CreatePushSubscriptionDto) {
    const update = {
      userId,
      p256dh: dto.keys.p256dh,
      auth: dto.keys.auth,
      ...(dto.userAgent !== undefined ? { userAgent: dto.userAgent } : {}),
    };

    return this.prisma.pushSubscription.upsert({
      where: { endpoint: dto.endpoint },
      update,
      create: {
        userId,
        endpoint: dto.endpoint,
        p256dh: dto.keys.p256dh,
        auth: dto.keys.auth,
        ...(dto.userAgent !== undefined ? { userAgent: dto.userAgent } : {}),
      },
    });
  }

  /**
   * Deletes a subscription. Only the owner (or an admin) may delete it;
   * an absent endpoint yields 404, a foreign one yields 403.
   */
  async deleteSubscription(endpoint: string, principal: Principal) {
    const subscription = await this.prisma.pushSubscription.findUnique({
      where: { endpoint },
    });

    if (!subscription) {
      throw new NotFoundException('Push subscription not found');
    }

    if (!isOwnerOrAdmin(principal, subscription.userId)) {
      throw new ForbiddenException(
        'Access denied. You can only delete your own push subscriptions.',
      );
    }

    await this.prisma.pushSubscription.delete({ where: { endpoint } });
  }

  /** Sends the payload to every device subscribed by the user. */
  async sendToUser(userId: string, payload: PushPayload) {
    const subscriptions = await this.prisma.pushSubscription.findMany({
      where: { userId },
    });

    await this.fanOut(subscriptions, payload);
  }

  /**
   * One send per target, each isolated: a failed send never blocks the
   * remaining targets. Expired endpoints (404/410) are pruned and fan-out
   * continues; any other error is logged and swallowed (isolation contract:
   * push must never affect notification creation).
   */
  private async fanOut(
    subscriptions: StoredSubscription[],
    payload: PushPayload,
  ) {
    const body = JSON.stringify(payload);

    for (const subscription of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          },
          body,
        );
      } catch (err) {
        if (isExpiredSubscription(err)) {
          this.logger.warn(
            `Pruning expired push subscription ${subscription.id} ` +
              `(status ${(err as { statusCode: number }).statusCode})`,
          );
          await this.prisma.pushSubscription
            .delete({ where: { id: subscription.id } })
            .catch((deleteErr) => {
              this.logger.warn(
                `Failed to prune expired push subscription ${subscription.id}`,
                deleteErr,
              );
            });
        } else {
          this.logger.error(
            `Push send failed for subscription ${subscription.id}`,
            err as Error,
          );
        }
      }
    }
  }
}