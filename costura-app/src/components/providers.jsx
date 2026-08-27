import { AuthProvider } from '../context/AuthContext';
import { CourseCatalogProvider } from '../context/CourseCatalogContext';
import { PurchaseProvider } from '../context/PurchaseContext';
import { ProgressProvider } from '../context/ProgressContext';
import { FavoritesProvider } from '../context/FavoritesContext';
import { NotificationsProvider } from '../context/NotificationsContext';
import { AdminProvider } from '../context/AdminContext';

// Composición de los providers globales en el orden exacto del árbol previo:
// Auth > CourseCatalog > Purchase > Progress > Favorites > Notifications >
// Admin. BrowserRouter queda fuera, en App.
export default function Providers({ children }) {
  return (
    <AuthProvider>
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
    </AuthProvider>
  );
}