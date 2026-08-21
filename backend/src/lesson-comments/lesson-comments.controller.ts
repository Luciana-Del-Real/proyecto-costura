import { Controller, Get, Post, Body, Param, Request, UseGuards } from '@nestjs/common';
import { LessonCommentsService } from './lesson-comments.service';
import { CreateLessonCommentDto } from './dto/create-lesson-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';

@Controller('lessons/:lessonId/comments')
@UseGuards(JwtAuthGuard)
export class LessonCommentsController {
  constructor(private readonly lessonCommentsService: LessonCommentsService) {}

  @Get()
  async findAll(@Param('lessonId') lessonId: string, @Request() req: any) {
    return this.lessonCommentsService.findByLesson(lessonId, req.user.id, req.user.role);
  }

  @Post()
  async create(
    @Param('lessonId') lessonId: string,
    @Body() dto: CreateLessonCommentDto,
    @Request() req: any,
  ) {
    return this.lessonCommentsService.create(lessonId, req.user.id, req.user.role, dto.message);
  }
}
