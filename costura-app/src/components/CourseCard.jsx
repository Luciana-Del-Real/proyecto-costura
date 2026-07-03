import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCourses } from '../context/CoursesContext';

// Colores suaves de fondo y texto legibles para las etiquetas de nivel
const levelClasses = {
  'Principiante': 'bg-[#EAF2ED] text-[#4E6D5B]', // Verde pastel muy sutil
  'Intermedio': 'bg-[#FDF3E7] text-[#C47D2B]',   // Naranja/Crema cálido
  'Avanzado': 'bg-[#F9EBF0] text-[#B84A62]',     // Rosa/Fucsia pálido
};

export default function CourseCard({ course }) {
  const { user } = useAuth();
  const { hasCourse, isPending, isFavorite, toggleFavorite, getProgress } = useCourses();
  
  const owned = user && hasCourse(course.id);
  const pending = user && isPending(course.id);
  const fav = user && isFavorite(course.id);
  const prog = owned ? getProgress(course.id, course.lessons.length) : 0;

  return (
    // Tarjeta con sombras profundas difuminadas en hover y bordes suaves sin líneas duras
    <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 overflow-hidden hover:shadow-[0_12px_30px_rgba(78,109,91,0.08)] hover:-translate-y-1.5 transition-all duration-300 group flex flex-col justify-between">
      <div>
        {/* Contenedor de la Imagen con efecto Zoom */}
        <div className="relative overflow-hidden aspect-video bg-gray-50">
          <img
            src={course.image?.startsWith('/uploads') ? `http://localhost:3000${course.image}` : course.image}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          
          {/* Badge de Nivel dinámico */}
          <span className={`absolute top-3 left-3 text-xs font-bold px-3 py-1 rounded-full shadow-sm tracking-wide ${levelClasses[course.level] || 'bg-gray-100 text-gray-700'}`}>
            {course.level}
          </span>
          
          {/* Corazón de Favoritos estilizado */}
          {user && (
            <button
              onClick={() => toggleFavorite(course.id)}
              className="absolute top-3 right-3 bg-white/90 backdrop-blur-md rounded-full p-2 shadow-sm hover:bg-white hover:scale-110 transition-all duration-200"
              aria-label={fav ? 'Quitar de favoritos' : 'Agregar a favoritos'}
            >
              <svg 
                className={`w-4 h-4 transition-colors ${fav ? 'text-[#B84A62] fill-[#B84A62]' : 'text-gray-400 hover:text-[#B84A62]'}`} 
                fill={fav ? 'currentColor' : 'none'} 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
          )}
        </div>

        {/* Información de la Tarjeta */}
        <div className="p-5">
          <h3 className="font-bold text-gray-800 text-base mb-1.5 leading-snug group-hover:text-[#4E6D5B] transition-colors line-clamp-1">
            {course.title}
          </h3>
          <p className="text-gray-500 text-xs mb-4 line-clamp-2 leading-relaxed">
            {course.description}
          </p>

          {/* Estadísticas / Badges inferiores */}
          <div className="flex items-center gap-4 text-[11px] font-semibold text-gray-400 mb-2 border-t border-gray-50 pt-3">
            <span className="flex items-center gap-1 text-amber-500">⭐ <span className="text-gray-600">{course.rating}</span></span>
            <span className="flex items-center gap-1">👩‍🎓 <span className="text-gray-600">{course.students.toLocaleString()}</span></span>
            <span className="flex items-center gap-1">🕐 <span className="text-gray-600">{course.duration}</span></span>
          </div>
        </div>
      </div>

      {/* Pie de Tarjeta (Precios y Acciones) siempre alineado abajo */}
      <div className="px-5 pb-5 pt-1">
        {owned && (
          <div className="mb-4 bg-[#FDF8FA] p-2.5 rounded-xl border border-[#4E6D5B]/5">
            <div className="flex justify-between text-[11px] font-bold text-[#4E6D5B] mb-1">
              <span>Tu progreso</span>
              <span>{prog}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div className="bg-[#4E6D5B] h-1.5 rounded-full transition-all duration-500" style={{ width: `${prog}%` }} />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 pt-2">
          {!owned && (
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 leading-none">Inversión</span>
              <span className="font-extrabold text-gray-800 text-xl tracking-tight mt-0.5">
                ${course.priceARS.toLocaleString()}
              </span>
            </div>
          )}
          
          {owned ? (
            <Link
              to={`/curso/${course.id}`}
              className="w-full text-center bg-[#4E6D5B] text-white text-xs py-2.5 rounded-xl hover:bg-[#3d5648] transition-all shadow-sm font-bold tracking-wide"
            >
              Continuar curso →
            </Link>
          ) : pending ? (
            <button className="w-full text-center bg-gray-100 text-gray-400 text-xs py-2.5 rounded-xl cursor-not-allowed font-medium" disabled>
              Solicitud en revisión
            </button>
          ) : (
            <Link
              to={user ? `/checkout/${course.id}` : '/login'}
              className="bg-[#4E6D5B] !text-white text-xs px-5 py-2.5 rounded-xl hover:bg-[#3d5648] hover:shadow-md transition-all font-bold tracking-wide ml-auto"
            >
              Inscribirme
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}