// Las imágenes subidas por el admin se guardan en el backend (ej. "/uploads/courses/xxx.jpg")
// y el frontend corre en otro puerto (Vite), así que hay que anteponerle el
// origen del backend para que carguen. Si ya es una URL completa (http...),
// se deja igual.
const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/api\/?$/, '');

export function getImageUrl(path) {
  if (!path) return '/placeholder-portada.png';
  if (path.startsWith('http')) return path;
  return `${API_ORIGIN}${path}`;
}
