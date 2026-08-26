import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

/**
 * Smoke tests for the page components extracted during the frontend cleanup
 * (admin course form pieces and course-detail pieces). Each component is
 * rendered with minimal required props and asserted to mount without throwing
 * (renderToStaticMarkup throws on any render error).
 *
 * No jsdom needed: static markup is enough to prove "renders without
 * throwing". Only CoursePublicHero uses a router Link, so it is wrapped in
 * MemoryRouter.
 */
import CourseFieldsForm from './admin/CourseFieldsForm';
import CourseAttachmentsSection from './admin/CourseAttachmentsSection';
import LessonEditorItem from './admin/LessonEditorItem';
import NewLessonForm from './admin/NewLessonForm';
import CoursePreviewView from './course/CoursePreviewView';
import CourseProgressCard from './course/CourseProgressCard';
import LessonAccordionItem from './course/LessonAccordionItem';
import LessonCommentsSection from './course/LessonCommentsSection';

const noop = vi.fn();
const emptyLesson = { id: 'l1', title: 'Lección 1', duration: '12 min', videoUrl: '', attachments: [] };

describe('extracted components smoke render', () => {
  it('CourseFieldsForm renders the course form shell', () => {
    const html = renderToStaticMarkup(
      <CourseFieldsForm
        form={{ title: '', description: '', priceARS: '', priceAUD: '', level: 'Principiante' }}
        onChange={noop}
        saving={false}
        isEditing={false}
        onSubmit={noop}
        setImageFile={noop}
        coursePdfFiles={[]}
        setCoursePdfFiles={noop}
        course={null}
        onDeleteAttachment={noop}
      />,
    );
    expect(html).toContain('<form');
    expect(html).toContain('Crear curso');
  });

  it('CourseAttachmentsSection renders the file inputs', () => {
    const html = renderToStaticMarkup(
      <CourseAttachmentsSection
        setImageFile={noop}
        coursePdfFiles={[]}
        setCoursePdfFiles={noop}
        course={{}}
        isEditing={false}
        onDeleteAttachment={noop}
      />,
    );
    expect(html).toContain('Portada');
    expect(html).toContain('type="file"');
  });

  it('LessonEditorItem renders the lesson editor row', () => {
    const html = renderToStaticMarkup(
      <LessonEditorItem
        lesson={emptyLesson}
        editedLessons={{}}
        onFieldChange={noop}
        onLessonPdfChange={noop}
        savingLessonId={null}
        onSaveLesson={noop}
        onDeleteLesson={noop}
        onDeleteLessonAttachment={noop}
        questionsOpen={false}
        onToggleQuestions={noop}
        comments={null}
        drafts={{}}
        sendingFor={null}
        onSendComment={noop}
        onDraftChange={noop}
      />,
    );
    expect(html).toContain('Lección 1');
    expect(html).toContain('Guardar lección');
  });

  it('NewLessonForm renders the new lesson form shell', () => {
    const html = renderToStaticMarkup(
      <NewLessonForm
        newLesson={{ title: '', description: '', duration: '', videoUrl: '' }}
        setNewLesson={noop}
        setPdfs={noop}
        creating={false}
        onSubmit={noop}
      />,
    );
    expect(html).toContain('Agregar nueva lección');
    expect(html).toContain('type="file"');
  });

  it('CoursePreviewView renders the course preview with lessons and CTA', () => {
    const course = {
      level: 'INTERMEDIO',
      title: 'Moldería Avanzada',
      longDescription: 'Descripción larga',
      instructor: 'Luciana',
      duration: '8 semanas',
      lessons: [{ id: 'l1', title: 'Lección 1', duration: '10 min', description: 'Intro' }],
      rating: 4.5,
      students: 120,
      priceARS: 14000,
      priceAUD: 150,
    };
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <CoursePreviewView course={course} user={null} onBuy={noop} />
      </MemoryRouter>,
    );
    expect(html).toContain('Moldería Avanzada');
    expect(html).toContain('Lección 1');
    expect(html).toContain('Inscribirme');
  });

  it('CourseProgressCard renders progress and counters', () => {
    const html = renderToStaticMarkup(
      <CourseProgressCard
        prog={50}
        completedCount={2}
        total={4}
        downloadingCert={false}
        onDownloadCertificate={noop}
      />,
    );
    expect(html).toContain('50%');
    expect(html).toContain('2/4 lecciones finalizadas');
  });

  it('LessonAccordionItem renders the lesson header (closed state, no player)', () => {
    const html = renderToStaticMarkup(
      <LessonAccordionItem
        lesson={emptyLesson}
        idx={0}
        total={2}
        isOpen={false}
        blocked={false}
        completed={false}
        comments={null}
        drafts={{}}
        sendingFor={null}
        onToggle={noop}
        onComplete={noop}
        onSendComment={noop}
        onDraftChange={noop}
        onNext={noop}
      />,
    );
    expect(html).toContain('Lección 1');
    expect(html).toContain('12 min');
  });

  it('LessonCommentsSection renders the questions block', () => {
    const html = renderToStaticMarkup(
      <LessonCommentsSection
        lessonId="l1"
        comments={{ loaded: true, items: [] }}
        draft=""
        sendingFor={null}
        onSend={noop}
        onDraftChange={noop}
      />,
    );
    expect(html).toContain('Preguntas sobre esta lección');
    expect(html).toContain('Enviar pregunta');
  });
});