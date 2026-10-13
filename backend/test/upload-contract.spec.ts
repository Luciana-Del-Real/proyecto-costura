import { CoursesController } from '../src/courses/courses.controller';
import { CoursesService } from '../src/courses/courses.service';
import { CreateCourseDto } from '../src/courses/dto/create-course.dto';
import { UpdateCourseDto } from '../src/courses/dto/update-course.dto';
import { PatternsController } from '../src/patterns/patterns.controller';
import { PatternsService } from '../src/patterns/patterns.service';
import { CreatePatternDto } from '../src/patterns/dto/create-pattern.dto';
import { UpdatePatternDto } from '../src/patterns/dto/update-pattern.dto';
import { AdminEventsController } from '../src/events/admin-events.controller';
import { EventsService } from '../src/events/events.service';
import { CreateEventDto } from '../src/events/dto/create-event.dto';
import { UpdateEventDto } from '../src/events/dto/update-event.dto';
import { LessonsController } from '../src/lessons/lessons.controller';
import { LessonsService } from '../src/lessons/lessons.service';
import { CreateLessonDto } from '../src/lessons/dto/create-lesson.dto';
import { UpdateLessonDto } from '../src/lessons/dto/update-lesson.dto';
import { LessonProgressController } from '../src/lesson-progress/lesson-progress.controller';
import { LessonProgressService } from '../src/lesson-progress/lesson-progress.service';
import { UpdateLessonProgressDto } from '../src/lesson-progress/dto/update-lesson-progress.dto';
import { LessonCommentsController } from '../src/lesson-comments/lesson-comments.controller';
import { LessonCommentsService } from '../src/lesson-comments/lesson-comments.service';
import { CreateLessonCommentDto } from '../src/lesson-comments/dto/create-lesson-comment.dto';
import { AttachmentsService } from '../src/attachments/attachments.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { StorageService } from '../src/storage/storage.service';
import { NotificationsService } from '../src/notifications/notifications.service';

/**
 * Upload contract (R3-001): the value persisted after an upload is the ABSOLUTE
 * public URL returned by `StorageService.upload(folder, file)`, never the old
 * relative `/uploads/...` path. These are unit tests: every collaborator is a
 * mock, no network and no database is touched. The recommendations controller
 * already proves the contract for `recommendations`; this spec covers the other
 * seven call sites.
 */

const publicUrl = (folder: string, fieldname: string) =>
  `https://fake.supabase.co/storage/v1/object/public/uploads/${folder}/${fieldname}.png`;

/** A fake multer file, shaped like the in-memory uploads the interceptors produce. */
const fakeFile = (
  fieldname: string,
  originalname = 'x.png',
): Express.Multer.File =>
  ({
    fieldname,
    originalname,
    mimetype: 'image/png',
    buffer: Buffer.from('x'),
  }) as unknown as Express.Multer.File;

/** Fake StorageService whose `upload` returns an absolute public URL. */
function makeStorage() {
  return {
    upload: jest.fn(
      async (folder: string, file: { fieldname: string }) =>
        `https://fake.supabase.co/storage/v1/object/public/uploads/${folder}/${file.fieldname}.png`,
    ),
  };
}

/** Minimal NotificationsService mock: never fails, never notifies for real. */
function makeNotifications() {
  return {
    createNotificationsForStudents: jest.fn().mockResolvedValue(0),
  };
}

