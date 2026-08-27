import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePurchases } from '../context/PurchaseContext';
import { useFavorites } from '../context/FavoritesContext';
import { useProgress } from '../context/ProgressContext';
import CourseCover from './CourseCover';
import { getLevelClass, getLevelLabel } from '../utils/levels';

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
    // Tarjeta con borde rosa suave y fondo blanco (identidad Grow). Sin hover:
    // la foto tiene su propio borde y separación, no se levanta ni hace zoom.
    <div className="card-glow-soft rounded-2xl p-3 flex flex-col justify-between h-full min-h-[400px]">
      <div>
        {/* Toda la card lleva a la vista previa del curso (sin permisos) */}
        <Link to={`/curso/${course.id}`} className="block">
          {/* Contenedor de la Imagen con borde propio, separado del borde de la card */}
          <div className="relative overflow-hidden aspect-video bg-gray-50 rounded-xl border border-border">
            <CourseCover
              course={course}
              className="w-full h-full object-cover"
            />
            
            {/* Badge de Nivel dinámico: claves normalizadas a minúsculas para el enum UPPERCASE del backend */}
            <span className={`absolute top-3 left-3 text-xs font-bold px-3 py-1 rounded-full shadow-sm tracking-wide ${getLevelClass(course.level)}`}>
              {getLevelLabel(course.level)}
            </span>
            
            {/* Corazón de Favoritos estilizado */}
            {user && (
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(course.id); }}
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
            <h3 className="font-body text-text-ink text-lg font-bold mb-1.5 leading-snug line-clamp-1">
              {course.title}
            </h3>
            <p className="text-text-muted text-xs mb-4 line-clamp-2 leading-relaxed min-h-[2.5rem]">
              {course.description}
            </p>

            {/* Vista previa del contenido del curso */}
            {course.lessons?.length > 0 && (
              <div className="mb-4">
                <p className="text-[11px] uppercase tracking-wide text-accent font-bold mb-1.5">Contenido del curso</p>
                <ul className="space-y-1">
                  {course.lessons.slice(0, 3).map(l => (
                    <li key={l.id} className="text-xs text-text-ink flex items-center gap-1.5 min-w-0">
                      <span className="w-1 h-1 rounded-full bg-primary flex-shrink-0" />
                      <span className="truncate">{l.title}</span>
                    </li>
                  ))}
                  {course.lessons.length > 3 && (
                    <li className="text-xs text-accent">+ {course.lessons.length - 3} lecciones más</li>
                  )}
                </ul>
              </div>
            )}

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
        </Link>
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