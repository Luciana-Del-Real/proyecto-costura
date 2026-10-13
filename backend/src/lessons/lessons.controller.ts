import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Request,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { LessonsService } from './lessons.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { Principal } from '../common/principal';
import { StorageService } from '../storage/storage.service';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

const storageOptions = {
  storage: memoryStorage(),
};

// - pdf: PDF principal de la lección, se mantiene por compatibilidad (1 solo)
// - pdfs: PDFs adicionales de la lección, ahora se puede subir más de uno
const lessonFileFields = FileFieldsInterceptor([
  { name: 'pdf', maxCount: 1 },
  { name: 'pdfs', maxCount: 10 },
], storageOptions);

@Controller('courses/:courseId/lessons')
export class LessonsController {
  constructor(
    private readonly lessonsService: LessonsService,
    private readonly storage: StorageService,
  ) {}

  // Lectura protegida: requiere JWT + compra aprobada (o ADMIN). El contenido
  // completo (videoUrl/pdf/attachments) NO se sirve por el catálogo público.
  @Get()
  @UseGuards(JwtAuthGuard)
  async findByCourse(@Param('courseId') courseId: string, @Request() req: { user: Principal }) {
    return this.lessonsService.findByCourse(courseId, req.user);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string, @Request() req: { user: Principal }) {
    return this.lessonsService.findOne(id, req.user);
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
      dto.pdf = await this.storage.upload('lessons', files.pdf[0]);
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
      dto.pdf = await this.storage.upload('lessons', files.pdf[0]);
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

// Endpoint plano de detalle de lección: mismo predicado de acceso que el
// listado anidado (JWT + compra aprobada o ADMIN).
@Controller('lessons')
export class LessonsDetailController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string, @Request() req: { user: Principal }) {
    return this.lessonsService.findOne(id, req.user);
  }
}