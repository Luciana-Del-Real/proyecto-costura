import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { LessonsService } from './lessons.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { mkdirSync } from 'fs';

const uploadsDir = './uploads/lessons';
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

// - pdf: PDF principal de la lección, se mantiene por compatibilidad (1 solo)
// - pdfs: PDFs adicionales de la lección, ahora se puede subir más de uno
const lessonFileFields = FileFieldsInterceptor([
  { name: 'pdf', maxCount: 1 },
  { name: 'pdfs', maxCount: 10 },
], storageOptions);

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
  @UseInterceptors(lessonFileFields)
  async create(
    @Param('courseId') courseId: string,
    @Body() dto: CreateLessonDto,
    @UploadedFiles() files: { pdf?: Express.Multer.File[]; pdfs?: Express.Multer.File[] },
  ) {
    // Ensure courseId in params matches DTO
    if (dto.courseId !== courseId) {
      throw new Error('Course ID mismatch');
    }
    if (files?.pdf?.length) {
      (dto as any).pdf = `/uploads/lessons/${files.pdf[0].filename}`;
    }
    const lesson = await this.lessonsService.create(dto);

    if (files?.pdfs?.length) {
      await this.lessonsService.addAttachments(lesson.id, files.pdfs);
    }

    return this.lessonsService.findOne(lesson.id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @UseInterceptors(lessonFileFields)
  async update(
    @Param('courseId') courseId: string,
    @Param('id') id: string,
    @Body() dto: UpdateLessonDto,
    @UploadedFiles() files: { pdf?: Express.Multer.File[]; pdfs?: Express.Multer.File[] },
  ) {
    // Validate lesson belongs to course
    const lesson = await this.lessonsService.findOne(id);
    if (lesson.courseId !== courseId) {
      throw new Error('Lesson does not belong to this course');
    }
    if (files?.pdf?.length) {
      (dto as any).pdf = `/uploads/lessons/${files.pdf[0].filename}`;
    }
    await this.lessonsService.update(id, dto);

    if (files?.pdfs?.length) {
      await this.lessonsService.addAttachments(id, files.pdfs);
    }

    return this.lessonsService.findOne(id);
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
