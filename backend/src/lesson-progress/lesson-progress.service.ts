import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateLessonProgressDto } from './dto/update-lesson-progress.dto';
import { PurchaseStatus } from '../common/enums';

@Injectable()
export class LessonProgressService {
  constructor(private prisma: PrismaService) {}

  async getUserCourseProgress(userId: string, courseId: string) {
    // Verify course exists
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        lessons: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Get all lesson progress for user in this course
    const progressList = await this.prisma.lessonProgress.findMany({
      where: {
        userId,
        lesson: {
          courseId,
        },
      },
      include: {
        lesson: true,
      },
    });

    // Calculate overall progress percentage
    const completedCount = progressList.filter((p: any) => p.completed).length;
    const progressPercentage =
      course.lessons.length > 0
        ? Math.round((completedCount / course.lessons.length) * 100)
        : 0;

    return {
      courseId,
      totalLessons: course.lessons.length,
      completedLessons: completedCount,
      progressPercentage,
      lessons: course.lessons.map((lesson: any) => {
        const progress = progressList.find((p: any) => p.lessonId === lesson.id);
        return {
          id: lesson.id,
          title: lesson.title,
          order: lesson.order,
          duration: lesson.duration,
          completed: progress?.completed || false,
        };
      }),
    };
  }

  async markLessonComplete(
    userId: string,
    lessonId: string,
    dto: UpdateLessonProgressDto,
  ) {
    // Verify lesson exists
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { course: true },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    // Verify user has purchased this course
    const purchase = await this.prisma.purchase.findFirst({
      where: {
        userId,
        courseId: lesson.courseId,
        deletedAt: null,
      },
    });

    if (!purchase || purchase.status !== PurchaseStatus.APPROVED) {
      throw new NotFoundException('User does not have access to this course');
    }

    // If marking as complete, verify sequential requirement
    if (dto.completed) {
      const previousLesson = await this.prisma.lesson.findFirst({
        where: {
          courseId: lesson.courseId,
          order: lesson.order - 1,
        },
      });

      if (previousLesson) {
        const previousProgress = await this.prisma.lessonProgress.findUnique({
          where: {
            userId_lessonId: {
              userId,
              lessonId: previousLesson.id,
            },
          },
        });

        if (!previousProgress?.completed) {
          throw new BadRequestException(
            'Cannot complete lesson: previous lesson must be completed first',
          );
        }
      }
    }

    // Update or create progress
    const progress = await this.prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId,
          lessonId,
        },
      },
      update: {
        completed: dto.completed,
      },
      create: {
        userId,
        lessonId,
        completed: dto.completed,
      },
      include: {
        lesson: true,
      },
    });

    return progress;
  }

  async getCourseProgress(userId: string, courseId: string) {
    return this.getUserCourseProgress(userId, courseId);
  }
}
