import { Module } from '@nestjs/common';
import { LessonCommentsController } from './lesson-comments.controller';
import { AdminCommentsController } from './admin-comments.controller';
import { LessonCommentsService } from './lesson-comments.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [PrismaModule, NotificationsModule, StorageModule],
  controllers: [LessonCommentsController, AdminCommentsController],
  providers: [LessonCommentsService],
})
export class LessonCommentsModule {}
