import { useEffect, useState } from 'react';
import PageHeader from '../../components/PageHeader';
import { usePurchases } from '../../context/PurchaseContext';
import { formatMoney } from '../../utils/currency';

export default function AdminRequests() {
  const { getPendingRequests, approvePurchase, denyPurchase } = usePurchases();
  const [requests, setRequests] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [search, setSearch] = useState('');

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

  // Filtro de búsqueda sobre la página cargada: alumna, curso o estado
  const filtered = requests.filter(req => {
    const q = search.toLowerCase();
    if (q === '') return true;
    return (req.user?.name || '').toLowerCase().includes(q) ||
      (req.user?.email || '').toLowerCase().includes(q) ||
      (req.course?.title || '').toLowerCase().includes(q) ||
      (req.status || '').toLowerCase().includes(q);
  });

  return (
    <div className="max-w-6xl mx-auto px-1 py-1 animate-fade-in">
      <PageHeader title="Panel de Solicitudes" subtitle="Gestioná las solicitudes de pago pendientes." />

      <div className="card-flat rounded-2xl px-6 py-10 animate-fade-up mt-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-text-ink text-2xl">Solicitudes pendientes</h2>
            <div className="text-xs text-text-tan">Página {page}</div>
          </div>

          <div className="relative max-w-sm mb-4">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar solicitud..."
              className="w-full pl-10 pr-4 py-2 text-sm border-2 border-gray-300 hover:border-gray-400 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white text-gray-700 placeholder-gray-400 shadow-sm transition-all duration-300"
            />
          </div>

          {loading ? (
            <div className="py-6 text-center text-sm text-text-tan">Cargando...</div>
          ) : requests.length === 0 ? (
            <p className="text-text-tan text-sm">No hay solicitudes pendientes.</p>
          ) : filtered.length === 0 ? (
            <p className="text-text-tan text-sm">Sin resultados para tu búsqueda.</p>
          ) : (
            <div className="grid gap-3">
              {filtered.map(req => (
                <div key={req.id} className="p-3 border-b border-border last:border-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
  );
}
