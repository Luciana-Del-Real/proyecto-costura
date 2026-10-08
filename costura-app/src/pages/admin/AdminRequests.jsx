import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import Pagination from '../../components/Pagination';
import LoadingState from '../../components/LoadingState';
import EmptyState from '../../components/EmptyState';
import SearchInput from '../../components/SearchInput';
import { usePurchases } from '../../context/PurchaseContext';
import { formatMoney } from '../../utils/currency';
import { listPatternPurchasesPending, approvePatternPurchase, rejectPatternPurchase } from '../../services/api';

export default function AdminRequests() {
  const { getPendingRequests, approvePurchase, denyPurchase } = usePurchases();
  const [requests, setRequests] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [search, setSearch] = useState('');
  // Solicitudes de patrones de pago (misma bandeja, sección propia).
  const [patternRequests, setPatternRequests] = useState([]);
  const [patternLoading, setPatternLoading] = useState(false);
  const [patternProcessingId, setPatternProcessingId] = useState(null);
  const [patternSearch, setPatternSearch] = useState('');
  // Solicitud a resaltar al llegar desde la campanita (?highlight=<id>): se
  // marca unos segundos y luego se desvanece.
  const [searchParams, setSearchParams] = useSearchParams();
  const [highlightId, setHighlightId] = useState(() => searchParams.get('highlight') || null);
  const highlightRef = useRef(null);

  useEffect(() => {
    if (!highlightId) return undefined;
    const timer = setTimeout(() => {
      setHighlightId(null);
      setSearchParams({}, { replace: true });
    }, 4000);
    return () => clearTimeout(timer);
  }, [highlightId, setSearchParams]);

  // Cuando la solicitud resaltada está en pantalla, scrolleá hasta ella
  useEffect(() => {
    if (highlightId && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightId, requests]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // Solicitudes de patrones de pago: se cargan una vez (sin paginación, son
  // pocas; se refrescan al aprobar/rechazar). Si venimos desde la campanita
  // con ?highlight=<id> de un patrón, scrollear y marcarlo en gris.
  useEffect(() => {
    (async () => {
      setPatternLoading(true);
      try {
        const data = await listPatternPurchasesPending();
        setPatternRequests(data);
        if (highlightId && data.some(r => r.id === highlightId)) {
          setTimeout(() => {
            const el = document.getElementById(highlightId);
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              el.classList.add('highlight-gray');
              setTimeout(() => el.classList.remove('highlight-gray'), 3000);
            }
          }, 150);
        }
      } catch (err) {
        console.error('Error cargando solicitudes de patrones:', err);
        setPatternRequests([]);
      } finally {
        setPatternLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadPatterns = async () => {
    try {
      setPatternRequests(await listPatternPurchasesPending());
    } catch (err) {
      console.error('Error cargando solicitudes de patrones:', err);
    }
  };

  const handleApprovePattern = async (id) => {
    try {
      setPatternProcessingId(id);
      await approvePatternPurchase(id);
      await loadPatterns();
    } catch (err) {
      console.error('Error aprobando solicitud de patrón', err);
    } finally {
      setPatternProcessingId(null);
    }
  };

  const handleRejectPattern = async (id) => {
    try {
      setPatternProcessingId(id);
      await rejectPatternPurchase(id);
      await loadPatterns();
    } catch (err) {
      console.error('Error rechazando solicitud de patrón', err);
    } finally {
      setPatternProcessingId(null);
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      const data = await getPendingRequests(page, limit);
      setRequests(Array.isArray(data) ? data : []);

      // Si llegamos desde la campanita (?highlight=<id>) y la solicitud no
      // está en la página actual, buscamos la página que la contiene.
      if (highlightId) {
        const found = (Array.isArray(data) ? data : []).some(r => r.id === highlightId);
        if (!found) {
          let foundPage = null;
          let p = 1;
          const maxPages = 20; // tope de seguridad
          while (!foundPage && p <= maxPages) {
            const more = await getPendingRequests(p, limit);
            if (!Array.isArray(more)) break;
            if (more.some(r => r.id === highlightId)) { foundPage = p; break; }
            if (more.length < limit) break;
            p += 1;
          }
          if (foundPage && foundPage !== page) {
            setPage(foundPage);
            return;
          }
        }
      }
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

  // Filtro de búsqueda sobre las solicitudes de patrones: alumna o patrón
  const filteredPatterns = patternRequests.filter(req => {
    const q = patternSearch.toLowerCase();
    if (q === '') return true;
    return (req.user?.name || '').toLowerCase().includes(q) ||
      (req.user?.email || '').toLowerCase().includes(q) ||
      (req.pattern?.titulo || '').toLowerCase().includes(q);
  });

  return (
    <div className="w-full px-4 py-8 animate-fade-in">
      <PageHeader title="Panel de Solicitudes" subtitle="Gestioná las solicitudes de pago pendientes." />

      <div className="card-flat rounded-2xl px-6 py-10 animate-fade-up mt-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-text-ink text-2xl">Solicitudes pendientes</h2>
          </div>

          <SearchInput
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar solicitud..."
            className="max-w-sm mb-4"
          />

          {loading ? (
            <div className="py-6"><LoadingState size="inline" /></div>
          ) : requests.length === 0 ? (
            <EmptyState variant="inline" title="No hay solicitudes pendientes." />
          ) : filtered.length === 0 ? (
            <EmptyState
              variant="compact"
              icon={Search}
              title="Sin resultados para tu búsqueda."
              action={{ label: 'Limpiar búsqueda', onClick: () => setSearch(''), variant: 'ghost' }}
            />
          ) : (
            <div className="grid gap-3">
              {filtered.map(req => (
                <div
                  key={req.id}
                  ref={highlightId === req.id ? highlightRef : undefined}
                  className={`p-3 border-b border-border last:border-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors duration-700 ${
                    highlightId === req.id ? 'highlight-gray' : ''
                  }`}
                >
                  <div>
                    <p className="font-medium text-text-ink">{req.user?.name} <span className="text-xs text-text-tan">({req.user?.email})</span></p>
                    <p className="text-xs text-text-ink">Curso: {req.course?.title} — {formatMoney(req.total ?? req.course?.priceARS, req.user?.country === 'AUD' ? 'AUD' : 'ARS')}</p>
                    <p className="text-xs text-text-tan">Solicitado: {new Date(req.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleApprove(req.id)} disabled={processingId === req.id}
                      className="btn btn-primary text-xs">{processingId === req.id ? 'Procesando...' : 'Aprobar'}</button>
                    <button onClick={() => handleReject(req.id)} disabled={processingId === req.id}
                      className="btn btn-ghost text-xs">{processingId === req.id ? 'Procesando...' : 'Rechazar'}</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Paginación consistente con el resto de listados admin: el total
              de páginas es server-side, así que se estima desde la página
              actual (si la página vino llena, hay al menos una más; si vino
              vacía, esta es la última real). */}
          <Pagination
            page={page}
            totalPages={Math.max(1, requests.length === 0 && page > 1 ? page - 1 : page + (requests.length === limit ? 1 : 0))}
            onPageChange={setPage}
          />
        </div>

        {/* Solicitudes de patrones de pago */}
        <div className="card-flat rounded-2xl px-6 py-10 animate-fade-up mt-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-text-ink text-2xl">Solicitudes de patrones</h2>
          </div>

          <SearchInput
            value={patternSearch}
            onChange={e => setPatternSearch(e.target.value)}
            placeholder="Buscar solicitud de patrón..."
            className="max-w-sm mb-4"
          />

          {patternLoading ? (
            <div className="py-6"><LoadingState size="inline" /></div>
          ) : patternRequests.length === 0 ? (
            <EmptyState variant="inline" title="No hay solicitudes de patrones pendientes." />
          ) : filteredPatterns.length === 0 ? (
            <EmptyState
              variant="compact"
              icon={Search}
              title="Sin resultados para tu búsqueda."
              action={{ label: 'Limpiar búsqueda', onClick: () => setPatternSearch(''), variant: 'ghost' }}
            />
          ) : (
            <div className="grid gap-3">
              {filteredPatterns.map(req => (
                <div
                  key={req.id}
                  id={req.id}
                  className={`p-3 border-b border-border last:border-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors duration-700 ${
                    highlightId === req.id ? 'highlight-gray' : ''
                  }`}
                >
                  <div>
                    <p className="font-medium text-text-ink">{req.user?.name} <span className="text-xs text-text-tan">({req.user?.email})</span></p>
                    <p className="text-xs text-text-ink">Patrón: {req.pattern?.titulo} — {formatMoney(req.total ?? req.pattern?.precioARS, req.user?.country === 'AUD' ? 'AUD' : 'ARS')}</p>
                    <p className="text-xs text-text-tan">Solicitado: {new Date(req.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleApprovePattern(req.id)} disabled={patternProcessingId === req.id}
                      className="btn btn-primary text-xs">{patternProcessingId === req.id ? 'Procesando...' : 'Aprobar'}</button>
                    <button onClick={() => handleRejectPattern(req.id)} disabled={patternProcessingId === req.id}
                      className="btn btn-ghost text-xs">{patternProcessingId === req.id ? 'Procesando...' : 'Rechazar'}</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
    </div>
  );
}
