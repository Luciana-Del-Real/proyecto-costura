import { PatternsService } from '../src/patterns/patterns.service';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * Soft-hide spec for patterns (task soft-hide-courses-patterns):
 * - DELETE /patterns/:id hides (active=false) when the pattern has purchases
 *   and hard-deletes when it has none.
 * - findAllPublic filters `active: true`; findAll (admin) ships a per-pattern
 *   `_count.patternPurchases`.
 * Runs without a database: PrismaService is mocked at the service boundary.
 */
describe('PatternsService (soft-hide)', () => {
  const mockPrisma = {
    pattern: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    patternPurchase: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    attachment: {
      findUnique: jest.fn(),
    },
  };

  let service: PatternsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PatternsService(mockPrisma as unknown as PrismaService, {} as never);
  });

  describe('#delete (smart hide)', () => {
    it('hides the pattern (update active:false) when it has pattern purchases', async () => {
      mockPrisma.pattern.findUnique.mockResolvedValue({ id: 'p1', titulo: 'Patrón A' });
      mockPrisma.patternPurchase.count.mockResolvedValue(2);
      mockPrisma.pattern.update.mockResolvedValue({ id: 'p1', titulo: 'Patrón A', active: false });

      const result = await service.delete('p1');

      expect(result).toEqual({ id: 'p1', titulo: 'Patrón A', active: false, action: 'hidden' });
      expect(mockPrisma.patternPurchase.count).toHaveBeenCalledWith({
        where: { patternId: 'p1', deletedAt: null },
      });
      expect(mockPrisma.pattern.update).toHaveBeenCalledWith({
        where: { id: 'p1' },
        data: { active: false },
        select: { id: true, titulo: true, active: true },
      });
      expect(mockPrisma.pattern.delete).not.toHaveBeenCalled();
    });

    it('hard-deletes the pattern when it has no purchases', async () => {
      mockPrisma.pattern.findUnique.mockResolvedValue({ id: 'p2', titulo: 'Patrón B' });
      mockPrisma.patternPurchase.count.mockResolvedValue(0);
      mockPrisma.pattern.delete.mockResolvedValue({ id: 'p2', titulo: 'Patrón B' });

      const result = await service.delete('p2');

      expect(result).toEqual({ id: 'p2', titulo: 'Patrón B', action: 'deleted' });
      expect(mockPrisma.patternPurchase.count).toHaveBeenCalledWith({
        where: { patternId: 'p2', deletedAt: null },
      });
      expect(mockPrisma.pattern.update).not.toHaveBeenCalled();
      expect(mockPrisma.pattern.delete).toHaveBeenCalledWith({
        where: { id: 'p2' },
        select: { id: true, titulo: true },
      });
    });
  });

  describe('#findAllPublic', () => {
    it('filters only active patterns', async () => {
      mockPrisma.pattern.findMany.mockResolvedValue([]);

      await service.findAllPublic(undefined);

      expect(mockPrisma.pattern.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { active: true } }),
      );
    });
  });

  describe('#findAll (admin)', () => {
    it('returns the pattern purchase count via _count', async () => {
      mockPrisma.pattern.findMany.mockResolvedValue([
        { id: 'p1', titulo: 'Patrón A', _count: { patternPurchases: 5 } },
      ]);

      const result = await service.findAll();

      expect(mockPrisma.pattern.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            _count: { select: { patternPurchases: true } },
            attachments: expect.any(Object),
          }),
        }),
      );
      expect(result[0]).toMatchObject({ _count: { patternPurchases: 5 } });
    });
  });
});