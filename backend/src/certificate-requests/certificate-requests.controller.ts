import { Controller, Get, Post, Param, Request, UseGuards } from '@nestjs/common';
import { CertificateRequestsService } from './certificate-requests.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { Principal } from '../common/principal';

// Solicitudes de certificado de la alumna (vista propia): pedir el
// certificado y consultar el estado de la solicitud de un curso.
@Controller('courses/:courseId/certificate/request')
@UseGuards(JwtAuthGuard)
export class CertificateRequestsController {
  constructor(private readonly certificateRequestsService: CertificateRequestsService) {}

  @Post()
  async request(
    @Param('courseId') courseId: string,
    @Request() req: { user: Principal },
  ) {
    return this.certificateRequestsService.request(req.user.id, courseId);
  }

  @Get()
  async findMy(
    @Param('courseId') courseId: string,
    @Request() req: { user: Principal },
  ) {
    return this.certificateRequestsService.findMyRequest(req.user.id, courseId);
  }
}