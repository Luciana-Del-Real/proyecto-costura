import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, UseInterceptors, UploadedFiles, BadRequestException } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { mkdirSync } from 'fs';
import { PatternsService } from './patterns.service';
import { CreatePatternDto } from './dto/create-pattern.dto';
import { UpdatePatternDto } from './dto/update-pattern.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

const uploadsDir = './uploads/patterns';
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

const patternFileFields = FileFieldsInterceptor([
  { name: 'imagen', maxCount: 1 },
  { name: 'archivo', maxCount: 1 },
], storageOptions);

@Controller('patterns')
export class PatternsController {
  constructor(private readonly patternsService: PatternsService) {}

  // Público: el catálogo de patrones gratis no requiere sesión.
  @Get()
  findAll() {
    return this.patternsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.patternsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @UseInterceptors(patternFileFields)
  async create(@Body() dto: CreatePatternDto, @UploadedFiles() files: { imagen?: Express.Multer.File[]; archivo?: Express.Multer.File[] }) {
    if (!files?.archivo) {
      throw new BadRequestException('El archivo PDF es obligatorio');
    }
    if (files.imagen) dto.imagen = `/uploads/patterns/${files.imagen[0].filename}`;
    if (files.archivo) dto.archivo = `/uploads/patterns/${files.archivo[0].filename}`;

    const pattern = await this.patternsService.create(dto);
    return this.patternsService.findOne(pattern.id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @UseInterceptors(patternFileFields)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePatternDto,
    @UploadedFiles() files: { imagen?: Express.Multer.File[]; archivo?: Express.Multer.File[] },
  ) {
    if (files?.imagen) dto.imagen = `/uploads/patterns/${files.imagen[0].filename}`;
    if (files?.archivo) dto.archivo = `/uploads/patterns/${files.archivo[0].filename}`;

    await this.patternsService.update(id, dto);
    return this.patternsService.findOne(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  delete(@Param('id') id: string) {
    return this.patternsService.delete(id);
  }
}