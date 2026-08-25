import { Controller, Get, Param, Request, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { CertificatesService } from './certificates.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { Principal } from '../common/principal';

@Controller('courses/:courseId/certificate')
@UseGuards(JwtAuthGuard)
export class CertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

 @Get()
  async download(
    @Param('courseId') courseId: string,
    @Request() req: { user: Principal },
    @Res() res: Response,
  ) {
    try {
      const pdfBuffer = await this.certificatesService.generate(req.user.id, courseId);
      
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="certificado.pdf"',
        'Content-Length': pdfBuffer.length,
      });

      // Usar end() es más seguro para buffers binarios directos
      return res.end(pdfBuffer);
    } catch (error) {
      // Si el servicio falla, dejamos que NestJS maneje el error HTTP
      // (Asegúrate de no haber enviado headers antes)
      if (!res.headersSent) {
        throw error;
      }
    }
  }
}