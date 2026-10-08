import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { PushNotificationsController } from './push-notifications.controller';
import { PushNotificationsService } from './push-notifications.service';
import { VAPID_CONFIG, vapidConfig } from './vapid.config';

@Module({
  imports: [PrismaModule],
  controllers: [PushNotificationsController],
  providers: [
    PushNotificationsService,
    {
      provide: VAPID_CONFIG,
      useFactory: vapidConfig,
      inject: [ConfigService],
    },
  ],
  exports: [PushNotificationsService],
})
export class PushNotificationsModule {}