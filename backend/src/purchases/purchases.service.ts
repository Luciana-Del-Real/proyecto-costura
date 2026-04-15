import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { PurchaseStatus } from '../common/enums';
import { MailService } from '../mail/mail.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PurchasesService {
  private readonly logger = new Logger(PurchasesService.name);
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
    private config: ConfigService,
  ) {}

  async requestPurchase(userId: string, dto: CreatePurchaseDto) {
    // Validate course exists
    const course = await this.prisma.course.findUnique({
      where: { id: dto.courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Check if purchase already exists for this user and course
    const existingPurchase = await this.prisma.purchase.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId: dto.courseId,
        },
      },
    });

    if (existingPurchase) {
      throw new BadRequestException(
        'You have already requested or purchased this course',
      );
    }

    // Create purchase request with PENDING status
    return this.prisma.purchase.create({
      data: {
        userId,
        courseId: dto.courseId,
        status: PurchaseStatus.PENDING,
        total: course.price,
      },
      include: {
        course: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });
  }

  async approvePurchase(purchaseId: string) {
    // Ejecutar todo en una transacción atómica para garantizar integridad
    const updatedPurchase = await this.prisma.$transaction(async (tx: any) => {
      const purchase = await tx.purchase.findUnique({
        where: { id: purchaseId },
        include: { course: true, user: true },
      });

      if (!purchase) {
        throw new NotFoundException('Purchase not found');
      }

      if (purchase.status !== PurchaseStatus.PENDING) {
        throw new BadRequestException(
          `Cannot approve purchase with status ${purchase.status}`,
        );
      }

      // Update purchase status
      const updated = await tx.purchase.update({
        where: { id: purchaseId },
        data: { status: PurchaseStatus.APPROVED },
        include: {
          course: true,
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      });

      // Initialize lesson progress for purchased course
      const lessons = await tx.lesson.findMany({
        where: { courseId: purchase.courseId },
        orderBy: { order: 'asc' },
      });

      // Crear o asegurar progress entries para cada lección
      for (const lesson of lessons) {
        await tx.lessonProgress.upsert({
          where: {
            userId_lessonId: {
              userId: purchase.userId,
              lessonId: lesson.id,
            },
          },
          update: {},
          create: {
            userId: purchase.userId,
            lessonId: lesson.id,
            completed: false,
          },
        });
      }

      // Crear notificación al usuario
      await tx.notification.create({
        data: {
          userId: purchase.userId,
          title: 'Purchase Approved',
          message: `Your purchase for "${purchase.course.title}" has been approved. You can now access the course.`,
          read: false,
        },
      });

      return updated;
    });

    // Enviar correo transaccional fuera de la transacción para no bloquear la BD
    try {
      const frontend = this.config.get<string>('FRONTEND_URL') || 'http://localhost:5173';
      const courseUrl = `${frontend}/courses/${updatedPurchase.course.id}`;
      const subject = 'Pago aprobado - Acceso al curso';
      const html = `
        <p>Hola ${updatedPurchase.user.name || ''},</p>
        <p>Tu pago para el curso "${updatedPurchase.course.title}" ha sido aprobado. Ya puedes acceder al curso.</p>
        <p><a href="${courseUrl}">Ir al curso</a></p>
        <p>Gracias por tu compra.</p>
      `;

      await this.mailService.sendEmail(updatedPurchase.user.email, subject, html);
    } catch (err) {
      // Loguear el fallo pero no revertir la transacción ya confirmada
      this.logger.warn('Fallo al enviar email de confirmación de compra', err as any);
    }

    return updatedPurchase;
  }

  async rejectPurchase(purchaseId: string) {
    const purchase = await this.prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: { course: true, user: true },
    });

    if (!purchase) {
      throw new NotFoundException('Purchase not found');
    }

    if (purchase.status !== PurchaseStatus.PENDING) {
      throw new BadRequestException(
        `Cannot reject purchase with status ${purchase.status}`,
      );
    }

    // Update purchase status
    const updatedPurchase = await this.prisma.purchase.update({
      where: { id: purchaseId },
      data: { status: PurchaseStatus.REJECTED },
      include: {
        course: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    // Create notification for user
    await this.prisma.notification.create({
      data: {
        userId: purchase.userId,
        title: 'Purchase Rejected',
        message: `Your purchase request for "${purchase.course.title}" has been rejected.`,
        read: false,
      },
    });

    return updatedPurchase;
  }

  async getUserPurchases(userId: string) {
    return this.prisma.purchase.findMany({
      where: { userId, deletedAt: null },
      include: {
        course: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPendingRequests(page = 1, limit = 20) {
    const MAX = 100;
    const p = Number.isInteger(page) && page > 0 ? page : 1;
    let l = Number.isInteger(limit) && limit > 0 ? limit : 20;
    if (l > MAX) l = MAX;

    const skip = (p - 1) * l;

    return this.prisma.purchase.findMany({
      where: { status: PurchaseStatus.PENDING, deletedAt: null },
      include: {
        course: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
      skip,
      take: l,
    });
  }

  async getAllPurchases() {
    return this.prisma.purchase.findMany({
      where: { status: PurchaseStatus.APPROVED, deletedAt: null },
      include: {
        course: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPurchaseById(id: string) {
    const purchase = await this.prisma.purchase.findFirst({
      where: { id, deletedAt: null },
      include: {
        course: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    if (!purchase) {
      throw new NotFoundException('Purchase not found');
    }

    return purchase;
  }
}
