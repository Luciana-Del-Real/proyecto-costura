import { useEffect, useState } from 'react';
import { useCourses } from '../../context/CoursesContext';
import { formatMoney } from '../../utils/currency';

export default function AdminRequests() {
  const { getPendingRequests, approvePurchase, denyPurchase } = useCourses();
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
      <div className="bg-[#F9F5F0] rounded-2xl shadow-sm border border-gray-100 px-6 py-10 animate-fade-up mt-5">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-[#6B4C3B]">Panel de Solicitudes</h1>
          <p className="text-[#A08060] text-sm mt-0.5">Gestioná las solicitudes de pago pendientes.</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-1 py-1 animate-fade-in">
        <div className="bg-[#F9F5F0] rounded-2xl shadow-sm border border-gray-100 px-6 py-10 animate-fade-up mt-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-[#6B4C3B] text-xl">Solicitudes pendientes</h2>
            <div className="text-xs text-[#A08060]">Página {page}</div>
          </div>

          {loading ? (
            <div className="py-6 text-center text-sm text-[#A08060]">Cargando...</div>
          ) : requests.length === 0 ? (
            <p className="text-[#A08060] text-sm">No hay solicitudes pendientes.</p>
          ) : (
            <div className="grid gap-3">
              {requests.map(req => (
                <div key={req.id} className="bg-[#F9F5F0] rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-[#3D2B1F]">{req.user?.name} <span className="text-xs text-[#A08060]">({req.user?.email})</span></p>
                    <p className="text-xs text-[#6B4C3B]">Curso: {req.course?.title} — {formatMoney(req.total ?? req.course?.priceARS, req.user?.country === 'AUD' ? 'AUD' : 'ARS')}</p>
                    <p className="text-xs text-[#A08060]">Solicitado: {new Date(req.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleApprove(req.id)} disabled={processingId === req.id}
                      className="px-3 py-1.5 text-xs bg-[#7A9E7E] text-white rounded-lg hover:bg-[#5E8262] disabled:opacity-50">{processingId === req.id ? 'Procesando...' : 'Aprobar'}</button>
                    <button onClick={() => handleReject(req.id)} disabled={processingId === req.id}
                      className="px-3 py-1.5 text-xs bg-[#EDE4D6] text-[#6B4C3B] rounded-lg hover:bg-[#D4C2B5] disabled:opacity-50">{processingId === req.id ? 'Procesando...' : 'Rechazar'}</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between mt-6">
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="bg-[#4E6D5B] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#3d5a4a] transition-all shadow-sm">Anterior</button>
              <button onClick={() => setPage(p => p + 1)} disabled={requests.length < limit}
                className="bg-[#4E6D5B] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#3d5a4a] transition-all shadow-sm">Siguiente</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
