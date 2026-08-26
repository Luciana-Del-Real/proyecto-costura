import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { BookOpen, AlertTriangle, GraduationCap, FileText } from 'lucide-react';
import { useCourseCatalog } from '../context/CourseCatalogContext';
import { usePurchases } from '../context/PurchaseContext';
import { useProgress } from '../context/ProgressContext';
import { useAuth } from '../context/AuthContext';
import { getImageUrl } from '../utils/media';
import { getLevelLabel } from '../utils/levels';
import CourseCover from '../components/CourseCover';
import { downloadFile } from '../services/api';
import useLessonComments from '../hooks/useLessonComments';
import CoursePreviewView from '../components/course/CoursePreviewView';
import CourseProgressCard from '../components/course/CourseProgressCard';
import LessonAccordionItem from '../components/course/LessonAccordionItem';

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { courses } = useCourseCatalog();
  const { hasCourse } = usePurchases();
  const { progress, getProgress, completeLesson } = useProgress();
  const course = courses.find(c => String(c.id) === String(id));

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-stone-500">Curso no encontrado.</p>
      </div>
    );
  }

  const owned = Boolean(user && hasCourse(course.id));

  if (owned && (!course.lessons || course.lessons.length === 0)) {
    return (
      <div className="min-h-screen bg-bg-surface flex items-center justify-center px-4">
        <div className="max-w-md text-center bg-white border border-border rounded-3xl p-8 shadow-sm">
          <BookOpen className="w-12 h-12 text-primary mx-auto" strokeWidth={1.5} />
          <h2 className="font-display font-bold text-text-ink text-2xl mt-4 mb-2">Todavía no hay lecciones cargadas</h2>
          <p className="text-text-ink mb-6">Este curso está confirmado, pero la profesora todavía no subió ninguna clase. Volvé a entrar más adelante.</p>
          <Link to="/mis-cursos" className="btn btn-primary inline-block font-semibold">
            ← Volver a mis cursos
          </Link>
        </div>
      </div>
    );
  }

  if (!owned) {
    return (
      <CoursePreviewView
        course={course}
        user={user}
        onBuy={() => navigate(user ? `/checkout/${course.id}` : '/login')}
      />
    );
  }

  return (
    <OwnedCourseView
      key={course.id}
      course={course}
      progress={progress}
      getProgress={getProgress}
      completeLesson={completeLesson}
    />
  );
}

// Vista de aprendizaje de un alumno con compra aprobada. El catálogo público
// solo trae títulos; el contenido completo (video/pdf/attachments + material
// del curso) se carga del endpoint protegido. `key={course.id}` resetea el
// estado al navegar entre cursos.
function OwnedCourseView({ course, progress, getProgress, completeLesson }) {
  const { getCourseLessons } = useCourseCatalog();
  const [fullCourse, setFullCourse] = useState(null);
  const [loadingContent, setLoadingContent] = useState(true);
  const [contentError, setContentError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getCourseLessons(course.id)
      .then((data) => {
        if (cancelled) return;
        setFullCourse({ ...course, ...data.course, lessons: data.lessons });
        setLoadingContent(false);
      })
      .catch((err) => {
        console.error('Error cargando el contenido del curso:', err);
        if (!cancelled) {
          setLoadingContent(false);
          setContentError(true);
        }
      });
    return () => { cancelled = true; };
  }, [course, getCourseLessons]);

  if (loadingContent) {
    return (
      <div className="min-h-screen bg-bg-surface flex items-center justify-center px-4">
        <p className="text-text-ink">Cargando el contenido del curso...</p>
      </div>
    );
  }

  if (contentError || !fullCourse) {
    return (
      <div className="min-h-screen bg-bg-surface flex items-center justify-center px-4">
        <div className="max-w-md text-center bg-white border border-border rounded-3xl p-8 shadow-sm">
          <AlertTriangle className="w-12 h-12 text-primary mx-auto" strokeWidth={1.5} />
          <h2 className="font-display font-bold text-text-ink text-2xl mt-4 mb-2">No se pudo cargar el contenido</h2>
          <p className="text-text-ink mb-6">Verificá tu conexión y volvé a intentar. Si el problema continúa, escribile a la profesora.</p>
          <Link to="/mis-cursos" className="btn btn-primary inline-block font-semibold">
            ← Volver a mis cursos
          </Link>
        </div>
      </div>
    );
  }

  return <CourseLearningView course={fullCourse} progress={progress} getProgress={getProgress} completeLesson={completeLesson} />;
}

