import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { NotificationsModule } from '../src/notifications/notifications.module';
import {
  NotificationsService,
  PUSH_DISPATCHER,
  PushDispatcher,
} from '../src/notifications/notifications.service';
import { PushNotificationsService } from '../src/push-notifications/push-notifications.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { Role } from '../src/common/enums';

/**
 * WU2 — Chokepoint push dispatch (isolation contract).
 * createNotification / createNotificationsForAdmins dispatch fire-and-forget
 * through the OPTIONAL PushDispatcher after creation. Push must never break,
 * delay or roll back notification creation; failures are logged and swallowed.
 * DB-free: Prisma and the dispatcher are mocked.
 */

type NotificationRow = {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  link?: string;
};

const makePrismaMock = () => ({
  $transaction: jest.fn(),
  notification: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
  },
  user: {
    findMany: jest.fn(),
  },
});

const makeDispatcherMock = () => ({
  schedule: jest.fn().mockResolvedValue(undefined),
});

/** Lets the event loop reach the check phase so queued setImmediate callbacks run. */
const flushImmediates = () =>
  new Promise<void>((resolve) => setImmediate(resolve));

describe('NotificationsService push dispatch (WU2 chokepoint)', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createNotification', () => {
    it('defers the dispatch past transaction commit and sends after creation', async () => {
      const mockPrisma = makePrismaMock();
      const dispatcher = makeDispatcherMock();
      mockPrisma.$transaction.mockImplementation(async (fn: any) => fn(mockPrisma));
      mockPrisma.notification.create.mockResolvedValue({
        id: 'n-1',
        userId: 'u-1',
        title: 'Título',
        message: 'Mensaje',
        read: false,
      } as NotificationRow);

      const service = new NotificationsService(
        mockPrisma as unknown as PrismaService,
        dispatcher as PushDispatcher,
      );

      const created = await mockPrisma.$transaction(async (tx: any) =>
        service.createNotification('u-1', 'Título', 'Mensaje', tx, '/curso/c-1'),
      );

      // Notification created and transaction committed, but the push is still
      // deferred (setImmediate runs on the next event-loop turn).
      expect(created).toEqual({
        id: 'n-1',
        userId: 'u-1',
        title: 'Título',
        message: 'Mensaje',
        read: false,
      });
      expect(dispatcher.schedule).not.toHaveBeenCalled();

      await flushImmediates();

      expect(dispatcher.schedule).toHaveBeenCalledTimes(1);
      expect(dispatcher.schedule).toHaveBeenCalledWith(
        'u-1',
        'Título',
        'Mensaje',
        '/curso/c-1',
      );
    });

    it('does not dispatch when the notification create fails (rollback sends none)', async () => {
      const mockPrisma = makePrismaMock();
      const dispatcher = makeDispatcherMock();
      mockPrisma.notification.create.mockRejectedValue(
        new Error('tx rollback'),
      );

      const service = new NotificationsService(
        mockPrisma as unknown as PrismaService,
        dispatcher as PushDispatcher,
      );

      await expect(
        service.createNotification(
          'u-1',
          'Título',
          'Mensaje',
          mockPrisma as any,
        ),
      ).rejects.toThrow('tx rollback');

      await flushImmediates();

      expect(dispatcher.schedule).not.toHaveBeenCalled();
    });

    it('still resolves creation when the deferred push send fails (isolation)', async () => {
      const errorSpy = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation(() => undefined);
      const mockPrisma = makePrismaMock();
      const dispatcher = makeDispatcherMock();
      mockPrisma.notification.create.mockResolvedValue({
        id: 'n-1',
        userId: 'u-1',
        title: 'Título',
        message: 'Mensaje',
        read: false,
      } as NotificationRow);
      dispatcher.schedule.mockRejectedValue(
        new Error('push service unavailable'),
      );

      const service = new NotificationsService(
        mockPrisma as unknown as PrismaService,
        dispatcher as PushDispatcher,
      );

      const notification = await service.createNotification(
        'u-1',
        'Título',
        'Mensaje',
      );

      // The caller's request already succeeded before the deferred send fails.
      expect(notification).toEqual({
        id: 'n-1',
        userId: 'u-1',
        title: 'Título',
        message: 'Mensaje',
        read: false,
      });
      expect(dispatcher.schedule).not.toHaveBeenCalled();

      await flushImmediates();

      expect(dispatcher.schedule).toHaveBeenCalledTimes(1);
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Push dispatch failed'),
        expect.any(Error),
      );
    });

    it('works without a dispatcher (optional seam keeps direct constructions green)', async () => {
      const mockPrisma = makePrismaMock();
      mockPrisma.notification.create.mockResolvedValue({
        id: 'n-1',
        userId: 'u-1',
        title: 'Título',
        message: 'Mensaje',
        read: false,
      } as NotificationRow);

      const service = new NotificationsService(
        mockPrisma as unknown as PrismaService,
      );

      const notification = await service.createNotification(
        'u-1',
        'Título',
        'Mensaje',
      );

      expect(notification).toEqual({
        id: 'n-1',
        userId: 'u-1',
        title: 'Título',
        message: 'Mensaje',
        read: false,
      });
      await flushImmediates();
    });
  });

  describe('createNotificationsForAdmins', () => {
    it('dispatches once per admin notification (fan-out) and keeps returning the count', async () => {
      const mockPrisma = makePrismaMock();
      const dispatcher = makeDispatcherMock();
      mockPrisma.user.findMany.mockResolvedValue([
        { id: 'admin-1' },
        { id: 'admin-2' },
      ]);
      mockPrisma.notification.create.mockResolvedValue({
        id: 'n-x',
        userId: 'admin-x',
        title: 'Nueva consulta',
        message: 'Mensaje',
        read: false,
      } as NotificationRow);

      const service = new NotificationsService(
        mockPrisma as unknown as PrismaService,
        dispatcher as PushDispatcher,
      );

      const count = await service.createNotificationsForAdmins(
        'Nueva consulta',
        'Mensaje',
        undefined,
        '/admin#consultas',
      );

      expect(count).toBe(2);
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: { role: Role.ADMIN },
        select: { id: true },
      });
      expect(mockPrisma.notification.create).toHaveBeenCalledTimes(2);
      expect(dispatcher.schedule).not.toHaveBeenCalled();

      await flushImmediates();

      expect(dispatcher.schedule).toHaveBeenCalledTimes(2);
      expect(dispatcher.schedule).toHaveBeenCalledWith(
        'admin-1',
        'Nueva consulta',
        'Mensaje',
        '/admin#consultas',
      );
      expect(dispatcher.schedule).toHaveBeenCalledWith(
        'admin-2',
        'Nueva consulta',
        'Mensaje',
        '/admin#consultas',
      );
    });

    it('dispatches nothing when there are no admins', async () => {
      const mockPrisma = makePrismaMock();
      const dispatcher = makeDispatcherMock();
      mockPrisma.user.findMany.mockResolvedValue([]);

      const service = new NotificationsService(
        mockPrisma as unknown as PrismaService,
        dispatcher as PushDispatcher,
      );

      const count = await service.createNotificationsForAdmins('Título', 'Mensaje');

      expect(count).toBe(0);
      await flushImmediates();
      expect(dispatcher.schedule).not.toHaveBeenCalled();
    });
  });
});

