import { useEffect, useState } from 'react';
import { usePurchases } from '../../context/PurchaseContext';
import { formatMoney } from '../../utils/currency';

export default function AdminRequests() {
  const { getPendingRequests, approvePurchase, denyPurchase } = usePurchases();
  const [requests, setRequests] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getPendingRequests(page, limit);
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error cargando solicitudes pendientes', err);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      setProcessingId(id);
      await approvePurchase(id);
      await load();
    } catch (err) {
      console.error('Error aprobando solicitud', err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id) => {
    try {
      setProcessingId(id);
      await denyPurchase(id);
      await load();
    } catch (err) {
      console.error('Error rechazando solicitud', err);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-1 py-1 animate-fade-in">
      <div className="bg-white rounded-2xl border border-primary/30 shadow-sm px-6 py-10 animate-fade-up mt-5">
        <div className="max-w-7xl mx-auto">
          <h1 className="font-display text-3xl font-bold text-text-ink">Panel de Solicitudes</h1>
          <p className="text-text-tan text-sm mt-0.5">Gestioná las solicitudes de pago pendientes.</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-1 py-1 animate-fade-in">
        <div className="card-glow rounded-2xl px-6 py-10 animate-fade-up mt-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-text-ink text-xl">Solicitudes pendientes</h2>
            <div className="text-xs text-text-tan">Página {page}</div>
          </div>

          {loading ? (
            <div className="py-6 text-center text-sm text-text-tan">Cargando...</div>
          ) : requests.length === 0 ? (
            <p className="text-text-tan text-sm">No hay solicitudes pendientes.</p>
          ) : (
            <div className="grid gap-3">
              {requests.map(req => (
                <div key={req.id} className="card-glow rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-text-ink">{req.user?.name} <span className="text-xs text-text-tan">({req.user?.email})</span></p>
                    <p className="text-xs text-text-ink">Curso: {req.course?.title} — {formatMoney(req.total ?? req.course?.priceARS, req.user?.country === 'AUD' ? 'AUD' : 'ARS')}</p>
                    <p className="text-xs text-text-tan">Solicitado: {new Date(req.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleApprove(req.id)} disabled={processingId === req.id}
                      className="btn btn-primary text-xs">{processingId === req.id ? 'Procesando...' : 'Aprobar'}</button>
                    <button onClick={() => handleReject(req.id)} disabled={processingId === req.id}
                      className="btn btn-ghost text-xs bg-bg-soft text-text-ink hover:bg-border">{processingId === req.id ? 'Procesando...' : 'Rechazar'}</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between mt-6">
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="btn btn-primary text-xs shadow-sm">Anterior</button>
              <button onClick={() => setPage(p => p + 1)} disabled={requests.length < limit}
                className="btn btn-primary text-xs shadow-sm">Siguiente</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
