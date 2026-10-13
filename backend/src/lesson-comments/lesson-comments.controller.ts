import { Controller, Get, Post, Body, Param, Request, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { LessonCommentsService } from './lesson-comments.service';
import { CreateLessonCommentDto } from './dto/create-lesson-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { Principal } from '../common/principal';
import { StorageService } from '../storage/storage.service';

const storageOptions = {
  storage: memoryStorage(),
};

@Controller('lessons/:lessonId/comments')
@UseGuards(JwtAuthGuard)
export class LessonCommentsController {
  constructor(
    private readonly lessonCommentsService: LessonCommentsService,
    private readonly storage: StorageService,
  ) {}

  @Get()
  async findAll(@Param('lessonId') lessonId: string, @Request() req: { user: Principal }) {
    return this.lessonCommentsService.findByLesson(lessonId, req.user.id, req.user.role);
  }

  // Acepta multipart/form-data (message, parentId, image opcional) y JSON
  // (message, parentId): el interceptor solo procesa el archivo cuando viene
  // y deja pasar los requests sin multipart sin tocarlos.
  @Post()
  @UseInterceptors(FileInterceptor('image', storageOptions))
  async create(
    @Param('lessonId') lessonId: string,
    @Body() dto: CreateLessonCommentDto,
    @Request() req: { user: Principal },
    @UploadedFile() image?: Express.Multer.File,
  ) {
    if (image) dto.image = await this.storage.upload('comments', image);
    return this.lessonCommentsService.create(
      lessonId,
      req.user.id,
      req.user.role,
      dto.message,
      dto.parentId,
      dto.image,
    );
  }
}