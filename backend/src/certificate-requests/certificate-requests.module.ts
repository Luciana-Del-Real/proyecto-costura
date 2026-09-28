import { Module } from '@nestjs/common';
import { CertificateRequestsController } from './certificate-requests.controller';
import { AdminCertificateRequestsController } from './admin-certificate-requests.controller';
import { CertificateRequestsService } from './certificate-requests.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [CertificateRequestsController, AdminCertificateRequestsController],
  providers: [CertificateRequestsService],
})
export class CertificateRequestsModule {}