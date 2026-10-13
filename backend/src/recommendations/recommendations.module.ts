import { Module } from '@nestjs/common';
import { RecommendationsService } from './recommendations.service';
import { RecommendationsController } from './recommendations.controller';
import { AdminRecommendationsController } from './admin-recommendations.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RecommendationsController, AdminRecommendationsController],
  providers: [RecommendationsService],
})
export class RecommendationsModule {}