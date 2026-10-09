import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, UseInterceptors, UploadedFiles, Logger } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { mkdirSync } from 'fs';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { NotificationsService } from '../notifications/notifications.service';

const uploadsDir = './uploads/events';
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

const eventImageFields = FileFieldsInterceptor([{ name: 'image', maxCount: 1 }], storageOptions);

// CRUD completo de eventos para el panel admin (crear, editar, eliminar y
// listar, incluidos los ocultos). El folleto se arma con TEXTO (título,
// descripción y detalle); la imagen se sube desde el formulario admin y se
// usa como fondo difuminado de la tarjeta pública del evento.
@Controller('admin/events')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminEventsController {
  private readonly logger = new Logger(AdminEventsController.name);

  constructor(
    private readonly eventsService: EventsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Get()
  findAll() {
    return this.eventsService.findAllForAdmin();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  @Post()
  @UseInterceptors(eventImageFields)
  async create(@Body() dto: CreateEventDto, @UploadedFiles() files?: { image?: Express.Multer.File[] }) {
    if (files?.image?.length) dto.image = '/uploads/events/' + files.image[0].filename;
    const event = await this.eventsService.create(dto);

    // Avisa a todas las alumnas del evento nuevo. La notificación nunca debe
    // romper la creación: si falla, se loguea y la creación sigue.
    try {
      await this.notificationsService.createNotificationsForStudents(
        'Nuevo evento',
        `${event.title} ya está disponible en Eventos. ¡Conocelo!`,
        undefined,
        '/eventos',
      );
    } catch (err) {
      this.logger.warn('No se pudo notificar a las alumnas del nuevo evento', err);
    }

    return event;
  }

  @Put(':id')
  @UseInterceptors(eventImageFields)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateEventDto,
    @UploadedFiles() files?: { image?: Express.Multer.File[] },
  ) {
    if (files?.image?.length) dto.image = '/uploads/events/' + files.image[0].filename;
    return this.eventsService.update(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.eventsService.delete(id);
  }
}