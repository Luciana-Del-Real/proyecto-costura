import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navLinks = [
  { to: '/admin', label: 'Inicio', icon: '📊' },
  { to: '/admin/cursos', label: 'Cursos', icon: '📚' },
  { to: '/admin/usuarios', label: 'Usuarios', icon: '👥' },
  { to: '/admin/ventas', label: 'Ventas', icon: '💳' },
];

export default function AdminNavbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <nav className="bg-[#3D2B1F] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/admin" className="flex items-center gap-2">
          <span className="text-xl">🧵</span>
          <div>
            <span className="font-bold text-[#F5EFE6] text-base tracking-tight">Grow</span>
            <span className="text-[#C4A882] text-xs ml-1.5">Admin</span>
          </div>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(link => (
            <Link key={link.to} to={link.to}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === link.to
                  ? 'bg-[#5C3D2A] text-[#F5EFE6]'
                  : 'text-[#C4A882] hover:text-[#F5EFE6] hover:bg-[#4A2E1A]'
              }`}>
              <span>{link.icon}</span>{link.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <div className="text-right">
            <p className="text-[#F5EFE6] text-xs font-semibold">{user?.name}</p>
            <p className="text-[#C4A882] text-xs">Administradora</p>
          </div>
          <button onClick={handleLogout}
            className="text-xs text-[#C4785A] border border-[#C4785A] px-3 py-1.5 rounded-lg hover:bg-[#4A2E1A] transition-colors">
            Salir
          </button>
        </div>

        <button className="md:hidden text-[#C4A882]" onClick={() => setMenuOpen(!menuOpen)}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-[#2E1F15] border-t border-[#5C3D2A] px-4 py-3 flex flex-col gap-2">
          {navLinks.map(link => (
            <Link key={link.to} to={link.to} onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 text-[#C4A882] text-sm py-1.5">
              <span>{link.icon}</span>{link.label}
            </Link>
          ))}
          <button onClick={handleLogout} className="text-left text-[#C4785A] text-sm mt-2">Cerrar sesión</button>
        </div>
      )}
    </nav>
  );
}
