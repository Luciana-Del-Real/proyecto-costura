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
      <nav className="bg-brown sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/admin" className="flex items-center gap-3">
          <img src="/Images/logo-nuevo-grow.png" alt="Grow" className="w-9 h-9 object-contain" />
          <div>
            <span className="font-bold text-rosa text-base tracking-tight">Grow</span>
            <span className="text-brown-soft text-xs ml-1.5">Admin</span>
          </div>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(link => (
            <Link key={link.to} to={link.to}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === link.to
                  ? 'bg-brown-dark text-rosa'
                  : 'text-brown-soft hover:text-rosa hover:bg-brown-muted'
              }`}>
              <span>{link.icon}</span>{link.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <div className="text-right">
            <p className="text-rosa text-xs font-semibold">{user?.name}</p>
            <p className="text-brown-soft text-xs">Administradora</p>
          </div>
          <button onClick={handleLogout}
            className="text-xs text-brown-accent border border-brown-accent px-3 py-1.5 rounded-lg hover:bg-brown-muted transition-colors">
            Salir
          </button>
        </div>

        <button className="md:hidden text-brown-soft" onClick={() => setMenuOpen(!menuOpen)}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-brown-muted border-t border-brown-dark px-4 py-3 flex flex-col gap-2">
          {navLinks.map(link => (
            <Link key={link.to} to={link.to} onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 text-brown-soft text-sm py-1.5">
              <span>{link.icon}</span>{link.label}
            </Link>
          ))}
          <button onClick={handleLogout} className="text-left text-brown-accent text-sm mt-2">Cerrar sesión</button>
        </div>
      )}
      </nav>
    </>
  );
}
