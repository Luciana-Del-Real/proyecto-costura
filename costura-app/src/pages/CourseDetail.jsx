import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCourseCatalog } from '../context/CourseCatalogContext';
import { usePurchases } from '../context/PurchaseContext';
import { useProgress } from '../context/ProgressContext';
import { useAuth } from '../context/AuthContext';
import ReactPlayer from 'react-player';
import { getImageUrl } from '../utils/media';
import { getCoursePrice } from '../utils/currency';
import { get, post, downloadFile } from '../services/api';

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
      <div className="min-h-screen bg-soft flex items-center justify-center px-4">
        <div className="max-w-md text-center bg-white border border-theme rounded-3xl p-8 shadow-sm">
          <span className="text-5xl">📚</span>
          <h2 className="text-xl font-bold text-theme mt-4 mb-2">Todavía no hay lecciones cargadas</h2>
          <p className="text-theme mb-6">Este curso está confirmado, pero la profesora todavía no subió ninguna clase. Volvé a entrar más adelante.</p>
          <Link to="/mis-cursos" className="btn btn-primary inline-block font-semibold">
            ← Volver a mis cursos
          </Link>
        </div>
      </div>
    );
  }

  if (!owned) {
    return (
      <div className="min-h-screen bg-stone-50">
        <div className="max-w-4xl mx-auto px-4 py-10">
          <Link to="/cursos" className="text-accent text-sm hover:text-accent mb-6 inline-block">← Volver a cursos</Link>
          <div className="card rounded-2xl overflow-hidden">
            <img src={getImageUrl(course.image)} alt={course.title} className="w-full h-64 object-cover" />
            <div className="p-8">
              <span className="text-xs font-semibold bg-soft text-accent px-3 py-1 rounded-full">{course.level}</span>
              <h1 className="text-3xl font-bold text-theme mt-3 mb-2">{course.title}</h1>
              <p className="text-theme mb-4">{course.longDescription}</p>
              <div className="flex flex-wrap gap-4 text-sm text-theme mb-6">
                <span>👩‍🏫 {course.instructor}</span>
                <span>🕐 {course.duration}</span>
                <span>📚 {course.lessons.length} lecciones</span>
                <span>⭐ {course.rating} ({course.students.toLocaleString()} alumnas)</span>
              </div>
              <div className="border-t border-stone-100 pt-6 flex items-center justify-between gap-4 flex-wrap">
                <span className="text-3xl font-bold text-stone-800">${getCoursePrice(course, user).toLocaleString()}</span>
                <button
                  onClick={() => navigate(user ? `/checkout/${course.id}` : '/login')}
                  className="btn btn-primary font-semibold"
                >
                  Comprar curso
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <CourseLearningView course={course} user={user} progress={progress} getProgress={getProgress} completeLesson={completeLesson} />;
}

function CourseLearningView({ course, user, progress, getProgress, completeLesson }) {
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
  const [commentsByLesson, setCommentsByLesson] = useState({});
  const [draftByLesson, setDraftByLesson] = useState({});
  const [sendingLessonId, setSendingLessonId] = useState(null);

  const loadComments = async (lessonId) => {
    if (commentsByLesson[lessonId]?.loaded) return;
    setCommentsByLesson(prev => ({ ...prev, [lessonId]: { loaded: false, items: [], loading: true } }));
    try {
      const items = await get(`/lessons/${lessonId}/comments`);
      setCommentsByLesson(prev => ({ ...prev, [lessonId]: { loaded: true, items, loading: false } }));
    } catch (e) {
      console.error('Error cargando comentarios', e);
      setCommentsByLesson(prev => ({ ...prev, [lessonId]: { loaded: true, items: [], loading: false } }));
    }
  };

  const toggleLesson = (lesson, blocked) => {
    if (blocked) return;
    const willOpen = openLessonId !== lesson.id;
    setOpenLessonId(willOpen ? lesson.id : null);
    if (willOpen) loadComments(lesson.id);
  };

  const handleSendComment = async (lessonId) => {
    const message = (draftByLesson[lessonId] || '').trim();
    if (!message) return;
    setSendingLessonId(lessonId);
    try {
      const created = await post(`/lessons/${lessonId}/comments`, { message });
      setCommentsByLesson(prev => ({
        ...prev,
        [lessonId]: { loaded: true, loading: false, items: [...(prev[lessonId]?.items || []), created] },
      }));
      setDraftByLesson(prev => ({ ...prev, [lessonId]: '' }));
    } catch (e) {
      console.error('Error enviando la pregunta', e);
      alert('No se pudo enviar tu pregunta. Probá de nuevo en un momento.');
    } finally {
      setSendingLessonId(null);
    }
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
    <div className="min-h-screen bg-soft pb-12">
      <div className="max-w-4xl mx-auto px-4 py-8 lg:py-10 animate-fade-in">
        <Link to="/mis-cursos" className="text-secondary text-sm hover:text-secondary-dark inline-flex items-center gap-1 mb-4">
          ← Volver a mis cursos
        </Link>

        {/* Encabezado del curso */}
        <div className="bg-white rounded-3xl border border-theme shadow-sm overflow-hidden mb-6">
          {course.image && (
            <img src={getImageUrl(course.image)} alt={course.title} className="w-full h-48 lg:h-64 object-cover" />
          )}
          <div className="p-6 lg:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex-1 min-w-[240px]">
                <span className="text-xs font-semibold bg-soft text-accent px-3 py-1 rounded-full">{course.level}</span>
                <h1 className="text-3xl md:text-4xl font-bold text-theme mt-3">{course.title}</h1>
                <p className="text-theme mt-2 max-w-2xl">{course.longDescription || course.description}</p>
                <div className="flex flex-wrap gap-4 text-sm text-theme mt-4">
                  <span>👩‍🏫 {course.instructor}</span>
                  <span>🕐 {course.duration}</span>
                  <span>📚 {course.lessons.length} lecciones</span>
                </div>
              </div>
              <div className="min-w-[220px] bg-soft rounded-2xl p-4">
                <div className="flex items-center justify-between text-sm text-theme mb-2">
                  <span>Progreso del curso</span>
                  <span className="font-bold text-secondary">{prog}%</span>
                </div>
                <div className="w-full bg-white rounded-full h-2 overflow-hidden">
                  <div className="bg-secondary h-2 rounded-full transition-all duration-500" style={{ width: `${prog}%` }} />
                </div>
                <p className="text-xs text-brown-accent mt-2">{completedCount}/{course.lessons.length} lecciones finalizadas</p>
                {prog === 100 && (
                  <button
                    onClick={handleDownloadCertificate}
                    disabled={downloadingCert}
                    className="btn btn-primary w-full mt-3 text-sm font-semibold"
                  >
                    {downloadingCert ? 'Generando...' : '🎓 Descargar certificado'}
                  </button>
                )}
              </div>
            </div>

            {/* PDFs generales del curso (no de una lección puntual) */}
            {courseAttachments.length > 0 && (
              <div className="mt-6 pt-6 border-t border-theme">
                <p className="text-xs uppercase tracking-wide text-brown-accent mb-2">Material del curso</p>
                <div className="flex flex-wrap gap-2">
                  {courseAttachments.map(att => (
                    <a
                      key={att.id}
                      href={getImageUrl(att.url)}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-ghost text-sm"
                    >
                      📄 {att.filename || 'Ver PDF'}
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
            const isOpen = openLessonId === lesson.id;
            const canComplete = !completed && !blocked;
            const lessonComments = commentsByLesson[lesson.id];
            const allPdfs = [
              ...(lesson.pdf ? [{ id: 'legacy', filename: 'PDF de la lección', url: lesson.pdf }] : []),
              ...(lesson.attachments || []),
            ];

            return (
              <div key={lesson.id} className={`bg-white border rounded-2xl shadow-sm overflow-hidden transition-colors ${isOpen ? 'border-secondary' : 'border-theme'}`}>
                {/* Cabecera de la lección */}
                <button
                  onClick={() => toggleLesson(lesson, blocked)}
                  disabled={blocked}
                  className={`w-full flex items-center gap-3 p-4 lg:p-5 text-left ${blocked ? 'opacity-60 cursor-not-allowed' : 'hover:bg-bg-soft/60'} transition-colors`}
                >
                  <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold ${
                    completed ? 'bg-emerald-500 text-white' : blocked ? 'bg-stone-200 text-stone-400' : 'bg-soft text-theme'
                  }`}>
                    {completed ? '✓' : blocked ? '🔒' : idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-theme truncate">{lesson.title}</p>
                    <p className="text-xs text-brown-accent mt-0.5">
                      ⏱ {lesson.duration}
                      {blocked && <span className="text-rose-400"> · Completá la lección anterior para desbloquear</span>}
                    </p>
                  </div>
                  {!blocked && (
                    <span className={`text-theme transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}>▾</span>
                  )}
                </button>

                {/* Contenido de la lección, solo si está abierta */}
                {isOpen && !blocked && (
                  <div className="border-t border-theme p-4 lg:p-6 space-y-5">
                    {lesson.description && (
                      <p className="text-sm text-theme leading-relaxed">{lesson.description}</p>
                    )}

                    {/* Video contenido (no a pantalla completa) */}
                    {lesson.videoUrl && (
                      <div className="max-w-xl mx-auto lg:mx-0">
                        <div className="aspect-video rounded-2xl overflow-hidden bg-black shadow-md relative">
                          <ReactPlayer
                            url={lesson.videoUrl}
                            width="100%"
                            height="100%"
                            controls
                            light
                            style={{ position: 'absolute', top: 0, left: 0 }}
                          />
                        </div>
                      </div>
                    )}

                    {/* PDFs de la lección */}
                    {allPdfs.length > 0 && (
                      <div>
                        <p className="text-xs uppercase tracking-wide text-brown-accent mb-2">Material descargable</p>
                        <div className="space-y-2">
                          {allPdfs.map(att => (
                            <a
                              key={att.id}
                              href={getImageUrl(att.url)}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-ghost text-sm w-fit"
                            >
                              📄 {att.filename || 'Ver PDF'}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Marcar como completada / avanzar */}
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        onClick={() => handleCompleteLesson(lesson.id)}
                        disabled={!canComplete}
                        className={`btn text-sm font-semibold ${
                          completed
                            ? 'bg-emerald-500 text-white'
                            : canComplete
                            ? 'bg-primary text-white hover:bg-primary-hover'
                            : 'bg-stone-200 text-stone-500 cursor-not-allowed'
                        }`}
                      >
                        {completed ? '✓ Completada' : 'Marcar como completada'}
                      </button>
                      {completed && idx < course.lessons.length - 1 && (
                        <button
                          onClick={() => toggleLesson(course.lessons[idx + 1], false)}
                          className="btn btn-ghost text-sm"
                        >
                          Ir a la siguiente lección →
                        </button>
                      )}
                    </div>

                    {/* Preguntas a la profesora (real, conectado al backend) */}
                    <div className="bg-soft rounded-2xl p-4 lg:p-5">
                      <h4 className="font-bold text-theme text-sm mb-3">Preguntas sobre esta lección</h4>

                      {lessonComments?.loading && (
                        <p className="text-sm text-brown-accent">Cargando...</p>
                      )}

                      {lessonComments?.loaded && lessonComments.items.length === 0 && (
                        <p className="text-sm text-brown-accent mb-3">Todavía no hay preguntas en esta lección. La profesora va a responder acá cuando dejes la tuya.</p>
                      )}

                      {lessonComments?.loaded && lessonComments.items.length > 0 && (
                        <div className="space-y-2 max-h-72 overflow-y-auto pr-1 mb-3">
                          {lessonComments.items.map(c => (
                            <div
                              key={c.id}
                              className={`rounded-xl p-3 border text-sm ${c.user?.role === 'ADMIN' ? 'bg-white border-theme' : 'bg-white border-[#d8e1d8] ml-4 sm:ml-8'}`}
                            >
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <p className="text-xs font-bold uppercase tracking-wide text-brown-accent">
                                  {c.user?.role === 'ADMIN' ? 'Profesora' : 'Vos'}
                                </p>
                                <p className="text-[11px] text-brown-accent/70">{c.user?.name}</p>
                              </div>
                              <p className="text-theme leading-relaxed">{c.message}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      <form
                        onSubmit={(e) => { e.preventDefault(); handleSendComment(lesson.id); }}
                        className="space-y-2"
                      >
                        <textarea
                          value={draftByLesson[lesson.id] || ''}
                          onChange={(e) => setDraftByLesson(prev => ({ ...prev, [lesson.id]: e.target.value }))}
                          rows={2}
                          placeholder="Escribí tu duda sobre esta lección..."
                          className="w-full rounded-xl border border-theme bg-white px-4 py-2.5 text-sm text-theme focus:outline-none focus:ring-2 focus:ring-secondary/30"
                        />
                        <button
                          type="submit"
                          disabled={sendingLessonId === lesson.id}
                          className="btn btn-primary text-sm font-semibold"
                        >
                          {sendingLessonId === lesson.id ? 'Enviando...' : 'Enviar pregunta'}
                        </button>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
