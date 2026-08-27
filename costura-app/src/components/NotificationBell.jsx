import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationsContext';

// Campanita de notificaciones reutilizable (navbar de alumna y de admin).
// Extraída del bloque inline que vivía en Navbar: mismo botón con campana,
// badge de no leídas y dropdown con listado, "Marcar todas como leídas" y
// borrado individual. Consume useNotifications internamente.
export default function NotificationBell() {
  const {
    notifications,
    unreadCount,
    notificationsLoading,
    notificationsError,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);

  // Al clickear una notificación navegá al lugar que corresponde (si tiene
  // link), marcala como leída y cerrá el dropdown.
  const handleItemClick = (n) => {
    if (n.link) navigate(n.link);
    if (!n.read) markAsRead(n.id);
    setNotifOpen(false);
  };

  // Cerrar el dropdown al hacer click afuera.
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={notifRef}>
      <button
        onClick={() => setNotifOpen(!notifOpen)}
        aria-label="Notificaciones"
        className="btn btn-icon relative"
      >
        <svg className="w-5 h-5 text-text-ink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {notifOpen && (
        <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-lg border border-border overflow-hidden animate-slide-down z-50">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <p className="text-xs font-semibold text-text-ink">Notificaciones</p>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead()}
                className="btn btn-ghost text-xs text-primary hover:text-primary-hover"
              >
                Marcar todas como leídas
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notificationsLoading && (
              <p className="text-sm text-accent px-4 py-3">Cargando...</p>
            )}
            {!notificationsLoading && notificationsError && (
              <p className="text-sm text-accent px-4 py-3">
                No se pudieron cargar las notificaciones.
              </p>
            )}
            {!notificationsLoading && !notificationsError && notifications.length === 0 && (
              <p className="text-sm text-accent px-4 py-3">Todavía no tenés notificaciones.</p>
            )}
            {!notificationsLoading && !notificationsError && notifications.length > 0 && (
              <ul>
                {notifications.slice(0, 5).map(n => (
                  <li key={n.id} className="border-b border-border last:border-0 flex items-start">
                    <button
                      onClick={() => handleItemClick(n)}
                      className="flex-1 text-left px-4 py-3 hover:bg-bg-soft transition-colors min-w-0"
                    >
                      <p className="text-xs font-semibold text-text-ink flex items-center gap-2">
                        {!n.read && <span className="w-2 h-2 rounded-full bg-accent flex-shrink-0" />}
                        {n.title}
                      </p>
                      <p className="text-xs text-accent mt-0.5 line-clamp-2">{n.message}</p>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                      aria-label="Eliminar notificación"
                      className="px-2 py-3 text-accent/60 hover:text-danger transition-colors flex-shrink-0"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
