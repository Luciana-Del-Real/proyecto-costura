import { Module } from '@nestjs/common';
import { LessonsService } from './lessons.service';
import { LessonsController, LessonsDetailController } from './lessons.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AttachmentsModule } from '../attachments/attachments.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [PrismaModule, AttachmentsModule, StorageModule],
  providers: [LessonsService],
  controllers: [LessonsController, LessonsDetailController],
  exports: [LessonsService],
})
export class LessonsModule {}
