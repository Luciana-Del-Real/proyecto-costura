import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { get, post, patch } from '../services/api';
import { derivePurchaseState } from './contextHelpers';

const PurchaseContext = createContext(null);

export function PurchaseProvider({ children }) {
  const { user } = useAuth();

  // purchaseRecords: raw records from the backend (all statuses).
  // purchases / pendingPurchases: derived course id lists, exposed separately.
  const [purchaseRecords, setPurchaseRecords] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [pendingPurchases, setPendingPurchases] = useState([]);
  const [purchasesLoading, setPurchasesLoading] = useState(false);
  const [purchasesError, setPurchasesError] = useState(null);

  const refreshMyPurchases = useCallback(async () => {
    if (!user) {
      setPurchaseRecords([]);
      setPurchases([]);
      setPendingPurchases([]);
      setPurchasesError(null);
      return [];
    }
    setPurchasesLoading(true);
    try {
      const data = await get(`/purchases/user/${user.id}`);
      const { approved, pending } = derivePurchaseState(data);
      setPurchaseRecords(data);
      setPurchases(approved);
      setPendingPurchases(pending);
      setPurchasesError(null);
      return approved;
    } catch (e) {
      console.error('Error cargando tus compras:', e);
      setPurchasesError(e.message || 'No se pudieron cargar tus compras.');
      return [];
    } finally {
      setPurchasesLoading(false);
    }
  }, [user]);

  // Cargar compras reales al iniciar sesión / cambiar de usuario.
  useEffect(() => {
    refreshMyPurchases();
  }, [refreshMyPurchases]);

  // Si la alumna vuelve a la pestaña (por ejemplo, después de que el admin
  // le aprobó la compra en otro momento), refrescamos el estado real.
  useEffect(() => {
    if (!user) return;
    const onFocus = () => {
      refreshMyPurchases();
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [user, refreshMyPurchases]);

  // --- Alumno ---
  const requestPurchase = async (courseId) => {
    if (!user) throw new Error('Debes iniciar sesión para solicitar un curso');
    if (purchases.includes(courseId) || pendingPurchases.includes(courseId)) return;

    const res = await post('/purchases', { courseId });
    // Volvemos a pedirle al backend el estado real, en vez de asumirlo local.
    await refreshMyPurchases();
    return res;
  };

  const approvePurchase = async (purchaseId) => {
    const res = await patch(`/purchases/${purchaseId}/approve`);
    return res;
  };

  const denyPurchase = async (purchaseId) => {
    const res = await patch(`/purchases/${purchaseId}/reject`);
    return res;
  };

  const hasCourse = (courseId) => Array.isArray(purchases) && purchases.includes(courseId);
  const isPending = (courseId) => Array.isArray(pendingPurchases) && pendingPurchases.includes(courseId);

  // --- Admin: estadísticas globales de ventas ---
  const getAllPurchases = async () => {
    try {
      if (!user) return [];
      if (user.role === 'ADMIN') {
        return await get('/purchases/all');
      }
      return await get(`/purchases/user/${user.id}`);
    } catch (err) {
      console.error('getAllPurchases error', err);
      return [];
    }
  };

  const getPendingRequests = async (page = 1, limit = 100) => {
    try {
      if (user?.role === 'ADMIN') {
        return await get(`/purchases/pending?page=${page}&limit=${limit}`);
      }
      return [];
    } catch (err) {
      console.error('getPendingRequests error', err);
      return [];
    }
  };

  return (
    <PurchaseContext.Provider value={{
      purchaseRecords,
      purchases, pendingPurchases,
      purchasesLoading, purchasesError,
      requestPurchase, approvePurchase, denyPurchase, refreshMyPurchases,
      hasCourse, isPending,
      getAllPurchases, getPendingRequests,
    }}>
      {children}
    </PurchaseContext.Provider>
  );
}
// eslint-disable-next-line react-refresh/only-export-components
export const usePurchases = () => useContext(PurchaseContext);