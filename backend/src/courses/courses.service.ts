import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCourseDto) {
    // Desestructuramos el DTO para asegurar que no enviamos campos extra a Prisma
    const { ...courseData } = dto;
    
    return this.prisma.course.create({
      data: courseData,
      include: { lessons: true, attachments: true },
    });
  }

  // Método específico para adjuntos (no pasa por el DTO del curso)
  async createManyAttachments(data: { filename: string, url: string, courseId: string }[]) {
    return this.prisma.attachment.createMany({
      data: data,
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
      include: { 
        lessons: { orderBy: { order: 'asc' } },
        attachments: true 
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: l,
    });
  }

  async findOne(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: { 
        lessons: { orderBy: { order: 'asc' } },
        attachments: true 
      },
    });

    if (!course) {
      throw new NotFoundException('Curso no encontrado');
    }

    return course;
  }

  async update(id: string, dto: UpdateCourseDto) {
    // Validar que existe
    await this.findOne(id); 
    
    // Al igual que en create, aseguramos que dto solo contenga campos válidos del modelo Course
    return this.prisma.course.update({
      where: { id },
      data: dto,
      include: { lessons: true, attachments: true },
    });
  }

  async delete(id: string) {
    await this.findOne(id);
    return this.prisma.course.delete({
      where: { id },
      select: { id: true, title: true },
    });
  }
}