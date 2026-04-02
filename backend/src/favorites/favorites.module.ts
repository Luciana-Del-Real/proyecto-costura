import { Module } from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { FavoritesController } from './favorites.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [FavoritesService],
  controllers: [FavoritesController],
  exports: [FavoritesService],
})
export class FavoritesModule {}
