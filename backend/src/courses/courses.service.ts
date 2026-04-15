import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCourseDto) {
    return this.prisma.course.create({
      data: dto,
      include: { lessons: true },
    });
  }

  async findAll(featured?: boolean, page = 1, limit = 20) {
    const MAX = 100;
    const p = Number.isInteger(page) && page > 0 ? page : 1;
    let l = Number.isInteger(limit) && limit > 0 ? limit : 20;
    if (l > MAX) l = MAX;

    const skip = (p - 1) * l;

    return this.prisma.course.findMany({
      where: featured ? { featured: true, active: true } : { active: true },
      include: { lessons: { orderBy: { order: 'asc' } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: l,
    });
  }

  async findOne(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: { lessons:{ orderBy: { order: 'asc' } } },
    });

    if (!course) {
      throw new NotFoundException('Curso no encontrado');
    }

    return course;
  }

  async update(id: string, dto: UpdateCourseDto) {
    await this.findOne(id); // Validar que existe
    return this.prisma.course.update({
      where: { id },
      data: dto,
      include: { lessons: true },
    });
  }

  async delete(id: string) {
    await this.findOne(id); // Validar que existe
    return this.prisma.course.delete({
      where: { id },
      select: { id: true, title: true },
    });
  }
}
