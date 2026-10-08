import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { assertLessonAccess } from '../common/course-access';
import { Role } from '../common/enums';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class LessonCommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

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

  // Bandeja de consultas del dashboard del admin: devuelve todos los
  // comentarios con su autor y su lección (y el curso de esa lección).
  // No filtra por lección ni por compra: el guard del controller ya exige
  // rol ADMIN. Ordenado por createdAt asc para armar hilos FIFO en el cliente.
  async findAllForAdmin() {
    return this.prisma.lessonComment.findMany({
      include: {
        user: { select: { id: true, name: true, role: true } },
        lesson: {
          select: {
            id: true,
            title: true,
            course: { select: { id: true, title: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(
    lessonId: string,
    userId: string,
    role: string,
    message: string,
    parentId?: string,
    image?: string,
  ) {
    await this.assertAccess(lessonId, userId, role);

    // El comentario y sus notificaciones se crean en la misma transacción
    // para que el hilo quede consistente y no se pierdan notificaciones.
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Si viene parentId, el padre debe existir y pertenecer a la misma lección.
      let parentAuthorId: string | null = null;
      if (parentId) {
        const parent = await tx.lessonComment.findUnique({
          where: { id: parentId },
          select: { id: true, lessonId: true, userId: true },
        });
        if (!parent || parent.lessonId !== lessonId) {
          throw new NotFoundException(
            'El comentario al que respondés no existe en esta lección',
          );
        }
        parentAuthorId = parent.userId;
      }

      const comment = await tx.lessonComment.create({
        data: {
          lessonId,
          userId,
          message,
          ...(image ? { image } : {}),
          ...(parentId ? { parentId } : {}),
        },
        include: {
          user: { select: { id: true, name: true, role: true } },
        },
      });

      // Título de la lección y de su curso, para armar los mensajes y los links.
      const lesson = await tx.lesson.findUnique({
        where: { id: lessonId },
        select: { title: true, course: { select: { title: true, id: true } } },
      });
      const lessonTitle = lesson?.title ?? '';
      const courseTitle = lesson?.course?.title ?? '';
      const courseId = lesson?.course?.id ?? '';

      if (role !== Role.ADMIN) {
        // Una consulta de alumna notifica a todos los admins.
        const author = await tx.user.findUnique({
          where: { id: userId },
          select: { name: true },
        });
        await this.notificationsService.createNotificationsForAdmins(
          'Nueva consulta',
          `${author?.name ?? 'Una alumna'} preguntó en la lección "${lessonTitle}" del curso "${courseTitle}".`,
          tx,
          courseId ? '/admin#consultas' : undefined,
        );
      } else if (parentId && parentAuthorId) {
        // Una respuesta de la profesora notifica a la autora del comentario padre.
        await this.notificationsService.createNotification(
          parentAuthorId,
          'Daiana respondió tu consulta',
          `Daiana respondió tu consulta en la lección "${lessonTitle}" del curso "${courseTitle}".`,
          tx,
          courseId ? `/curso/${courseId}#lesson-${lessonId}` : undefined,
        );
      }

      return comment;
    });
  }
}