function CourseLearningView({ course, progress, getProgress, completeLesson }) {
  const courseProgress = progress[course.id] || { completed: [], lastLesson: 0 };
  const isCompleted = (lessonId) => courseProgress.completed.includes(lessonId);

  const isSequentialAllowed = (index) => {
    if (index === 0) return true;
    return courseProgress.completed.includes(course.lessons[index - 1].id);
  };

  // Se abre por defecto la primera lección no completada (o la última si ya se terminó todo)
  const firstOpenIndex = course.lessons.findIndex(l => !isCompleted(l.id));
  const [openLessonId, setOpenLessonId] = useState(
    course.lessons[firstOpenIndex >= 0 ? firstOpenIndex : course.lessons.length - 1].id
  );

  // Comentarios/preguntas por lección, cargados de a uno (al abrir la lección)
  const { commentsByLesson, loadComments, sendComment, drafts, setDraft, sendingFor } = useLessonComments();

  // Al llegar con #lesson-<id> (desde una notificación de la campanita), abrir
  // esa lección, cargar sus preguntas y scrollear hasta ella. El hash se limpia
  // al final para que un refresh no lo repita.
  const location = useLocation();
  useEffect(() => {
    const m = location.hash.match(/^#lesson-(.+)$/);
    if (!m) return;
    const lessonId = m[1];
    setOpenLessonId(lessonId);
    loadComments(lessonId);
    const timer = setTimeout(() => {
      document.getElementById(`lesson-${lessonId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleLesson = (lesson, blocked) => {
    if (blocked) return;
    const willOpen = openLessonId !== lesson.id;
    setOpenLessonId(willOpen ? lesson.id : null);
    if (willOpen) loadComments(lesson.id);
  };

  const handleCompleteLesson = async (lessonId) => {
    try {
      await completeLesson(course.id, lessonId);
    } catch (err) {
      console.error(err);
      alert('No se pudo marcar la lección como completada. Probá de nuevo.');
    }
  };
  const [downloadingCert, setDownloadingCert] = useState(false);
  const handleDownloadCertificate = async () => {
    setDownloadingCert(true);
    try {
      await downloadFile(`/courses/${course.id}/certificate`, `certificado-${course.title}.pdf`);
    } catch (err) {
      console.error(err);
      alert('No se pudo descargar el certificado. Probá de nuevo en un momento.');
    } finally {
      setDownloadingCert(false);
    }
  };

  const prog = getProgress(course.id, course.lessons.length);
  const completedCount = courseProgress.completed.length;
  const courseAttachments = [
    ...(course.pdfGuide ? [{ id: 'course-legacy', filename: 'PDF principal del curso', url: course.pdfGuide }] : []),
    ...(course.attachments || []),
  ];

  return (
    <div className="min-h-screen bg-bg-surface pb-12">
      <div className="max-w-4xl mx-auto px-4 py-8 lg:py-10 animate-fade-in">
        <Link to="/mis-cursos" className="text-primary text-sm hover:text-primary-hover inline-flex items-center gap-1 mb-4">
          ← Volver a mis cursos
        </Link>

        {/* Encabezado del curso */}
        <div className="bg-white rounded-3xl border border-border shadow-sm overflow-hidden mb-6">
          {/* Portada: CourseCover muestra el nombre del curso si no hay imagen */}
          <CourseCover course={course} className="w-full h-48 lg:h-64 object-cover" />
          <div className="p-6 lg:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex-1 min-w-[240px]">
                <span className="text-xs font-semibold bg-bg-soft text-accent px-3 py-1 rounded-full">{getLevelLabel(course.level)}</span>
                <h1 className="font-display text-3xl md:text-4xl font-bold text-text-ink mt-3">{course.title}</h1>
                <p className="text-text-ink mt-2 max-w-2xl">{course.longDescription || course.description}</p>
                <div className="flex flex-wrap gap-4 text-sm text-text-ink mt-4">
                  <span className="flex items-center gap-1.5"><GraduationCap className="w-4 h-4 text-accent" strokeWidth={1.5} /> {course.instructor}</span>
                  <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-accent" strokeWidth={1.5} /> {course.lessons.length} lecciones</span>
                </div>
              </div>
              <CourseProgressCard
                prog={prog}
                completedCount={completedCount}
                total={course.lessons.length}
                downloadingCert={downloadingCert}
                onDownloadCertificate={handleDownloadCertificate}
              />
            </div>

            {/* PDFs generales del curso (no de una lección puntual) */}
            {courseAttachments.length > 0 && (
              <div className="mt-6 pt-6 border-t border-border">
                <p className="text-xs uppercase tracking-wide text-accent mb-2">Material del curso</p>
                <div className="flex flex-wrap gap-2">
                  {courseAttachments.map(att => (
                    <a
                      key={att.id}
                      href={getImageUrl(att.url)}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-ghost text-sm flex items-center gap-1.5"
                    >
                      <FileText className="w-4 h-4" strokeWidth={1.5} /> {att.filename || 'Ver PDF'}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Desglose de lecciones (acordeón) */}
        <div className="space-y-3">
          {course.lessons.map((lesson, idx) => {
            const blocked = !isSequentialAllowed(idx);
            const completed = isCompleted(lesson.id);

            return (
              <LessonAccordionItem
                key={lesson.id}
                lesson={lesson}
                idx={idx}
                total={course.lessons.length}
                isOpen={openLessonId === lesson.id}
                blocked={blocked}
                completed={completed}
                comments={commentsByLesson[lesson.id]}
                drafts={drafts}
                sendingFor={sendingFor}
                onToggle={toggleLesson}
                onComplete={handleCompleteLesson}
                onSendComment={sendComment}
                onDraftChange={setDraft}
                onNext={() => toggleLesson(course.lessons[idx + 1], false)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}