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
import SearchInput from '../components/SearchInput';

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
            <SearchInput
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar mis cursos..."
              className="max-w-sm mb-6"
            />

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
