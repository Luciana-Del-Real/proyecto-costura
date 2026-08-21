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
});