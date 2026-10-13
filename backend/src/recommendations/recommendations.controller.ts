import { Controller, Get } from '@nestjs/common';
import { RecommendationsService } from './recommendations.service';

// Público: la grilla de tarjetas de la página Recomendaciones (solo
// recomendaciones visibles, las más nuevas primero).
@Controller('recommendations')
export class RecommendationsController {
  constructor(private readonly recommendationsService: RecommendationsService) {}

  @Get()
  findAll() {
    return this.recommendationsService.findAllPublic();
  }
}