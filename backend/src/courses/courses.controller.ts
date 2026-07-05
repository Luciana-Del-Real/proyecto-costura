import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { mkdirSync } from 'fs';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

const uploadsDir = './uploads/courses';
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
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  async findAll(@Query('featured') featured?: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    let p = parseInt(page as any, 10) || 1;
    let l = parseInt(limit as any, 10) || 20;
    return this.coursesService.findAll(featured === 'true', p, Math.min(l, 100));
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.coursesService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @UseInterceptors(courseFileFields)
  async create(@Body() dto: CreateCourseDto, @UploadedFiles() files: any) {
    if (files?.image) dto.image = `/uploads/courses/${files.image[0].filename}`;
    if (files?.pdfGuide) (dto as any).pdfGuide = `/uploads/courses/${files.pdfGuide[0].filename}`;

    const course = await this.coursesService.create(dto);

    if (files?.pdfs?.length) {
      await this.coursesService.addAttachments(course.id, files.pdfs);
    }

    return this.coursesService.findOne(course.id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @UseInterceptors(courseFileFields)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCourseDto,
    @UploadedFiles() files: any,
  ) {
    if (files?.image) dto.image = `/uploads/courses/${files.image[0].filename}`;
    if (files?.pdfGuide) (dto as any).pdfGuide = `/uploads/courses/${files.pdfGuide[0].filename}`;

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
