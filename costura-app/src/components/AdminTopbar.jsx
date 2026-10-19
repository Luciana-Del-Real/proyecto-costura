import { Link, useNavigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import NotificationBell from './NotificationBell';
import { useAuth } from '../context/AuthContext';

// Admin brand bar. Keeps the SAME brand disposition as every other screen
// (logo + name, inside a centered max-w-6xl row) and surfaces the notification
// bell plus the admin identity and logout on the right, matching the old navbar.
// The identity/logout are desktop-only: the mobile drawer carries its own copy.
export default function AdminTopbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-border shadow-sm">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Abrir menú de navegación"
            className="btn btn-icon lg:hidden shrink-0"
          >
            <Menu className="w-6 h-6" aria-hidden="true" />
          </button>

          <Link to="/admin" className="flex items-center gap-3">
            <img
              src="/Images/Logo%20sin%20Slogan.png"
              alt="Creative Education Studio"
              className="w-9 h-9 object-contain"
            />
            <div className="flex flex-col">
              <span className="text-sm uppercase tracking-widest text-text-ink">
                Creative Education Studio
              </span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <NotificationBell />
          <div className="hidden lg:flex items-center gap-4">
            <div className="text-right">
              <p className="text-primary text-xs font-semibold">{user?.name}</p>
              <p className="text-text-ink text-[10px] uppercase">Administradora</p>
            </div>
            <button type="button" onClick={handleLogout} className="btn btn-primary text-xs">
              Salir
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
