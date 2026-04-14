import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function BackToHome() {
  const location = useLocation();
  const { user } = useAuth();
  
  // Rutas consideradas como "inicio" donde NO debe aparecer la flecha
  const hidePaths = ['/', '/dashboard', '/admin'];
  if (hidePaths.includes(location.pathname)) return null;

  // Si estamos en secciones de admin, volver al inicio de admin o al dashboard si es alumno
  let target = '/';
  if (location.pathname.startsWith('/admin')) {
    target = '/admin';
  } else if (user) {
    target = '/dashboard';
  }

  return (
    <Link to={target} style={{ zIndex: 9999 }} className="fixed top-4 left-4">
      <div className="w-9 h-9 bg-white/90 text-[#6B4C3B] rounded-full shadow-md flex items-center justify-center border border-[#EDE4D6] hover:bg-white transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </div>
    </Link>
  );
}
