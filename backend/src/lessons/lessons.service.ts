import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AttachmentsService } from '../attachments/attachments.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { Principal } from '../common/principal';
import { assertCourseAccess, assertLessonAccess } from '../common/course-access';

@Injectable()
export class LessonsService {
  constructor(
    private prisma: PrismaService,
    private readonly attachmentsService: AttachmentsService,
  ) {}

  async create(dto: CreateLessonDto) {
    // Validate course exists
    const course = await this.prisma.course.findUnique({
      where: { id: dto.courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    return this.prisma.lesson.create({
      data: {
        title: dto.title,
        description: dto.description,
        duration: dto.duration,
        videoUrl: dto.videoUrl,
        order: dto.order,
        courseId: dto.courseId,
        pdf: dto.pdf,
      },
      include: { attachments: true },
    });
  }

  async addAttachments(lessonId: string, files: Express.Multer.File[]) {
    return this.attachmentsService.createManyForLesson(lessonId, files);
  }

  // Lectura protegida del listado de lecciones de un curso: devuelve el
  // contenido completo (videoUrl/pdf/attachments) solo para ADMIN o alumnos
  // con compra aprobada. Incluye el material general del curso para que la
  // vista de aprendizaje no dependa del payload público del catálogo.
  async findByCourse(courseId: string, principal: Principal) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        pdfGuide: true,
        attachments: true,
      },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    await assertCourseAccess(this.prisma, principal, courseId);

    const lessons = await this.prisma.lesson.findMany({
      where: { courseId },
      orderBy: { order: 'asc' },
      include: { attachments: true },
    });

    return { course, lessons };
  }

  // `principal` es opcional porque los flujos de administración
  // (create/update/delete) leen lecciones sin pasar por el predicado de
  // acceso: ya están protegidos por AdminGuard en el controller.
  async findOne(id: string, principal?: Principal) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: { attachments: true },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    if (principal) {
      await assertLessonAccess(this.prisma, principal, id);
    }

    return lesson;
  }

  async update(id: string, dto: UpdateLessonDto) {
    const lesson = await this.findOne(id);

    if (dto.courseId && dto.courseId !== lesson.courseId) {
      const course = await this.prisma.course.findUnique({
        where: { id: dto.courseId },
      });

      if (!course) {
        throw new NotFoundException('New course not found');
      }
    }

    return this.prisma.lesson.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        duration: dto.duration,
        videoUrl: dto.videoUrl,
        order: dto.order,
        courseId: dto.courseId,
        pdf: dto.pdf,
      },
      include: { attachments: true },
    });
  }

  async delete(id: string) {
    await this.findOne(id);

    return this.prisma.lesson.delete({
      where: { id },
    });
  }

  async deleteMultiple(courseId: string) {
    return this.prisma.lesson.deleteMany({
      where: { courseId },
    });
  }
}