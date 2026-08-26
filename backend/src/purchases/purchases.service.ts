import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { PurchaseStatus } from '../common/enums';
import { Principal, isOwnerOrAdmin } from '../common/principal';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PurchasesService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
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

    // Determinar el precio según el país/moneda del comprador
    const buyer = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { country: true, name: true },
    });
    const total = buyer?.country === 'AUD' ? course.priceAUD : course.priceARS;

    // Create purchase request with PENDING status y notifica a los admins
    // dentro de la misma transacción para que queden atómicos.
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const purchase = await tx.purchase.create({
        data: {
          userId,
          courseId: dto.courseId,
          status: PurchaseStatus.PENDING,
          total,
        },
        include: {
          course: true,
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              country: true,
            },
          },
        },
      });

      await this.notificationsService.createNotificationsForAdmins(
        'Nueva solicitud de curso',
        `La alumna ${buyer?.name ?? '...'} solicitó el curso "${course.title}". Revisá la solicitud para darle acceso.`,
        tx,
        '/admin/ventas',
      );

      return purchase;
    });
  }

  async approvePurchase(purchaseId: string) {
    // Ejecutar todo en una transacción atómica para garantizar integridad.
    // Acepta PENDING y REJECTED: la denegación es reversible y una nueva
    // aprobación restaura el acceso sin perder el progreso guardado.
    const updatedPurchase = await this.prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        const purchase = await tx.purchase.findUnique({
          where: { id: purchaseId },
          include: { course: true, user: true },
        });

        if (!purchase) {
          throw new NotFoundException('Purchase not found');
        }

        if (
          purchase.status !== PurchaseStatus.PENDING &&
          purchase.status !== PurchaseStatus.REJECTED
        ) {
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

        // Notificación de desbloqueo dentro de la misma transacción
        await this.notificationsService.createNotification(
          purchase.userId,
          'Acceso desbloqueado',
          `Tu solicitud para el curso "${purchase.course.title}" fue aprobada. Ya podés acceder al contenido completo.`,
          tx,
          `/curso/${purchase.courseId}`,
        );

        return updated;
      },
    );

    // Decisión del owner: NO se envía email de compra (el link que se armaba
    // apuntaba a /courses/:id, una ruta inexistente — la real es /curso/:id).
    // El acceso se desbloquea con la notificación in-app creada en la
    // transacción. El email de reset-password sigue intacto en auth.service.
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

    // Acepta PENDING y APPROVED: negar una compra aprobada revoca el acceso.
    // Es reversible — una aprobación posterior restaura el acceso.
    if (
      purchase.status !== PurchaseStatus.PENDING &&
      purchase.status !== PurchaseStatus.APPROVED
    ) {
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
            country: true,
          },
        },
      },
    });

    // La denegación NO genera notificación de desbloqueo (y el progreso no
    // se borra: una re-aprobación restaura el acceso sin perder historia).

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
            country: true,
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
            country: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
      skip,
      take: l,
    });
  }

  async getAllPurchases() {
    // Todas las compras no eliminadas, sin filtrar por estado: el listado del
    // admin debe mostrar PENDING/APPROVED/REJECTED para poder re-aprobar o
    // denegar desde la tabla (los totales financieros se calculan en el front).
    return this.prisma.purchase.findMany({
      where: { deletedAt: null },
      include: {
        course: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            country: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Un registro de compra solo es visible para su dueño o un ADMIN (IDOR
  // cerrado: cualquier otro usuario autenticado recibe 403).
  async getPurchaseById(id: string, principal: Principal) {
    const purchase = await this.prisma.purchase.findFirst({
      where: { id, deletedAt: null },
      include: {
        course: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            country: true,
          },
        },
      },
    });

    if (!purchase) {
      throw new NotFoundException('Purchase not found');
    }

    if (!isOwnerOrAdmin(principal, purchase.userId)) {
      throw new ForbiddenException('No podés ver la compra de otro usuario');
    }

    return purchase;
  }
}