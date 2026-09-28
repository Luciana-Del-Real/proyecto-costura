import { Module } from '@nestjs/common';
import { PatternPurchasesService } from './pattern-purchases.service';
import { PatternPurchasesController } from './pattern-purchases.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [PatternPurchasesController],
  providers: [PatternPurchasesService],
})
export class PatternPurchasesModule {}