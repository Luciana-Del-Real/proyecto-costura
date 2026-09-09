import { AuthProvider } from '../context/AuthContext';
import { PushProvider } from '../context/PushContext';
import { CourseCatalogProvider } from '../context/CourseCatalogContext';
import { PurchaseProvider } from '../context/PurchaseContext';
import { ProgressProvider } from '../context/ProgressContext';
import { FavoritesProvider } from '../context/FavoritesContext';
import { NotificationsProvider } from '../context/NotificationsContext';
import { AdminProvider } from '../context/AdminContext';

// Composición de los providers globales en el orden exacto del árbol previo:
// Auth > Push > CourseCatalog > Purchase > Progress > Favorites >
// Notifications > Admin. BrowserRouter queda fuera, en App. PushProvider va
// inmediatamente bajo AuthProvider (consume useAuth) y renderiza el banner de
// consentimiento push de forma global (spec pwa-installability).
export default function Providers({ children }) {
  return (
    <AuthProvider>
      <PushProvider>
        <CourseCatalogProvider>
          <PurchaseProvider>
            <ProgressProvider>
              <FavoritesProvider>
                <NotificationsProvider>
                  <AdminProvider>
                    {children}
                  </AdminProvider>
                </NotificationsProvider>
              </FavoritesProvider>
            </ProgressProvider>
          </PurchaseProvider>
        </CourseCatalogProvider>
      </PushProvider>
    </AuthProvider>
  );
}
