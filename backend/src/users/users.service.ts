import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });
  }

  async findAll(role?: string) {
    return this.prisma.user.findMany({
      where: role ? { role: role as 'ADMIN' | 'ALUMNO' } : undefined,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        createdAt: true,
        purchases: {
          select: { courseId: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async toggleActive(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new Error('User not found');
    return this.prisma.user.update({
      where: { id },
      data: { active: !user.active },
      select: {
        id: true,
        email: true,
        name: true,
        active: true,
      },
    });
  }

  async delete(id: string) {
    return this.prisma.user.delete({
      where: { id },
      select: { id: true, email: true },
    });
  }
}
