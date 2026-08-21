import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { get, patch, del } from '../services/api';
import {
  unreadCountOf,
  applyNotificationRead,
  applyNotificationDelete,
} from './contextHelpers';

const NotificationsContext = createContext(null);

export function NotificationsProvider({ children }) {
  const { user } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState(null);

  // Backend is authoritative: the list and the unread count come from the API.
  // A fetch failure surfaces in notificationsError instead of silently keeping
  // stale data.
  const refreshNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setNotificationsError(null);
      return;
    }
    setNotificationsLoading(true);
    try {
      const [list, countRes] = await Promise.all([
        get('/notifications'),
        get('/notifications/unread-count'),
      ]);
      setNotifications(list);
      setUnreadCount(countRes?.unreadCount ?? unreadCountOf(list));
      setNotificationsError(null);
    } catch (e) {
      console.error('Error cargando notificaciones:', e);
      setNotificationsError(e.message || 'No se pudieron cargar las notificaciones.');
    } finally {
      setNotificationsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (cancelled) return undefined;
      return refreshNotifications();
    });
    return () => { cancelled = true; };
  }, [refreshNotifications]);

  const markAsRead = async (notificationId) => {
    try {
      await patch(`/notifications/${notificationId}/read`, {});
      setNotifications(prev => applyNotificationRead(prev, notificationId));
      setUnreadCount(prev => Math.max(0, prev - 1));
      setNotificationsError(null);
    } catch (e) {
      console.error('Error marcando notificación como leída:', e);
      setNotificationsError(e.message || 'No se pudo actualizar la notificación.');
    }
  };

  const markAllAsRead = async () => {
    try {
      await patch('/notifications/mark-all-read', {});
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      setNotificationsError(null);
    } catch (e) {
      console.error('Error marcando todas las notificaciones como leídas:', e);
      setNotificationsError(e.message || 'No se pudieron actualizar las notificaciones.');
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await del(`/notifications/${notificationId}`);
      const next = applyNotificationDelete(notifications, notificationId);
      setNotifications(next);
      setUnreadCount(unreadCountOf(next));
      setNotificationsError(null);
    } catch (e) {
      console.error('Error eliminando notificación:', e);
      setNotificationsError(e.message || 'No se pudo eliminar la notificación.');
    }
  };

  return (
    <NotificationsContext.Provider value={{
      notifications, unreadCount,
      notificationsLoading, notificationsError,
      refreshNotifications, markAsRead, markAllAsRead, deleteNotification,
    }}>
      {children}
    </NotificationsContext.Provider>
  );
}
// eslint-disable-next-line react-refresh/only-export-components
export const useNotifications = () => useContext(NotificationsContext);