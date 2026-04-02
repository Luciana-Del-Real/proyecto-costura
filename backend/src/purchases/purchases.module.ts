import { Module } from '@nestjs/common';
import { PurchasesService } from './purchases.service';
import { PurchasesController } from './purchases.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [PurchasesService],
  controllers: [PurchasesController],
  exports: [PurchasesService],
})
export class PurchasesModule {}
