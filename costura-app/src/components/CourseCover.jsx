import { getImageUrl } from '../utils/media';

// Portada de curso: la imagen real se resuelve con getImageUrl (regla única de
// origen de API). Si el curso no tiene portada, se muestra un placeholder con
// el nombre del curso — nunca un ícono de imagen rota.
export default function CourseCover({ course, className = '' }) {
  if (!course?.image) {
    return (
      <div className={`${className} flex items-center justify-center bg-bg-soft p-3`}>
        <span className="text-center text-xs font-semibold text-text-muted leading-snug line-clamp-3">
          {course?.title}
        </span>
      </div>
    );
  }

  return (
    <img
      src={getImageUrl(course.image)}
      alt={course.title}
      className={className}
      onError={(e) => { e.target.src = '/placeholder-portada.png'; }}
    />
  );
}