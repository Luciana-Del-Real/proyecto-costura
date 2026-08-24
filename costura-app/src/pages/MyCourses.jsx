import { Link } from 'react-router-dom';
import { useCourseCatalog } from '../context/CourseCatalogContext';
import { usePurchases } from '../context/PurchaseContext';
import { useProgress } from '../context/ProgressContext';
import { useNotifications } from '../context/NotificationsContext';
import { getImageUrl } from '../utils/media';

export default function MyCourses() {
  const { purchases } = usePurchases();
  const { getProgress } = useProgress();
  const { courses } = useCourseCatalog();
  const { notifications, unreadCount, notificationsLoading, notificationsError, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const myCourses = courses.filter(c => purchases.includes(c.id));

  return (
    <div className="max-w-6xl mx-auto px-1 py-1 animate-fade-in">
      <div className="bg-[#F4F1ED] rounded-2xl shadow-sm border border-gray-100 px-4 py-10 animate-fade-up mt-5 mb-5">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-[#6B4C3B]">Mis cursos</h1>
          <p className="text-theme mt-1">{myCourses.length} curso{myCourses.length !== 1 ? 's' : ''} adquirido{myCourses.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {myCourses.length === 0 ? (
            <div className="text-center py-20">
            <span className="text-6xl">📚</span>
            <h2 className="text-xl font-bold text-theme mt-4 mb-2">Todavía no tenés cursos</h2>
            <p className="text-theme mb-6">Explorá nuestro catálogo y empezá a aprender hoy.</p>
            <Link to="/cursos" className="btn btn-primary font-medium">
              Ver cursos disponibles
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {myCourses.map(course => {
              const prog = getProgress(course.id, course.lessons.length);
              return (
                <div key={course.id} className="stagger-item bg-white rounded-2xl shadow-sm border border-theme p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                  <img src={getImageUrl(course.image)} alt={course.title} className="w-full sm:w-28 h-20 object-cover rounded-xl flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-theme">{course.title}</h3>
                      <span className="text-sm font-bold text-secondary flex-shrink-0">{prog}%</span>
                    </div>
                    <p className="text-theme text-sm mt-0.5 mb-3">{course.instructor} · {course.lessons.length} lecciones</p>
                    <div className="w-full bg-soft rounded-full h-2 mb-3">
                      <div className="bg-secondary h-2 rounded-full transition-all" style={{ width: `${prog}%` }} />
                    </div>
                    <Link
                      to={`/curso/${course.id}`}
                      className="btn btn-accent text-sm font-medium"
                    >
                      Abrir curso →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Notificaciones: leídas/actualizadas desde el backend */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-theme p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-[#6B4C3B] text-xl">Notificaciones</h2>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead()}
                className="btn btn-ghost text-sm text-secondary hover:text-secondary-dark"
              >
                Marcar todas como leídas
              </button>
            )}
          </div>

          {notificationsLoading && (
            <p className="text-theme text-sm">Cargando notificaciones...</p>
          )}

          {!notificationsLoading && notificationsError && (
            <div className="bg-soft border border-theme rounded-xl px-4 py-3 text-sm text-theme">
              No se pudieron cargar las notificaciones. Verificá tu conexión e intentá de nuevo más tarde.
            </div>
          )}

          {!notificationsLoading && !notificationsError && notifications.length === 0 && (
            <p className="text-theme text-sm">Todavía no tenés notificaciones.</p>
          )}

          {!notificationsLoading && !notificationsError && notifications.length > 0 && (
            <ul className="space-y-3">
              {notifications.map(n => (
                <li key={n.id} className={`flex items-start gap-3 rounded-xl border p-4 ${n.read ? 'border-theme bg-white' : 'border-[#B84A62]/30 bg-soft'}`}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-theme flex items-center gap-2">
                      {!n.read && <span className="w-2 h-2 rounded-full bg-[#B84A62] flex-shrink-0" />}
                      {n.title}
                    </p>
                    <p className="text-sm text-brown-accent mt-0.5 leading-relaxed">{n.message}</p>
                    <p className="text-xs text-brown-accent/70 mt-1">
                      {new Date(n.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    {!n.read && (
                      <button
                        onClick={() => markAsRead(n.id)}
                        className="btn btn-ghost text-xs text-secondary hover:text-secondary-dark"
                      >
                        Marcar como leída
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(n.id)}
                      className="btn btn-ghost text-xs text-red-500 hover:text-red-600"
                    >
                      Eliminar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
