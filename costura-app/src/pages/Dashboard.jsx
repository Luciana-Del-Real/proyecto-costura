import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCourses } from '../context/CoursesContext';
import { courses } from '../data/courses';
import CourseCard from '../components/CourseCard';

export default function Dashboard() {
  const { user } = useAuth();
  const { purchases } = useCourses();

  const myCourses = courses.filter(c => purchases.includes(c.id));
  const suggested = courses.filter(c => !purchases.includes(c.id)).slice(0, 3);

  return (
    <div className="min-h-screen bg-[#F9F5F0]">
      {/* Header */}
      <div className="bg-[#7A9E7E] text-white px-4 py-10 animate-fade-up">
        <div className="max-w-6xl mx-auto">
          <p className="text-[#D4E8D4] text-sm mb-1">Bienvenida de vuelta 👋</p>
          <h1 className="text-3xl font-bold">{user?.name}</h1>
          <p className="text-[#D4E8D4] mt-1 text-sm">{user?.email}</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Quick actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Mis Cursos', icon: '📚', to: '/mis-cursos', count: purchases.length },
            { label: 'Explorar', icon: '🔍', to: '/cursos' },
            { label: 'Perfil', icon: '👤', to: '/perfil' },
            { label: 'Favoritos', icon: '❤️', to: '/favoritos' },
          ].map((item, i) => (
            <Link key={i} to={item.to} className="stagger-item bg-white rounded-2xl p-4 text-center shadow-sm border border-[#EDE4D6] hover:border-[#7A9E7E] hover:-translate-y-1 hover:shadow-md transition-all duration-300">
              <div className="text-3xl mb-2">{item.icon}</div>
              <p className="text-sm font-medium text-[#3D2B1F]">{item.label}</p>
              {item.count !== undefined && (
                <p className="text-xs text-[#A08060] mt-0.5">{item.count} cursos</p>
              )}
            </Link>
          ))}
        </div>

        {/* My courses */}
        {myCourses.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-[#3D2B1F]">Mis cursos</h2>
              <Link to="/mis-cursos" className="text-[#7A9E7E] text-sm hover:text-[#5E8262]">Ver todos →</Link>
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
            <h2 className="text-xl font-bold text-[#3D2B1F] mb-5">
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
