import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  GraduationCap,
  Scissors,
  CalendarDays,
  ShoppingBag,
  BookOpen,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Student navigation. Same items the navbar used to expose, in the same order;
// every item carries a lucide icon and a route-based active state.
// "Favoritos" and "Perfil" are NOT here: they already live in the navbar user
// menu, so repeating them in the sidebar would duplicate the same destination.
const NAV_ITEMS = [
  { to: '/dashboard', label: 'Inicio', icon: LayoutDashboard },
  { to: '/cursos', label: 'Cursos', icon: GraduationCap },
  { to: '/patrones-gratis', label: 'Patrones', icon: Scissors },
  { to: '/eventos', label: 'Eventos', icon: CalendarDays },
  { to: '/recomendaciones', label: 'Recomendaciones', icon: ShoppingBag },
  { to: '/mis-cursos', label: 'Mis cursos', icon: BookOpen },
];

// `/dashboard` is the index and must only match exactly; every other item
// stays active for its own route and any nested sub-route.
function isActive(pathname, to) {
  if (to === '/dashboard') return pathname === '/dashboard';
  return pathname === to || pathname.startsWith(`${to}/`);
}

function NavItem({ item, active, onNavigate }) {
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? 'bg-success/10 text-success'
          : 'text-text-ink hover:bg-bg-surface hover:text-success'
      }`}
    >
      <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
      <span>{item.label}</span>
    </Link>
  );
}

// Shared sidebar body used by both the desktop rail and the mobile drawer.
// The desktop rail keeps the user menu in the navbar; the drawer adds the
// identity + logout footer because the navbar dropdown is desktop-only.
function SidebarContent({ onNavigate, showLogout = false }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleLogout = () => {
    logout();
    onNavigate?.();
    navigate('/');
  };

  return (
    <>
      <nav className="flex-1 min-h-0 overflow-y-auto px-3 py-4 flex flex-col gap-1" aria-label="Navegación del alumno">
        {NAV_ITEMS.map((item) => (
          <NavItem
            key={item.to}
            item={item}
            active={isActive(pathname, item.to)}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      {showLogout && (
        <div className="border-t border-border px-4 py-4 flex flex-col gap-3 shrink-0">
          <div className="flex flex-col">
            <p className="text-sm font-semibold text-text-ink">{user?.name}</p>
            <p className="text-[10px] uppercase tracking-widest text-text-muted">Alumna</p>
          </div>
          <button type="button" onClick={handleLogout} className="btn btn-primary text-xs w-full">
            Cerrar sesión
          </button>
        </div>
      )}
    </>
  );
}

export default function StudentSidebar({ open = false, onClose }) {
  // Escape closes the mobile drawer.
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  return (
    <>
      {/* Desktop rail (in flow). It sticks below the h-16 navbar, so it only
          occupies the remaining viewport height. */}
      <aside className="hidden lg:flex lg:flex-col w-64 shrink-0 bg-white border-r border-border lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)]">
        <SidebarContent />
      </aside>

      {/* Mobile drawer (overlay + panel). */}
      {open && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Navegación del alumno"
        >
          <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
          <aside className="absolute inset-y-0 left-0 w-64 max-w-[80vw] bg-white border-r border-border flex flex-col shadow-xl">
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar menú"
              className="btn btn-icon absolute top-3 right-3 z-10"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
            <SidebarContent onNavigate={onClose} showLogout />
          </aside>
        </div>
      )}
    </>
  );
}
