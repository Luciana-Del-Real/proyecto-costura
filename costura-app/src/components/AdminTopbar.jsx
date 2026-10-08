import { Link } from 'react-router-dom';
import { Menu } from 'lucide-react';
import NotificationBell from './NotificationBell';

// Thin sticky admin top bar. The sidebar carries the full nav; here we only
// keep the mobile menu trigger and the notification bell. No page title is
// rendered because each page owns its flat <PageHeader>.
export default function AdminTopbar({ onMenuClick }) {
  return (
    <header className="sticky top-0 z-40 h-14 flex items-center gap-3 px-4 bg-white border-b border-border">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Abrir menú de navegación"
        className="btn btn-icon lg:hidden"
      >
        <Menu className="w-6 h-6" aria-hidden="true" />
      </button>

      {/* Mobile-only brand: the sidebar is hidden below lg, so the institution
          name lives here and must never shrink or truncate. */}
      <Link to="/admin" className="lg:hidden flex items-center gap-2 shrink-0">
        <img
          src="/Images/Logo%20sin%20Slogan.png"
          alt="Creative Education Studio"
          className="w-8 h-8 object-contain shrink-0"
        />
        <span className="text-[11px] uppercase tracking-wider text-text-ink whitespace-nowrap">
          Creative Education Studio
        </span>
      </Link>

      <div className="ml-auto flex items-center shrink-0">
        <NotificationBell />
      </div>
    </header>
  );
}
