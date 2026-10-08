import { NotFoundException } from '@nestjs/common';
import { CertificateRequestsService } from '../src/certificate-requests/certificate-requests.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { NotificationsService } from '../src/notifications/notifications.service';
import { CertificateRequestStatus, Role } from '../src/common/enums';

/**
 * Detalle de una solicitud de certificado para el admin: mezcla el progreso
 * lección por lección (con su evidencia) y los comentarios de la alumna en el
 * curso. DB-free: PrismaService mockeado en el borde del service.
 */
describe('CertificateRequestsService#findDetailForAdmin', () => {
  const mockPrisma = {
    certificateRequest: { findUnique: jest.fn() },
    lesson: { findMany: jest.fn() },
    lessonProgress: { findMany: jest.fn() },
    lessonComment: { findMany: jest.fn() },
  };
  const notifications = {} as unknown as NotificationsService;

  let service: CertificateRequestsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CertificateRequestsService(
      mockPrisma as unknown as PrismaService,
      notifications,
    );
  });

  it('lanza 404 si la solicitud no existe', async () => {
    mockPrisma.certificateRequest.findUnique.mockResolvedValue(null);

    await expect(service.findDetailForAdmin('cr-ghost')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('mergea lecciones con su evidencia y los comentarios de la alumna', async () => {
    mockPrisma.certificateRequest.findUnique.mockResolvedValue({
      id: 'cr-1',
      userId: 'u-1',
      courseId: 'c-1',
      status: CertificateRequestStatus.PENDING,
      createdAt: new Date('2026-01-01T00:00:00Z'),
      sentAt: null,
      user: { id: 'u-1', name: 'Ana', email: 'ana@test.local' },
      course: { id: 'c-1', title: 'Curso de prueba' },
    });
    mockPrisma.lesson.findMany.mockResolvedValue([
      { id: 'l-1', title: 'Lección 1', order: 1 },
      { id: 'l-2', title: 'Lección 2', order: 2 },
    ]);
    mockPrisma.lessonProgress.findMany.mockResolvedValue([
      {
        lessonId: 'l-1',
        completed: true,
        evidenceImage: '/uploads/progress/img-1.jpg',
        evidenceNote: 'Lista',
      },
    ]);
    mockPrisma.lessonComment.findMany.mockResolvedValue([
      {
        id: 'com-1',
        message: '¿Está bien así?',
        user: { id: 'u-1', name: 'Ana', role: Role.ALUMNO },
        lesson: { id: 'l-1', title: 'Lección 1', order: 1 },
      },
    ]);

    const result = await service.findDetailForAdmin('cr-1');

    expect(result.request.id).toBe('cr-1');
    expect(result.student.name).toBe('Ana');
    expect(result.course.title).toBe('Curso de prueba');
    expect(result.lessons).toEqual([
      {
        id: 'l-1',
        title: 'Lección 1',
        order: 1,
        completed: true,
        evidenceImage: '/uploads/progress/img-1.jpg',
        evidenceNote: 'Lista',
      },
      {
        id: 'l-2',
        title: 'Lección 2',
        order: 2,
        completed: false,
        evidenceImage: null,
        evidenceNote: null,
      },
    ]);
    expect(result.comments).toHaveLength(1);
  });
});
