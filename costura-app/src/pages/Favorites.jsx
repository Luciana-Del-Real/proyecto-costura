import { useState } from 'react';
import { Heart, AlertTriangle, Search } from 'lucide-react';
import { useCourseCatalog } from '../context/CourseCatalogContext';
import { useFavorites } from '../context/FavoritesContext';
import CourseCard from '../components/CourseCard';
import PageHeader from '../components/PageHeader';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';

export default function Favorites() {
  const { favorites, favoritesLoading, favoritesError } = useFavorites();
  const { courses, loading: coursesLoading } = useCourseCatalog();
  const [search, setSearch] = useState('');
  const favCourses = courses.filter(c => favorites.includes(c.id));
  const filtered = favCourses.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full px-4 py-1 animate-fade-in">
      <PageHeader
        title="Mis favoritos"
        subtitle={`${favCourses.length} curso${favCourses.length !== 1 ? 's' : ''} guardado${favCourses.length !== 1 ? 's' : ''}`}
      />

      <div className="w-full px-4 py-8">
        {favoritesLoading || coursesLoading ? (
          <LoadingState size="section" />
        ) : favoritesError ? (
          <ErrorState
            icon={AlertTriangle}
            title="No se pudieron cargar tus favoritos"
            description="Verificá tu conexión e intentá de nuevo más tarde."
          />
        ) : favCourses.length === 0 ? (
          <EmptyState
            variant="plain"
            icon={Heart}
            title="Todavía no tenés favoritos"
            description="Hacé clic en el corazón de cualquier curso para guardarlo acá."
            action={{ label: 'Explorar cursos', to: '/cursos' }}
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
                placeholder="Buscar favoritos..."
                className="w-full pl-10 pr-4 py-2 text-sm border-2 border-gray-300 hover:border-gray-400 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white text-gray-700 placeholder-gray-400 shadow-sm transition-all duration-300"
              />
            </div>

            {filtered.length === 0 ? (
              <EmptyState
                variant="plain"
                icon={Search}
                title="Sin resultados para tu búsqueda."
                action={{ label: 'Limpiar búsqueda', onClick: () => setSearch(''), variant: 'ghost' }}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {filtered.map(course => (
                  <div key={course.id} className="stagger-item">
                    <CourseCard course={course} />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
