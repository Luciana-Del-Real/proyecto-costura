import { NotFoundException } from '@nestjs/common';
import { RecommendationsService } from '../src/recommendations/recommendations.service';
import { RecommendationsController } from '../src/recommendations/recommendations.controller';
import { AdminRecommendationsController } from '../src/recommendations/admin-recommendations.controller';
import { CreateRecommendationDto } from '../src/recommendations/dto/create-recommendation.dto';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * Recomendaciones (feature nueva): la lista pública expone SOLO las activas,
 * el CRUD admin maneja 404 y borrado, y el controller admin traduce el archivo
 * subido al path /uploads/recommendations/... Corren sin base de datos:
 * PrismaService se mockea en el borde del servicio.
 */
describe('RecommendationsService', () => {
  const mockPrisma = {
    recommendation: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  let service: RecommendationsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new RecommendationsService(mockPrisma as unknown as PrismaService);
  });

  it('la lista pública pide solo las activas, más nuevas primero', async () => {
    mockPrisma.recommendation.findMany.mockResolvedValue([]);

    await service.findAllPublic();

    expect(mockPrisma.recommendation.findMany).toHaveBeenCalledWith({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('la lista admin incluye las ocultas (sin filtro active)', async () => {
    mockPrisma.recommendation.findMany.mockResolvedValue([]);

    await service.findAllForAdmin();

    expect(mockPrisma.recommendation.findMany).toHaveBeenCalledWith({
      orderBy: { createdAt: 'desc' },
    });
  });

  it('findOne tira 404 cuando el id no existe', async () => {
    mockPrisma.recommendation.findUnique.mockResolvedValue(null);

    await expect(service.findOne('nope')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('create guarda null en los campos opcionales ausentes', async () => {
    mockPrisma.recommendation.create.mockResolvedValue({ id: 'r1' });

    await service.create({ title: 'Taladro' });

    expect(mockPrisma.recommendation.create).toHaveBeenCalledWith({
      data: { title: 'Taladro', description: null, image: null, link: null },
    });
  });

  it('create persiste la imagen y el link cuando vienen', async () => {
    mockPrisma.recommendation.create.mockResolvedValue({ id: 'r1' });

    await service.create({
      title: 'Taladro',
      image: '/uploads/recommendations/image-1.png',
      link: 'https://taladro.test',
    });

    expect(mockPrisma.recommendation.create).toHaveBeenCalledWith({
      data: {
        title: 'Taladro',
        description: null,
        image: '/uploads/recommendations/image-1.png',
        link: 'https://taladro.test',
      },
    });
  });

  it('update verifica que exista y pisa solo los campos enviados', async () => {
    mockPrisma.recommendation.findUnique.mockResolvedValue({ id: 'r1' });
    mockPrisma.recommendation.update.mockResolvedValue({ id: 'r1' });

    await service.update('r1', { link: 'https://nuevo.test' });

    expect(mockPrisma.recommendation.update).toHaveBeenCalledWith({
      where: { id: 'r1' },
      data: { link: 'https://nuevo.test' },
    });
  });

  it('update tira 404 si el id no existe y no llega a update', async () => {
    mockPrisma.recommendation.findUnique.mockResolvedValue(null);

    await expect(service.update('nope', { title: 'x' })).rejects.toBeInstanceOf(NotFoundException);
    expect(mockPrisma.recommendation.update).not.toHaveBeenCalled();
  });

  it('delete tira 404 cuando no borró ninguna fila (count 0)', async () => {
    mockPrisma.recommendation.deleteMany.mockResolvedValue({ count: 0 });

    await expect(service.delete('nope')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('delete devuelve { id } cuando borró la fila', async () => {
    mockPrisma.recommendation.deleteMany.mockResolvedValue({ count: 1 });

    await expect(service.delete('r1')).resolves.toEqual({ id: 'r1' });
  });
});

describe('Recommendations controllers', () => {
  it('el listado público delega en findAllPublic', () => {
    const svc = { findAllPublic: jest.fn().mockReturnValue([]) };
    const controller = new RecommendationsController(svc as unknown as RecommendationsService);

    controller.findAll();

    expect(svc.findAllPublic).toHaveBeenCalledTimes(1);
  });

  it('el create admin traduce el archivo subido al path servido por /uploads', async () => {
    const svc = { create: jest.fn().mockResolvedValue({ id: 'r1' }) };
    const controller = new AdminRecommendationsController(svc as unknown as RecommendationsService);
    const dto: CreateRecommendationDto = { title: 'Taladro' };

    await controller.create(dto, {
      image: [{ filename: 'image-123.png' }],
    } as unknown as { image: Express.Multer.File[] });

    expect(dto.image).toBe('/uploads/recommendations/image-123.png');
    expect(svc.create).toHaveBeenCalledWith(dto);
  });
});
