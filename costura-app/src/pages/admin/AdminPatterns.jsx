import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { get, del } from '../../services/api';
import { getImageUrl } from '../../utils/media';
import PageHeader from '../../components/PageHeader';

export default function AdminPatterns() {
  const [patrones, setPatrones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const filtered = patrones.filter(p =>
    p.titulo.toLowerCase().includes(search.toLowerCase())
  );

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
    if (!window.confirm(`¿Borrar el patrón "${p.titulo}"? Esta acción no se puede deshacer.`)) return;
    try {
      await del(`/patterns/${p.id}`);
      await load();
    } catch (error) {
      console.error('Error borrando el patrón:', error);
      alert('No se pudo borrar el patrón');
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-bg-surface flex items-center justify-center"><span className="text-4xl">🧵</span></div>;
  }

  return (
    <div className="min-h-screen bg-bg-surface">
      <div className="max-w-6xl mx-auto px-1 py-1 animate-fade-in">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
          <div className="min-w-0">
            <PageHeader title="Gestión de patrones" />
          </div>
          <Link to="/admin/patrones/nuevo" className="btn btn-primary text-sm mt-6">
            ＋ Nuevo patrón
          </Link>
        </div>

        <div className="relative max-w-sm mb-6">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar patrón..."
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-primary bg-white text-gray-700 placeholder-gray-400 shadow-sm transition-all duration-300"
          />
        </div>

        <div className="space-y-4 pb-16">
          {patrones.length === 0 ? (
            <div className="text-center py-16 card-glow rounded-2xl">
              <FileText className="w-12 h-12 text-primary mx-auto" strokeWidth={1.5} />
              <h2 className="font-display font-bold text-text-ink text-2xl mt-4">Todavía no hay patrones cargados.</h2>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 card-glow rounded-2xl">
              <FileText className="w-12 h-12 text-primary mx-auto" strokeWidth={1.5} />
              <h2 className="font-display font-bold text-text-ink text-2xl mt-4">Sin resultados para tu búsqueda.</h2>
              <button onClick={() => setSearch('')} className="btn btn-ghost mt-3 text-sm text-primary hover:text-primary-hover">
                Limpiar búsqueda
              </button>
            </div>
          ) : (
            filtered.map((p) => (
              <div key={p.id} className="card-glow rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 shadow-sm">
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
                  </div>
                </div>

                {/* Acciones */}
                <Link to={`/admin/patrones/editar/${p.id}`} className="btn btn-primary text-sm w-full sm:w-auto">
                  Editar
                </Link>
                <button onClick={() => handleDelete(p)} className="btn btn-danger text-sm w-full sm:w-auto">
                  Borrar
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}