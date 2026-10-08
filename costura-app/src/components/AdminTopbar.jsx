import { Link } from 'react-router-dom';
import { Menu } from 'lucide-react';
import NotificationBell from './NotificationBell';

// Admin brand bar. Keeps the SAME brand disposition as every other screen
// (logo + name, inside a centered max-w-6xl row) and surfaces the notification
// bell on the right, matching the student navbar.
export default function AdminTopbar({ onMenuClick }) {
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

        <NotificationBell />
      </div>
    </header>
  );
}
