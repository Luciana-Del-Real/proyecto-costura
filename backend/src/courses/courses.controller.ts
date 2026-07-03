import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { FileFieldsInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

const storageOptions = {
  storage: diskStorage({
    destination: './uploads/courses',
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`);
    },
  }),
};

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
  // SOLO archivos aquí
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'image', maxCount: 1 },
    { name: 'pdfGuide', maxCount: 1 }
  ], storageOptions))
  async create(@Body() dto: CreateCourseDto, @UploadedFiles() files: any) {
    if (files?.image) dto.image = `/uploads/courses/${files.image[0].filename}`;
    if (files?.pdfGuide) (dto as any).pdfGuide = `/uploads/courses/${files.pdfGuide[0].filename}`;
    return this.coursesService.create(dto);
  }

  @Put(':id')
@UseGuards(JwtAuthGuard, AdminGuard)
@UseInterceptors(FileFieldsInterceptor([
  { name: 'image', maxCount: 1 },
  { name: 'pdfGuide', maxCount: 1 }
], storageOptions))
async update(
  @Param('id') id: string, 
  @Body() dto: UpdateCourseDto, 
  @Query('lessons') lessons: string, // <-- RECIBIMOS LAS LECCIONES AQUÍ
  @UploadedFiles() files: any
) {
  if (files?.image) dto.image = `/uploads/courses/${files.image[0].filename}`;
  if (files?.pdfGuide) (dto as any).pdfGuide = `/uploads/courses/${files.pdfGuide[0].filename}`;
  
  // Si vienen en el query, las pasamos al DTO manualmente
  if (lessons) {
    (dto as any).lessons = lessons;
  }
  
  return this.coursesService.update(id, dto);
}

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async delete(@Param('id') id: string) {
    return this.coursesService.delete(id);
  }
}