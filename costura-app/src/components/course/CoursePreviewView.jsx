import { useState } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, BookOpen, Clock } from 'lucide-react';
import CourseCover from '../CourseCover';
import { getLevelLabel } from '../../utils/levels';
import { getCoursePrice } from '../../utils/currency';

// Vista previa pública de un curso (sin compra): portada, datos, CTA de
// inscripción y el listado de lecciones (solo título/duración/descripción).
// El contenido pago (video/pdf) jamás se muestra acá — el catálogo público
// no lo expone.
export default function CoursePreviewView({ course, user, onBuy }) {
  const [openLessonId, setOpenLessonId] = useState(course.lessons?.[0]?.id || null);
  const price = `$${getCoursePrice(course, user).toLocaleString()} ${user?.country === 'AUD' ? 'AUD' : 'ARS'}`;

  return (
    <div className="min-h-screen bg-bg-surface pb-12">
      <div className="max-w-4xl mx-auto px-4 py-8 lg:py-10 animate-fade-in">
        <Link to="/cursos" className="text-primary text-sm hover:text-primary-hover inline-flex items-center gap-1 mb-4">
          ← Volver a cursos
        </Link>

        {/* Encabezado del curso */}
        <div className="bg-white rounded-3xl border border-border shadow-sm overflow-hidden mb-6">
          <CourseCover course={course} className="w-full h-48 lg:h-64 object-cover" />
          <div className="p-6 lg:p-8">
            <span className="text-xs font-semibold bg-bg-soft text-accent px-3 py-1 rounded-full">{getLevelLabel(course.level)}</span>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-text-ink mt-3">{course.title}</h1>
            <p className="text-text-ink mt-2 max-w-2xl">{course.longDescription || course.description}</p>
            <div className="flex flex-wrap gap-4 text-sm text-text-ink mt-4">
              <span className="flex items-center gap-1.5"><GraduationCap className="w-4 h-4 text-accent" strokeWidth={1.5} /> {course.instructor}</span>
              <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-accent" strokeWidth={1.5} /> {course.lessons.length} lecciones</span>
            </div>
            <div className="border-t border-border pt-6 flex items-center justify-between gap-4 flex-wrap mt-6">
              <span className="text-3xl font-bold text-text-ink">{price}</span>
              <button onClick={onBuy} className="btn btn-primary font-semibold">
                Inscribirme
              </button>
            </div>
          </div>
        </div>

        {/* Vista previa de lecciones */}
        <h2 className="font-display font-bold text-text-ink text-2xl mb-4">Contenido del curso</h2>
        {!course.lessons || course.lessons.length === 0 ? (
          <p className="text-text-ink text-sm">El contenido todavía se está armando. ¡Volvé pronto!</p>
        ) : (
          <div className="space-y-3">
            {course.lessons.map((lesson, idx) => {
              const isOpen = openLessonId === lesson.id;
              return (
                <div key={lesson.id} className={`bg-white border rounded-2xl shadow-sm overflow-hidden transition-colors ${isOpen ? 'border-secondary' : 'border-border'}`}>
                  <button
                    onClick={() => setOpenLessonId(isOpen ? null : lesson.id)}
                    className="w-full flex items-center gap-3 p-4 lg:p-5 text-left hover:bg-bg-soft/60 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold bg-bg-soft text-text-ink">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-text-ink truncate">{lesson.title}</p>
                      <p className="text-xs text-accent mt-0.5 flex items-center gap-1"><Clock className="w-3.5 h-3.5" strokeWidth={1.5} /> {lesson.duration}</p>
                    </div>
                    <span className={`text-text-ink transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}>▾</span>
                  </button>
                  {isOpen && (
                    <div className="border-t border-border p-4 lg:p-6">
                      {lesson.description ? (
                        <p className="text-sm text-text-ink leading-relaxed">{lesson.description}</p>
                      ) : (
                        <p className="text-sm text-text-muted">Descripción disponible al inscribirte.</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* CTA final */}
        <div className="card-glow rounded-2xl p-6 mt-6 text-center">
          <p className="font-display font-bold text-text-ink text-2xl mb-1">¿Te gustó el curso?</p>
          <p className="text-text-ink text-sm mb-4">Inscribite y empezá a aprender hoy.</p>
          <button onClick={onBuy} className="btn btn-primary font-semibold">
            {price} · Inscribirme
          </button>
        </div>
      </div>
    </div>
  );
}