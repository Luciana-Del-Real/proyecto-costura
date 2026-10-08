import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CertificateRequestStatus } from '../common/enums';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class CertificateRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // Una alumna puede pedir el certificado solo si compró el curso (compra
  // aprobada, sin borrado lógico) y completó el 100% de sus lecciones.
  // Misma compuerta que usaba el viejo módulo de certificados (PDF).
  private async assertEligible(userId: string, courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: { lessons: true },
    });
    if (!course) throw new NotFoundException('Curso no encontrado');

    const purchase = await this.prisma.purchase.findFirst({
      where: { userId, courseId, status: 'APPROVED', deletedAt: null },
    });
    if (!purchase) {
      throw new ForbiddenException('No compraste este curso, o tu compra todavía no fue aprobada');
    }

    const totalLessons = course.lessons.length;
    if (totalLessons === 0) {
      throw new ForbiddenException('Este curso todavía no tiene lecciones cargadas');
    }

    const completedCount = await this.prisma.lessonProgress.count({
      where: {
        userId,
        completed: true,
        lesson: { courseId },
      },
    });
    if (completedCount < totalLessons) {
      throw new ForbiddenException('Todavía no completaste todas las lecciones de este curso');
    }

    return course;
  }

  // Crea la solicitud (upsert de facto por el @@unique([userId, courseId])):
  // si ya existe una PENDING la devuelve tal cual (idempotente, sin repetir
  // notificaciones); si ya está SENT, la solicitud no puede reabrirse.
  async request(userId: string, courseId: string) {
    const course = await this.assertEligible(userId, courseId);

    const existing = await this.prisma.certificateRequest.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (existing?.status === CertificateRequestStatus.SENT) {
      throw new ConflictException('El certificado ya fue enviado');
    }
    if (existing?.status === CertificateRequestStatus.PENDING) {
      return existing;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    // La solicitud y la notificación a los admins se crean en la misma
    // transacción para que queden atómicas (mismo patrón que purchases).
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const request = await tx.certificateRequest.create({
        data: {
          userId,
          courseId,
          status: CertificateRequestStatus.PENDING,
        },
      });

      await this.notificationsService.createNotificationsForAdmins(
        'Nueva solicitud de certificado',
        `${user?.name ?? 'Una alumna'} terminó "${course.title}" y pidió su certificado`,
        tx,
        `/admin/certificados?highlight=${request.id}`,
      );

      return request;
    });
  }

  // Estado de la solicitud de la alumna para este curso, para que la vista
  // pueda mostrar el botón correcto después de un refresh.
  async findMyRequest(userId: string, courseId: string) {
    const request = await this.prisma.certificateRequest.findUnique({
      where: { userId_courseId: { userId, courseId } },
      select: { status: true },
    });
    return { request: request ? { status: request.status } : null };
  }

  // Bandeja del dashboard del admin: todas las solicitudes con su alumna y su
  // curso, las más nuevas primero. El guard del controller ya exige rol ADMIN.
  async findAllForAdmin() {
    return this.prisma.certificateRequest.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        course: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Detalle de una solicitud para la revisión del admin: alumna, curso,
  // progreso lección por lección con su evidencia, y los comentarios que esa
  // alumna dejó en el curso. El guard del controller ya exige rol ADMIN.
  async findDetailForAdmin(id: string) {
    const request = await this.prisma.certificateRequest.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        course: { select: { id: true, title: true } },
      },
    });
    if (!request) {
      throw new NotFoundException('Solicitud de certificado no encontrada');
    }

    const lessons = await this.prisma.lesson.findMany({
      where: { courseId: request.courseId },
      orderBy: { order: 'asc' },
      select: { id: true, title: true, order: true },
    });

    const progressList = await this.prisma.lessonProgress.findMany({
      where: {
        userId: request.userId,
        lessonId: { in: lessons.map((lesson) => lesson.id) },
      },
    });
    const progressByLesson = new Map(
      progressList.map((progress) => [progress.lessonId, progress]),
    );

    const comments = await this.prisma.lessonComment.findMany({
      where: {
        userId: request.userId,
        lesson: { courseId: request.courseId },
      },
      include: {
        user: { select: { id: true, name: true, role: true } },
        lesson: { select: { id: true, title: true, order: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return {
      request: {
        id: request.id,
        status: request.status,
        createdAt: request.createdAt,
        sentAt: request.sentAt,
      },
      student: request.user,
      course: request.course,
      lessons: lessons.map((lesson) => {
        const progress = progressByLesson.get(lesson.id);
        return {
          id: lesson.id,
          title: lesson.title,
          order: lesson.order,
          completed: progress?.completed ?? false,
          evidenceImage: progress?.evidenceImage ?? null,
          evidenceNote: progress?.evidenceNote ?? null,
        };
      }),
      comments,
    };
  }

  // El admin marca la solicitud como SENT después de enviar el certificado
  // por mail fuera de la app. Registra la fecha de envío.
  async markAsSent(id: string) {
    const existing = await this.prisma.certificateRequest.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Solicitud de certificado no encontrada');
    }

    return this.prisma.certificateRequest.update({
      where: { id },
      data: { status: CertificateRequestStatus.SENT, sentAt: new Date() },
    });
  }
}