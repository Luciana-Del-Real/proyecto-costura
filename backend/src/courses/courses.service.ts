import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCourseDto) {
    const { lessons, ...courseData } = dto;
    let lessonsArray = [];
    if (lessons) {
      try {
        lessonsArray = JSON.parse(lessons as string);
      } catch (e) {
        console.error("Error al parsear lecciones:", e);
      }
    }

    return this.prisma.course.create({
      data: {
        ...courseData,
        lessons: {
          create: lessonsArray.map((l: any) => ({
            title: l.title,
            description: l.description,
          })),
        },
      },
      include: { lessons: true, attachments: true },
    });
  }

  // Corregido: Nombre cambiado de updateCourse a update
  async update(id: string, dto: UpdateCourseDto) {
    const { lessons, ...courseData } = dto;
    
    // Preparamos el objeto de actualización
    const updatePayload: any = { ...courseData };

    if (lessons) {
      const parsedLessons = typeof lessons === 'string' ? JSON.parse(lessons) : lessons;
      
      // Estrategia: borrar las existentes y crear las nuevas
      updatePayload.lessons = {
        deleteMany: {}, 
        create: parsedLessons.map((l: any) => ({
          title: l.title,
          description: l.description,
        })),
      };
    }

    return await this.prisma.course.update({
      where: { id },
      data: updatePayload as any, // Forzamos el tipo para evitar conflicto con la estructura relacional
      include: { lessons: true, attachments: true },
    });
  }

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

  async delete(id: string) {
    await this.findOne(id);
    return this.prisma.course.delete({
      where: { id },
      select: { id: true, title: true },
    });
  }
}