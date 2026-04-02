import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { courses } from '../data/courses';
import { useCourses } from '../context/CoursesContext';
import { useAuth } from '../context/AuthContext';

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasCourse, completeLesson, progress, getProgress } = useCourses();
  const course = courses.find(c => c.id === Number(id));

  const owned = user && hasCourse(course?.id);
  const courseProgress = progress[course?.id] || { completed: [], lastLesson: 0 };
  const [activeLesson, setActiveLesson] = useState(0);

  if (!course) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-stone-500">Curso no encontrado.</p>
    </div>
  );

  const prog = getProgress(course.id, course.lessons.length);
  const currentLesson = course.lessons[activeLesson];
  const isCompleted = (lessonId) => courseProgress.completed.includes(lessonId);

  const isSequentialAllowed = (index) => {
    if (index === 0) return true;
    return courseProgress.completed.includes(course.lessons[index - 1].id);
  };

  const canCompleteCurrent = () => {
    if (!currentLesson) return false;
    if (isCompleted(currentLesson.id)) return false;
    return isSequentialAllowed(activeLesson);
  };

  if (!owned) {
    return (
      <div className="min-h-screen bg-stone-50">
        <div className="max-w-4xl mx-auto px-4 py-10">
          <Link to="/cursos" className="text-rose-400 text-sm hover:text-rose-500 mb-6 inline-block">← Volver a cursos</Link>
          <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
            <img src={course.image} alt={course.title} className="w-full h-64 object-cover" />
            <div className="p-8">
              <span className="text-xs font-semibold bg-rose-100 text-rose-500 px-3 py-1 rounded-full">{course.level}</span>
              <h1 className="text-3xl font-bold text-stone-800 mt-3 mb-2">{course.title}</h1>
              <p className="text-stone-500 mb-4">{course.longDescription}</p>
              <div className="flex flex-wrap gap-4 text-sm text-stone-400 mb-6">
                <span>👩‍🏫 {course.instructor}</span>
                <span>🕐 {course.duration}</span>
                <span>📚 {course.lessons.length} lecciones</span>
                <span>⭐ {course.rating} ({course.students.toLocaleString()} alumnas)</span>
              </div>
              <div className="border-t border-stone-100 pt-6 flex items-center justify-between">
                <span className="text-3xl font-bold text-stone-800">${course.price.toLocaleString()}</span>
                <button
                  onClick={() => navigate(user ? `/checkout/${course.id}` : '/login')}
                  className="bg-rose-400 text-white px-8 py-3 rounded-xl font-semibold hover:bg-rose-500 transition-colors"
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
    <div className="min-h-screen bg-stone-900">
      {/* Top bar */}
      <div className="bg-stone-800 px-4 py-3 flex items-center justify-between">
        <Link to="/mis-cursos" className="text-stone-300 hover:text-white text-sm flex items-center gap-1">
          ← Mis cursos
        </Link>
        <h1 className="text-white font-semibold text-sm truncate max-w-xs">{course.title}</h1>
        <div className="flex items-center gap-2">
          <div className="w-24 bg-stone-600 rounded-full h-1.5">
            <div className="bg-rose-400 h-1.5 rounded-full" style={{ width: `${prog}%` }} />
          </div>
          <span className="text-stone-300 text-xs">{prog}%</span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row h-[calc(100vh-52px)]">
        {/* Video player */}
        <div className="flex-1 flex flex-col">
          <div className="bg-black aspect-video w-full">
            <iframe
              src={currentLesson.videoUrl}
              title={currentLesson.title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <div className="bg-stone-800 p-5 flex-1">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-stone-400 text-xs mb-1">Lección {activeLesson + 1} de {course.lessons.length}</p>
                <h2 className="text-white font-semibold text-lg">{currentLesson.title}</h2>
                <p className="text-stone-400 text-sm mt-1">⏱ {currentLesson.duration}</p>
              </div>
              <button
                onClick={() => completeLesson(course.id, currentLesson.id)}
                disabled={!canCompleteCurrent()}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  isCompleted(currentLesson.id)
                    ? 'bg-emerald-500 text-white'
                    : canCompleteCurrent()
                    ? 'bg-rose-400 text-white hover:bg-rose-500'
                    : 'bg-stone-600 text-stone-300 cursor-not-allowed'
                }`}
              >
                {isCompleted(currentLesson.id)
                  ? '✓ Completada'
                  : canCompleteCurrent()
                  ? 'Marcar como completada'
                  : 'Completa lección anterior primero'}
              </button>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setActiveLesson(Math.max(0, activeLesson - 1))}
                disabled={activeLesson === 0}
                className="px-4 py-2 bg-stone-700 text-stone-300 rounded-xl text-sm hover:bg-stone-600 disabled:opacity-40 transition-colors"
              >
                ← Anterior
              </button>
              <button
                onClick={() => setActiveLesson(Math.min(course.lessons.length - 1, activeLesson + 1))}
                disabled={activeLesson === course.lessons.length - 1}
                className="px-4 py-2 bg-stone-700 text-stone-300 rounded-xl text-sm hover:bg-stone-600 disabled:opacity-40 transition-colors"
              >
                Siguiente →
              </button>
            </div>
          </div>
        </div>

        {/* Lessons sidebar */}
        <div className="lg:w-80 bg-stone-800 border-l border-stone-700 overflow-y-auto">
          <div className="p-4 border-b border-stone-700">
            <h3 className="text-white font-semibold text-sm">Contenido del curso</h3>
            <p className="text-stone-400 text-xs mt-0.5">{courseProgress.completed.length}/{course.lessons.length} completadas</p>
          </div>
          <div className="divide-y divide-stone-700">
            {course.lessons.map((lesson, idx) => {
              const blocked = !isSequentialAllowed(idx);
              return (
                <button
                  key={lesson.id}
                  onClick={() => !blocked && setActiveLesson(idx)}
                  disabled={blocked}
                  className={`w-full text-left px-4 py-3.5 flex items-start gap-3 transition-colors ${
                    activeLesson === idx ? 'bg-stone-700' : ''
                  } ${blocked ? 'opacity-60 cursor-not-allowed' : 'hover:bg-stone-700'} `}
                >
                  <div className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 text-xs ${
                    isCompleted(lesson.id)
                      ? 'bg-emerald-500 text-white'
                      : activeLesson === idx
                      ? 'bg-rose-400 text-white'
                      : 'bg-stone-600 text-stone-400'
                  }`}>
                    {isCompleted(lesson.id) ? '✓' : idx + 1}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm font-medium truncate ${activeLesson === idx ? 'text-white' : 'text-stone-300'}`}>
                      {lesson.title}
                    </p>
                    <p className="text-stone-500 text-xs mt-0.5">{lesson.duration}</p>
                    {blocked && (
                      <span className="text-xs text-rose-300 mt-0.5 block">Completa la lección anterior para continuar</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
