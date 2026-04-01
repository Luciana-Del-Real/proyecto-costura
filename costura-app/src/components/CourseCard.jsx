import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCourses } from '../context/CoursesContext';

const levelColors = {
  'Principiante': 'bg-[#EAF0EA] text-[#5E8262]',
  'Intermedio': 'bg-[#F5E8E2] text-[#A85E42]',
  'Avanzado': 'bg-[#EDE4D6] text-[#6B4C3B]',
};

export default function CourseCard({ course }) {
  const { user } = useAuth();
  const { hasCourse, isFavorite, toggleFavorite, getProgress } = useCourses();
  const owned = user && hasCourse(course.id);
  const fav = user && isFavorite(course.id);
  const prog = owned ? getProgress(course.id, course.lessons.length) : 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#EDE4D6] overflow-hidden hover:shadow-md hover:-translate-y-1 transition-all duration-300 group">
      <div className="relative overflow-hidden">
        <img
          src={course.image}
          alt={course.title}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <span className={`absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full ${levelColors[course.level]}`}>
          {course.level}
        </span>
        {user && (
          <button
            onClick={() => toggleFavorite(course.id)}
            className="absolute top-3 right-3 bg-white/80 backdrop-blur-sm rounded-full p-1.5 hover:bg-white transition-colors"
            aria-label={fav ? 'Quitar de favoritos' : 'Agregar a favoritos'}
          >
            <svg className={`w-4 h-4 ${fav ? 'text-[#C4785A] fill-[#C4785A]' : 'text-[#A08060]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-[#3D2B1F] mb-1 leading-tight">{course.title}</h3>
        <p className="text-[#6B4C3B] text-sm mb-3 line-clamp-2 opacity-70">{course.description}</p>

        <div className="flex items-center gap-3 text-xs text-[#A08060] mb-3">
          <span>⭐ {course.rating}</span>
          <span>👩‍🎓 {course.students.toLocaleString()}</span>
          <span>🕐 {course.duration}</span>
        </div>

        {owned && (
          <div className="mb-3">
            <div className="flex justify-between text-xs text-[#A08060] mb-1">
              <span>Progreso</span>
              <span>{prog}%</span>
            </div>
            <div className="w-full bg-[#EDE4D6] rounded-full h-1.5">
              <div className="bg-[#7A9E7E] h-1.5 rounded-full transition-all" style={{ width: `${prog}%` }} />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          {!owned && (
            <span className="font-bold text-[#3D2B1F] text-lg">
              ${course.price.toLocaleString()}
            </span>
          )}
          {owned ? (
            <Link
              to={`/curso/${course.id}`}
              className="w-full text-center bg-[#7A9E7E] text-white text-sm py-2 rounded-xl hover:bg-[#5E8262] transition-colors font-medium"
            >
              Continuar →
            </Link>
          ) : (
            <Link
              to={user ? `/checkout/${course.id}` : '/login'}
              className="bg-[#C4785A] text-white text-sm px-4 py-2 rounded-xl hover:bg-[#A85E42] transition-colors font-medium"
            >
              Comprar
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
