import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import {
  NotificationsService,
  PUSH_DISPATCHER,
} from './notifications.service';
import type { PushDispatcher } from './notifications.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PushNotificationsModule } from '../push-notifications/push-notifications.module';
import { PushNotificationsService } from '../push-notifications/push-notifications.service';

@Module({
  imports: [PrismaModule, PushNotificationsModule],
  providers: [
    NotificationsService,
    {
      // Adapter for the chokepoint seam: maps (userId, title, message, link)
      // to the real push service and derives the Web Push payload
      // (`{ title, body: message, data: { url: link } }`).
      provide: PUSH_DISPATCHER,
      useFactory: (push: PushNotificationsService): PushDispatcher => ({
        schedule: (userId, title, message, link) =>
          push.sendToUser(userId, {
            title,
            body: message,
            ...(link ? { data: { url: link } } : {}),
          }),
      }),
      inject: [PushNotificationsService],
    },
  ],
  controllers: [NotificationsController],
  exports: [NotificationsService, PushNotificationsModule],
})
export class NotificationsModule {}
