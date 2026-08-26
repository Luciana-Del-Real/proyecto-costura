import { Link } from 'react-router-dom';
import { useCourseCatalog } from '../context/CourseCatalogContext';
import { useFavorites } from '../context/FavoritesContext';
import CourseCard from '../components/CourseCard';

export default function Favorites() {
  const { favorites, favoritesLoading, favoritesError } = useFavorites();
  const { courses } = useCourseCatalog();
  const favCourses = courses.filter(c => favorites.includes(c.id));

  return (
    <div className="max-w-6xl mx-auto px-1 py-1 animate-fade-in">
      <div className="bg-white rounded-2xl border border-primary/30 shadow-sm px-4 py-10 animate-fade-up mt-5 mb-5">
        <div className="max-w-6xl mx-auto">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-text-ink mb-2">Mis favoritos</h1>
          <p className="text-text-muted">{favCourses.length} curso{favCourses.length !== 1 ? 's' : ''} guardado{favCourses.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-1 py-8">
        {favoritesLoading ? (
          <div className="text-center py-20">
            <p className="text-text-ink">Cargando tus favoritos...</p>
          </div>
        ) : favoritesError ? (
          <div className="text-center py-20">
            <span className="text-6xl">⚠️</span>
            <h2 className="text-xl font-bold text-text-ink mt-4 mb-2">No se pudieron cargar tus favoritos</h2>
            <p className="text-text-ink mb-6">Verificá tu conexión e intentá de nuevo más tarde.</p>
          </div>
        ) : favCourses.length === 0 ? (
          <div className="text-center py-20">
            <span className="text-6xl">❤️</span>
            <h2 className="text-xl font-bold text-text-ink mt-4 mb-2">Todavía no tenés favoritos</h2>
            <p className="text-text-ink mb-6">Hacé clic en el corazón de cualquier curso para guardarlo acá.</p>
            <Link to="/cursos" className="btn btn-primary font-medium">
              Explorar cursos
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {favCourses.map(course => (
              <div key={course.id} className="stagger-item">
                <CourseCard course={course} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
