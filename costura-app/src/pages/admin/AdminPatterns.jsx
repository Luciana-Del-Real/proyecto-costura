import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { get, del, put } from '../../services/api';
import { useDialog } from '../../context/DialogContext';
import { getImageUrl } from '../../utils/media';
import PageHeader from '../../components/PageHeader';
import Pagination from '../../components/Pagination';
import LoadingState from '../../components/LoadingState';
import EmptyState from '../../components/EmptyState';
import SearchInput from '../../components/SearchInput';
import Badge from '../../components/Badge';

export default function AdminPatterns() {
  const { confirmDialog, alertDialog } = useDialog();
  const [patrones, setPatrones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  const filtered = patrones.filter(p =>
    p.titulo.toLowerCase().includes(search.toLowerCase())
  );

  const pageItems = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const load = async () => {
    try {
      const data = await get('/patterns');
      setPatrones(data);
    } catch (error) {
      console.error('Error cargando patrones:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const salesCount = (p) => p._count?.patternPurchases ?? 0;

  const handleShow = async (p) => {
    try {
      await put(`/patterns/${p.id}`, { active: true });
      await load();
    } catch (error) {
      console.error('Error reactivando el patrón:', error);
      alertDialog('No se pudo reactivar el patrón');
    }
  };

  // Delete inteligente: el backend oculta (active=false) si el patrón tiene
  // ventas y borra definitivamente si no tiene. La respuesta trae
  // `action: 'hidden' | 'deleted'` para mostrar el resultado correcto.
  const handleHideOrDelete = async (p) => {
    const sales = salesCount(p);
    if (sales > 0) {
      if (!await confirmDialog(`Este patrón tiene ${sales} venta(s): se va a OCULTAR del catálogo conservando el historial.`)) return;
    } else if (!await confirmDialog('Se va a ELIMINAR definitivamente. No se puede deshacer.')) {
      return;
    }
    try {
      const result = await del(`/patterns/${p.id}`);
      await alertDialog(
        result?.action === 'hidden'
          ? 'El patrón se ocultó: conserva el historial de ventas y podés mostrarlo cuando quieras.'
          : 'El patrón se eliminó definitivamente.',
        result?.action === 'hidden' ? 'Patrón ocultado' : 'Patrón eliminado',
      );
      await load();
    } catch (error) {
      console.error('Error ocultando/eliminando el patrón:', error);
      alertDialog('No se pudo ocultar/eliminar el patrón');
    }
  };

  if (loading) {
    return <LoadingState size="section" />;
  }

  return (
    <div className="w-full px-4 py-8 animate-fade-in">
      <PageHeader title="Gestión de patrones" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <SearchInput
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Buscar patrón..."
          className="w-full max-w-sm"
        />
        <Link to="/admin/patrones/nuevo" className="btn btn-primary text-sm shrink-0">
          ＋ Nuevo patrón
        </Link>
      </div>

      <div className="space-y-4 pb-16">
        {patrones.length === 0 ? (
          <EmptyState icon={FileText} title="Todavía no hay patrones cargados." />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Sin resultados para tu búsqueda."
            action={{ label: 'Limpiar búsqueda', onClick: () => { setSearch(''); setPage(1); }, variant: 'ghost' }}
          />
        ) : (
          pageItems.map((p) => (
            <div key={p.id} className="card-flat rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 shadow-sm">
              {/* Portada o bloque de color */}
              <div className="w-24 h-16 bg-bg-soft rounded-lg overflow-hidden flex-shrink-0">
                {p.imagen ? (
                  <img src={getImageUrl(p.imagen)} alt={p.titulo} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-primary-soft flex items-center justify-center">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Información */}
              <div className="flex-grow min-w-0">
                <h3 className="font-body text-text-ink text-lg font-bold mb-2 leading-tight flex items-center gap-2">
                  {p.titulo}
                  {p.active === false && <Badge tone="neutral">Oculto</Badge>}
                </h3>
                <div className="flex gap-4 text-xs text-black/70 font-medium">
                  <span>{p.nivel}</span>
                  <span>{p.categoria}</span>
                  <span>{salesCount(p)} venta{salesCount(p) === 1 ? '' : 's'}</span>
                  <Badge tone={p.esPago ? 'success' : 'primary'}>{p.esPago ? 'De pago' : 'Gratis'}</Badge>
                </div>
              </div>

              {/* Acciones */}
              <Link to={`/admin/patrones/editar/${p.id}`} className="btn btn-primary text-sm w-full sm:w-auto">
                Editar
              </Link>
              {p.active === false ? (
                <button onClick={() => handleShow(p)} className="btn btn-ghost text-sm w-full sm:w-auto">
                  Mostrar
                </button>
              ) : salesCount(p) > 0 ? (
                <button onClick={() => handleHideOrDelete(p)} className="btn btn-ghost text-sm w-full sm:w-auto text-accent">
                  Ocultar
                </button>
              ) : (
                <button onClick={() => handleHideOrDelete(p)} className="btn btn-ghost text-sm w-full sm:w-auto text-danger border-danger/30">
                  Eliminar
                </button>
              )}
            </div>
          ))
        )}
        <Pagination page={page} total={filtered.length} perPage={PER_PAGE} onPageChange={setPage} />
      </div>
    </div>
  );
}
