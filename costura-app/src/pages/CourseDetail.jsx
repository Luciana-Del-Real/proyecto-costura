import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCourses } from '../context/CoursesContext';
import { useAuth } from '../context/AuthContext';
import ReactPlayer from 'react-player';
import { getImageUrl } from '../utils/media';

const buildInitialThread = (course, lesson) => ([
  {
    id: `teacher-${lesson.id}-intro`,
    role: 'teacher',
    author: course.instructor,
    text: `Dejá acá tus dudas sobre "${lesson.title}" y te respondo en este mismo espacio.`,
  },
]);

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { courses, hasCourse, progress, getProgress, completeLesson } = useCourses();
  const course = courses.find(c => String(c.id) === String(id));

  const owned = Boolean(user && course && hasCourse(course.id));
  const courseProgress = progress[course?.id] || { completed: [], lastLesson: 0 };
  const [activeLesson, setActiveLesson] = useState(0);
  const [feedbackDraft, setFeedbackDraft] = useState('');
  const [feedbackThreads, setFeedbackThreads] = useState({});

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-stone-500">Curso no encontrado.</p>
      </div>
    );
  }

  const prog = getProgress(course.id, course.lessons.length);
  const currentLesson = course.lessons[activeLesson] || course.lessons[0];
  const completedCount = courseProgress.completed.length;

  const isCompleted = (lessonId) => courseProgress.completed.includes(lessonId);

  const isSequentialAllowed = (index) => {
    if (index === 0) return true;
    return courseProgress.completed.includes(course.lessons[index - 1].id);
  };

  const canCompleteCurrent = Boolean(currentLesson) && !isCompleted(currentLesson.id) && isSequentialAllowed(activeLesson);
  const canAdvanceNext = Boolean(currentLesson) && activeLesson < course.lessons.length - 1 && isCompleted(currentLesson.id);
  const currentThread = currentLesson ? (feedbackThreads[currentLesson.id] || buildInitialThread(course, currentLesson)) : [];

  const handleSubmitFeedback = (event) => {
    event.preventDefault();
    const message = feedbackDraft.trim();
    if (!message || !currentLesson) return;

    const lessonSnapshot = currentLesson;

    const studentMessage = {
      id: `student-${lessonSnapshot.id}-${Date.now()}`,
      role: 'student',
      author: user?.name || 'Alumno',
      text: message,
    };

    setFeedbackThreads(prev => ({
      ...prev,
      [lessonSnapshot.id]: [...(prev[lessonSnapshot.id] || buildInitialThread(course, lessonSnapshot)), studentMessage],
    }));
    setFeedbackDraft('');

    window.setTimeout(() => {
      setFeedbackThreads(prev => ({
        ...prev,
        [lessonSnapshot.id]: [
          ...(prev[lessonSnapshot.id] || buildInitialThread(course, lessonSnapshot)),
          {
            id: `teacher-${lessonSnapshot.id}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
            role: 'teacher',
            author: course.instructor,
            text: `Gracias por tu consulta sobre ${lessonSnapshot.title}. Mi recomendación es repasar el paso clave y volver a practicarlo antes de avanzar.`,
          },
        ],
      }));
    }, 700);
  };

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
                <span className="text-3xl font-bold text-stone-800">${course.priceARS.toLocaleString()}</span>
                <button
                  onClick={() => navigate(user ? `/checkout/${course.id}` : '/login')}
                  className="btn-theme px-8 py-3 rounded-xl font-semibold"
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

  return (
    <div className="min-h-screen bg-soft pb-12">
      <div className="max-w-7xl mx-auto px-4 py-8 lg:py-10 animate-fade-in">
        <div className="bg-white rounded-3xl border border-theme shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_0.8fr] gap-0">
            <div className="p-6 lg:p-8 border-b lg:border-b-0 lg:border-r border-theme">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                  <Link to="/mis-cursos" className="text-secondary text-sm hover:text-secondary-dark inline-flex items-center gap-1 mb-3">
                    ← Volver a mis cursos
                  </Link>
                  <h1 className="text-3xl md:text-4xl font-bold text-theme">{course.title}</h1>
                  <p className="text-theme mt-2 max-w-2xl">{course.longDescription}</p>
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
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <div className="bg-soft rounded-2xl p-4">
                  <p className="text-xs text-brown-accent uppercase tracking-wide">Nivel</p>
                  <p className="font-semibold text-theme mt-1">{course.level}</p>
                </div>
                <div className="bg-soft rounded-2xl p-4">
                  <p className="text-xs text-brown-accent uppercase tracking-wide">Duración</p>
                  <p className="font-semibold text-theme mt-1">{course.duration}</p>
                </div>
                <div className="bg-soft rounded-2xl p-4">
                  <p className="text-xs text-brown-accent uppercase tracking-wide">Lecciones</p>
                  <p className="font-semibold text-theme mt-1">{course.lessons.length}</p>
                </div>
                <div className="bg-soft rounded-2xl p-4">
                  <p className="text-xs text-brown-accent uppercase tracking-wide">Docente</p>
                  <p className="font-semibold text-theme mt-1">{course.instructor}</p>
                </div>
              </div>

              <div className="aspect-video rounded-3xl overflow-hidden bg-black shadow-md">
                <ReactPlayer
                  url={currentLesson?.videoUrl}
                  width="100%"
                  height="100%"
                  controls={true}
                  className="absolute top-0 left-0"
                  style={{ position: 'absolute', top: 0, left: 0 }}
                />
              </div>

              <div className="mt-6 bg-white border border-theme rounded-3xl p-5 lg:p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-brown-accent text-xs uppercase tracking-wide">Lección {activeLesson + 1} de {course.lessons.length}</p>
                    <h2 className="text-2xl font-bold text-theme mt-1">{currentLesson?.title}</h2>
                    <p className="text-theme text-sm mt-1">⏱ {currentLesson?.duration}</p>
                  </div>
                  <button
                    onClick={() => completeLesson(course.id, currentLesson.id)}
                    disabled={!canCompleteCurrent}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                      isCompleted(currentLesson.id)
                        ? 'bg-emerald-500 text-white'
                        : canCompleteCurrent
                        ? 'bg-secondary text-white hover:bg-secondary-dark'
                        : 'bg-stone-200 text-stone-500 cursor-not-allowed'
                    }`}
                  >
                    {isCompleted(currentLesson.id)
                      ? '✓ Completada'
                      : canCompleteCurrent
                      ? 'Marcar como completada'
                      : 'Completa la lección anterior primero'}
                  </button>
                </div>

                <div className="flex flex-wrap gap-3 mt-5">
                  <button
                    onClick={() => setActiveLesson(Math.max(0, activeLesson - 1))}
                    disabled={activeLesson === 0}
                    className="px-4 py-2 bg-soft text-theme rounded-xl text-sm hover:bg-[#efe7dd] disabled:opacity-40 transition-colors"
                  >
                    ← Anterior
                  </button>
                  <button
                    onClick={() => setActiveLesson(Math.min(course.lessons.length - 1, activeLesson + 1))}
                    disabled={!canAdvanceNext}
                    className="px-4 py-2 bg-secondary text-white rounded-xl text-sm hover:bg-secondary-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {activeLesson === course.lessons.length - 1 ? 'Última lección' : canAdvanceNext ? 'Siguiente →' : 'Finalizá la lección para avanzar'}
                  </button>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 xl:grid-cols-2 gap-6">
                <section className="bg-white border border-theme rounded-3xl p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-theme">Feedback de la lección</h3>
                      <p className="text-sm text-theme">La alumna pregunta y la profesora responde en el mismo hilo.</p>
                    </div>
                    <span className="text-xs font-semibold bg-soft text-secondary px-3 py-1 rounded-full">{currentLesson?.title}</span>
                  </div>

                  <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                    {currentThread.map(message => (
                      <div
                        key={message.id}
                        className={`rounded-2xl p-4 border ${message.role === 'teacher' ? 'bg-soft border-theme ml-0' : 'bg-white border-[#d8e1d8] ml-6 sm:ml-10'}`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="text-xs font-bold uppercase tracking-wide text-brown-accent">{message.role === 'teacher' ? 'Profesora' : 'Alumna'}</p>
                          <p className="text-[11px] text-brown-accent/70">{message.author}</p>
                        </div>
                        <p className="text-sm text-theme leading-relaxed">{message.text}</p>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleSubmitFeedback} className="mt-4 space-y-3">
                    <textarea
                      value={feedbackDraft}
                      onChange={(event) => setFeedbackDraft(event.target.value)}
                      rows={3}
                      placeholder="Escribí tu duda sobre esta lección..."
                      className="w-full rounded-2xl border border-theme bg-white px-4 py-3 text-sm text-theme focus:outline-none focus:ring-2 focus:ring-secondary/30"
                    />
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <p className="text-xs text-brown-accent">La respuesta de la profesora queda asociada a esta lección.</p>
                      <button type="submit" className="btn-theme px-5 py-2.5 rounded-xl text-sm font-semibold">
                        Enviar feedback
                      </button>
                    </div>
                  </form>
                </section>

                <section className="bg-white border border-theme rounded-3xl p-5 shadow-sm">
                  <h3 className="text-xl font-bold text-theme mb-4">Resumen de la lección</h3>
                  <div className="space-y-4 text-sm text-theme">
                    <div className="bg-soft rounded-2xl p-4">
                      <p className="text-xs uppercase tracking-wide text-brown-accent mb-1">Lo que trabajás ahora</p>
                      <p className="leading-relaxed">Repasá el contenido actual, completá la práctica y recién ahí desbloqueá la siguiente clase.</p>
                    </div>
                    <div className="bg-soft rounded-2xl p-4">
                      <p className="text-xs uppercase tracking-wide text-brown-accent mb-1">Regla de avance</p>
                      <p className="leading-relaxed">No podés pasar a la siguiente lección si la anterior no quedó marcada como terminada.</p>
                    </div>
                    <div className="bg-soft rounded-2xl p-4">
                      <p className="text-xs uppercase tracking-wide text-brown-accent mb-1">Progreso guardado</p>
                      <p className="leading-relaxed">Cada vez que finalizás una lección, la barra de progreso se actualiza y queda asociada a tu cuenta.</p>
                    </div>
                  </div>
                </section>
              </div>
            </div>

            <aside className="bg-white p-5 lg:p-6">
              <div className="bg-soft rounded-3xl p-5 mb-5 border border-theme">
                <p className="text-xs uppercase tracking-wide text-brown-accent">Acceso al curso</p>
                <h2 className="text-2xl font-bold text-theme mt-1">Abrí tu curso y seguí aprendiendo</h2>
                <p className="text-sm text-theme mt-2">Cada lección queda bloqueada hasta terminar la anterior, para que el recorrido sea lineal y el progreso sea coherente.</p>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-bold text-theme px-1">Contenido del curso</h3>
                {course.lessons.map((lesson, idx) => {
                  const blocked = !isSequentialAllowed(idx);
                  const completed = isCompleted(lesson.id);
                  const isActive = activeLesson === idx;

                  return (
                    <button
                      key={lesson.id}
                      onClick={() => !blocked && setActiveLesson(idx)}
                      disabled={blocked}
                      className={`w-full text-left rounded-2xl border p-4 transition-colors ${
                        isActive ? 'bg-secondary text-white border-secondary shadow-md' : 'bg-white border-theme hover:border-secondary/40'
                      } ${blocked ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${
                          completed ? 'bg-emerald-500 text-white' : isActive ? 'bg-white/20 text-white' : 'bg-soft text-theme'
                        }`}>
                          {completed ? '✓' : idx + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`font-semibold truncate ${isActive ? 'text-white' : 'text-theme'}`}>{lesson.title}</p>
                          <p className={`text-xs mt-1 ${isActive ? 'text-white/80' : 'text-brown-accent'}`}>{lesson.duration}</p>
                          {blocked && <span className="text-xs text-rose-400 mt-1 block">Completá la lección anterior para continuar</span>}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 bg-white border border-theme rounded-3xl p-5 shadow-sm">
                <div className="flex items-center gap-2 font-bold text-brown-accent mb-2 text-sm uppercase">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
                  </svg>
                  Importante
                </div>
                <p className="text-sm text-brown-muted leading-relaxed">
                  Este material es personal e intransferible. Si detectamos accesos simultáneos o compartidos, la cuenta puede ser dada de baja.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
