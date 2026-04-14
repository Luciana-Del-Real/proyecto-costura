import { Link } from 'react-router-dom';
import { useCourses } from '../context/CoursesContext';

export default function MyCourses() {
  const { purchases, getProgress, courses } = useCourses();
  const myCourses = courses.filter(c => purchases.includes(c.id));

  return (
    <div className="min-h-screen bg-[#F9F5F0]">
      <div className="bg-[#F5EFE6] py-10 px-4 border-b border-[#EDE4D6]">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-[#3D2B1F]">Mis cursos</h1>
          <p className="text-[#A08060] mt-1">{myCourses.length} curso{myCourses.length !== 1 ? 's' : ''} adquirido{myCourses.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {myCourses.length === 0 ? (
          <div className="text-center py-20">
            <span className="text-6xl">📚</span>
            <h2 className="text-xl font-bold text-[#3D2B1F] mt-4 mb-2">Todavía no tenés cursos</h2>
            <p className="text-[#A08060] mb-6">Explorá nuestro catálogo y empezá a aprender hoy.</p>
            <Link to="/cursos" className="bg-[#7A9E7E] text-white px-6 py-3 rounded-xl hover:bg-[#5E8262] transition-colors font-medium">
              Ver cursos disponibles
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {myCourses.map(course => {
              const prog = getProgress(course.id, course.lessons.length);
              return (
                <div key={course.id} className="stagger-item bg-white rounded-2xl shadow-sm border border-[#EDE4D6] p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                  <img src={course.image} alt={course.title} className="w-full sm:w-28 h-20 object-cover rounded-xl flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-[#3D2B1F]">{course.title}</h3>
                      <span className="text-sm font-bold text-[#7A9E7E] flex-shrink-0">{prog}%</span>
                    </div>
                    <p className="text-[#A08060] text-sm mt-0.5 mb-3">{course.instructor} · {course.lessons.length} lecciones</p>
                    <div className="w-full bg-[#EDE4D6] rounded-full h-2 mb-3">
                      <div className="bg-[#7A9E7E] h-2 rounded-full transition-all" style={{ width: `${prog}%` }} />
                    </div>
                    <Link
                      to={`/curso/${course.id}`}
                      className="inline-block bg-[#C4785A] text-white text-sm px-5 py-2 rounded-xl hover:bg-[#A85E42] transition-colors font-medium"
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
