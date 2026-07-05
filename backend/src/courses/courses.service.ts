import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AttachmentsService } from '../attachments/attachments.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@Injectable()
export class CoursesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly attachmentsService: AttachmentsService,
  ) {}

  // NOTA: las lecciones de un curso ya NO se crean/editan desde acá.
  // Se manejan exclusivamente a través del módulo de Lessons
  // (POST/PUT/DELETE /courses/:courseId/lessons/...), que es el que
  // valida y guarda correctamente cada lección de forma individual.
  // Antes existía acá un mecanismo que borraba TODAS las lecciones del
  // curso (`deleteMany: {}`) cada vez que se actualizaba el curso con un
  // parámetro `lessons` en la URL — eso era lo que podía hacer desaparecer
  // lecciones creadas previamente. Se eliminó por seguridad.

  async create(dto: CreateCourseDto) {
    return this.prisma.course.create({
      data: { ...dto },
      include: { lessons: true, attachments: true },
    });
  }

  async update(id: string, dto: UpdateCourseDto) {
    return this.prisma.course.update({
      where: { id },
      data: { ...dto },
      include: { lessons: true, attachments: true },
    });
  }

  async addAttachments(courseId: string, files: Express.Multer.File[]) {
    return this.attachmentsService.createManyForCourse(courseId, files);
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
        lessons: { orderBy: { order: 'asc' }, include: { attachments: true } },
        attachments: true,
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
        lessons: { orderBy: { order: 'asc' }, include: { attachments: true } },
        attachments: true,
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
