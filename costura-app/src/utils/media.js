import { API_BASE_URL } from '../services/api';

// Regla única de origen: API_BASE_URL (VITE_API_URL) es la base de la API e
// incluye el prefijo /api por convención. Los archivos estáticos subidos por el
// admin (ej. "/uploads/courses/xxx.jpg") se sirven desde el MISMO origen pero
// SIN el prefijo /api (backend main.ts: useStaticAssets con prefix /uploads).
// Si el path ya es una URL completa (http...), se deja igual.
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

export function getImageUrl(path) {
  if (!path) return '/placeholder-portada.png';
  if (path.startsWith('http')) return path;
  return `${API_ORIGIN}${path}`;
}
