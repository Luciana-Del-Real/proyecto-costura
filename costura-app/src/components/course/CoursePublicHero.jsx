import { Link } from 'react-router-dom';
import CourseCover from '../CourseCover';
import { getLevelLabel } from '../../utils/levels';
import { getCoursePrice } from '../../utils/currency';

// Hero público de un curso para visitantes/no compradores: portada, badge,
// título, metadatos, precio y CTA de compra. El CTA decide el destino en el
// padre (checkout si hay sesión, login si no).
export default function CoursePublicHero({ course, user, onBuy }) {
  return (
    <div className="min-h-screen bg-bg-surface">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <Link to="/cursos" className="text-accent text-sm hover:text-accent mb-6 inline-block">← Volver a cursos</Link>
        <div className="card rounded-2xl overflow-hidden">
          <CourseCover course={course} className="w-full h-64 object-cover" />
          <div className="p-8">
            <span className="text-xs font-semibold bg-bg-soft text-accent px-3 py-1 rounded-full">{getLevelLabel(course.level)}</span>
            <h1 className="font-display text-3xl font-bold text-text-ink mt-3 mb-2">{course.title}</h1>
            <p className="text-text-ink mb-4">{course.longDescription}</p>
            <div className="flex flex-wrap gap-4 text-sm text-text-ink mb-6">
              <span>👩‍🏫 {course.instructor}</span>
              <span>🕐 {course.duration}</span>
              <span>📚 {course.lessons.length} lecciones</span>
              <span>⭐ {course.rating} ({course.students.toLocaleString()} alumnas)</span>
            </div>
            <div className="border-t border-border pt-6 flex items-center justify-between gap-4 flex-wrap">
              <span className="text-3xl font-bold text-text-ink">${getCoursePrice(course, user).toLocaleString()}</span>
              <button
                onClick={onBuy}
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