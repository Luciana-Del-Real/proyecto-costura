import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { Principal } from '../common/principal';

@Controller('favorites')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  async getUserFavorites(@Request() req: { user: Principal }) {
    return this.favoritesService.getUserFavorites(req.user.id);
  }

  @Post('courses/:courseId')
  async addFavorite(
    @Request() req: { user: Principal },
    @Param('courseId') courseId: string,
  ) {
    return this.favoritesService.addFavorite(req.user.id, courseId);
  }

  @Delete('courses/:courseId')
  async removeFavorite(
    @Request() req: { user: Principal },
    @Param('courseId') courseId: string,
  ) {
    return this.favoritesService.removeFavorite(req.user.id, courseId);
  }

  @Get('courses/:courseId/check')
  async isFavorite(
    @Request() req: { user: Principal },
    @Param('courseId') courseId: string,
  ) {
    return this.favoritesService.isFavorite(req.user.id, courseId);
  }
}
