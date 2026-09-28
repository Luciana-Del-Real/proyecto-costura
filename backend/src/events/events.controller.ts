import { Controller, Get } from '@nestjs/common';
import { EventsService } from './events.service';

// Público: la grilla de tarjetas de la página Eventos (solo eventos
// visibles, en el orden definido por el admin).
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  findAll() {
    return this.eventsService.findAllPublic();
  }
}