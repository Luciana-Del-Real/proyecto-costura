import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCourses } from '../context/CoursesContext';
import CourseCard from '../components/CourseCard';
export default function Dashboard() {
  const { user } = useAuth();
  const { purchases, courses } = useCourses();

  const myCourses = courses.filter(c => purchases.includes(c.id));
  const suggested = courses.filter(c => !purchases.includes(c.id)).slice(0, 3);

  return (
    <div className="max-w-6xl mx-auto px-1 py-1 animate-fade-in mt-5 mb-8">
      {/* Header */}
      <div className="bg-[#F4F1ED] rounded-2xl shadow-sm border border-gray-100 px-4 py-10 animate-fade-up mt-5 mb-5">
        <div className="max-w-6xl mx-auto">
          <p className="text-black text-sm mb-3">Bienvenida de vuelta 👋</p>
          <h1 className="text-3xl md:text-4xl font-bold text-[#6B4C3B] mb-2">{user?.name}</h1>
          <p className="text-black mt- text-sm">{user?.email}</p>
        </div>
      </div>

      <div className="bg-[#F4F1ED] rounded-2xl shadow-sm border border-gray-100 max-w-6xl mx-auto px-4 py-4">
        {/* My courses */}
        {myCourses.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-[#6B4C3B] text-xl">Mis cursos</h2>
              <Link to="/mis-cursos" className="text-secondary text-sm hover:text-[#5E8262]">Ver todos →</Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {myCourses.slice(0, 3).map(course => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          </div>
        )}

        {/* Suggested */}
        {suggested.length > 0 && (
          <div>
            <h2 className="font-bold text-[#6B4C3B] text-xl">
              {myCourses.length === 0 ? 'Empezá con estos cursos' : 'Seguí aprendiendo'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {suggested.map(course => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
