import { Link } from 'react-router-dom';
import { useCourseCatalog } from '../context/CourseCatalogContext';
import { usePurchases } from '../context/PurchaseContext';
import CourseCard from '../components/CourseCard';
import WelcomeToast from '../components/WelcomeToast';
import LoadingState from '../components/LoadingState';
import PageHeader from '../components/PageHeader';
export default function Dashboard() {
  const { purchases } = usePurchases();
  const { courses, loading } = useCourseCatalog();

  const myCourses = courses.filter(c => purchases.includes(c.id));
  const suggested = courses.filter(c => !purchases.includes(c.id)).slice(0, 3);

  return (
    <div className="w-full px-4 py-1 animate-fade-in">
      <WelcomeToast message="¡Bienvenida de vuelta!" />

      {/* Con compras: SOLO mis cursos. Sin compras: cursos disponibles */}
      {loading ? (
        <LoadingState size="section" />
      ) : myCourses.length > 0 ? (
        <div className="mb-10">
          <PageHeader
            title="Mis cursos"
            subtitle={`${myCourses.length} curso${myCourses.length !== 1 ? 's' : ''} adquirido${myCourses.length !== 1 ? 's' : ''}`}
          />
          <div className="w-full px-4">
            <div className="flex justify-end mb-5">
              <Link to="/mis-cursos" className="text-text-ink text-sm hover:text-success">Ver todos →</Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {myCourses.map(course => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          </div>
        </div>
      ) : (
        suggested.length > 0 && (
          <div className="mb-10">
            <PageHeader title="Cursos disponibles" subtitle="Encontrá el curso perfecto para vos" />
            <div className="w-full px-4">
              <div className="flex justify-end mb-5">
                <Link to="/cursos" className="text-text-ink text-sm hover:text-success">Ver todos →</Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {suggested.map(course => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}
