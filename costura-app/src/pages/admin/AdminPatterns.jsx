import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { get, del } from '../../services/api';
import { useDialog } from '../../context/DialogContext';
import { getImageUrl } from '../../utils/media';
import PageHeader from '../../components/PageHeader';
import Pagination from '../../components/Pagination';
import LoadingState from '../../components/LoadingState';

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

  const handleDelete = async (p) => {
    if (!await confirmDialog(`¿Borrar el patrón "${p.titulo}"? Esta acción no se puede deshacer.`)) return;
    try {
      await del(`/patterns/${p.id}`);
      await load();
    } catch (error) {
      console.error('Error borrando el patrón:', error);
      alertDialog('No se pudo borrar el patrón');
    }
  };

  if (loading) {
    return <LoadingState size="section" />;
  }

  return (
    <div className="w-full px-4 py-8 animate-fade-in">
      <PageHeader title="Gestión de patrones" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="relative w-full max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Buscar patrón..."
            className="w-full pl-10 pr-4 py-2 text-sm border-2 border-gray-300 hover:border-gray-400 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white text-gray-700 placeholder-gray-400 shadow-sm transition-all duration-300"
          />
        </div>
        <Link to="/admin/patrones/nuevo" className="btn btn-primary text-sm shrink-0">
          ＋ Nuevo patrón
        </Link>
      </div>

      <div className="space-y-4 pb-16">
        {patrones.length === 0 ? (
          <div className="text-center py-16 card-flat rounded-2xl">
            <FileText className="w-12 h-12 text-primary mx-auto" strokeWidth={1.5} />
            <h2 className="font-display font-bold text-text-ink text-2xl mt-4">Todavía no hay patrones cargados.</h2>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 card-flat rounded-2xl">
            <FileText className="w-12 h-12 text-primary mx-auto" strokeWidth={1.5} />
            <h2 className="font-display font-bold text-text-ink text-2xl mt-4">Sin resultados para tu búsqueda.</h2>
            <button onClick={() => { setSearch(''); setPage(1); }} className="btn btn-ghost mt-3 text-sm text-primary">
              Limpiar búsqueda
            </button>
          </div>
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
                <h3 className="font-body text-text-ink text-lg font-bold mb-2 leading-tight">{p.titulo}</h3>
                <div className="flex gap-4 text-xs text-black/70 font-medium">
                  <span>{p.nivel}</span>
                  <span>{p.categoria}</span>
                  <span className={`font-bold px-2 py-0.5 rounded-full ${p.esPago ? 'bg-success/10 text-success' : 'bg-primary-soft text-primary'}`}>
                    {p.esPago ? 'De pago' : 'Gratis'}
                  </span>
                </div>
              </div>

              {/* Acciones */}
              <Link to={`/admin/patrones/editar/${p.id}`} className="btn btn-primary text-sm w-full sm:w-auto">
                Editar
              </Link>
              <button onClick={() => handleDelete(p)} className="btn btn-ghost text-sm w-full sm:w-auto text-danger border-danger/30">
                Borrar
              </button>
            </div>
          ))
        )}
        <Pagination page={page} total={filtered.length} perPage={PER_PAGE} onPageChange={setPage} />
      </div>
    </div>
  );
}
