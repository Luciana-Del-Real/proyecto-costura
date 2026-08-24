import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { Principal } from '../common/principal';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any) {
    return this.usersService.findOne(id, req.user);
  }

  @Get()
  @UseGuards(AdminGuard)
  async findAll() {
    return this.usersService.findAll('ALUMNO');
  }

  @Patch(':id/active')
  @UseGuards(AdminGuard)
  async toggleActive(@Param('id') id: string) {
    return this.usersService.toggleActive(id);
  }

  // Profile self-edit: owner-or-admin enforced in the service boundary,
  // mirroring findOne. Non-owners get 403 before any mutation.
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @Request() req: { user: Principal },
  ) {
    return this.usersService.update(id, dto, req.user);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  async delete(@Param('id') id: string) {
    return this.usersService.delete(id);
  }
}
