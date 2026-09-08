import { ForbiddenException, NotFoundException } from '@nestjs/common';
import * as webpush from 'web-push';
import { PushNotificationsService } from '../src/push-notifications/push-notifications.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { VapidConfig } from '../src/push-notifications/vapid.config';
import { Role } from '../src/common/enums';

jest.mock('web-push', () => ({
  setVapidDetails: jest.fn(),
  sendNotification: jest.fn(),
}));

const mockSend = webpush.sendNotification as jest.Mock;

/**
 * Focused tests for WU1 (web-push-notifications): subscription upsert by
 * endpoint, owner/admin DELETE boundary, per-target fan-out, 404/410 pruning
 * mid-fan-out, and send-failure isolation. DB-free: Prisma and web-push are
 * mocked.
 */
describe('PushNotificationsService', () => {
  const mockPrisma = {
    pushSubscription: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const vapid: VapidConfig = {
    publicKey: 'public-key',
    privateKey: 'private-key',
    subject: 'mailto:push@test.local',
  };

  const dto = {
    endpoint: 'https://push.example.com/device-1',
    keys: { p256dh: 'p256dh-key', auth: 'auth-secret' },
    userAgent: 'Mozilla/5.0',
  };

  const owner = { id: 'user-1', role: Role.ALUMNO };
  const admin = { id: 'user-2', role: Role.ADMIN };
  const other = { id: 'user-3', role: Role.ALUMNO };

  let service: PushNotificationsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PushNotificationsService(
      mockPrisma as unknown as PrismaService,
      vapid,
    );
  });

  it('registers VAPID details once at construction', () => {
    expect(webpush.setVapidDetails).toHaveBeenCalledWith(
      'mailto:push@test.local',
      'public-key',
      'private-key',
    );
  });

  describe('upsertSubscription', () => {
    it('creates a row for a new endpoint with the user keys and agent', async () => {
      mockPrisma.pushSubscription.upsert.mockResolvedValue({ id: 'sub-1' });

      await service.upsertSubscription('user-1', dto);

      expect(mockPrisma.pushSubscription.upsert).toHaveBeenCalledWith({
        where: { endpoint: dto.endpoint },
        update: {
          userId: 'user-1',
          p256dh: dto.keys.p256dh,
          auth: dto.keys.auth,
          userAgent: dto.userAgent,
        },
        create: {
          userId: 'user-1',
          endpoint: dto.endpoint,
          p256dh: dto.keys.p256dh,
          auth: dto.keys.auth,
          userAgent: dto.userAgent,
        },
      });
    });

    it('upserts instead of duplicating when the endpoint already exists', async () => {
      mockPrisma.pushSubscription.upsert.mockResolvedValue({ id: 'sub-1' });

      await service.upsertSubscription('user-1', dto);
      await service.upsertSubscription('user-1', dto);

      expect(mockPrisma.pushSubscription.upsert).toHaveBeenCalledTimes(2);
    });

    it('omits userAgent from both branches when not provided', async () => {
      mockPrisma.pushSubscription.upsert.mockResolvedValue({ id: 'sub-1' });

      const { userAgent: _userAgent, ...dtoWithoutAgent } = dto;
      await service.upsertSubscription('user-1', dtoWithoutAgent);

      const call = mockPrisma.pushSubscription.upsert.mock.calls[0][0];
      expect(call.update).not.toHaveProperty('userAgent');
      expect(call.create).not.toHaveProperty('userAgent');
    });

    it('reassigns the owner on upsert to heal a raced logout', async () => {
      mockPrisma.pushSubscription.upsert.mockResolvedValue({ id: 'sub-1' });

      await service.upsertSubscription('user-9', dto);

      const call = mockPrisma.pushSubscription.upsert.mock.calls[0][0];
      expect(call.update.userId).toBe('user-9');
      expect(call.create.userId).toBe('user-9');
    });
  });

  describe('deleteSubscription', () => {
    it('allows the owner to delete their subscription', async () => {
      mockPrisma.pushSubscription.findUnique.mockResolvedValue({
        id: 'sub-1',
        userId: 'user-1',
      });
      mockPrisma.pushSubscription.delete.mockResolvedValue({ id: 'sub-1' });

      await service.deleteSubscription(dto.endpoint, owner);

      expect(mockPrisma.pushSubscription.delete).toHaveBeenCalledWith({
        where: { endpoint: dto.endpoint },
      });
    });

    it('allows an admin to delete any subscription', async () => {
      mockPrisma.pushSubscription.findUnique.mockResolvedValue({
        id: 'sub-1',
        userId: 'user-1',
      });

      await service.deleteSubscription(dto.endpoint, admin);

      expect(mockPrisma.pushSubscription.delete).toHaveBeenCalled();
    });

    it('rejects a non-owner with 403 and does not delete', async () => {
      mockPrisma.pushSubscription.findUnique.mockResolvedValue({
        id: 'sub-1',
        userId: 'user-1',
      });

      await expect(
        service.deleteSubscription(dto.endpoint, other),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(mockPrisma.pushSubscription.delete).not.toHaveBeenCalled();
    });

    it('throws 404 when the endpoint is not stored', async () => {
      mockPrisma.pushSubscription.findUnique.mockResolvedValue(null);

      await expect(
        service.deleteSubscription('https://push.example.com/missing', owner),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('sendToUser fan-out', () => {
    const subscriptions = [
      {
        id: 'sub-1',
        userId: 'user-1',
        endpoint: 'https://push.example.com/device-1',
        p256dh: 'p256dh-1',
        auth: 'auth-1',
      },
      {
        id: 'sub-2',
        userId: 'user-1',
        endpoint: 'https://push.example.com/device-2',
        p256dh: 'p256dh-2',
        auth: 'auth-2',
      },
    ];

    const payload = {
      title: 'Nueva consulta',
      body: 'Ana preguntó en la lección "Lección 1"',
      data: { url: '/curso/c-1' },
    };

    beforeEach(() => {
      mockPrisma.pushSubscription.findMany.mockResolvedValue(subscriptions);
    });

    it('sends one push per subscription with the mapped keys and payload', async () => {
      mockSend.mockResolvedValue(undefined);

      await service.sendToUser('user-1', payload);

      expect(mockPrisma.pushSubscription.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
      expect(mockSend).toHaveBeenCalledTimes(2);
      expect(mockSend).toHaveBeenCalledWith(
        {
          endpoint: 'https://push.example.com/device-1',
          keys: { p256dh: 'p256dh-1', auth: 'auth-1' },
        },
        JSON.stringify(payload),
      );
      expect(mockSend).toHaveBeenCalledWith(
        {
          endpoint: 'https://push.example.com/device-2',
          keys: { p256dh: 'p256dh-2', auth: 'auth-2' },
        },
        JSON.stringify(payload),
      );
    });

    it('prunes an expired subscription (410) and keeps fanning out', async () => {
      mockSend
        .mockRejectedValueOnce({ statusCode: 410 })
        .mockResolvedValueOnce(undefined);

      await service.sendToUser('user-1', payload);

      expect(mockPrisma.pushSubscription.delete).toHaveBeenCalledTimes(1);
      expect(mockPrisma.pushSubscription.delete).toHaveBeenCalledWith({
        where: { id: 'sub-1' },
      });
      expect(mockSend).toHaveBeenCalledTimes(2);
    });

    it('prunes a 404 endpoint as well', async () => {
      mockSend.mockRejectedValueOnce({ statusCode: 404 });

      await service.sendToUser('user-1', payload);

      expect(mockPrisma.pushSubscription.delete).toHaveBeenCalledWith({
        where: { id: 'sub-1' },
      });
    });

    it('logs and swallows non-expired send errors without pruning', async () => {
      mockSend
        .mockRejectedValueOnce(new Error('network down'))
        .mockResolvedValueOnce(undefined);

      await expect(service.sendToUser('user-1', payload)).resolves.toBeUndefined();

      expect(mockPrisma.pushSubscription.delete).not.toHaveBeenCalled();
      expect(mockSend).toHaveBeenCalledTimes(2);
    });

    it('sends nothing when the user has no subscriptions', async () => {
      mockPrisma.pushSubscription.findMany.mockResolvedValue([]);

      await service.sendToUser('user-1', payload);

      expect(mockSend).not.toHaveBeenCalled();
    });
  });
});