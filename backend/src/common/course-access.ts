import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Principal } from './principal';
import { Role, PurchaseStatus } from './enums';

/**
 * Paywall predicate shared by every content boundary (lessons, progress,
 * comments): a caller may access course content only when they are an ADMIN
 * or hold an APPROVED purchase for the course. Soft-deleted purchases
 * (`deletedAt: null`) never grant access, so deny + re-approve is fully
 * reversible through the purchase status alone.
 */
export async function assertCourseAccess(
  prisma: PrismaService,
  principal: Principal,
  courseId: string,
): Promise<void> {
  if (principal.role === Role.ADMIN) return;

  const purchase = await prisma.purchase.findFirst({
    where: {
      userId: principal.id,
      courseId,
      status: PurchaseStatus.APPROVED,
      deletedAt: null,
    },
  });

  if (!purchase) {
    throw new ForbiddenException('No tenés acceso a este curso');
  }
}

/**
 * Resolves a lesson to its course and applies the paywall predicate.
 * Returns the lesson row (id + courseId) so callers avoid a second lookup.
 */
export async function assertLessonAccess(
  prisma: PrismaService,
  principal: Principal,
  lessonId: string,
) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { id: true, courseId: true },
  });

  if (!lesson) {
    throw new NotFoundException('Lección no encontrada');
  }

  await assertCourseAccess(prisma, principal, lesson.courseId);
  return lesson;
}