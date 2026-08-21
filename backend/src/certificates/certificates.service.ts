import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import PDFDocument from 'pdfkit';

@Injectable()
export class CertificatesService {
  constructor(private readonly prisma: PrismaService) {}

  // Genera el PDF del certificado si (y solo si) la alumna compró el curso
  // (compra aprobada) y completó el 100% de sus lecciones.
  // NOTA para cuando el diseño final del certificado esté listo: este es el
  // único lugar que hay que tocar para reemplazar este diseño genérico por
  // el definitivo (por ejemplo, dibujando sobre una plantilla en vez de
  // armar el PDF desde cero como se hace acá).
  async generate(userId: string, courseId: string): Promise<Buffer> {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: { lessons: true },
    });
    if (!course) throw new NotFoundException('Curso no encontrado');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const purchase = await this.prisma.purchase.findFirst({
      where: { userId, courseId, status: 'APPROVED', deletedAt: null },
    });
    if (!purchase) {
      throw new ForbiddenException('No compraste este curso, o tu compra todavía no fue aprobada');
    }

    const totalLessons = course.lessons.length;
    if (totalLessons === 0) {
      throw new ForbiddenException('Este curso todavía no tiene lecciones cargadas');
    }

    const completedCount = await this.prisma.lessonProgress.count({
      where: {
        userId,
        completed: true,
        lesson: { courseId },
      },
    });

    if (completedCount < totalLessons) {
      throw new ForbiddenException('Todavía no completaste todas las lecciones de este curso');
    }

    return this.buildPdf(user.name, course.title);
  }

  private buildPdf(studentName: string, courseName: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ layout: 'landscape', size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const width = doc.page.width;
      const height = doc.page.height;

      // Marco decorativo simple (esto se reemplaza cuando esté el diseño final)
      doc.rect(20, 20, width - 40, height - 40).lineWidth(2).stroke('#7A9E7E');
      doc.rect(30, 30, width - 60, height - 60).lineWidth(0.5).stroke('#C4A882');

      doc.fontSize(14).fillColor('#A08060').font('Helvetica').text(
        'GROW · CREATIVE EDUCATION STUDIO',
        0,
        90,
        { align: 'center' },
      );

      doc.fontSize(34).fillColor('#3D2B1F').font('Helvetica-Bold').text(
        'Certificado de finalización',
        0,
        130,
        { align: 'center' },
      );

      doc.fontSize(14).fillColor('#6B4C3B').font('Helvetica').text(
        'Se certifica que',
        0,
        200,
        { align: 'center' },
      );

      doc.fontSize(28).fillColor('#7A9E7E').font('Helvetica-Bold').text(
        studentName,
        0,
        230,
        { align: 'center' },
      );

      doc.fontSize(14).fillColor('#6B4C3B').font('Helvetica').text(
        'completó satisfactoriamente el curso',
        0,
        280,
        { align: 'center' },
      );

      doc.fontSize(22).fillColor('#3D2B1F').font('Helvetica-Bold').text(
        courseName,
        60,
        310,
        { align: 'center', width: width - 120 },
      );

      const date = new Date().toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' });
      doc.fontSize(11).fillColor('#A08060').font('Helvetica').text(
        date,
        0,
        height - 90,
        { align: 'center' },
      );

      doc.end();
    });
  }
}
