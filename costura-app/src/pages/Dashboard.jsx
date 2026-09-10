import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCourseCatalog } from '../context/CourseCatalogContext';
import { usePurchases } from '../context/PurchaseContext';
import CourseCard from '../components/CourseCard';
import WelcomeToast from '../components/WelcomeToast';
export default function Dashboard() {
  const { t } = useTranslation();
  const { purchases } = usePurchases();
  const { courses } = useCourseCatalog();

  const myCourses = courses.filter(c => purchases.includes(c.id));
  const suggested = courses.filter(c => !purchases.includes(c.id)).slice(0, 3);

  return (
    <div className="max-w-6xl mx-auto px-1 py-1 animate-fade-in mt-5 mb-8">
      <WelcomeToast message={t('dashboard.welcome')} />

      {/* Con compras: SOLO mis cursos. Sin compras: cursos disponibles */}
      {myCourses.length > 0 ? (
        <div className="mb-10">
          <div className="flex items-center justify-between mt-5 mb-5">
            <h2 className="font-display text-text-ink text-3xl">{t('dashboard.myCourses')}</h2>
            <Link to="/mis-cursos" className="text-text-ink text-sm hover:text-success">{t('dashboard.viewAll')}</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {myCourses.map(course => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </div>
      ) : (
        suggested.length > 0 && (
          <div>
            <div className="flex items-center justify-between mt-5 mb-5">
              <h2 className="font-display text-text-ink text-3xl">{t('dashboard.availableCourses')}</h2>
              <Link to="/cursos" className="text-text-ink text-sm hover:text-success">{t('dashboard.viewAll')}</Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {suggested.map(course => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          </div>
        )
      )}
    </div>
  );
}
