import { Link } from 'react-router-dom';
import { useCourses } from '../context/CoursesContext';
import { getImageUrl } from '../utils/media';

export default function MyCourses() {
  const { purchases, getProgress, courses } = useCourses();
  const myCourses = courses.filter(c => purchases.includes(c.id));

  return (
    <div className="max-w-6xl mx-auto px-1 py-1 animate-fade-in">
      <div className="bg-[#F4F1ED] rounded-2xl shadow-sm border border-gray-100 px-4 py-10 animate-fade-up mt-5 mb-5">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-[#6B4C3B]">Mis cursos</h1>
          <p className="text-theme mt-1">{myCourses.length} curso{myCourses.length !== 1 ? 's' : ''} adquirido{myCourses.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {myCourses.length === 0 ? (
            <div className="text-center py-20">
            <span className="text-6xl">📚</span>
            <h2 className="text-xl font-bold text-theme mt-4 mb-2">Todavía no tenés cursos</h2>
            <p className="text-theme mb-6">Explorá nuestro catálogo y empezá a aprender hoy.</p>
            <Link to="/cursos" className="bg-secondary !text-white px-6 py-3 rounded-xl hover:bg-[#5E8262] transition-colors font-medium">
              Ver cursos disponibles
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {myCourses.map(course => {
              const prog = getProgress(course.id, course.lessons.length);
              return (
                <div key={course.id} className="stagger-item bg-white rounded-2xl shadow-sm border border-theme p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                  <img src={getImageUrl(course.image)} alt={course.title} className="w-full sm:w-28 h-20 object-cover rounded-xl flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-theme">{course.title}</h3>
                      <span className="text-sm font-bold text-secondary flex-shrink-0">{prog}%</span>
                    </div>
                    <p className="text-theme text-sm mt-0.5 mb-3">{course.instructor} · {course.lessons.length} lecciones</p>
                    <div className="w-full bg-soft rounded-full h-2 mb-3">
                      <div className="bg-secondary h-2 rounded-full transition-all" style={{ width: `${prog}%` }} />
                    </div>
                    <Link
                      to={`/curso/${course.id}`}
                      className="inline-block bg-accent text-white text-sm px-5 py-2 rounded-xl hover:bg-[#A85E42] transition-colors font-medium"
                    >
                      {prog === 0 ? 'Comenzar' : prog === 100 ? 'Repasar' : 'Continuar'} →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
