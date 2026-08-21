import { Module } from '@nestjs/common';
import { LessonCommentsController } from './lesson-comments.controller';
import { LessonCommentsService } from './lesson-comments.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [LessonCommentsController],
  providers: [LessonCommentsService],
})
export class LessonCommentsModule {}
