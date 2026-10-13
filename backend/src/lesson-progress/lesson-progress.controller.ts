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
import { memoryStorage } from 'multer';
import { LessonProgressService } from './lesson-progress.service';
import { UpdateLessonProgressDto } from './dto/update-lesson-progress.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { Principal } from '../common/principal';
import { StorageService } from '../storage/storage.service';

const storageOptions = {
  storage: memoryStorage(),
};

@Controller('progress')
@UseGuards(JwtAuthGuard)
export class LessonProgressController {
  constructor(
    private readonly progressService: LessonProgressService,
    private readonly storage: StorageService,
  ) {}

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
    if (image) dto.image = await this.storage.upload('progress', image);
    return this.progressService.markLessonComplete(req.user.id, lessonId, dto);
  }
}
