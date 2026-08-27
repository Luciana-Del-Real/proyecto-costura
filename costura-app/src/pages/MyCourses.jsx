import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { useCourseCatalog } from '../context/CourseCatalogContext';
import { usePurchases } from '../context/PurchaseContext';
import { useProgress } from '../context/ProgressContext';
import { getImageUrl } from '../utils/media';
import NotificationsInbox from '../components/NotificationsInbox';
import PageHeader from '../components/PageHeader';

export default function MyCourses() {
  const { purchases } = usePurchases();
  const { getProgress } = useProgress();
  const { courses } = useCourseCatalog();
  const myCourses = courses.filter(c => purchases.includes(c.id));

  return (
    <div className="max-w-6xl mx-auto px-1 py-1 animate-fade-in">
      <PageHeader
        title="Mis cursos"
        subtitle={`${myCourses.length} curso${myCourses.length !== 1 ? 's' : ''} adquirido${myCourses.length !== 1 ? 's' : ''}`}
      />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {myCourses.length === 0 ? (
            <div className="text-center py-20">
            <BookOpen className="w-12 h-12 text-primary mx-auto" strokeWidth={1.5} />
            <h2 className="font-display font-bold text-text-ink text-2xl mt-4 mb-2">Todavía no tenés cursos</h2>
            <p className="text-text-ink mb-6">Explorá nuestro catálogo y empezá a aprender hoy.</p>
            <Link to="/cursos" className="btn btn-primary font-medium">
              Ver cursos disponibles
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {myCourses.map(course => {
              const prog = getProgress(course.id, course.lessons.length);
              return (
                <div key={course.id} className="stagger-item card-glow rounded-2xl p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center hover:-translate-y-0.5 transition-all duration-300">
                  <img src={getImageUrl(course.image)} alt={course.title} className="w-full sm:w-28 h-20 object-cover rounded-xl flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-text-ink">{course.title}</h3>
                      <span className="text-sm font-bold text-primary flex-shrink-0">{prog}%</span>
                    </div>
                    <p className="text-text-ink text-sm mt-0.5 mb-3">{course.instructor} · {course.lessons.length} lecciones</p>
                    <div className="w-full bg-bg-soft rounded-full h-2 mb-3">
                      <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${prog}%` }} />
                    </div>
                    <Link
                      to={`/curso/${course.id}`}
                      className="btn btn-accent text-sm font-medium"
                    >
                      Abrir curso →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Notificaciones: panel extraído en NotificationsInbox */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <NotificationsInbox />
      </div>
    </div>
  );
}
