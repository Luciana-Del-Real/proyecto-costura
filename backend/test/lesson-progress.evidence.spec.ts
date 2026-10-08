import { BadRequestException } from '@nestjs/common';
import { LessonProgressService } from '../src/lesson-progress/lesson-progress.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { PurchaseStatus } from '../src/common/enums';

/**
 * Reglas de evidencia al completar una lección (feature
 * lesson-evidence-and-student-comments):
 * - completar exige una imagen (nueva o ya guardada), si no -> 400;
 * - con imagen se persisten evidenceImage + evidenceNote y completed=true;
 * - des-completar conserva la evidencia previa.
 *
 * DB-free: PrismaService se mockea en el borde del service.
 */
describe('LessonProgressService#markLessonComplete (evidencia)', () => {
  const lesson = {
    id: 'l-1',
    courseId: 'c-1',
    order: 2,
    course: { id: 'c-1', title: 'Curso de prueba' },
  };

  const mockPrisma = {
    lesson: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    purchase: {
      findFirst: jest.fn(),
    },
    lessonProgress: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  };

  let service: LessonProgressService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new LessonProgressService(mockPrisma as unknown as PrismaService);

    // Lección existente + compra aprobada + sin lección anterior (evita la
    // regla secuencial para aislar la regla de evidencia).
    mockPrisma.lesson.findUnique.mockResolvedValue(lesson);
    mockPrisma.lesson.findFirst.mockResolvedValue(null);
    mockPrisma.purchase.findFirst.mockResolvedValue({
      id: 'p-1',
      status: PurchaseStatus.APPROVED,
      deletedAt: null,
    });
    mockPrisma.lessonProgress.upsert.mockImplementation(async (args: any) => {
      const existing = await mockPrisma.lessonProgress.findUnique();
      return existing ? { ...existing, ...args.update } : { ...args.create };
    });
  });

  it('rechaza completar sin imagen ni evidencia previa', async () => {
    mockPrisma.lessonProgress.findUnique.mockResolvedValue(null);

    await expect(
      service.markLessonComplete('u-1', 'l-1', { completed: true }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(mockPrisma.lessonProgress.upsert).not.toHaveBeenCalled();
  });

  it('guarda la imagen y la nota al completar', async () => {
    mockPrisma.lessonProgress.findUnique.mockResolvedValue(null);

    const result = await service.markLessonComplete('u-1', 'l-1', {
      completed: true,
      image: '/uploads/progress/image-1.jpg',
      note: 'Muestra terminada',
    });

    expect(mockPrisma.lessonProgress.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: {
          completed: true,
          evidenceImage: '/uploads/progress/image-1.jpg',
          evidenceNote: 'Muestra terminada',
        },
        create: expect.objectContaining({
          userId: 'u-1',
          lessonId: 'l-1',
          completed: true,
          evidenceImage: '/uploads/progress/image-1.jpg',
          evidenceNote: 'Muestra terminada',
        }),
      }),
    );
    expect(result.completed).toBe(true);
    expect(result.evidenceImage).toBe('/uploads/progress/image-1.jpg');
  });

  it('conserva la imagen previa si se completa sin subir una nueva', async () => {
    mockPrisma.lessonProgress.findUnique.mockResolvedValue({
      id: 'lp-1',
      userId: 'u-1',
      lessonId: 'l-1',
      completed: false,
      evidenceImage: '/uploads/progress/old.jpg',
      evidenceNote: 'nota vieja',
    });

    await service.markLessonComplete('u-1', 'l-1', { completed: true });

    expect(mockPrisma.lessonProgress.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: {
          completed: true,
          evidenceImage: '/uploads/progress/old.jpg',
          evidenceNote: 'nota vieja',
        },
      }),
    );
  });

  it('des-completar setea completed=false y conserva la evidencia', async () => {
    mockPrisma.lessonProgress.findUnique.mockResolvedValue({
      id: 'lp-1',
      userId: 'u-1',
      lessonId: 'l-1',
      completed: true,
      evidenceImage: '/uploads/progress/image-1.jpg',
      evidenceNote: 'Muestra terminada',
    });

    const result = await service.markLessonComplete('u-1', 'l-1', {
      completed: false,
    });

    expect(mockPrisma.lessonProgress.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: { completed: false },
      }),
    );
    expect(result.completed).toBe(false);
    expect(result.evidenceImage).toBe('/uploads/progress/image-1.jpg');
  });
});
