import {
  Injectable,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { Principal, isOwnerOrAdmin } from '../common/principal';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(id: string, principal: Principal) {
    if (!isOwnerOrAdmin(principal, id)) {
      throw new ForbiddenException(
        'Access denied. You can only view your own profile.',
      );
    }

    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });
  }

  /**
   * Profile self-edit: only the owner or an ADMIN may mutate the user.
   * Prisma unique violation on email (P2002) becomes a 409 conflict so the
   * client can show the error without leaking any other account's data.
   */
  async update(id: string, dto: UpdateUserDto, principal: Principal) {
    if (!isOwnerOrAdmin(principal, id)) {
      throw new ForbiddenException(
        'Access denied. You can only edit your own profile.',
      );
    }

    const data: Prisma.UserUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.country !== undefined) data.country = dto.country;

    try {
      return await this.prisma.user.update({
        where: { id },
        data,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          country: true,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Email already registered');
      }
      throw error;
    }
  }

  async findAll(role?: string) {
    return this.prisma.user.findMany({
      where: role ? { role: role as 'ADMIN' | 'ALUMNO' } : undefined,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        createdAt: true,
        purchases: {
          select: { courseId: true }
        },
        progress: {
          where: { completed: true },
          select: { lessonId: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async toggleActive(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new Error('User not found');
    return this.prisma.user.update({
      where: { id },
      data: { active: !user.active },
      select: {
        id: true,
        email: true,
        name: true,
        active: true,
      },
    });
  }

  async delete(id: string) {
    return this.prisma.user.delete({
      where: { id },
      select: { id: true, email: true },
    });
  }
}
