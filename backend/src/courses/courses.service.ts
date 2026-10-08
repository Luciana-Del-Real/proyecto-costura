import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AttachmentsService } from '../attachments/attachments.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { Principal } from '../common/principal';
import { Role } from '../common/enums';

// Proyección pública del catálogo: metadata + títulos de lecciones.
// NUNCA incluye videoUrl/pdf/attachments ni el material del curso, así el
// contenido pago no se filtra por el endpoint público. Los alumnos con
// compra aprobada obtienen el contenido completo desde el endpoint de
// lecciones protegido (GET /courses/:courseId/lessons).
const publicLessonSelect = {
  id: true,
  title: true,
  description: true,
  duration: true,
  order: true,
} as const;

const publicCourseSelect = {
  id: true,
  title: true,
  description: true,
  longDescription: true,
  image: true,
  instructor: true,
  duration: true,
  level: true,
  priceARS: true,
  priceAUD: true,
  featured: true,
  rating: true,
  students: true,
  active: true,
  createdAt: true,
  updatedAt: true,
  lessons: {
    orderBy: { order: 'asc' as const },
    select: publicLessonSelect,
  },
} as const;

// Forma completa para administradores (gestión): lecciones con attachments
// y material del curso (attachments + pdfGuide).
const fullCourseInclude = {
  lessons: { orderBy: { order: 'asc' }, include: { attachments: true } },
  attachments: true,
} as const;

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
      include: fullCourseInclude,
    });
  }

  async update(id: string, dto: UpdateCourseDto) {
    return this.prisma.course.update({
      where: { id },
      data: { ...dto },
      include: fullCourseInclude,
    });
  }

  async addAttachments(courseId: string, files: Express.Multer.File[]) {
    return this.attachmentsService.createManyForCourse(courseId, files);
  }

  async findAll(featured?: boolean, page = 1, limit = 20, principal?: Principal) {
    const MAX = 100;
    const p = Number.isInteger(page) && page > 0 ? page : 1;
    let l = Number.isInteger(limit) && limit > 0 ? limit : 20;
    if (l > MAX) l = MAX;

    const skip = (p - 1) * l;

    if (principal?.role === Role.ADMIN) {
      // Rama admin: ve TODO (activos y ocultos) + conteo de ventas por curso,
      // para que el frontend decida entre Ocultar (con ventas) o Eliminar.
      const adminWhere = featured ? { featured: true } : {};
      return this.prisma.course.findMany({
        where: adminWhere,
        include: {
          ...fullCourseInclude,
          _count: { select: { purchases: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: l,
      });
    }

    // Rama pública: solo cursos activos (los ocultos no se muestran).
    const where = featured ? { featured: true, active: true } : { active: true };
    return this.prisma.course.findMany({
      where,
      select: publicCourseSelect,
      orderBy: { createdAt: 'desc' },
      skip,
      take: l,
    });
  }

  async findOne(id: string, principal?: Principal) {
    if (principal?.role === Role.ADMIN) {
      const adminCourse = await this.prisma.course.findUnique({
        where: { id },
        include: fullCourseInclude,
      });
      if (!adminCourse) {
        throw new NotFoundException('Curso no encontrado');
      }
      return adminCourse;
    }

    const course = await this.prisma.course.findUnique({
      where: { id },
      select: publicCourseSelect,
    });

    if (!course) {
      throw new NotFoundException('Curso no encontrado');
    }
    return course;
  }

  // Delete inteligente: si el curso tiene compras (historial de pagos) se
  // OCULTA (active=false) en vez de borrarse, porque las FKs reales son
  // ON DELETE RESTRICT y borrar el historial sería peligroso. Sin compras se
  // borra definitivamente. Respuesta uniforme para el frontend:
  //   { id, title, action: 'hidden' | 'deleted' } (+ active cuando se oculta).
  async delete(id: string) {
    await this.findOne(id);
    const count = await this.prisma.purchase.count({
      where: { courseId: id, deletedAt: null },
    });
    if (count > 0) {
      const hidden = await this.prisma.course.update({
        where: { id },
        data: { active: false },
        select: { id: true, title: true, active: true },
      });
      return { ...hidden, action: 'hidden' as const };
    }
    const removed = await this.prisma.course.delete({
      where: { id },
      select: { id: true, title: true },
    });
    return { ...removed, action: 'deleted' as const };
  }
}