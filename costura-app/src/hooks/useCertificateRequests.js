import { useState, useEffect, useCallback } from 'react';
import { get, patch } from '../services/api';

// Lógica de la bandeja de solicitudes de certificado del admin: fetch de
// /admin/certificate-requests, partición en pendientes y enviadas, y marcado
// como enviada con refresh posterior. CertificadosSection queda como vista
// pura consumiendo esto.
export default function useCertificateRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await get('/admin/certificate-requests');
      setRequests(data);
      setError(false);
    } catch (e) {
      console.error('Error cargando solicitudes de certificado:', e);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const pending = requests.filter(r => r.status === 'PENDING');
  const sent = requests.filter(r => r.status === 'SENT');

  // Marca como enviada tras mandar el certificado por mail fuera de la app.
  // Re-lanza el error para que la vista decida cómo informarlo (alert).
  const markSent = useCallback(async (id) => {
    await patch(`/admin/certificate-requests/${id}`, { status: 'SENT' });
    await refresh();
  }, [refresh]);

  return {
    requests,
    pending,
    sent,
    loading,
    error,
    refresh,
    markSent,
  };
}