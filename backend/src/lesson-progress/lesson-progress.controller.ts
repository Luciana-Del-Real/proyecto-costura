import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { mkdirSync } from 'fs';
import { LessonProgressService } from './lesson-progress.service';
import { UpdateLessonProgressDto } from './dto/update-lesson-progress.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { Principal } from '../common/principal';

const uploadsDir = './uploads/progress';
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

@Controller('progress')
@UseGuards(JwtAuthGuard)
export class LessonProgressController {
  constructor(private readonly progressService: LessonProgressService) {}

  @Get('courses/:courseId')
  async getCourseProgress(
    @Request() req: { user: Principal },
    @Param('courseId') courseId: string,
  ) {
    return this.progressService.getCourseProgress(req.user, courseId);
  }

  // Acepta multipart/form-data (completed, note opcional, image opcional): el
  // interceptor solo procesa el archivo cuando viene. La imagen es obligatoria
  // para completar, pero eso lo decide el service (así una lección ya
  // completada con evidencia previa puede re-completarse sin subir otra).
  @Patch('lessons/:lessonId')
  @UseInterceptors(FileInterceptor('image', storageOptions))
  async markLessonComplete(
    @Request() req: { user: Principal },
    @Param('lessonId') lessonId: string,
    @Body() dto: UpdateLessonProgressDto,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    if (image) dto.image = `/uploads/progress/${image.filename}`;
    return this.progressService.markLessonComplete(req.user.id, lessonId, dto);
  }
}
