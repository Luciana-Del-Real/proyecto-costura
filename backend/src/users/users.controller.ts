import { Controller, Get, Delete, Param, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Get()
  @UseGuards(AdminGuard)
  async findAll() {
    return this.usersService.findAll();
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  async delete(@Param('id') id: string) {
    return this.usersService.delete(id);
  }
}