describe('upload contract: courses controller', () => {
  const files = (): {
    image: Express.Multer.File[];
    pdfGuide: Express.Multer.File[];
  } => ({ image: [fakeFile('image')], pdfGuide: [fakeFile('pdfGuide', 'guia.pdf')] });

  it('create sube image y pdfGuide y persiste sus URLs absolutas', async () => {
    const svc = {
      create: jest.fn().mockResolvedValue({ id: 'c1', title: 'Curso' }),
      findOne: jest.fn().mockResolvedValue({ id: 'c1' }),
    };
    const storage = makeStorage();
    const controller = new CoursesController(
      svc as unknown as CoursesService,
      makeNotifications() as unknown as NotificationsService,
      storage as unknown as StorageService,
    );
    const dto = {
      title: 'Curso',
      description: 'd',
      priceARS: 0,
      priceAUD: 0,
      level: 'PRINCIPIANTE',
    } as unknown as CreateCourseDto;

    await controller.create(dto, files());

    expect(storage.upload).toHaveBeenCalledWith(
      'courses',
      expect.objectContaining({ fieldname: 'image' }),
    );
    expect(storage.upload).toHaveBeenCalledWith(
      'courses',
      expect.objectContaining({ fieldname: 'pdfGuide' }),
    );
    expect(svc.create).toHaveBeenCalledWith(
      expect.objectContaining({
        image: publicUrl('courses', 'image'),
        pdfGuide: publicUrl('courses', 'pdfGuide'),
      }),
    );
  });

  it('update sube image y pdfGuide y persiste sus URLs absolutas', async () => {
    const svc = {
      update: jest.fn().mockResolvedValue({ id: 'c1' }),
      findOne: jest.fn().mockResolvedValue({ id: 'c1' }),
    };
    const storage = makeStorage();
    const controller = new CoursesController(
      svc as unknown as CoursesService,
      makeNotifications() as unknown as NotificationsService,
      storage as unknown as StorageService,
    );
    const dto = {} as UpdateCourseDto;

    await controller.update('c1', dto, files());

    expect(storage.upload).toHaveBeenCalledWith('courses', expect.anything());
    expect(svc.update).toHaveBeenCalledWith(
      'c1',
      expect.objectContaining({
        image: publicUrl('courses', 'image'),
        pdfGuide: publicUrl('courses', 'pdfGuide'),
      }),
    );
  });
});

describe('upload contract: patterns controller', () => {
  it('create sube imagen y archivo y persiste sus URLs absolutas', async () => {
    const svc = {
      create: jest
        .fn()
        .mockResolvedValue({ id: 'p1', titulo: 'Patrón', precioARS: 0, precioAUD: 0 }),
      findOne: jest.fn().mockResolvedValue({ id: 'p1' }),
    };
    const storage = makeStorage();
    const controller = new PatternsController(
      svc as unknown as PatternsService,
      makeNotifications() as unknown as NotificationsService,
      storage as unknown as StorageService,
    );
    const dto = { titulo: 'Patrón', descripcion: 'd' } as unknown as CreatePatternDto;

    await controller.create(dto, {
      imagen: [fakeFile('imagen')],
      archivo: [fakeFile('archivo', 'patron.pdf')],
    });

    expect(storage.upload).toHaveBeenCalledWith(
      'patterns',
      expect.objectContaining({ fieldname: 'imagen' }),
    );
    expect(storage.upload).toHaveBeenCalledWith(
      'patterns',
      expect.objectContaining({ fieldname: 'archivo' }),
    );
    expect(svc.create).toHaveBeenCalledWith(
      expect.objectContaining({
        imagen: publicUrl('patterns', 'imagen'),
        archivo: publicUrl('patterns', 'archivo'),
      }),
    );
  });

  it('update sube imagen y archivo y persiste sus URLs absolutas', async () => {
    const svc = {
      update: jest.fn().mockResolvedValue({ id: 'p1' }),
      findOne: jest.fn().mockResolvedValue({ id: 'p1' }),
    };
    const storage = makeStorage();
    const controller = new PatternsController(
      svc as unknown as PatternsService,
      makeNotifications() as unknown as NotificationsService,
      storage as unknown as StorageService,
    );
    const dto = {} as UpdatePatternDto;

    await controller.update('p1', dto, {
      imagen: [fakeFile('imagen')],
      archivo: [fakeFile('archivo', 'patron.pdf')],
    });

    expect(storage.upload).toHaveBeenCalledWith('patterns', expect.anything());
    expect(svc.update).toHaveBeenCalledWith(
      'p1',
      expect.objectContaining({
        imagen: publicUrl('patterns', 'imagen'),
        archivo: publicUrl('patterns', 'archivo'),
      }),
    );
  });
});

