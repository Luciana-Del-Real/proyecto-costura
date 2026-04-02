import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { LessonsService } from './lessons.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('courses/:courseId/lessons')
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Get()
  async findByCourse(@Param('courseId') courseId: string) {
    return this.lessonsService.findByCourse(courseId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.lessonsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  async create(
    @Param('courseId') courseId: string,
    @Body() dto: CreateLessonDto,
  ) {
    // Ensure courseId in params matches DTO
    if (dto.courseId !== courseId) {
      throw new Error('Course ID mismatch');
    }
    return this.lessonsService.create(dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async update(
    @Param('courseId') courseId: string,
    @Param('id') id: string,
    @Body() dto: UpdateLessonDto,
  ) {
    // Validate lesson belongs to course
    const lesson = await this.lessonsService.findOne(id);
    if (lesson.courseId !== courseId) {
      throw new Error('Lesson does not belong to this course');
    }
    return this.lessonsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async delete(
    @Param('courseId') courseId: string,
    @Param('id') id: string,
  ) {
    // Validate lesson belongs to course
    const lesson = await this.lessonsService.findOne(id);
    if (lesson.courseId !== courseId) {
      throw new Error('Lesson does not belong to this course');
    }
    return this.lessonsService.delete(id);
  }
}
