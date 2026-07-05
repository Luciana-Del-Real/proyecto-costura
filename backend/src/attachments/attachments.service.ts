import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { join } from 'path';
import { unlink } from 'fs/promises';

@Injectable()
export class AttachmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async createManyForCourse(courseId: string, files: Express.Multer.File[]) {
    if (!files?.length) return [];
    await this.prisma.attachment.createMany({
      data: files.map((f) => ({
        filename: f.originalname,
        url: `/uploads/courses/${f.filename}`,
        courseId,
      })),
    });
    return this.prisma.attachment.findMany({ where: { courseId } });
  }

  async createManyForLesson(lessonId: string, files: Express.Multer.File[]) {
    if (!files?.length) return [];
    await this.prisma.attachment.createMany({
      data: files.map((f) => ({
        filename: f.originalname,
        url: `/uploads/lessons/${f.filename}`,
        lessonId,
      })),
    });
    return this.prisma.attachment.findMany({ where: { lessonId } });
  }

  async delete(id: string) {
    const attachment = await this.prisma.attachment.findUnique({ where: { id } });
    if (!attachment) throw new NotFoundException('Adjunto no encontrado');

    // Intentamos borrar el archivo físico, pero si falla no bloqueamos el borrado del registro
    try {
      const relativePath = attachment.url.replace(/^\/uploads\//, '');
      await unlink(join(process.cwd(), 'uploads', relativePath));
    } catch (err) {
      // El archivo puede no existir en disco; no es crítico
    }

    return this.prisma.attachment.delete({ where: { id } });
  }
}
