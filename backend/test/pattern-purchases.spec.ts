import { ForbiddenException } from '@nestjs/common';
import { PatternPurchasesService } from '../src/pattern-purchases/pattern-purchases.service';
import { PatternPurchasesController } from '../src/pattern-purchases/pattern-purchases.controller';
import { PrismaService } from '../src/prisma/prisma.service';
import { PurchaseStatus, Role } from '../src/common/enums';
import { Principal } from '../src/common/principal';

// Display-safe pattern projection expected inside every purchase response:
// catalog metadata only, NEVER `archivo` (the paid PDF URL) nor `attachments`.
const SAFE_PATTERN_SELECT = {
  id: true,
  titulo: true,
  descripcion: true,
  nivel: true,
  categoria: true,
  imagen: true,
  precioARS: true,
  precioAUD: true,
  active: true,
  createdAt: true,
  updatedAt: true,
};

/**
 * Mimics Prisma's `select` at the mock boundary: only the keys present in the
 * projection survive. A regression back to `pattern: true` returns the whole
 * fixture (archivo included) and the assertions catch it.
 */
const projectWith = (row: Record<string, unknown>, select: unknown) => {
  if (!select || typeof select !== 'object') return row;
  return Object.fromEntries(
    Object.keys(select as Record<string, boolean>)
      .filter((key) => key in row)
      .map((key) => [key, row[key]]),
  );
};

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
          pattern: { select: SAFE_PATTERN_SELECT },
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
          pattern: { select: SAFE_PATTERN_SELECT },
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

/**
 * Paywall regression (task: paywall-pdf-leaks): neither the purchase request
 * nor the student/admin history may carry `pattern.archivo` — the public URL
 * of the paid PDF. The file stays reachable only through the pattern endpoints,
 * which check `hasAccess`.
 */
describe('PatternPurchasesService (paywall PDF projection)', () => {
  const patternFixture = {
    id: 'pat1',
    titulo: 'Blusa Romántica',
    descripcion: 'Blusa de ejemplo',
    nivel: 'Intermedio',
    categoria: 'Blusas',
    imagen: '/uploads/patterns/blusa.jpg',
    archivo: '/uploads/patterns/blusa.pdf',
    precioARS: 12000,
    precioAUD: 20,
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
    attachments: [{ id: 'att1', url: '/uploads/patterns/extra.pdf' }],
  };

  const mockPrisma = {
    pattern: { findUnique: jest.fn() },
    user: { findUnique: jest.fn() },
    patternPurchase: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
    runInTransaction: jest.fn(),
  };

  let service: PatternPurchasesService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.pattern.findUnique.mockResolvedValue(patternFixture);
    mockPrisma.user.findUnique.mockResolvedValue({
      country: 'ARS',
      name: 'Ana',
    });
    mockPrisma.patternPurchase.findUnique.mockResolvedValue(null);
    mockPrisma.patternPurchase.findMany.mockResolvedValue([]);
    mockPrisma.patternPurchase.create.mockImplementation((args: any) => ({
      id: 'pp1',
      status: PurchaseStatus.PENDING,
      total: 12000,
      pattern: projectWith(patternFixture, args.include.pattern.select),
    }));
    mockPrisma.runInTransaction.mockImplementation((fn: any) => fn(mockPrisma));

    service = new PatternPurchasesService(
      mockPrisma as unknown as PrismaService,
      { createNotificationsForAdmins: jest.fn() } as never,
    );
  });

  it('requestPurchase selects the pattern without archivo or attachments', async () => {
    const result = await service.requestPurchase('u1', 'pat1');

    const arg = mockPrisma.patternPurchase.create.mock.calls[0][0];
    expect(arg.include.pattern.select).toEqual(SAFE_PATTERN_SELECT);
    expect(arg.include.pattern.select).not.toHaveProperty('archivo');
    expect(arg.include.pattern.select).not.toHaveProperty('attachments');

    expect(result.pattern).not.toHaveProperty('archivo');
    expect(result.pattern).not.toHaveProperty('attachments');
    expect(result.pattern.titulo).toBe('Blusa Romántica');
  });

  it('getUserPurchases selects the pattern without archivo or attachments', async () => {
    mockPrisma.patternPurchase.findMany.mockImplementation((args: any) => [
      {
        id: 'pp1',
        status: PurchaseStatus.APPROVED,
        total: 12000,
        pattern: projectWith(patternFixture, args.include.pattern.select),
      },
    ]);

    const result = await service.getUserPurchases('u1');

    const arg = mockPrisma.patternPurchase.findMany.mock.calls[0][0];
    expect(arg.include.pattern.select).toEqual(SAFE_PATTERN_SELECT);
    expect(arg.include.pattern.select).not.toHaveProperty('archivo');
    expect(arg.include.pattern.select).not.toHaveProperty('attachments');

    expect(result[0].pattern).not.toHaveProperty('archivo');
    expect(result[0].pattern).not.toHaveProperty('attachments');
    expect(result[0].pattern.imagen).toBe('/uploads/patterns/blusa.jpg');
  });

  it('admin listings project the pattern without archivo', async () => {
    await service.getPendingRequests();
    await service.getAllPurchases();

    for (const call of mockPrisma.patternPurchase.findMany.mock.calls) {
      expect(call[0].include.pattern.select).toEqual(SAFE_PATTERN_SELECT);
      expect(call[0].include.pattern.select).not.toHaveProperty('archivo');
    }
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
