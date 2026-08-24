import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BackToHome from './BackToHome';

const navLinks = [
  { to: '/admin', label: 'Inicio', icon: '📊' },
  { to: '/admin/cursos', label: 'Cursos', icon: '📚' },
  { to: '/admin/usuarios', label: 'Usuarios', icon: '👥' },
  { to: '/admin/solicitudes', label: 'Solicitudes', icon: '⏳' },
  { to: '/admin/ventas', label: 'Ventas', icon: '💳' },
];

export default function AdminNavbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <>
      <BackToHome />
      {/* Navbar con fondo blanco y borde temático para unificar con el Dashboard */}
      <nav className="bg-white border-b border-border sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          
          {/* Logo y Nombre unificado */}
          <Link to="/admin" className="flex items-center gap-3">
            <img src="/Images/Logo%20sin%20Slogan.png" alt="Grow" className="w-9 h-9 object-contain" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-widest text-black">Creative Education Studio</span>
            </div>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link key={link.to} to={link.to}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === link.to
                    ? 'bg-bg-surface text-primary'
                    : 'text-text-ink hover:text-primary hover:bg-bg-soft'
                }`}>
                <span>{link.icon}</span>{link.label}
              </Link>
            ))}
          </div>

          {/* User info */}
          <div className="hidden md:flex items-center gap-4">
            <div className="text-right">
              <p className="text-primary text-xs font-semibold">{user?.name}</p>
              <p className="text-text-ink text-[10px] uppercase">Administradora</p>
            </div>
            <button onClick={handleLogout}
              className="btn btn-primary text-xs">
              Salir
            </button>
          </div>

          {/* Mobile menu button */}
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
          <div className="md:hidden bg-white border-t border-border px-4 py-3 flex flex-col gap-2">
            {navLinks.map(link => (
              <Link key={link.to} to={link.to} onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 text-text-ink text-sm py-2">
                <span>{link.icon}</span>{link.label}
              </Link>
            ))}
            <button onClick={handleLogout} className="btn btn-ghost w-full justify-start text-sm text-accent mt-2 border-t border-border pt-0">
              Cerrar sesión
            </button>
          </div>
        )}
      </nav>
    </>
  );
}