import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { LessonProgressService } from './lesson-progress.service';
import { UpdateLessonProgressDto } from './dto/update-lesson-progress.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';

@Controller('progress')
@UseGuards(JwtAuthGuard)
export class LessonProgressController {
  constructor(private readonly progressService: LessonProgressService) {}

  @Get('courses/:courseId')
  async getCourseProgress(
    @Request() req: any,
    @Param('courseId') courseId: string,
  ) {
    return this.progressService.getCourseProgress(req.user.id, courseId);
  }

  @Patch('lessons/:lessonId')
  async markLessonComplete(
    @Request() req: any,
    @Param('lessonId') lessonId: string,
    @Body() dto: UpdateLessonProgressDto,
  ) {
    return this.progressService.markLessonComplete(req.user.id, lessonId, dto);
  }
}
