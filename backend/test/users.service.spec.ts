import { ForbiddenException } from '@nestjs/common';
import { UsersService } from '../src/users/users.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { Role } from '../src/common/enums';

/**
 * Focused tests for task 3.1 (access-control-ownership spec):
 * `GET users/:id` allows only the owner or an admin; anyone else gets 403.
 * These run without a database: PrismaService is mocked at the service boundary.
 */
describe('UsersService#findOne (owner-or-admin)', () => {
  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  let service: UsersService;

  const owner = { id: 'user-1', role: Role.ALUMNO };
  const admin = { id: 'user-2', role: Role.ADMIN };
  const other = { id: 'user-3', role: Role.ALUMNO };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UsersService(mockPrisma as unknown as PrismaService);
  });

  it('allows the owner to read their own profile', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1', email: 'a@b.com' });

    const result = await service.findOne('user-1', owner);

    expect(result).toEqual({ id: 'user-1', email: 'a@b.com' });
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'user-1' } }),
    );
  });

  it('allows an admin to read any profile', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-3', email: 'c@d.com' });

    const result = await service.findOne('user-3', admin);

    expect(result).toEqual({ id: 'user-3', email: 'c@d.com' });
  });

  it('rejects a non-owner, non-admin user with 403 and leaks no data', async () => {
    await expect(service.findOne('user-1', other)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
  });
});