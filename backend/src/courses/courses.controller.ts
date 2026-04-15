import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
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
  async findAll(
    @Query('featured') featured?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    let p = parseInt(page as any, 10);
    if (isNaN(p) || p < 1) p = 1;

    let l = parseInt(limit as any, 10);
    if (isNaN(l) || l < 1) l = 20;
    const MAX = 100;
    if (l > MAX) l = MAX;

    return this.coursesService.findAll(featured === 'true', p, l);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.coursesService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'image', maxCount: 1 },
    { name: 'pdfGuide', maxCount: 1 },
  ], storageOptions))
  async create(
    @Body() dto: CreateCourseDto,
    @UploadedFiles() files: { image?: Express.Multer.File[], pdfGuide?: Express.Multer.File[] },
  ) {
    if (files?.image?.length) {
      dto.image = `/uploads/courses/${files.image[0].filename}`;
    }
    if (files?.pdfGuide?.length) {
      (dto as any).pdfGuide = `/uploads/courses/${files.pdfGuide[0].filename}`;
    }
    return this.coursesService.create(dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'image', maxCount: 1 },
    { name: 'pdfGuide', maxCount: 1 },
  ], storageOptions))
  async update(
    @Param('id') id: string, 
    @Body() dto: UpdateCourseDto,
    @UploadedFiles() files: { image?: Express.Multer.File[], pdfGuide?: Express.Multer.File[] },
  ) {
    if (files?.image?.length) {
      dto.image = `/uploads/courses/${files.image[0].filename}`;
    }
    if (files?.pdfGuide?.length) {
      (dto as any).pdfGuide = `/uploads/courses/${files.pdfGuide[0].filename}`;
    }
    return this.coursesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async delete(@Param('id') id: string) {
    return this.coursesService.delete(id);
  }
}
