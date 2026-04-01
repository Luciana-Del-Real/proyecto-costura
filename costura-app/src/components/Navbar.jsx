import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
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
    <nav className="bg-[#F5EFE6] border-b border-[#EDE4D6] sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to={user ? (user.role === 'admin' ? "/admin" : "/dashboard") : "/"} className="flex items-center gap-2">
          <span className="text-2xl">🧵</span>
          <span className="font-bold text-[#7A9E7E] text-xl tracking-tight">Grow</span>
          <span className="text-[#6B4C3B] text-sm font-medium hidden sm:inline">Textil Creative Institute</span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-6">
          {user ? (
            <>
              <Link to="/dashboard" className="text-[#6B4C3B] hover:text-[#7A9E7E] transition-colors text-sm font-medium">Inicio</Link>
              <Link to="/cursos" className="text-[#6B4C3B] hover:text-[#7A9E7E] transition-colors text-sm font-medium">Cursos disponibles</Link>
              <Link to="/favoritos" className="text-[#6B4C3B] hover:text-[#7A9E7E] transition-colors text-sm font-medium">Favoritos</Link>

              {/* Profile dropdown */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 text-[#6B4C3B] hover:text-[#7A9E7E] transition-colors text-sm font-medium"
                >
                  <div className="w-7 h-7 bg-[#7A9E7E] rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  Perfil
                  <svg className={`w-3.5 h-3.5 transition-transform ${profileOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-lg border border-[#EDE4D6] py-1 overflow-hidden animate-slide-down">
                    <div className="px-4 py-3 border-b border-[#F5EFE6]">
                      <p className="text-xs font-semibold text-[#3D2B1F] truncate">{user.name}</p>
                      <p className="text-xs text-[#A08060] truncate">{user.email}</p>
                    </div>
                    <Link to="/perfil" onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#6B4C3B] hover:bg-[#F5EFE6] transition-colors">
                      👤 Mi perfil
                    </Link>
                    <Link to="/mis-cursos" onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#6B4C3B] hover:bg-[#F5EFE6] transition-colors">
                      📚 Mis cursos
                    </Link>
                    <div className="border-t border-[#F5EFE6] mt-1">
                      <button onClick={handleLogout}
                        className="w-full text-left flex items-center gap-2 px-4 py-2.5 text-sm text-[#C4785A] hover:bg-[#F5E8E2] transition-colors">
                        🚪 Cerrar sesión
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/cursos" className="text-[#6B4C3B] hover:text-[#7A9E7E] transition-colors text-sm font-medium">Cursos</Link>
              <Link to="/login" className="text-sm text-[#6B4C3B] hover:text-[#7A9E7E] transition-colors font-medium">Iniciar sesión</Link>
              <Link to="/registro" className="text-sm bg-[#7A9E7E] text-white px-4 py-1.5 rounded-full hover:bg-[#5E8262] transition-colors">
                Registrarse
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden text-[#6B4C3B]" onClick={() => setMenuOpen(!menuOpen)}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-[#F5EFE6] border-t border-[#EDE4D6] px-4 py-3 flex flex-col gap-3">
          {user ? (
            <>
              <div className="flex items-center gap-2 pb-2 border-b border-[#EDE4D6]">
                <div className="w-8 h-8 bg-[#7A9E7E] rounded-full flex items-center justify-center text-white text-sm font-bold">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#3D2B1F]">{user.name}</p>
                  <p className="text-xs text-[#A08060]">{user.email}</p>
                </div>
              </div>
              <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="text-[#6B4C3B] text-sm font-medium">Inicio</Link>
              <Link to="/cursos" onClick={() => setMenuOpen(false)} className="text-[#6B4C3B] text-sm font-medium">Cursos disponibles</Link>
              <Link to="/favoritos" onClick={() => setMenuOpen(false)} className="text-[#6B4C3B] text-sm font-medium">Favoritos</Link>
              <Link to="/perfil" onClick={() => setMenuOpen(false)} className="text-[#6B4C3B] text-sm font-medium">Perfil</Link>
              <Link to="/mis-cursos" onClick={() => setMenuOpen(false)} className="text-[#6B4C3B] text-sm font-medium">Mis cursos</Link>
              <button onClick={handleLogout} className="text-left text-[#C4785A] text-sm font-medium">Cerrar sesión</button>
            </>
          ) : (
            <>
              <Link to="/cursos" onClick={() => setMenuOpen(false)} className="text-[#6B4C3B] text-sm font-medium">Cursos</Link>
              <Link to="/login" onClick={() => setMenuOpen(false)} className="text-[#6B4C3B] text-sm font-medium">Iniciar sesión</Link>
              <Link to="/registro" onClick={() => setMenuOpen(false)} className="text-[#7A9E7E] text-sm font-medium">Registrarse</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
