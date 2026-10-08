import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { useCourseCatalog } from '../context/CourseCatalogContext';
import { usePurchases } from '../context/PurchaseContext';
import { useProgress } from '../context/ProgressContext';
import { getImageUrl } from '../utils/media';
import PageHeader from '../components/PageHeader';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';

export default function MyCourses() {
  const { purchases } = usePurchases();
  const { getProgress } = useProgress();
  const { courses, loading } = useCourseCatalog();
  const [search, setSearch] = useState('');
  const myCourses = courses.filter(c => purchases.includes(c.id));
  const filtered = myCourses.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full px-4 py-1 animate-fade-in">
      <PageHeader
        title="Mis cursos"
        subtitle={`${myCourses.length} curso${myCourses.length !== 1 ? 's' : ''} adquirido${myCourses.length !== 1 ? 's' : ''}`}
      />

      <div className="w-full px-4 py-8">
        {loading ? (
          <LoadingState size="section" />
        ) : myCourses.length === 0 ? (
          <EmptyState
            variant="plain"
            icon={BookOpen}
            title="Todavía no tenés cursos"
            description="Explorá nuestro catálogo y empezá a aprender hoy."
            action={{ label: 'Ver cursos disponibles', to: '/cursos' }}
          />
        ) : (
          <>
            <div className="relative max-w-sm mb-6">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar mis cursos..."
                className="w-full pl-10 pr-4 py-2 text-sm border-2 border-gray-300 hover:border-gray-400 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white text-gray-700 placeholder-gray-400 shadow-sm transition-all duration-300"
              />
            </div>

            {filtered.length === 0 ? (
              <EmptyState
                variant="plain"
                icon={BookOpen}
                title="Sin resultados para tu búsqueda."
                action={{ label: 'Limpiar búsqueda', onClick: () => setSearch(''), variant: 'ghost' }}
              />
            ) : (
              <div className="space-y-4">
                {filtered.map(course => {
                  const prog = getProgress(course.id, course.lessons.length);
                  return (
                    <div key={course.id} className="stagger-item card-flat rounded-2xl p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center hover:-translate-y-0.5 transition-all duration-300">
                      <img src={getImageUrl(course.image)} alt={course.title} className="w-full sm:w-28 h-20 object-cover rounded-xl flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-text-ink text-xl sm:text-2xl leading-snug">{course.title}</h3>
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
          </>
        )}
      </div>
    </div>
  );
}
