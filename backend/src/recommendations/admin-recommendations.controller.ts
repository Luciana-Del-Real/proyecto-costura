import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, UseInterceptors, UploadedFiles, Logger } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { RecommendationsService } from './recommendations.service';
import { CreateRecommendationDto } from './dto/create-recommendation.dto';
import { UpdateRecommendationDto } from './dto/update-recommendation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { NotificationsService } from '../notifications/notifications.service';
import { StorageService } from '../storage/storage.service';

const storageOptions = {
  storage: memoryStorage(),
};

const recommendationImageFields = FileFieldsInterceptor([{ name: 'image', maxCount: 1 }], storageOptions);

// CRUD completo de recomendaciones para el panel admin (crear, editar,
// eliminar y listar, incluidos los ocultos). La imagen se sube desde el
// formulario admin y se muestra como portada de la tarjeta pública.
@Controller('admin/recommendations')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminRecommendationsController {
  private readonly logger = new Logger(AdminRecommendationsController.name);

  constructor(
    private readonly recommendationsService: RecommendationsService,
    private readonly notificationsService: NotificationsService,
    private readonly storage: StorageService,
  ) {}

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
  async create(@Body() dto: CreateRecommendationDto, @UploadedFiles() files?: { image?: Express.Multer.File[] }) {
    if (files?.image?.length) dto.image = await this.storage.upload('recommendations', files.image[0]);
    const recommendation = await this.recommendationsService.create(dto);

    // Avisa a todas las alumnas de la recomendación nueva (mismo mecanismo que
    // cursos, patrones y eventos). La notificación nunca debe romper la
    // creación: si falla, se loguea y la creación sigue.
    try {
      await this.notificationsService.createNotificationsForStudents(
        'Nueva recomendación',
        `${recommendation.title} ya está disponible en Recomendaciones. ¡Conocela!`,
        undefined,
        '/recomendaciones',
      );
    } catch (err) {
      this.logger.warn('No se pudo notificar a las alumnas de la nueva recomendación', err);
    }

    return recommendation;
  }

  @Put(':id')
  @UseInterceptors(recommendationImageFields)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateRecommendationDto,
    @UploadedFiles() files?: { image?: Express.Multer.File[] },
  ) {
    if (files?.image?.length) dto.image = await this.storage.upload('recommendations', files.image[0]);
    return this.recommendationsService.update(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.recommendationsService.delete(id);
  }
}