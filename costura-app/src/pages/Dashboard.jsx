import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCourseCatalog } from '../context/CourseCatalogContext';
import { usePurchases } from '../context/PurchaseContext';
import CourseCard from '../components/CourseCard';
export default function Dashboard() {
  const { user } = useAuth();
  const { purchases } = usePurchases();
  const { courses } = useCourseCatalog();

  const myCourses = courses.filter(c => purchases.includes(c.id));
  const suggested = courses.filter(c => !purchases.includes(c.id)).slice(0, 3);

  return (
    <div className="max-w-6xl mx-auto px-1 py-1 animate-fade-in mt-5 mb-8">
      {/* Header */}
      <div className="bg-white rounded-2xl border-2 border-primary shadow-md px-4 py-10 animate-fade-up mt-1 mb-5">
        <div className="max-w-6xl mx-auto">
          <p className="text-text-ink text-sm mb-3">Bienvenida de vuelta 👋</p>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-text-ink mb-2">{user?.name}</h1>
        </div>
      </div>

      <div className="card-glow rounded-2xl max-w-6xl mx-auto px-4 py-4">
        {/* My courses */}
        {myCourses.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center justify-between mt-5 mb-5">
              <h2 className="font-display text-text-ink text-3xl">Mis cursos</h2>
              <Link to="/mis-cursos" className="text-text-ink text-sm hover:text-success">Ver todos →</Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {myCourses.slice(0, 3).map(course => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          </div>
        )}

        {/* Suggested */}
        {suggested.length > 0 && (
          <div>
            <h2 className="font-display font-bold text-text-ink text-xl">
              {myCourses.length === 0 ? 'Empezá con estos cursos' : 'Seguí aprendiendo'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
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
