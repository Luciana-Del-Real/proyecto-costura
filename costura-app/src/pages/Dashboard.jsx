import { Link } from 'react-router-dom';
import { useCourseCatalog } from '../context/CourseCatalogContext';
import { usePurchases } from '../context/PurchaseContext';
import CourseCard from '../components/CourseCard';
import WelcomeToast from '../components/WelcomeToast';
export default function Dashboard() {
  const { purchases } = usePurchases();
  const { courses } = useCourseCatalog();

  const myCourses = courses.filter(c => purchases.includes(c.id));
  const suggested = courses.filter(c => !purchases.includes(c.id)).slice(0, 3);

  return (
    <div className="max-w-6xl mx-auto px-1 py-1 animate-fade-in mt-5 mb-8">
      <WelcomeToast message="¡Bienvenida de vuelta!" />

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
          <div className="flex items-center justify-between mt-5 mb-5">
            <h2 className="font-display text-text-ink text-3xl">Cursos disponibles</h2>
            <Link to="/cursos" className="text-text-ink text-sm hover:text-success">Ver todos →</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {suggested.map(course => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
