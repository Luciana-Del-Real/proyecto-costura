import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AttachmentsService } from '../attachments/attachments.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';

@Injectable()
export class LessonsService {
  constructor(
    private prisma: PrismaService,
    private readonly attachmentsService: AttachmentsService,
  ) {}

  async create(dto: CreateLessonDto) {
    // Validate course exists
    const course = await this.prisma.course.findUnique({
      where: { id: dto.courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    return this.prisma.lesson.create({
      data: {
        title: dto.title,
        duration: dto.duration,
        videoUrl: dto.videoUrl,
        order: dto.order,
        courseId: dto.courseId,
        pdf: (dto as any).pdf,
      },
      include: { attachments: true },
    });
  }

  async addAttachments(lessonId: string, files: Express.Multer.File[]) {
    return this.attachmentsService.createManyForLesson(lessonId, files);
  }

  async findByCourse(courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    return this.prisma.lesson.findMany({
      where: { courseId },
      orderBy: { order: 'asc' },
      include: { attachments: true },
    });
  }

  async findOne(id: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: { attachments: true },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    return lesson;
  }

  async update(id: string, dto: UpdateLessonDto) {
    const lesson = await this.findOne(id);

    if (dto.courseId && dto.courseId !== lesson.courseId) {
      const course = await this.prisma.course.findUnique({
        where: { id: dto.courseId },
      });

      if (!course) {
        throw new NotFoundException('New course not found');
      }
    }

    return this.prisma.lesson.update({
      where: { id },
      data: {
        title: dto.title,
        duration: dto.duration,
        videoUrl: dto.videoUrl,
        order: dto.order,
        courseId: dto.courseId,
        pdf: (dto as any).pdf,
      },
      include: { attachments: true },
    });
  }

  async delete(id: string) {
    await this.findOne(id);

    return this.prisma.lesson.delete({
      where: { id },
    });
  }

  async deleteMultiple(courseId: string) {
    return this.prisma.lesson.deleteMany({
      where: { courseId },
    });
  }
}
