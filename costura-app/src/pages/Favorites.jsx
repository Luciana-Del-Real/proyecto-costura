import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, AlertTriangle, Search } from 'lucide-react';
import { useCourseCatalog } from '../context/CourseCatalogContext';
import { useFavorites } from '../context/FavoritesContext';
import CourseCard from '../components/CourseCard';
import PageHeader from '../components/PageHeader';

export default function Favorites() {
  const { favorites, favoritesLoading, favoritesError } = useFavorites();
  const { courses } = useCourseCatalog();
  const [search, setSearch] = useState('');
  const favCourses = courses.filter(c => favorites.includes(c.id));
  const filtered = favCourses.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-1 py-1 animate-fade-in">
      <PageHeader
        title="Mis favoritos"
        subtitle={`${favCourses.length} curso${favCourses.length !== 1 ? 's' : ''} guardado${favCourses.length !== 1 ? 's' : ''}`}
      />

      <div className="max-w-6xl mx-auto px-1 py-8">
        {favoritesLoading ? (
          <div className="text-center py-20">
            <p className="text-text-ink">Cargando tus favoritos...</p>
          </div>
        ) : favoritesError ? (
          <div className="text-center py-20">
            <AlertTriangle className="w-12 h-12 text-primary mx-auto" strokeWidth={1.5} />
            <h2 className="font-display font-bold text-text-ink text-2xl mt-4 mb-2">No se pudieron cargar tus favoritos</h2>
            <p className="text-text-ink mb-6">Verificá tu conexión e intentá de nuevo más tarde.</p>
          </div>
        ) : favCourses.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="w-12 h-12 text-primary mx-auto" strokeWidth={1.5} />
            <h2 className="font-display font-bold text-text-ink text-2xl mt-4 mb-2">Todavía no tenés favoritos</h2>
            <p className="text-text-ink mb-6">Hacé clic en el corazón de cualquier curso para guardarlo acá.</p>
            <Link to="/cursos" className="btn btn-primary font-medium">
              Explorar cursos
            </Link>
          </div>
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
                className="w-full pl-10 pr-4 py-2 text-sm border-2 border-primary/40 hover:border-primary/70 rounded-full focus:outline-none focus:ring-2 focus:ring-primary bg-white text-gray-700 placeholder-gray-400 shadow-sm transition-all duration-300"
              />
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-16">
                <Search className="w-12 h-12 text-primary mx-auto" strokeWidth={1.5} />
                <h2 className="font-display font-bold text-text-ink text-2xl mt-4">Sin resultados para tu búsqueda.</h2>
                <button onClick={() => setSearch('')} className="btn btn-ghost mt-3 text-sm text-primary hover:text-primary-hover">
                  Limpiar búsqueda
                </button>
              </div>
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
