import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePatternDto } from './dto/create-pattern.dto';
import { UpdatePatternDto } from './dto/update-pattern.dto';

@Injectable()
export class PatternsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.pattern.findMany({
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string) {
    const pattern = await this.prisma.pattern.findUnique({
      where: { id },
    });
    if (!pattern) {
      throw new NotFoundException('Patrón no encontrado');
    }
    return pattern;
  }

  create(dto: CreatePatternDto) {
    return this.prisma.pattern.create({
      data: {
        ...dto,
        // El controller garantiza que archivo está seteado antes de llegar acá
        // (BadRequestException si no viene el PDF en el POST).
        archivo: dto.archivo as string,
      },
    });
  }

  // Solo pisa imagen/archivo si vienen en el DTO; si el campo llega
  // undefined, Prisma conserva el valor existente.
  update(id: string, dto: UpdatePatternDto) {
    return this.prisma.pattern.update({
      where: { id },
      data: { ...dto },
    });
  }

  // Consistente con courses: borra la fila pero NO los archivos del disco.
  async delete(id: string) {
    await this.findOne(id);
    return this.prisma.pattern.delete({
      where: { id },
      select: { id: true, titulo: true },
    });
  }
}