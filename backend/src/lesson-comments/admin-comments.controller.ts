import { Controller, Get, UseGuards } from '@nestjs/common';
import { LessonCommentsService } from './lesson-comments.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

// Bandeja de consultas del dashboard del admin: expone TODOS los comentarios
// de todas las lecciones (con su curso y su autor) para que el admin responda
// desde un solo lugar, sin tener que entrar lección por lección.
@Controller('admin/comments')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminCommentsController {
  constructor(private readonly lessonCommentsService: LessonCommentsService) {}

  @Get()
  async findAllForAdmin() {
    return this.lessonCommentsService.findAllForAdmin();
  }
}
