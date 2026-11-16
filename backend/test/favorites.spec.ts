import { FavoritesService } from '../src/favorites/favorites.service';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * Mimics Prisma's `select` at the mock boundary: only the keys present in the
 * projection survive. A regression back to `course: true` returns the whole
 * fixture (pdfGuide included) and the assertions catch it.
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
 * Paywall regression (task: paywall-pdf-leaks): the favorites endpoints return
 * course records, and they must never carry `course.pdfGuide` — the paid PDF
 * guide URL. Favorites only need display metadata; the guide stays behind the
 * protected lessons endpoint (GET /courses/:id/lessons).
 */
describe('FavoritesService (paywall PDF projection)', () => {
  const courseFixture = {
    id: 'c1',
    title: 'Curso de costura',
    description: 'Curso de ejemplo',
    longDescription: 'Descripción larga',
    image: '/uploads/courses/c1.jpg',
    pdfGuide: '/uploads/courses/guia.pdf',
    priceARS: 15000,
    priceAUD: 25,
    level: 'PRINCIPIANTE',
    instructor: 'Ana',
    duration: '4 semanas',
    featured: false,
    rating: 5,
    students: 3,
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
    attachments: [{ id: 'att1', url: '/uploads/courses/extra.pdf' }],
  };

  const mockPrisma = {
    course: { findUnique: jest.fn() },
    favorite: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
  };

  let service: FavoritesService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.course.findUnique.mockResolvedValue(courseFixture);
    mockPrisma.favorite.findUnique.mockResolvedValue(null);
    mockPrisma.favorite.findMany.mockResolvedValue([]);
    mockPrisma.favorite.create.mockImplementation((args: any) => ({
      id: 'f1',
      userId: 'u1',
      courseId: 'c1',
      course: projectWith(courseFixture, args.include.course.select),
    }));

    service = new FavoritesService(mockPrisma as unknown as PrismaService);
  });

  it('getUserFavorites selects the course without pdfGuide', async () => {
    mockPrisma.favorite.findMany.mockImplementation((args: any) => [
      {
        id: 'f1',
        userId: 'u1',
        courseId: 'c1',
        course: projectWith(courseFixture, args.include.course.select),
      },
    ]);

    const result = await service.getUserFavorites('u1');

    const arg = mockPrisma.favorite.findMany.mock.calls[0][0];
    expect(arg.include.course.select).toEqual(
      expect.objectContaining({ id: true, title: true, priceARS: true }),
    );
    expect(arg.include.course.select).not.toHaveProperty('pdfGuide');
    expect(arg.include.course.select).not.toHaveProperty('attachments');

    expect(result[0].course).not.toHaveProperty('pdfGuide');
    expect(result[0].course.image).toBe('/uploads/courses/c1.jpg');
  });

  it('addFavorite selects the course without pdfGuide', async () => {
    const result = await service.addFavorite('u1', 'c1');

    const arg = mockPrisma.favorite.create.mock.calls[0][0];
    expect(arg.include.course.select).toEqual(
      expect.objectContaining({ id: true, title: true }),
    );
    expect(arg.include.course.select).not.toHaveProperty('pdfGuide');

    expect(result.course).not.toHaveProperty('pdfGuide');
    expect(result.course.title).toBe('Curso de costura');
  });
});
