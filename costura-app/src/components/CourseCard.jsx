import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePurchases } from '../context/PurchaseContext';
import { useFavorites } from '../context/FavoritesContext';
import { useProgress } from '../context/ProgressContext';

// Colores suaves de fondo y texto legibles para las etiquetas de nivel
const levelClasses = {
  'Principiante': 'bg-primary-soft text-primary', // Verde pastel muy sutil
  'Intermedio': 'bg-bg-soft text-ochre',   // Naranja/Crema cálido
  'Avanzado': 'bg-accent-soft text-accent',     // Rosa/Fucsia pálido
};

export default function CourseCard({ course }) {
  const { user } = useAuth();
  const { hasCourse, isPending } = usePurchases();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { getProgress } = useProgress();

  const owned = user && hasCourse(course.id);
  const pending = user && isPending(course.id);
  const fav = user && isFavorite(course.id);
  const prog = owned ? getProgress(course.id, course.lessons.length) : 0;

  return (
    // Tarjeta con sombras profundas difuminadas en hover y bordes suaves sin líneas duras
    <div className="bg-bg-soft rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-border overflow-hidden hover:shadow-card hover:-translate-y-1.5 transition-all duration-300 group flex flex-col justify-between">
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
              className="btn btn-icon absolute top-3 right-3 backdrop-blur-md shadow-sm hover:scale-110 transition-all duration-200 bg-gray-100/70 text-gray-700"
              aria-label={fav ? 'Quitar de favoritos' : 'Agregar a favoritos'}
            >
              <svg 
                className={`w-4 h-4 transition-colors ${fav ? 'text-accent fill-accent' : 'text-gray-400 hover:text-accent'}`} 
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
          <h3 className=" text-text-ink text-2xl mb-1.5 leading-snug line-clamp-1">
            {course.title}
          </h3>
          <p className="text-text-muted text-xs mb-4 line-clamp-2 leading-relaxed">
            {course.description}
          </p>

          {/* LÓGICA DE PRECIO: Solo visible si el usuario está logueado */}
          {user && !owned && (
            <div className="mt-2">
              <p className="text-sm text-text-muted font-medium">Precio:</p>
              <p className="text-2xl font-bold text-text-ink">
                {/* Cambiamos la comparación a 'ARS' según los datos de tu consola */}
                {user.country === 'ARS' 
                  ? `$${course.priceARS.toLocaleString()} ARS` 
                  : `$${course.priceAUD.toLocaleString()} AUD`
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Pie de Tarjeta (Precios y Acciones) siempre alineado abajo */}
      <div className="px-5 pb-5 pt-1">
        {owned && (
          <div className="mb-4 bg-accent-soft/50 p-2.5 rounded-xl border border-primary/5">
            <div className="flex justify-between text-[11px] font-bold text-text-ink mb-1">
              <span>Tu progreso</span>
              <span>{prog}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div className="bg-primary h-1.5 rounded-full transition-all duration-500" style={{ width: `${prog}%` }} />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 pt-2">
          {owned ? (
            <Link
              to={`/curso/${course.id}`}
              className="btn btn-primary w-full hover:shadow-md tracking-wide text-l"
            >
              Abrir curso
            </Link>
          ) : pending ? (
            <button className="btn btn-primary w-full text-xs cursor-not-allowed" disabled>
              Solicitud en revisión
            </button>
          ) : (
            <Link
              to={user ? `/checkout/${course.id}` : '/login'}
              className="btn btn-primary w-full hover:shadow-md tracking-wide text-l"
            >
              Inscribirme
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}