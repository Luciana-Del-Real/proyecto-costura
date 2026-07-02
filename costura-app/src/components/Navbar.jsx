import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BackToHome from './BackToHome';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location?.pathname || '';
  const simplifiedRoutes = ['/login', '/registro', '/cursos', '/forgot-password', '/reset-password'];
  const isCourseDetail = pathname.startsWith('/curso/');
  const isSimplified = simplifiedRoutes.includes(pathname) || isCourseDetail;
  const isHome = pathname === '/';
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
    setProfileOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <>
      <BackToHome />
      <nav className={`${isHome ? 'absolute inset-x-0 top-0 z-50 nav-on-hero' : 'sticky top-0 z-50 bg-white border-b border-gray-100'}`}>
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to={user ? (isAdmin ? "/admin" : "/dashboard") : "/"} className="flex items-center gap-3">
          <div className="w-12 h-12 flex items-center justify-center overflow-hidden">
            <img src="/Images/logo-nuevo-grow.png" alt="Grow" className="max-w-full max-h-full object-contain" />
          </div>
          <div className="hidden sm:block">
            <span className="font-bold text-[#6B4C3B] text-xl tracking-tight logo-text">
              Creative Education Studio
            </span>
          </div>
        </Link>

        {/* Desktop */}
        {(!isSimplified || user) && (
        <div className="hidden md:flex items-center gap-6">
          {user ? (
            <>
              <Link to="/dashboard" className="text-theme hover:text-secondary transition-colors text-sm font-medium">Inicio</Link>
              <Link to="/cursos" className="text-theme hover:text-secondary transition-colors text-sm font-medium">Cursos disponibles</Link>
              <Link to="/favoritos" className="text-theme hover:text-secondary transition-colors text-sm font-medium">Favoritos</Link>

              {/* Profile dropdown */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 text-[#6B4C3B] hover:text-[#7A9E7E] transition-colors text-sm font-medium"
                >
                  <div className="w-7 h-7 bg-secondary rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  Perfil
                  <svg className={`w-3.5 h-3.5 transition-transform ${profileOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-theme rounded-2xl shadow-lg border border-theme py-1 overflow-hidden animate-slide-down">
                    <div className="px-4 py-3 border-b border-theme">
                      <p className="text-xs font-semibold text-theme truncate">{user.name}</p>
                      <p className="text-xs text-brown-accent truncate">{user.email}</p>
                    </div>
                    <Link to="/perfil" onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-theme hover:bg-soft transition-colors">
                      👤 Mi perfil
                    </Link>
                    <Link to="/mis-cursos" onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-theme hover:bg-soft transition-colors">
                      📚 Mis cursos
                    </Link>
                    <div className="border-t border-[#F5EFE6] mt-1">
                      <button onClick={handleLogout}
                        className="w-full text-left flex items-center gap-2 px-4 py-2.5 text-sm text-brown-accent hover:bg-soft transition-colors">
                        🚪 Cerrar sesión
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {!isSimplified && (
                <>
                  <Link to="/cursos" className="text-theme hover:text-secondary transition-colors text-sm font-medium">Cursos</Link>
                  <Link to="/login" className="text-sm text-theme hover:text-secondary transition-colors font-medium">Iniciar sesión</Link>
                  <Link to="/registro" className="text-sm bg-secondary text-white px-4 py-1.5 rounded-full hover:bg-secondary-dark transition-colors btn">
                    Registrarse
                  </Link>
                </>
              )}
            </>
          )}
        </div>
        )}

        {/* Mobile toggle */}
        <button className="md:hidden text-theme" onClick={() => setMenuOpen(!menuOpen)}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className={`md:hidden px-4 py-3 flex flex-col gap-3 ${!isHome ? 'bg-theme border-t border-theme' : ''}`}>
          {user ? (
            <>
              <div className="flex items-center gap-2 pb-2 border-b border-theme">
                <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center text-white text-sm font-bold">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs font-semibold text-theme">{user.name}</p>
                  <p className="text-xs text-brown-accent">{user.email}</p>
                </div>
              </div>
              <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="text-theme text-sm font-medium">Inicio</Link>
              <Link to="/cursos" onClick={() => setMenuOpen(false)} className="text-theme text-sm font-medium">Cursos disponibles</Link>
              <Link to="/favoritos" onClick={() => setMenuOpen(false)} className="text-theme text-sm font-medium">Favoritos</Link>
              <Link to="/perfil" onClick={() => setMenuOpen(false)} className="text-theme text-sm font-medium">Perfil</Link>
              <Link to="/mis-cursos" onClick={() => setMenuOpen(false)} className="text-theme text-sm font-medium">Mis cursos</Link>
              <button onClick={handleLogout} className="text-left text-brown-accent text-sm font-medium">Cerrar sesión</button>
            </>
          ) : (
            !isSimplified && (
              <>
                <Link to="/cursos" onClick={() => setMenuOpen(false)} className="text-theme text-sm font-medium">Cursos</Link>
                <Link to="/login" onClick={() => setMenuOpen(false)} className="text-theme text-sm font-medium">Iniciar sesión</Link>
                <Link to="/registro" onClick={() => setMenuOpen(false)} className="text-sm bg-secondary text-white px-4 py-1.5 rounded-full hover:bg-secondary-dark transition-colors btn">Registrarse</Link>
              </>
            )
          )}
        </div>
      )}
      </nav>
    </>
  );
}
