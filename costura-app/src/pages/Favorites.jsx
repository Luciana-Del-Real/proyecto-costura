import { Link } from 'react-router-dom';
import { Heart, AlertTriangle } from 'lucide-react';
import { useCourseCatalog } from '../context/CourseCatalogContext';
import { useFavorites } from '../context/FavoritesContext';
import CourseCard from '../components/CourseCard';
import PageHeader from '../components/PageHeader';

export default function Favorites() {
  const { favorites, favoritesLoading, favoritesError } = useFavorites();
  const { courses } = useCourseCatalog();
  const favCourses = courses.filter(c => favorites.includes(c.id));

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
