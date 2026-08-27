import { NotFoundException } from '@nestjs/common';
import { LessonCommentsService } from '../src/lesson-comments/lesson-comments.service';
import { NotificationsService } from '../src/notifications/notifications.service';
import { PurchasesService } from '../src/purchases/purchases.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { Role, PurchaseStatus } from '../src/common/enums';

/**
 * Notification flows for the bell (campanita), DB-free (Prisma mocked):
 * (a) solicitud de compra -> notifica a todos los admins;
 * (b) comentario de alumna en una lección -> notifica a los admins;
 * (c) respuesta de la profesora con parentId -> notifica a la autora del
 *     comentario padre.
 *
 * El NotificationsService real se inyecta (con el mismo mock de prisma) para
 * ejercitar createNotificationsForAdmins tal como se usa en producción.
 */
describe('Notification flows (purchase request + lesson comments)', () => {
  const admins = [{ id: 'admin-1' }, { id: 'admin-2' }];

  const mockPrisma = {
    $transaction: jest.fn(),
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    course: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    purchase: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    lesson: {
      findUnique: jest.fn(),
    },
    lessonComment: {
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
    },
    notification: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
  };

  // El tx es el mismo mock, así `tx.<model>` resuelve igual que `prisma.<model>`.
  mockPrisma.$transaction.mockImplementation(async (fn: any) => fn(mockPrisma));

  const notificationsService = new NotificationsService(
    mockPrisma as unknown as PrismaService,
  );
  const lessonCommentsService = new LessonCommentsService(
    mockPrisma as unknown as PrismaService,
    notificationsService,
  );
  const purchasesService = new PurchasesService(
    mockPrisma as unknown as PrismaService,
    notificationsService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.$transaction.mockImplementation(async (fn: any) => fn(mockPrisma));

    // assertAccess: lección resuelta (id + courseId) y compra aprobada del alumno.
    mockPrisma.lesson.findUnique.mockImplementation((args: any) =>
      args.select?.course
        ? Promise.resolve({
            id: 'l-1',
            title: 'Lección 1',
            course: { title: 'Curso de prueba', id: 'c-1' },
          })
        : Promise.resolve({ id: 'l-1', courseId: 'c-1' }),
    );
    mockPrisma.purchase.findFirst.mockResolvedValue({
      id: 'p-1',
      status: PurchaseStatus.APPROVED,
      deletedAt: null,
    });
  });

  describe('(a) requestPurchase notifica a los admins', () => {
    it('crea la compra y una notificación por cada admin, en la misma transacción', async () => {
      mockPrisma.course.findUnique.mockResolvedValue({
        id: 'c-1',
        title: 'Curso de prueba',
        priceARS: 100,
        priceAUD: 10,
      });
      mockPrisma.purchase.findUnique.mockResolvedValue(null); // sin solicitud previa
      mockPrisma.user.findUnique.mockResolvedValue({ country: 'ARS', name: 'Ana' });
      mockPrisma.user.findMany.mockResolvedValue(admins);
      mockPrisma.purchase.create.mockResolvedValue({ id: 'p-1' });

      await purchasesService.requestPurchase('u-1', { courseId: 'c-1' });

      expect(mockPrisma.purchase.create).toHaveBeenCalled();
      expect(mockPrisma.notification.create).toHaveBeenCalledTimes(2);
      expect(mockPrisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: 'admin-1',
          title: 'Nueva solicitud de curso',
          message: expect.stringContaining('Ana'),
          read: false,
          link: '/admin/solicitudes?highlight=p-1',
        },
      });
      expect(mockPrisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: 'admin-2',
          title: 'Nueva solicitud de curso',
          message: expect.stringContaining('Curso de prueba'),
          read: false,
          link: '/admin/solicitudes?highlight=p-1',
        },
      });
    });
  });

  describe('(b) comentario de alumna notifica a los admins', () => {
    it('crea el comentario y una notificación por admin', async () => {
      mockPrisma.user.findMany.mockResolvedValue(admins);
      mockPrisma.user.findUnique.mockResolvedValue({ name: 'Ana' });
      mockPrisma.lessonComment.create.mockResolvedValue({
        id: 'c-1',
        message: '¿Cómo hago el dobladillo?',
        user: { id: 'u-1', name: 'Ana', role: Role.ALUMNO },
      });

      const result = await lessonCommentsService.create(
        'l-1',
        'u-1',
        Role.ALUMNO,
        '¿Cómo hago el dobladillo?',
      );

      expect(result.id).toBe('c-1');
      expect(mockPrisma.notification.create).toHaveBeenCalledTimes(2);
      expect(mockPrisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: 'admin-1',
          title: 'Nueva consulta',
          message: expect.stringContaining('Ana'),
          read: false,
          link: '/admin#consultas',
        },
      });
    });

    it('no notifica si no hay admins en el sistema', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.user.findUnique.mockResolvedValue({ name: 'Ana' });
      mockPrisma.lessonComment.create.mockResolvedValue({ id: 'c-1' });

      await lessonCommentsService.create('l-1', 'u-1', Role.ALUMNO, 'Hola');

      expect(mockPrisma.notification.create).not.toHaveBeenCalled();
    });
  });

  describe('(c) respuesta de admin con parentId notifica a la autora del padre', () => {
    it('notifica al autor del comentario padre y no a los admins', async () => {
      mockPrisma.lessonComment.findUnique.mockResolvedValue({
        id: 'c-parent',
        lessonId: 'l-1',
        userId: 'u-alumna',
      });
      mockPrisma.lessonComment.create.mockResolvedValue({
        id: 'c-reply',
        message: 'Fijate acá.',
        user: { id: 'u-admin', name: 'Daiana', role: Role.ADMIN },
      });

      const result = await lessonCommentsService.create(
        'l-1',
        'u-admin',
        Role.ADMIN,
        'Fijate acá.',
        'c-parent',
      );

      expect(result.id).toBe('c-reply');
      // Solo la notificación a la alumna (no createNotificationsForAdmins).
      expect(mockPrisma.notification.create).toHaveBeenCalledTimes(1);
      expect(mockPrisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: 'u-alumna',
          title: 'Daiana respondió tu consulta',
          message: expect.stringContaining('Lección 1'),
          read: false,
          link: '/curso/c-1#lesson-l-1',
        },
      });
      expect(mockPrisma.user.findMany).not.toHaveBeenCalled();
    });

    it('un comentario de admin sin parentId no genera ninguna notificación', async () => {
      mockPrisma.lessonComment.create.mockResolvedValue({
        id: 'c-x',
        message: 'Bienvenidas',
        user: { id: 'u-admin', name: 'Daiana', role: Role.ADMIN },
      });

      await lessonCommentsService.create('l-1', 'u-admin', Role.ADMIN, 'Bienvenidas');

      expect(mockPrisma.notification.create).not.toHaveBeenCalled();
      expect(mockPrisma.user.findMany).not.toHaveBeenCalled();
    });

    it('lanza NotFoundException si el padre pertenece a otra lección y no crea nada', async () => {
      mockPrisma.lessonComment.findUnique.mockResolvedValue({
        id: 'c-parent',
        lessonId: 'l-OTRA',
        userId: 'u-alumna',
      });

      await expect(
        lessonCommentsService.create('l-1', 'u-admin', Role.ADMIN, 'Hola', 'c-parent'),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(mockPrisma.lessonComment.create).not.toHaveBeenCalled();
      expect(mockPrisma.notification.create).not.toHaveBeenCalled();
    });

    it('lanza NotFoundException si el padre no existe', async () => {
      mockPrisma.lessonComment.findUnique.mockResolvedValue(null);

      await expect(
        lessonCommentsService.create('l-1', 'u-admin', Role.ADMIN, 'Hola', 'c-ghost'),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(mockPrisma.lessonComment.create).not.toHaveBeenCalled();
      expect(mockPrisma.notification.create).not.toHaveBeenCalled();
    });
  });

  describe('(e) create con imagen adjunta', () => {
    it('pasa data.image al create cuando el comentario trae una imagen', async () => {
      mockPrisma.user.findMany.mockResolvedValue(admins);
      mockPrisma.user.findUnique.mockResolvedValue({ name: 'Ana' });
      mockPrisma.lessonComment.create.mockResolvedValue({
        id: 'c-img',
        message: 'Acá va la foto',
        image: '/uploads/comments/image-1720000000000-123.jpg',
        user: { id: 'u-1', name: 'Ana', role: Role.ALUMNO },
      });

      const result = await lessonCommentsService.create(
        'l-1',
        'u-1',
        Role.ALUMNO,
        'Acá va la foto',
        undefined,
        '/uploads/comments/image-1720000000000-123.jpg',
      );

      expect(mockPrisma.lessonComment.create).toHaveBeenCalledWith({
        data: {
          lessonId: 'l-1',
          userId: 'u-1',
          message: 'Acá va la foto',
          image: '/uploads/comments/image-1720000000000-123.jpg',
        },
        include: {
          user: { select: { id: true, name: true, role: true } },
        },
      });
      expect(result.image).toBe('/uploads/comments/image-1720000000000-123.jpg');
    });

    it('omite la clave image del create cuando el comentario no trae imagen', async () => {
      mockPrisma.user.findMany.mockResolvedValue(admins);
      mockPrisma.user.findUnique.mockResolvedValue({ name: 'Ana' });
      mockPrisma.lessonComment.create.mockResolvedValue({
        id: 'c-noimg',
        message: 'Sin foto',
        user: { id: 'u-1', name: 'Ana', role: Role.ALUMNO },
      });

      await lessonCommentsService.create('l-1', 'u-1', Role.ALUMNO, 'Sin foto');

      expect(mockPrisma.lessonComment.create).toHaveBeenCalledWith({
        data: {
          lessonId: 'l-1',
          userId: 'u-1',
          message: 'Sin foto',
        },
        include: {
          user: { select: { id: true, name: true, role: true } },
        },
      });
    });
  });

  describe('(d) findAllForAdmin devuelve todos los comentarios con sus includes', () => {
    it('consulta con los includes esperados (usuario, lección y curso) y orden asc', async () => {
      const comment = {
        id: 'c-1',
        message: '¿Cómo hago el dobladillo?',
        parentId: null,
        createdAt: new Date('2026-01-01T10:00:00Z'),
        user: { id: 'u-1', name: 'Ana', role: Role.ALUMNO },
        lesson: {
          id: 'l-1',
          title: 'Lección 1',
          course: { id: 'c-1', title: 'Curso de prueba' },
        },
      };
      mockPrisma.lessonComment.findMany.mockResolvedValue([comment]);

      const result = await lessonCommentsService.findAllForAdmin();

      expect(mockPrisma.lessonComment.findMany).toHaveBeenCalledWith({
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
      expect(result).toEqual([comment]);
      expect(result[0].lesson.course.title).toBe('Curso de prueba');
      expect(result[0].user.role).toBe(Role.ALUMNO);
    });

    it('devuelve lista vacía cuando no hay comentarios', async () => {
      mockPrisma.lessonComment.findMany.mockResolvedValue([]);

      const result = await lessonCommentsService.findAllForAdmin();

      expect(result).toEqual([]);
    });
  });
});
