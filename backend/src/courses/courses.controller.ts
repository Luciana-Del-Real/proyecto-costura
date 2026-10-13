import { Controller, Get, Post, Put, Delete, Body, Param, Query, Request, UseGuards, UseInterceptors, UploadedFiles, Logger } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt.guard';
import { Principal } from '../common/principal';
import { NotificationsService } from '../notifications/notifications.service';
import { StorageService } from '../storage/storage.service';

const storageOptions = {
  storage: memoryStorage(),
};

// Campos de archivos que acepta el formulario de curso:
// - image: portada (1 sola)
// - pdfGuide: PDF principal del curso, se mantiene por compatibilidad (1 solo)
// - pdfs: PDFs adicionales del curso, ahora se puede subir más de uno
const courseFileFields = FileFieldsInterceptor([
  { name: 'image', maxCount: 1 },
  { name: 'pdfGuide', maxCount: 1 },
  { name: 'pdfs', maxCount: 10 },
], storageOptions);

@Controller('courses')
export class CoursesController {
  private readonly logger = new Logger(CoursesController.name);

  constructor(
    private readonly coursesService: CoursesService,
    private readonly notificationsService: NotificationsService,
    private readonly storage: StorageService,
  ) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  async findAll(@Request() req: { user: Principal }, @Query('featured') featured?: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    let p = parseInt(page ?? '', 10) || 1;
    let l = parseInt(limit ?? '', 10) || 20;
    return this.coursesService.findAll(featured === 'true', p, Math.min(l, 100), req.user);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  async findOne(@Param('id') id: string, @Request() req: { user: Principal }) {
    return this.coursesService.findOne(id, req.user);
  }

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @UseInterceptors(courseFileFields)
  async create(@Body() dto: CreateCourseDto, @UploadedFiles() files: { image?: Express.Multer.File[]; pdfGuide?: Express.Multer.File[]; pdfs?: Express.Multer.File[] }) {
    if (files?.image) dto.image = await this.storage.upload('courses', files.image[0]);
    if (files?.pdfGuide) dto.pdfGuide = await this.storage.upload('courses', files.pdfGuide[0]);

    const course = await this.coursesService.create(dto);

    if (files?.pdfs?.length) {
      await this.coursesService.addAttachments(course.id, files.pdfs);
    }

    // Avisa a todas las alumnas del curso nuevo. La notificación nunca debe
    // romper la creación: si falla, se loguea y la creación sigue.
    try {
      await this.notificationsService.createNotificationsForStudents(
        'Nuevo curso disponible',
        `${course.title} ya está disponible. ¡Inscribite y empezá a crear!`,
        undefined,
        `/curso/${course.id}`,
      );
    } catch (err) {
      this.logger.warn('No se pudo notificar a las alumnas del nuevo curso', err);
    }

    return this.coursesService.findOne(course.id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @UseInterceptors(courseFileFields)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCourseDto,
    @UploadedFiles() files: { image?: Express.Multer.File[]; pdfGuide?: Express.Multer.File[]; pdfs?: Express.Multer.File[] },
  ) {
    if (files?.image) dto.image = await this.storage.upload('courses', files.image[0]);
    if (files?.pdfGuide) dto.pdfGuide = await this.storage.upload('courses', files.pdfGuide[0]);

    await this.coursesService.update(id, dto);

    if (files?.pdfs?.length) {
      await this.coursesService.addAttachments(id, files.pdfs);
    }

    return this.coursesService.findOne(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async delete(@Param('id') id: string) {
    return this.coursesService.delete(id);
  }
}
