import { ForbiddenException } from '@nestjs/common';
import { PatternPurchasesService } from '../src/pattern-purchases/pattern-purchases.service';
import { PatternPurchasesController } from '../src/pattern-purchases/pattern-purchases.controller';
import { PrismaService } from '../src/prisma/prisma.service';
import { PurchaseStatus, Role } from '../src/common/enums';
import { Principal } from '../src/common/principal';

/**
 * Admin sales-history spec for pattern purchases (task: pattern sales in the
 * admin "Historial de ventas").
 * - getAllPurchases() mirrors getPendingRequests() but WITHOUT a status filter
 *   and ordered by createdAt desc, so the panel can show every purchase.
 * Runs without a database: PrismaService is mocked at the service boundary.
 */
describe('PatternPurchasesService (admin history)', () => {
  const mockPrisma = {
    patternPurchase: {
      findMany: jest.fn(),
    },
  };

  let service: PatternPurchasesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PatternPurchasesService(
      mockPrisma as unknown as PrismaService,
      {} as never,
    );
  });

  describe('#getAllPurchases', () => {
    it('queries every non-deleted purchase ordered by createdAt desc', async () => {
      mockPrisma.patternPurchase.findMany.mockResolvedValue([]);

      await service.getAllPurchases();

      expect(mockPrisma.patternPurchase.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null },
        include: {
          pattern: true,
          user: {
            select: { id: true, email: true, name: true, country: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('does not filter by status, unlike getPendingRequests', async () => {
      mockPrisma.patternPurchase.findMany.mockResolvedValue([]);

      await service.getAllPurchases();

      const arg = mockPrisma.patternPurchase.findMany.mock.calls[0][0];
      expect(arg.where).toEqual({ deletedAt: null });
      expect(arg.where).not.toHaveProperty('status');

      // Sanity check: the pending view still filters by PENDING.
      mockPrisma.patternPurchase.findMany.mockClear();
      mockPrisma.patternPurchase.findMany.mockResolvedValue([]);

      await service.getPendingRequests();

      expect(mockPrisma.patternPurchase.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: PurchaseStatus.PENDING, deletedAt: null },
        }),
      );
    });

    it('returns the rows resolved by prisma', async () => {
      const rows = [
        {
          id: 'pp1',
          status: PurchaseStatus.APPROVED,
          total: 12000,
          user: { country: 'ARS' },
        },
        {
          id: 'pp2',
          status: PurchaseStatus.PENDING,
          total: 20,
          user: { country: 'AUD' },
        },
      ];
      mockPrisma.patternPurchase.findMany.mockResolvedValue(rows);

      const result = await service.getAllPurchases();

      expect(result).toEqual(rows);
    });
  });
});

describe('PatternPurchasesService (student history)', () => {
  const mockPrisma = {
    patternPurchase: {
      findMany: jest.fn(),
    },
  };

  let service: PatternPurchasesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PatternPurchasesService(
      mockPrisma as unknown as PrismaService,
      {} as never,
    );
  });

  describe('#getUserPurchases', () => {
    it('queries only the given user non-deleted purchases ordered by createdAt desc', async () => {
      mockPrisma.patternPurchase.findMany.mockResolvedValue([]);

      await service.getUserPurchases('u1');

      expect(mockPrisma.patternPurchase.findMany).toHaveBeenCalledWith({
        where: { userId: 'u1', deletedAt: null },
        include: {
          pattern: true,
          user: {
            select: { id: true, email: true, name: true, country: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('returns the given user\'s pattern purchases resolved by prisma', async () => {
      const rows = [
        {
          id: 'pp1',
          status: PurchaseStatus.APPROVED,
          total: 12000,
          pattern: { titulo: 'Blusa Romántica' },
        },
      ];
      mockPrisma.patternPurchase.findMany.mockResolvedValue(rows);

      const result = await service.getUserPurchases('u1');

      expect(result).toEqual(rows);
    });
  });
});

describe('PatternPurchasesController (admin history route)', () => {
  it('getAll() delegates to the service', () => {
    const getAllPurchases = jest.fn().mockReturnValue(['purchase']);
    const controller = new PatternPurchasesController({
      getAllPurchases,
    } as unknown as PatternPurchasesService);

    expect(controller.getAll()).toEqual(['purchase']);
    expect(getAllPurchases).toHaveBeenCalledTimes(1);
  });
});

describe('PatternPurchasesController (student history route)', () => {
  const principal = (id: string, role: Role): { user: Principal } => ({
    user: { id, role },
  });

  it('lets the owner read their own pattern purchases', async () => {
    const getUserPurchases = jest.fn().mockResolvedValue(['purchase']);
    const controller = new PatternPurchasesController({
      getUserPurchases,
    } as unknown as PatternPurchasesService);

    const result = await controller.getUserPurchases(
      'u1',
      principal('u1', Role.ALUMNO),
    );

    expect(result).toEqual(['purchase']);
    expect(getUserPurchases).toHaveBeenCalledWith('u1');
  });

  it('lets an admin read another student purchases', async () => {
    const getUserPurchases = jest.fn().mockResolvedValue(['purchase']);
    const controller = new PatternPurchasesController({
      getUserPurchases,
    } as unknown as PatternPurchasesService);

    const result = await controller.getUserPurchases(
      'u2',
      principal('admin1', Role.ADMIN),
    );

    expect(result).toEqual(['purchase']);
    expect(getUserPurchases).toHaveBeenCalledWith('u2');
  });

  it('forbids another student without calling the service', async () => {
    const getUserPurchases = jest.fn();
    const controller = new PatternPurchasesController({
      getUserPurchases,
    } as unknown as PatternPurchasesService);

    await expect(
      controller.getUserPurchases('u1', principal('u2', Role.ALUMNO)),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(getUserPurchases).not.toHaveBeenCalled();
  });
});
