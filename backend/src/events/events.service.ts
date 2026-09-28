import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  // Público: solo eventos visibles (active), en el orden de la grilla.
  findAllPublic() {
    return this.prisma.event.findMany({
      where: { active: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });
  }

  // Admin: todos, incluidos los ocultos, en el orden de la grilla.
  findAllForAdmin() {
    return this.prisma.event.findMany({
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async findOne(id: string) {
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) {
      throw new NotFoundException('Evento no encontrado');
    }
    return event;
  }

  async create(dto: CreateEventDto) {
    // Sin orden explícito, el evento nuevo va al final de la grilla. El
    // mensaje de WhatsApp se genera desde el título si no viene uno propio.
    const order = dto.order ?? (await this.nextOrder());
    return this.prisma.event.create({
      data: {
        title: dto.title,
        subtitle: dto.subtitle,
        detail: dto.detail,
        waMessage: dto.waMessage ?? `Hola, quiero consultar sobre ${dto.title}`,
        image: dto.image ?? null,
        icon: dto.icon ?? 'Sparkles',
        order,
        active: dto.active ?? true,
      },
    });
  }

  // Siguiente orden disponible para los eventos creados sin orden explícito.
  private async nextOrder() {
    const last = await this.prisma.event.findFirst({
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    return (last?.order ?? 0) + 1;
  }

  // Solo pisa los campos que vienen en el DTO; los que llegan undefined
  // los conserva Prisma (misma lógica que el módulo de patrones).
  async update(id: string, dto: UpdateEventDto) {
    await this.findOne(id);
    return this.prisma.event.update({ where: { id }, data: { ...dto } });
  }

  async delete(id: string) {
    await this.findOne(id);
    return this.prisma.event.delete({ where: { id }, select: { id: true, title: true } });
  }
}