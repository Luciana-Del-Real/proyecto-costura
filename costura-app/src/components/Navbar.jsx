import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationsContext';
import BackToHome from './BackToHome';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { notifications, unreadCount, notificationsLoading, notificationsError, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location?.pathname || '';
  const simplifiedRoutes = ['/login', '/registro', '/cursos', '/forgot-password', '/reset-password'];
  const isCourseDetail = pathname.startsWith('/curso/');
  const isSimplified = simplifiedRoutes.includes(pathname) || isCourseDetail;
  const isHome = pathname === '/';
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const profileRef = useRef(null);
  const notifRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
    setProfileOpen(false);
    setNotifOpen(false);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <>
      <BackToHome />
        <nav className={`${isHome ? 'absolute inset-x-0 top-0 z-50 nav-on-hero' : 'sticky top-0 z-50 bg-white border-b border-theme shadow-sm'}`}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to={user ? (isAdmin ? "/admin" : "/dashboard") : "/"} className="flex items-center gap-3">
            <img src="/Images/Logo%20sin%20Slogan.png" alt="Grow" className="w-9 h-9 object-contain" />
            <div className="flex flex-col">
              <span className="text-sm uppercase tracking-widest text-black">Creative Education Studio</span>
            </div>
          </Link>

          {/* Desktop */}
          {(!isSimplified || user) && (
          <div className="hidden md:flex items-center gap-6">
            {user ? (
              <>
              <Link to="/dashboard" className={`px-1 py-1 rounded-lg text-sm font-medium transition-colors ${pathname === '/dashboard' ? 'text-black transition-colors text-xl' : 'text-black transition-colors text-xl'}`}>Inicio</Link>
              <Link to="/cursos" className={`px-1 py-1 rounded-lg text-sm font-medium transition-colors ${pathname === '/cursos' ? 'text-black transition-colors text-xl' : 'text-black transition-colors text-xl'}`}>Cursos disponibles</Link>
              <Link to="/favoritos" className={`px-1 py-1 rounded-lg text-sm font-medium transition-colors ${pathname === '/favoritos' ? 'text-black transition-colors text-xl' : 'text-black transition-colors text-xl'}`}>Favoritos</Link>

              {/* Notifications bell */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setNotifOpen(!notifOpen)}
                  aria-label="Notificaciones"
                  className="btn btn-icon relative"
                >
                  <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#B84A62] text-white text-[10px] font-bold flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-lg border border-theme overflow-hidden animate-slide-down z-50">
                    <div className="px-4 py-3 border-b border-theme flex items-center justify-between">
                      <p className="text-xs font-semibold text-theme">Notificaciones</p>
                      {unreadCount > 0 && (
                        <button
                          onClick={() => markAllAsRead()}
                          className="btn btn-ghost text-xs text-secondary hover:text-secondary-dark"
                        >
                          Marcar todas como leídas
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notificationsLoading && (
                        <p className="text-sm text-brown-accent px-4 py-3">Cargando...</p>
                      )}
                      {!notificationsLoading && notificationsError && (
                        <p className="text-sm text-brown-accent px-4 py-3">
                          No se pudieron cargar las notificaciones.
                        </p>
                      )}
                      {!notificationsLoading && !notificationsError && notifications.length === 0 && (
                        <p className="text-sm text-brown-accent px-4 py-3">Todavía no tenés notificaciones.</p>
                      )}
                      {!notificationsLoading && !notificationsError && notifications.length > 0 && (
                        <ul>
                          {notifications.slice(0, 5).map(n => (
                            <li key={n.id} className="border-b border-theme last:border-0">
                              <button
                                onClick={() => { if (!n.read) markAsRead(n.id); }}
                                className="w-full text-left px-4 py-3 hover:bg-bg-soft transition-colors"
                              >
                                <p className="text-xs font-semibold text-theme flex items-center gap-2">
                                  {!n.read && <span className="w-2 h-2 rounded-full bg-[#B84A62] flex-shrink-0" />}
                                  {n.title}
                                </p>
                                <p className="text-xs text-brown-accent mt-0.5 line-clamp-2">{n.message}</p>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Profile dropdown */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="btn btn-ghost text-sm"
                >
                  <div className="w-7 h-7 bg-soft rounded-full flex items-center justify-center text-black text-xs font-bold">
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
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-theme hover:bg-bg-soft transition-colors">
                      👤 Mi perfil
                    </Link>
                    <Link to="/mis-cursos" onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-theme hover:bg-bg-soft transition-colors">
                      📚 Mis cursos
                    </Link>
                    <div className="border-t border-[#F5EFE6] py-3 px-3 mt-1">
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
                  <Link to="/cursos" className="text-black transition-colors text-xl">Cursos</Link>
                  <Link to="/login" className="text-xl text-black transition-colors">Iniciar sesión</Link>
                  <Link to="/registro" className="btn btn-primary text-sm transition-all duration-200 hover:scale-105">
                    Registrarse
                  </Link>
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
                {unreadCount > 0 && (
                  <span className="ml-auto text-[10px] font-bold bg-[#B84A62] text-white px-2 py-0.5 rounded-full">
                    {unreadCount} nueva{unreadCount !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="text-theme text-sm font-medium">Inicio</Link>
              <Link to="/cursos" onClick={() => setMenuOpen(false)} className="text-theme text-sm font-medium">Cursos disponibles</Link>
              <Link to="/favoritos" onClick={() => setMenuOpen(false)} className="text-theme text-sm font-medium">Favoritos</Link>
              <Link to="/perfil" onClick={() => setMenuOpen(false)} className="text-theme text-sm font-medium">Perfil</Link>
              <Link to="/mis-cursos" onClick={() => setMenuOpen(false)} className="text-theme text-sm font-medium">Mis cursos</Link>
              <button onClick={handleLogout} className="btn btn-ghost w-full justify-start text-sm text-accent">Cerrar sesión</button>
            </>
          ) : (
            !isSimplified && (
              <>
                  <Link to="/cursos" onClick={() => setMenuOpen(false)} className="text-black text-sm font-medium">Cursos</Link>
                  <Link to="/login" onClick={() => setMenuOpen(false)} className="text-black text-sm font-medium">Iniciar sesión</Link>
                <Link to="/registro" onClick={() => setMenuOpen(false)} className="btn btn-primary text-sm">Registrarse</Link>
              </>
            )
          )}
        </div>
      )}
      </nav>
    </>
  );
}
