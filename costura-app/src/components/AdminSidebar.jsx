import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  GraduationCap,
  Scissors,
  CalendarDays,
  Users,
  Award,
  Inbox,
  ShoppingBag,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Grouped admin navigation. Sections keep the sidebar easy to scan;
// every item carries a lucide icon and a route-based active state.
const NAV_GROUPS = [
  {
    label: 'Panel',
    items: [{ to: '/admin', label: 'Inicio', icon: LayoutDashboard }],
  },
  {
    label: 'Catálogo',
    items: [
      { to: '/admin/cursos', label: 'Cursos', icon: GraduationCap },
      { to: '/admin/patrones', label: 'Patrones', icon: Scissors },
      { to: '/admin/eventos', label: 'Eventos', icon: CalendarDays },
      { to: '/admin/productos', label: 'Productos', icon: ShoppingBag },
    ],
  },
  {
    label: 'Alumnas',
    items: [
      { to: '/admin/usuarios', label: 'Usuarios', icon: Users },
      { to: '/admin/certificados', label: 'Certificados', icon: Award },
    ],
  },
  {
    label: 'Operaciones',
    items: [
      { to: '/admin/solicitudes', label: 'Solicitudes', icon: Inbox },
      { to: '/admin/ventas', label: 'Ventas', icon: ShoppingBag },
    ],
  },
];

// `/admin` is the dashboard index and must only match exactly; every other
// item stays active for its own route and any nested sub-route.
function isActive(pathname, to) {
  if (to === '/admin') return pathname === '/admin';
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
function SidebarContent({ onNavigate }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      <nav className="flex-1 min-h-0 overflow-y-auto px-3 py-4 flex flex-col gap-5" aria-label="Navegación principal">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-text-muted">
              {group.label}
            </p>
            <div className="flex flex-col gap-1">
              {group.items.map((item) => (
                <NavItem
                  key={item.to}
                  item={item}
                  active={isActive(pathname, item.to)}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer — identity and logout. Name and role keep their own room
          (no truncation). The notification bell lives in the topbar. */}
      <div className="border-t border-border px-4 py-4 flex flex-col gap-3 shrink-0">
        <div className="flex flex-col">
          <p className="text-sm font-semibold text-text-ink">{user?.name}</p>
          <p className="text-[10px] uppercase tracking-widest text-text-muted">Administradora</p>
        </div>
        <button type="button" onClick={handleLogout} className="btn btn-primary text-xs w-full">
          Salir
        </button>
      </div>
    </>
  );
}

export default function AdminSidebar({ open = false, onClose }) {
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
      {/* Desktop rail (in flow). It sticks below the h-16 topbar, so it only
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
          aria-label="Navegación de administración"
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
            <SidebarContent onNavigate={onClose} />
          </aside>
        </div>
      )}
    </>
  );
}
