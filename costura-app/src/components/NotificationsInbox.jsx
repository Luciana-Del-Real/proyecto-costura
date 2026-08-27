import { useNotifications } from '../context/NotificationsContext';

// Panel de notificaciones extraído de MyCourses: consume directamente el
// contexto (sin props) y preserva la lista, marcar como leída/todas, eliminar
// y los estados de carga, error y vacío tal como estaban en la página.
export default function NotificationsInbox() {
  const {
    notifications, unreadCount, notificationsLoading, notificationsError,
    markAsRead, markAllAsRead, deleteNotification,
  } = useNotifications();

  return (
    <div className="card-flat rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display font-bold text-text-ink text-2xl">Notificaciones</h2>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllAsRead()}
            className="btn btn-ghost text-sm text-primary hover:text-primary-hover"
          >
            Marcar todas como leídas
          </button>
        )}
      </div>

      {notificationsLoading && (
        <p className="text-text-ink text-sm">Cargando notificaciones...</p>
      )}

      {!notificationsLoading && notificationsError && (
        <div className="card-flat rounded-xl px-4 py-3 text-sm text-text-ink">
          No se pudieron cargar las notificaciones. Verificá tu conexión e intentá de nuevo más tarde.
        </div>
      )}

      {!notificationsLoading && !notificationsError && notifications.length === 0 && (
        <p className="text-text-ink text-sm">Todavía no tenés notificaciones.</p>
      )}

      {!notificationsLoading && !notificationsError && notifications.length > 0 && (
        <ul className="space-y-3">
          {notifications.map(n => (
            <li key={n.id} className={`flex items-start gap-3 rounded-xl border p-4 ${n.read ? 'border-border bg-white' : 'border-accent/30 bg-bg-soft'}`}>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-ink flex items-center gap-2">
                  {!n.read && <span className="w-2 h-2 rounded-full bg-accent flex-shrink-0" />}
                  {n.title}
                </p>
                <p className="text-sm text-accent mt-0.5 leading-relaxed">{n.message}</p>
                <p className="text-xs text-accent/70 mt-1">
                  {new Date(n.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="flex flex-col gap-2 flex-shrink-0">
                {!n.read && (
                  <button
                    onClick={() => markAsRead(n.id)}
                    className="btn btn-ghost text-xs text-primary hover:text-primary-hover h-auto min-h-9 px-3 sm:h-11 sm:px-6"
                  >
                    Marcar como leída
                  </button>
                )}
                <button
                  onClick={() => deleteNotification(n.id)}
                  className="btn btn-ghost text-xs text-danger hover:text-danger-hover h-auto min-h-9 px-3 sm:h-11 sm:px-6"
                >
                  Eliminar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}