import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { assertLessonAccess } from '../common/course-access';
import { Role } from '../common/enums';

@Injectable()
export class LessonCommentsService {
  constructor(private readonly prisma: PrismaService) {}

  // Un usuario puede ver/comentar en una lección si es ADMIN, o si tiene
  // una compra APROBADA del curso al que pertenece esa lección.
  // El predicado vive en common/course-access y lo comparten lessons,
  // lesson-progress y lesson-comments.
  private async assertAccess(lessonId: string, userId: string, role: string) {
    return assertLessonAccess(this.prisma, { id: userId, role: role as Role }, lessonId);
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