describe('upload contract: admin events controller', () => {
  it('create sube image y persiste su URL absoluta', async () => {
    const svc = {
      create: jest.fn().mockResolvedValue({ id: 'e1', title: 'Evento' }),
    };
    const storage = makeStorage();
    const controller = new AdminEventsController(
      svc as unknown as EventsService,
      makeNotifications() as unknown as NotificationsService,
      storage as unknown as StorageService,
    );
    const dto = {
      title: 'Evento',
      subtitle: 's',
      detail: 'd',
    } as unknown as CreateEventDto;

    await controller.create(dto, { image: [fakeFile('image')] });

    expect(storage.upload).toHaveBeenCalledWith(
      'events',
      expect.objectContaining({ fieldname: 'image' }),
    );
    expect(svc.create).toHaveBeenCalledWith(
      expect.objectContaining({ image: publicUrl('events', 'image') }),
    );
  });

  it('update sube image y persiste su URL absoluta', async () => {
    const svc = {
      update: jest.fn().mockResolvedValue({ id: 'e1' }),
    };
    const storage = makeStorage();
    const controller = new AdminEventsController(
      svc as unknown as EventsService,
      makeNotifications() as unknown as NotificationsService,
      storage as unknown as StorageService,
    );
    const dto = {} as UpdateEventDto;

    await controller.update('e1', dto, { image: [fakeFile('image')] });

    expect(storage.upload).toHaveBeenCalledWith('events', expect.anything());
    expect(svc.update).toHaveBeenCalledWith(
      'e1',
      expect.objectContaining({ image: publicUrl('events', 'image') }),
    );
  });
});

describe('upload contract: lessons controller', () => {
  it('create sube pdf y persiste su URL absoluta', async () => {
    const svc = {
      create: jest.fn().mockResolvedValue({ id: 'l1' }),
      findOne: jest.fn().mockResolvedValue({ id: 'l1', courseId: 'c1' }),
    };
    const storage = makeStorage();
    const controller = new LessonsController(
      svc as unknown as LessonsService,
      storage as unknown as StorageService,
    );
    const dto = {
      title: 'Lección',
      duration: '10',
      videoUrl: 'https://v.test',
      order: 1,
      courseId: 'c1',
    } as unknown as CreateLessonDto;

    await controller.create('c1', dto, { pdf: [fakeFile('pdf', 'guia.pdf')] });

    expect(storage.upload).toHaveBeenCalledWith(
      'lessons',
      expect.objectContaining({ fieldname: 'pdf' }),
    );
    expect(svc.create).toHaveBeenCalledWith(
      expect.objectContaining({ pdf: publicUrl('lessons', 'pdf') }),
    );
  });

  it('update sube pdf y persiste su URL absoluta', async () => {
    const svc = {
      findOne: jest.fn().mockResolvedValue({ id: 'l1', courseId: 'c1' }),
      update: jest.fn().mockResolvedValue({ id: 'l1' }),
    };
    const storage = makeStorage();
    const controller = new LessonsController(
      svc as unknown as LessonsService,
      storage as unknown as StorageService,
    );
    const dto = {} as UpdateLessonDto;

    await controller.update('c1', 'l1', dto, { pdf: [fakeFile('pdf', 'guia.pdf')] });

    expect(storage.upload).toHaveBeenCalledWith('lessons', expect.anything());
    expect(svc.update).toHaveBeenCalledWith(
      'l1',
      expect.objectContaining({ pdf: publicUrl('lessons', 'pdf') }),
    );
  });
});

