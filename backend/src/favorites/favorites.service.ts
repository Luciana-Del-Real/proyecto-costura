import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FavoritesService {
  constructor(private prisma: PrismaService) {}

  async getUserFavorites(userId: string) {
    return this.prisma.favorite.findMany({
      where: { userId },
      include: {
        course: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addFavorite(userId: string, courseId: string) {
    // Verify course exists
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Check if already favorited
    const existingFavorite = await this.prisma.favorite.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    });

    if (existingFavorite) {
      throw new BadRequestException('Course is already in favorites');
    }

    return this.prisma.favorite.create({
      data: {
        userId,
        courseId,
      },
      include: {
        course: true,
      },
    });
  }

  async removeFavorite(userId: string, courseId: string) {
    const favorite = await this.prisma.favorite.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    });

    if (!favorite) {
      throw new NotFoundException('Favorite not found');
    }

    return this.prisma.favorite.delete({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    });
  }

  async isFavorite(userId: string, courseId: string) {
    const favorite = await this.prisma.favorite.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    });

    return {
      isFavorite: !!favorite,
    };
  }
}
