import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LessonCommentsService {
  constructor(private readonly prisma: PrismaService) {}

  // Un usuario puede ver/comentar en una lección si es ADMIN, o si tiene
  // una compra APROBADA del curso al que pertenece esa lección.
  private async assertAccess(lessonId: string, userId: string, role: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { id: true, courseId: true },
    });
    if (!lesson) throw new NotFoundException('Lección no encontrada');

    if (role === 'ADMIN') return lesson;

    const purchase = await this.prisma.purchase.findFirst({
      where: { userId, courseId: lesson.courseId, status: 'APPROVED' },
    });
    if (!purchase) {
      throw new ForbiddenException('No tenés acceso a este curso');
    }
    return lesson;
  }

  async findByLesson(lessonId: string, userId: string, role: string) {
    await this.assertAccess(lessonId, userId, role);

    return this.prisma.lessonComment.findMany({
      where: { lessonId },
      include: {
        user: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(lessonId: string, userId: string, role: string, message: string) {
    await this.assertAccess(lessonId, userId, role);

    return this.prisma.lessonComment.create({
      data: { lessonId, userId, message },
      include: {
        user: { select: { id: true, name: true, role: true } },
      },
    });
  }
}
