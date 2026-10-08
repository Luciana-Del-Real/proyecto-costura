import { CoursesService } from '../src/courses/courses.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { Role } from '../src/common/enums';

/**
 * Soft-hide spec for courses (task soft-hide-courses-patterns):
 * - DELETE /courses/:id hides (active=false) when the course has purchases
 *   and hard-deletes when it has none.
 * - findAll admin branch shows EVERYTHING (no `active` filter) and ships a
 *   per-course `_count.purchases`; the public branch keeps filtering active.
 * Runs without a database: PrismaService is mocked at the service boundary.
 */
describe('CoursesService (soft-hide)', () => {
  const mockPrisma = {
    course: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    purchase: {
      count: jest.fn(),
    },
  };

  let service: CoursesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CoursesService(mockPrisma as unknown as PrismaService, {} as never);
  });

  describe('#delete (smart hide)', () => {
    it('hides the course (update active:false) when it has purchases', async () => {
      mockPrisma.course.findUnique.mockResolvedValue({ id: 'c1', title: 'Curso A' });
      mockPrisma.purchase.count.mockResolvedValue(3);
      mockPrisma.course.update.mockResolvedValue({ id: 'c1', title: 'Curso A', active: false });

      const result = await service.delete('c1');

      expect(result).toEqual({ id: 'c1', title: 'Curso A', active: false, action: 'hidden' });
      expect(mockPrisma.purchase.count).toHaveBeenCalledWith({
        where: { courseId: 'c1', deletedAt: null },
      });
      expect(mockPrisma.course.update).toHaveBeenCalledWith({
        where: { id: 'c1' },
        data: { active: false },
        select: { id: true, title: true, active: true },
      });
      expect(mockPrisma.course.delete).not.toHaveBeenCalled();
    });

    it('hard-deletes the course when it has no purchases', async () => {
      mockPrisma.course.findUnique.mockResolvedValue({ id: 'c2', title: 'Curso B' });
      mockPrisma.purchase.count.mockResolvedValue(0);
      mockPrisma.course.delete.mockResolvedValue({ id: 'c2', title: 'Curso B' });

      const result = await service.delete('c2');

      expect(result).toEqual({ id: 'c2', title: 'Curso B', action: 'deleted' });
      expect(mockPrisma.purchase.count).toHaveBeenCalledWith({
        where: { courseId: 'c2', deletedAt: null },
      });
      expect(mockPrisma.course.update).not.toHaveBeenCalled();
      expect(mockPrisma.course.delete).toHaveBeenCalledWith({
        where: { id: 'c2' },
        select: { id: true, title: true },
      });
    });
  });

  describe('#findAll admin vs public', () => {
    it('admin branch: no active filter and returns _count.purchases', async () => {
      mockPrisma.course.findMany.mockResolvedValue([
        { id: 'c1', title: 'Curso A', _count: { purchases: 2 } },
        { id: 'c2', title: 'Curso Oculto', active: false, _count: { purchases: 5 } },
      ]);
      const admin = { id: 'a1', role: Role.ADMIN };

      const result = await service.findAll(false, 1, 20, admin);

      expect(mockPrisma.course.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
          include: expect.objectContaining({
            _count: { select: { purchases: true } },
            attachments: true,
          }),
        }),
      );
      expect(result).toHaveLength(2);
      expect(result[1]).toMatchObject({ active: false, _count: { purchases: 5 } });
    });

    it('public branch: keeps filtering active: true', async () => {
      mockPrisma.course.findMany.mockResolvedValue([]);
      const student = { id: 'u1', role: Role.ALUMNO };

      await service.findAll(false, 1, 20, student);

      expect(mockPrisma.course.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { active: true } }),
      );
    });
  });
});