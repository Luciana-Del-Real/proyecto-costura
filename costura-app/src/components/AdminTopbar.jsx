import { Link } from 'react-router-dom';
import { Menu } from 'lucide-react';

// Full-width admin brand bar. It owns the institution brand and the mobile
// menu trigger; the sidebar carries the full nav and the notification bell.
export default function AdminTopbar({ onMenuClick }) {
  return (
    <header className="sticky top-0 z-40 h-16 flex items-center gap-3 px-4 bg-white border-b border-border">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Abrir menú de navegación"
        className="btn btn-icon lg:hidden"
      >
        <Menu className="w-6 h-6" aria-hidden="true" />
      </button>

      {/* Brand is always visible and must never shrink or truncate. */}
      <Link to="/admin" className="flex items-center gap-2 shrink-0">
        <img
          src="/Images/Logo%20sin%20Slogan.png"
          alt="Creative Education Studio"
          className="w-9 h-9 object-contain shrink-0"
        />
        <span className="text-sm uppercase tracking-widest leading-tight whitespace-nowrap text-text-ink">
          Creative Education Studio
        </span>
      </Link>
    </header>
  );
}
