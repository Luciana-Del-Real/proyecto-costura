import { Module } from '@nestjs/common';
import { LessonProgressService } from './lesson-progress.service';
import { LessonProgressController } from './lesson-progress.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [LessonProgressService],
  controllers: [LessonProgressController],
  exports: [LessonProgressService],
})
export class LessonProgressModule {}
