import { Controller, Get, Post, Body, Param, Request, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { mkdirSync } from 'fs';
import { LessonCommentsService } from './lesson-comments.service';
import { CreateLessonCommentDto } from './dto/create-lesson-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { Principal } from '../common/principal';

const uploadsDir = './uploads/comments';
mkdirSync(uploadsDir, { recursive: true });

const storageOptions = {
  storage: diskStorage({
    destination: uploadsDir,
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`);
    },
  }),
};

@Controller('lessons/:lessonId/comments')
@UseGuards(JwtAuthGuard)
export class LessonCommentsController {
  constructor(private readonly lessonCommentsService: LessonCommentsService) {}

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
    if (image) dto.image = `/uploads/comments/${image.filename}`;
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