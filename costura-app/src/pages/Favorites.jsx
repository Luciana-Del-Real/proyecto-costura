import { Link } from 'react-router-dom';
import { useCourses } from '../context/CoursesContext';
import CourseCard from '../components/CourseCard';

export default function Favorites() {
  const { favorites, courses } = useCourses();
  const favCourses = courses.filter(c => favorites.includes(c.id));

  return (
    <div className="min-h-screen bg-[#F9F5F0]">
      <div className="bg-[#F5EFE6] py-10 px-4 border-b border-[#EDE4D6]">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-[#3D2B1F]">Mis favoritos</h1>
          <p className="text-[#A08060] mt-1">{favCourses.length} curso{favCourses.length !== 1 ? 's' : ''} guardado{favCourses.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {favCourses.length === 0 ? (
          <div className="text-center py-20">
            <span className="text-6xl">❤️</span>
            <h2 className="text-xl font-bold text-[#3D2B1F] mt-4 mb-2">Todavía no tenés favoritos</h2>
            <p className="text-[#A08060] mb-6">Hacé clic en el corazón de cualquier curso para guardarlo acá.</p>
            <Link to="/cursos" className="bg-[#7A9E7E] text-white px-6 py-3 rounded-xl hover:bg-[#5E8262] transition-colors font-medium">
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
