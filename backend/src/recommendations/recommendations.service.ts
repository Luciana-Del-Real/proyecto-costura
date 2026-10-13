import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRecommendationDto } from './dto/create-recommendation.dto';
import { UpdateRecommendationDto } from './dto/update-recommendation.dto';

@Injectable()
export class RecommendationsService {
  constructor(private readonly prisma: PrismaService) {}

  // Público: solo recomendaciones visibles (active), las más nuevas primero.
  findAllPublic() {
    return this.prisma.recommendation.findMany({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Admin: todas, incluidas las ocultas, las más nuevas primero.
  findAllForAdmin() {
    return this.prisma.recommendation.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const recommendation = await this.prisma.recommendation.findUnique({ where: { id } });
    if (!recommendation) {
      throw new NotFoundException('Recomendación no encontrada');
    }
    return recommendation;
  }

  async create(dto: CreateRecommendationDto) {
    return this.prisma.recommendation.create({
      data: {
        title: dto.title,
        description: dto.description ?? null,
        image: dto.image ?? null,
        link: dto.link ?? null,
      },
    });
  }

  // Solo pisa los campos que vienen en el DTO; los que llegan undefined
  // los conserva Prisma (misma lógica que el módulo de eventos).
  async update(id: string, dto: UpdateRecommendationDto) {
    await this.findOne(id);
    return this.prisma.recommendation.update({ where: { id }, data: { ...dto } });
  }

  // Borrado duro (igual que eventos): no hay historial ni soft-delete acá.
  async delete(id: string) {
    const result = await this.prisma.recommendation.deleteMany({ where: { id } });
    if (result.count === 0) {
      throw new NotFoundException('Recomendación no encontrada');
    }
    return { id };
  }
}