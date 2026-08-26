import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationsContext';
import BackToHome from './BackToHome';
import NotificationBell from './NotificationBell';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { unreadCount } = useNotifications();
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

  // Close dropdowns when clicking outside
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
        <nav className={`${isHome ? 'absolute inset-x-0 top-0 z-50 nav-on-hero' : 'sticky top-0 z-50 bg-white border-b border-border shadow-sm'}`}>
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to={user ? (isAdmin ? "/admin" : "/dashboard") : "/"} className="flex items-center gap-3">
            <img src="/Images/Logo%20sin%20Slogan.png" alt="Grow" className="w-9 h-9 object-contain" />
            <div className="flex flex-col">
              <span className="text-sm uppercase tracking-widest text-text-ink">Creative Education Studio</span>
            </div>
          </Link>

          {/* Desktop */}
          {(!isSimplified || user) && (
          <div className="hidden md:flex items-center gap-6">
            {user ? (
              <>
              <Link to="/dashboard" className={`px-1 py-1 rounded-lg text-sm font-medium transition-colors ${pathname === '/dashboard' ? 'text-primary' : 'text-text-ink hover:text-primary'}`}>Inicio</Link>
              <Link to="/cursos" className={`px-1 py-1 rounded-lg text-sm font-medium transition-colors ${pathname === '/cursos' ? 'text-primary' : 'text-text-ink hover:text-primary'}`}>Cursos disponibles</Link>
              <Link to="/favoritos" className={`px-1 py-1 rounded-lg text-sm font-medium transition-colors ${pathname === '/favoritos' ? 'text-primary' : 'text-text-ink hover:text-primary'}`}>Favoritos</Link>
              <Link to="/patrones-gratis" className={`px-1 py-1 rounded-lg text-sm font-medium transition-colors ${pathname === '/patrones-gratis' ? 'text-primary' : 'text-text-ink hover:text-primary'}`}>Patrones gratis</Link>

              {/* Notifications bell */}
              <NotificationBell />

              {/* Profile dropdown */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="btn btn-ghost text-sm"
                >
                  <div className="w-7 h-7 bg-bg-soft rounded-full flex items-center justify-center text-text-ink text-xs font-bold">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  Perfil
                  <svg className={`w-3.5 h-3.5 transition-transform ${profileOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-bg-surface rounded-2xl shadow-lg border border-border py-1 overflow-hidden animate-slide-down">
                    <div className="px-4 py-3 border-b border-border">
                      <p className="text-xs font-semibold text-text-ink truncate">{user.name}</p>
                      <p className="text-xs text-accent truncate">{user.email}</p>
                    </div>
                    <Link to="/perfil" onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-text-ink hover:bg-bg-soft transition-colors">
                      <User className="w-4 h-4 text-primary" strokeWidth={1.5} /> Mi perfil
                    </Link>
                    <div className="border-t border-bg-soft py-3 px-3 mt-1">
                      <button onClick={handleLogout}
                        className="btn btn-accent w-full text-sm">
                        Cerrar sesión
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
                  <Link to="/patrones-gratis" className="px-1 py-1 rounded-lg text-sm font-medium text-text-ink hover:text-primary transition-colors">Patrones gratis</Link>
                  <Link to="/login" className="btn btn-ghost text-sm text-primary border-primary/40 hover:bg-primary-soft hover:text-primary-hover">Iniciar sesión</Link>
                </>
              )}
            </>
          )}
        </div>
        )}

        {/* Mobile toggle */}
        <button className="btn btn-icon md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className={`md:hidden px-4 py-3 flex flex-col gap-3 ${!isHome ? 'bg-bg-surface border-t border-border' : ''}`}>
          {user ? (
            <>
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs font-semibold text-text-ink">{user.name}</p>
                  <p className="text-xs text-accent">{user.email}</p>
                </div>
                {unreadCount > 0 && (
                  <span className="ml-auto text-[10px] font-bold bg-accent text-white px-2 py-0.5 rounded-full">
                    {unreadCount} nueva{unreadCount !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="text-text-ink text-sm font-medium">Inicio</Link>
              <Link to="/cursos" onClick={() => setMenuOpen(false)} className="text-text-ink text-sm font-medium">Cursos disponibles</Link>
              <Link to="/favoritos" onClick={() => setMenuOpen(false)} className="text-text-ink text-sm font-medium">Favoritos</Link>
              <Link to="/patrones-gratis" onClick={() => setMenuOpen(false)} className="text-text-ink text-sm font-medium">Patrones gratis</Link>
              <Link to="/perfil" onClick={() => setMenuOpen(false)} className="text-text-ink text-sm font-medium">Perfil</Link>
              <Link to="/mis-cursos" onClick={() => setMenuOpen(false)} className="text-text-ink text-sm font-medium">Mis cursos</Link>
              <button onClick={handleLogout} className="btn btn-ghost w-full justify-start text-sm text-accent">Cerrar sesión</button>
            </>
          ) : (
            !isSimplified && (
              <>
                  <Link to="/patrones-gratis" onClick={() => setMenuOpen(false)} className="text-text-ink text-sm font-medium">Patrones gratis</Link>
                  <Link to="/login" onClick={() => setMenuOpen(false)} className="text-text-ink text-sm font-medium">Iniciar sesión</Link>
              </>
            )
          )}
        </div>
      )}
      </nav>
    </>
  );
}
