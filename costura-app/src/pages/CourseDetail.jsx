import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { BookOpen, AlertTriangle } from 'lucide-react';
import { useCourseCatalog } from '../context/CourseCatalogContext';
import { useDialog } from '../context/DialogContext';
import { usePurchases } from '../context/PurchaseContext';
import { useProgress } from '../context/ProgressContext';
import { useAuth } from '../context/AuthContext';
import { downloadFile } from '../services/api';
import useLessonComments from '../hooks/useLessonComments';
import CoursePreviewView from '../components/course/CoursePreviewView';
import CourseWelcomePanel from '../components/course/CourseWelcomePanel';
import LessonAccordionItem from '../components/course/LessonAccordionItem';
import LessonListItem from '../components/course/LessonListItem';
import LessonContent from '../components/course/LessonContent';

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
  const { alertDialog } = useDialog();
  const courseProgress = progress[course.id] || { completed: [], lastLesson: 0 };
  const isCompleted = (lessonId) => courseProgress.completed.includes(lessonId);

  const isSequentialAllowed = (index) => {
    if (index === 0) return true;
    return courseProgress.completed.includes(course.lessons[index - 1].id);
  };

  // Estado de lección seleccionada: null muestra la bienvenida del curso en el
  // panel derecho (portada + nombre + descripción) hasta que se elige una lección.
  const [openLessonId, setOpenLessonId] = useState(null);

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
      alertDialog('No se pudo marcar la lección como completada. Probá de nuevo.');
    }
  };
  const [downloadingCert, setDownloadingCert] = useState(false);
  const handleDownloadCertificate = async () => {
    setDownloadingCert(true);
    try {
      await downloadFile(`/courses/${course.id}/certificate`, `certificado-${course.title}.pdf`);
    } catch (err) {
      console.error(err);
      alertDialog('No se pudo descargar el certificado. Probá de nuevo en un momento.');
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

  // Lección seleccionada (desktop): el panel derecho muestra su contenido.
  const activeLesson = course.lessons.find(l => l.id === openLessonId);
  const activeIdx = activeLesson ? course.lessons.findIndex(l => l.id === activeLesson.id) : -1;

  return (
    <div className="min-h-screen bg-bg-surface pb-12">
      <div className="max-w-6xl mx-auto px-4 py-8 lg:py-10 animate-fade-in">
        <Link to="/mis-cursos" className="text-primary text-sm hover:text-primary-hover inline-flex items-center gap-1 mb-4">
          ← Volver a mis cursos
        </Link>

        {/* Desktop: layout de dos paneles (lista de lecciones + contenido).
            Sin lección seleccionada, el panel derecho muestra la bienvenida
            del curso (portada + nombre + descripción). */}
        <div className="hidden lg:grid lg:grid-cols-[320px_1fr] lg:gap-6 lg:items-start">
          {/* Lista compacta de lecciones (panel izquierdo): seleccionar una
              lección la resalta y muestra su contenido en el panel derecho */}
          <div className="space-y-2">
            {course.lessons.map((lesson, idx) => {
              const blocked = !isSequentialAllowed(idx);
              const completed = isCompleted(lesson.id);

              return (
                <LessonListItem
                  key={lesson.id}
                  lesson={lesson}
                  idx={idx}
                  isActive={openLessonId === lesson.id}
                  blocked={blocked}
                  completed={completed}
                  onClick={() => toggleLesson(lesson, blocked)}
                />
              );
            })}
          </div>

          {/* Contenido del panel derecho: bienvenida del curso o lección */}
          <div>
            {activeLesson ? (
              <div className="card-flat rounded-2xl p-6">
                <LessonContent
                  lesson={activeLesson}
                  idx={activeIdx}
                  total={course.lessons.length}
                  completed={isCompleted(activeLesson.id)}
                  comments={commentsByLesson[activeLesson.id]}
                  draft={drafts[activeLesson.id] || ''}
                  sendingFor={sendingFor}
                  onComplete={handleCompleteLesson}
                  onSendComment={sendComment}
                  onDraftChange={setDraft}
                  onNext={() => toggleLesson(course.lessons[activeIdx + 1], false)}
                  canComplete={!isCompleted(activeLesson.id) && isSequentialAllowed(activeIdx)}
                />
              </div>
            ) : (
              <CourseWelcomePanel
                course={course}
                prog={prog}
                completedCount={completedCount}
                downloadingCert={downloadingCert}
                onDownloadCertificate={handleDownloadCertificate}
                courseAttachments={courseAttachments}
              />
            )}
          </div>
        </div>

        {/* Mobile: bienvenida + acordeón clásico (comportamiento actual) */}
        <div className="lg:hidden">
          <CourseWelcomePanel
            course={course}
            prog={prog}
            completedCount={completedCount}
            downloadingCert={downloadingCert}
            onDownloadCertificate={handleDownloadCertificate}
            courseAttachments={courseAttachments}
          />

          <div className="space-y-3 mt-6">
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
    </div>
  );
}