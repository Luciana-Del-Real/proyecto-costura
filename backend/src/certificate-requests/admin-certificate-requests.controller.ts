import { Controller, Get, Patch, Param, UseGuards } from '@nestjs/common';
import { CertificateRequestsService } from './certificate-requests.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

// Bandeja de solicitudes de certificado del dashboard del admin: expone TODAS
// las solicitudes (con su alumna y su curso) y permite marcar una como enviada
// una vez que la profesora mandó el certificado por mail fuera de la app.
@Controller('admin/certificate-requests')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminCertificateRequestsController {
  constructor(private readonly certificateRequestsService: CertificateRequestsService) {}

  @Get()
  async findAll() {
    return this.certificateRequestsService.findAllForAdmin();
  }

  @Patch(':id')
  async markAsSent(@Param('id') id: string) {
    return this.certificateRequestsService.markAsSent(id);
  }
}