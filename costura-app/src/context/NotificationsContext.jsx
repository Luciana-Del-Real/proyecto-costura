import { createContext, useContext } from 'react';

const NotificationsContext = createContext(null);

export function NotificationsProvider({ children }) {
  // Backend fetch/update wiring lands in task 4.5; this context exists as part
  // of the domain split so the provider tree is complete from the start.
  return (
    <NotificationsContext.Provider value={{
      notifications: [],
      unreadCount: 0,
      notificationsLoading: false,
      notificationsError: null,
    }}>
      {children}
    </NotificationsContext.Provider>
  );
}
// eslint-disable-next-line react-refresh/only-export-components
export const useNotifications = () => useContext(NotificationsContext);