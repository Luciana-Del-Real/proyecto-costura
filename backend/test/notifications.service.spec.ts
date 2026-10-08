import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { NotificationsService } from '../src/notifications/notifications.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { Role } from '../src/common/enums';

/**
 * Focused tests for task 3.2 (access-control-ownership spec):
 * notification read/delete (`PATCH :id/read`, `DELETE :id`) allows only the
 * owner or an admin; anyone else gets 403. DB-free: Prisma is mocked.
 */
describe('NotificationsService ownership (read/delete)', () => {
  const mockPrisma = {
    notification: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      create: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
    },
  };

  let service: NotificationsService;

  const owner = { id: 'user-1', role: Role.ALUMNO };
  const admin = { id: 'user-2', role: Role.ADMIN };
  const other = { id: 'user-3', role: Role.ALUMNO };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new NotificationsService(mockPrisma as unknown as PrismaService);
  });

  describe('markAsRead', () => {
    it('allows the owner to mark their own notification as read', async () => {
      mockPrisma.notification.findUnique.mockResolvedValue({
        id: 'n-1',
        userId: 'user-1',
        read: false,
      });
      mockPrisma.notification.update.mockResolvedValue({ id: 'n-1', read: true });

      const result = await service.markAsRead('n-1', owner);

      expect(result).toEqual({ id: 'n-1', read: true });
      expect(mockPrisma.notification.update).toHaveBeenCalled();
    });

    it('allows an admin to mark any notification as read', async () => {
      mockPrisma.notification.findUnique.mockResolvedValue({
        id: 'n-1',
        userId: 'user-1',
        read: false,
      });
      mockPrisma.notification.update.mockResolvedValue({ id: 'n-1', read: true });

      const result = await service.markAsRead('n-1', admin);

      expect(result).toEqual({ id: 'n-1', read: true });
    });

    it('rejects a non-owner with 403 and does not mutate the notification', async () => {
      mockPrisma.notification.findUnique.mockResolvedValue({
        id: 'n-1',
        userId: 'user-1',
        read: false,
      });

      await expect(service.markAsRead('n-1', other)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(mockPrisma.notification.update).not.toHaveBeenCalled();
    });

    it('throws 404 when the notification does not exist', async () => {
      mockPrisma.notification.findUnique.mockResolvedValue(null);

      await expect(service.markAsRead('n-missing', owner)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('deleteNotification', () => {
    it('allows the owner to delete their own notification', async () => {
      mockPrisma.notification.findUnique.mockResolvedValue({
        id: 'n-1',
        userId: 'user-1',
      });
      mockPrisma.notification.delete.mockResolvedValue({ id: 'n-1' });

      const result = await service.deleteNotification('n-1', owner);

      expect(result).toEqual({ id: 'n-1' });
      expect(mockPrisma.notification.delete).toHaveBeenCalled();
    });

    it('rejects a non-owner with 403 and does not delete the notification', async () => {
      mockPrisma.notification.findUnique.mockResolvedValue({
        id: 'n-1',
        userId: 'user-1',
      });

      await expect(service.deleteNotification('n-1', other)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(mockPrisma.notification.delete).not.toHaveBeenCalled();
    });

    it('throws 404 when the notification does not exist', async () => {
      mockPrisma.notification.findUnique.mockResolvedValue(null);

      await expect(
        service.deleteNotification('n-missing', owner),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('createNotificationsForAdmins', () => {
    it('creates one notification per admin and returns the admin count', async () => {
      mockPrisma.user.findMany.mockResolvedValue([{ id: 'admin-1' }, { id: 'admin-2' }]);

      const count = await service.createNotificationsForAdmins(
        'Nueva consulta',
        'Ana preguntó en la lección "Lección 1" del curso "Curso".',
      );

      expect(count).toBe(2);
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: { role: Role.ADMIN },
        select: { id: true },
      });
      expect(mockPrisma.notification.create).toHaveBeenCalledTimes(2);
      expect(mockPrisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: 'admin-1',
          title: 'Nueva consulta',
          message: 'Ana preguntó en la lección "Lección 1" del curso "Curso".',
          read: false,
        },
      });
      expect(mockPrisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: 'admin-2',
          title: 'Nueva consulta',
          message: 'Ana preguntó en la lección "Lección 1" del curso "Curso".',
          read: false,
        },
      });
    });

    it('creates no notifications when there are no admins', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);

      const count = await service.createNotificationsForAdmins('Título', 'Mensaje');

      expect(count).toBe(0);
      expect(mockPrisma.notification.create).not.toHaveBeenCalled();
    });

    it('uses the provided transaction client when one is given', async () => {
      const tx = {
        user: { findMany: jest.fn().mockResolvedValue([{ id: 'admin-1' }]) },
        notification: { create: jest.fn() },
      };

      const count = await service.createNotificationsForAdmins(
        'Título',
        'Mensaje',
        tx as any,
      );

      expect(count).toBe(1);
      expect(tx.user.findMany).toHaveBeenCalled();
      expect(tx.notification.create).toHaveBeenCalledTimes(1);
      expect(mockPrisma.user.findMany).not.toHaveBeenCalled();
      expect(mockPrisma.notification.create).not.toHaveBeenCalled();
    });

    it('persists the link on each notification when one is provided', async () => {
      mockPrisma.user.findMany.mockResolvedValue([{ id: 'admin-1' }]);

      await service.createNotificationsForAdmins(
        'Título',
        'Mensaje',
        undefined,
        '/admin/ventas',
      );

      expect(mockPrisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: 'admin-1',
          title: 'Título',
          message: 'Mensaje',
          read: false,
          link: '/admin/ventas',
        },
      });
    });
  });

  describe('createNotification', () => {
    it('persists the link when one is provided', async () => {
      mockPrisma.notification.create.mockResolvedValue({ id: 'n-1' });

      await service.createNotification('u-1', 'Título', 'Mensaje', undefined, '/curso/c-1');

      expect(mockPrisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: 'u-1',
          title: 'Título',
          message: 'Mensaje',
          read: false,
          link: '/curso/c-1',
        },
      });
    });

    it('omits the link when none is provided', async () => {
      mockPrisma.notification.create.mockResolvedValue({ id: 'n-1' });

      await service.createNotification('u-1', 'Título', 'Mensaje');

      expect(mockPrisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: 'u-1',
          title: 'Título',
          message: 'Mensaje',
          read: false,
        },
      });
    });
  });
});