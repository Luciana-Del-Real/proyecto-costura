import { Link } from 'react-router-dom';
import { useCourses } from '../context/CoursesContext';
import CourseCard from '../components/CourseCard';

export default function Favorites() {
  const { favorites, courses } = useCourses();
  const favCourses = courses.filter(c => favorites.includes(c.id));

  return (
    <div className="max-w-6xl mx-auto px-1 py-1 animate-fade-in">
      <div className="bg-[#F4F1ED] rounded-2xl shadow-sm border border-gray-100 px-4 py-10 animate-fade-up mt-5 mb-5">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-[#6B4C3B]">Mis favoritos</h1>
          <p className="text-[#6B4C3B] mt-1">{favCourses.length} curso{favCourses.length !== 1 ? 's' : ''} guardado{favCourses.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {favCourses.length === 0 ? (
          <div className="text-center py-20">
            <span className="text-6xl">❤️</span>
            <h2 className="text-xl font-bold text-theme mt-4 mb-2">Todavía no tenés favoritos</h2>
            <p className="text-theme mb-6">Hacé clic en el corazón de cualquier curso para guardarlo acá.</p>
            <Link to="/cursos" className="bg-secondary !text-white px-6 py-3 rounded-xl hover:bg-[#5E8262] transition-colors font-medium">
              Explorar cursos
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