describe('PUSH_DISPATCHER module wiring (payload derivation)', () => {
  const mockPrisma = makePrismaMock();
  const pushServiceMock = {
    sendToUser: jest.fn().mockResolvedValue(undefined),
  };

  let service: NotificationsService;
  let dispatcher: PushDispatcher;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [NotificationsModule, ConfigModule.forRoot({ isGlobal: true })],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .overrideProvider(PushNotificationsService)
      .useValue(pushServiceMock)
      .compile();

    service = moduleRef.get(NotificationsService);
    dispatcher = moduleRef.get(PUSH_DISPATCHER);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('derives the payload with url from the link (notification with link)', async () => {
    await dispatcher.schedule('u-1', 'Título', 'Mensaje', '/curso/c-1');

    expect(pushServiceMock.sendToUser).toHaveBeenCalledTimes(1);
    expect(pushServiceMock.sendToUser).toHaveBeenCalledWith('u-1', {
      title: 'Título',
      body: 'Mensaje',
      data: { url: '/curso/c-1' },
    });
  });

  it('omits data.url when the notification has no link', async () => {
    await dispatcher.schedule('u-2', 'Título', 'Mensaje');

    expect(pushServiceMock.sendToUser).toHaveBeenCalledWith('u-2', {
      title: 'Título',
      body: 'Mensaje',
    });
  });

  it('wires the seam end-to-end: createNotification triggers a push via the real service', async () => {
    mockPrisma.notification.create.mockResolvedValue({
      id: 'n-1',
      userId: 'u-1',
      title: 'Título',
      message: 'Mensaje',
      read: false,
    } as NotificationRow);

    await service.createNotification('u-1', 'Título', 'Mensaje', undefined, '/curso/c-1');
    await flushImmediates();

    expect(pushServiceMock.sendToUser).toHaveBeenCalledTimes(1);
    expect(pushServiceMock.sendToUser).toHaveBeenCalledWith('u-1', {
      title: 'Título',
      body: 'Mensaje',
      data: { url: '/curso/c-1' },
    });
  });
});