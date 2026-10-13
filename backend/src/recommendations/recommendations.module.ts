import { Module } from '@nestjs/common';
import { RecommendationsService } from './recommendations.service';
import { RecommendationsController } from './recommendations.controller';
import { AdminRecommendationsController } from './admin-recommendations.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [PrismaModule, NotificationsModule, StorageModule],
  controllers: [RecommendationsController, AdminRecommendationsController],
  providers: [RecommendationsService],
})
export class RecommendationsModule {}