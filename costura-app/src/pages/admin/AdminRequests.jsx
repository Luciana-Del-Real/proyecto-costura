import { useEffect, useState } from 'react';
import { useCourses } from '../../context/CoursesContext';

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
    <div className="min-h-screen bg-[#F9F5F0]">
      <div className="bg-[#F5EFE6] py-8 px-4 border-b border-[#EDE4D6]">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-[#3D2B1F]">Panel de Solicitudes</h1>
          <p className="text-[#A08060] text-sm mt-0.5">Gestioná las solicitudes de pago pendientes.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl border border-[#EDE4D6] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-[#3D2B1F]">Solicitudes pendientes</h2>
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
                    <p className="text-xs text-[#6B4C3B]">Curso: {req.course?.title} — {req.course?.price ? `$${req.course.price.toLocaleString()}` : ''}</p>
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
            <div className="text-xs text-[#A08060]">Mostrar {limit} por página</div>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 text-xs bg-white border border-[#EDE4D6] rounded-lg disabled:opacity-50">Anterior</button>
              <button onClick={() => setPage(p => p + 1)} disabled={requests.length < limit}
                className="px-3 py-1.5 text-xs bg-white border border-[#EDE4D6] rounded-lg disabled:opacity-50">Siguiente</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
