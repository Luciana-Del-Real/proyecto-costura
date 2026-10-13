import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { mkdirSync } from 'fs';
import { RecommendationsService } from './recommendations.service';
import { CreateRecommendationDto } from './dto/create-recommendation.dto';
import { UpdateRecommendationDto } from './dto/update-recommendation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

const uploadsDir = './uploads/recommendations';
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

const recommendationImageFields = FileFieldsInterceptor([{ name: 'image', maxCount: 1 }], storageOptions);

// CRUD completo de recomendaciones para el panel admin (crear, editar,
// eliminar y listar, incluidos los ocultos). La imagen se sube desde el
// formulario admin y se muestra como portada de la tarjeta pública.
@Controller('admin/recommendations')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminRecommendationsController {
  constructor(private readonly recommendationsService: RecommendationsService) {}

  @Get()
  findAll() {
    return this.recommendationsService.findAllForAdmin();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.recommendationsService.findOne(id);
  }

  @Post()
  @UseInterceptors(recommendationImageFields)
  create(@Body() dto: CreateRecommendationDto, @UploadedFiles() files?: { image?: Express.Multer.File[] }) {
    if (files?.image?.length) dto.image = '/uploads/recommendations/' + files.image[0].filename;
    return this.recommendationsService.create(dto);
  }

  @Put(':id')
  @UseInterceptors(recommendationImageFields)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateRecommendationDto,
    @UploadedFiles() files?: { image?: Express.Multer.File[] },
  ) {
    if (files?.image?.length) dto.image = '/uploads/recommendations/' + files.image[0].filename;
    return this.recommendationsService.update(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.recommendationsService.delete(id);
  }
}