describe('upload contract: lesson progress controller', () => {
  it('markLessonComplete sube la evidencia y persiste la URL absoluta en el DTO', async () => {
    const svc = { markLessonComplete: jest.fn().mockResolvedValue({ id: 'pr1' }) };
    const storage = makeStorage();
    const controller = new LessonProgressController(
      svc as unknown as LessonProgressService,
      storage as unknown as StorageService,
    );
    const dto = { completed: true } as UpdateLessonProgressDto;

    await controller.markLessonComplete(
      { user: { id: 'u1', role: 'STUDENT' } } as never,
      'l1',
      dto,
      fakeFile('image'),
    );

    expect(storage.upload).toHaveBeenCalledWith(
      'progress',
      expect.objectContaining({ fieldname: 'image' }),
    );
    expect(svc.markLessonComplete).toHaveBeenCalledWith(
      'u1',
      'l1',
      expect.objectContaining({ image: publicUrl('progress', 'image') }),
    );
  });
});

describe('upload contract: lesson comments controller', () => {
  it('create sube la imagen y persiste la URL absoluta', async () => {
    const svc = { create: jest.fn().mockResolvedValue({ id: 'cm1' }) };
    const storage = makeStorage();
    const controller = new LessonCommentsController(
      svc as unknown as LessonCommentsService,
      storage as unknown as StorageService,
    );
    const dto = { message: 'hola' } as CreateLessonCommentDto;
    const expected = publicUrl('comments', 'image');

    await controller.create(
      'l1',
      dto,
      { user: { id: 'u1', role: 'STUDENT' } } as never,
      fakeFile('image'),
    );

    expect(storage.upload).toHaveBeenCalledWith(
      'comments',
      expect.objectContaining({ fieldname: 'image' }),
    );
    expect(dto.image).toBe(expected);
    expect(svc.create).toHaveBeenCalledWith('l1', 'u1', 'STUDENT', 'hola', undefined, expected);
  });
});

describe('upload contract: attachments service', () => {
  const makePrisma = () => ({
    attachment: {
      createMany: jest.fn().mockResolvedValue({ count: 1 }),
      findMany: jest.fn().mockResolvedValue([]),
    },
  });

  it('createManyForCourse persiste la URL absoluta del adjunto', async () => {
    const prisma = makePrisma();
    const storage = makeStorage();
    const service = new AttachmentsService(
      prisma as unknown as PrismaService,
      storage as unknown as StorageService,
    );

    await service.createManyForCourse('c1', [fakeFile('file', 'anexo.pdf')]);

    expect(storage.upload).toHaveBeenCalledWith(
      'courses',
      expect.objectContaining({ fieldname: 'file' }),
    );
    expect(prisma.attachment.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          filename: 'anexo.pdf',
          url: publicUrl('courses', 'file'),
          courseId: 'c1',
        }),
      ],
    });
  });

  it('createManyForLesson persiste la URL absoluta del adjunto', async () => {
    const prisma = makePrisma();
    const storage = makeStorage();
    const service = new AttachmentsService(
      prisma as unknown as PrismaService,
      storage as unknown as StorageService,
    );

    await service.createManyForLesson('l1', [fakeFile('file', 'anexo.pdf')]);

    expect(storage.upload).toHaveBeenCalledWith(
      'lessons',
      expect.objectContaining({ fieldname: 'file' }),
    );
    expect(prisma.attachment.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          filename: 'anexo.pdf',
          url: publicUrl('lessons', 'file'),
          lessonId: 'l1',
        }),
      ],
    });
  });

  it('createManyForPattern persiste la URL absoluta del adjunto', async () => {
    const prisma = makePrisma();
    const storage = makeStorage();
    const service = new AttachmentsService(
      prisma as unknown as PrismaService,
      storage as unknown as StorageService,
    );

    await service.createManyForPattern('p1', [fakeFile('file', 'anexo.pdf')]);

    expect(storage.upload).toHaveBeenCalledWith(
      'patterns',
      expect.objectContaining({ fieldname: 'file' }),
    );
    expect(prisma.attachment.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          filename: 'anexo.pdf',
          url: publicUrl('patterns', 'file'),
          patternId: 'p1',
        }),
      ],
    });
  });
});
