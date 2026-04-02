import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';

@Injectable()
export class PurchasesService {
  constructor(private prisma: PrismaService) {}

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
        status: 'PENDING',
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
    const purchase = await this.prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: { course: true, user: true },
    });

    if (!purchase) {
      throw new NotFoundException('Purchase not found');
    }

    if (purchase.status !== 'PENDING') {
      throw new BadRequestException(
        `Cannot approve purchase with status ${purchase.status}`,
      );
    }

    // Update purchase status
    const updatedPurchase = await this.prisma.purchase.update({
      where: { id: purchaseId },
      data: { status: 'APPROVED' },
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
    const lessons = await this.prisma.lesson.findMany({
      where: { courseId: purchase.courseId },
      orderBy: { order: 'asc' },
    });

    // Create progress entries for each lesson (not completed)
    if (lessons.length > 0) {
      await Promise.all(
        lessons.map((lesson) =>
          this.prisma.lessonProgress.upsert({
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
          }),
        ),
      );
    }

    // Create notification for user
    await this.prisma.notification.create({
      data: {
        userId: purchase.userId,
        title: 'Purchase Approved',
        message: `Your purchase for "${purchase.course.title}" has been approved. You can now access the course.`,
        read: false,
      },
    });

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

    if (purchase.status !== 'PENDING') {
      throw new BadRequestException(
        `Cannot reject purchase with status ${purchase.status}`,
      );
    }

    // Update purchase status
    const updatedPurchase = await this.prisma.purchase.update({
      where: { id: purchaseId },
      data: { status: 'REJECTED' },
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
      where: { userId },
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

  async getPendingRequests() {
    return this.prisma.purchase.findMany({
      where: { status: 'PENDING' },
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
    });
  }

  async getPurchaseById(id: string) {
    const purchase = await this.prisma.purchase.findUnique({
      where: { id },
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
