import { Module } from '@nestjs/common';
import { LessonCommentsController } from './lesson-comments.controller';
import { AdminCommentsController } from './admin-comments.controller';
import { LessonCommentsService } from './lesson-comments.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [LessonCommentsController, AdminCommentsController],
  providers: [LessonCommentsService],
})
export class LessonCommentsModule {}
