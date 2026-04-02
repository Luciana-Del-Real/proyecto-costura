import { Module } from '@nestjs/common';
import { LessonsService } from './lessons.service';
import { LessonsController } from './lessons.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [LessonsService],
  controllers: [LessonsController],
  exports: [LessonsService],
})
export class LessonsModule {}
