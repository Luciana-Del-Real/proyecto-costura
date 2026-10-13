import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { listAdminRecommendations, deleteRecommendation } from '../../services/api';
import { useDialog } from '../../context/DialogContext';
import { getImageUrl } from '../../utils/media';
import PageHeader from '../../components/PageHeader';
import LoadingState from '../../components/LoadingState';
import EmptyState from '../../components/EmptyState';
import SearchInput from '../../components/SearchInput';

// Gestión de recomendaciones del admin: lista las tarjetas (visibles y
// ocultas), permite editar, borrar y crear nuevas desde
// /admin/recomendaciones/nuevo.
export default function AdminRecommendations() {
  const { confirmDialog, alertDialog } = useDialog();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const filtered = recommendations.filter(r =>
    (r.title || '').toLowerCase().includes(search.toLowerCase())
  );

  const load = async () => {
    try {
      const data = await listAdminRecommendations();
      setRecommendations(data);
    } catch (error) {
      console.error('Error cargando recomendaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (r) => {
    if (!await confirmDialog(`¿Borrar la recomendación "${r.title}"? Esta acción no se puede deshacer.`)) return;
    try {
      await deleteRecommendation(r.id);
      await load();
    } catch (error) {
      console.error('Error borrando la recomendación:', error);
      alertDialog('No se pudo borrar la recomendación');
    }
  };

  if (loading) {
    return <LoadingState size="section" />;
  }

  return (
    <div className="w-full px-4 py-8 animate-fade-in">
      <PageHeader title="Recomendaciones" subtitle="Gestión de recomendaciones" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <SearchInput
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar recomendación..."
          className="w-full max-w-sm"
        />
        <Link to="/admin/recomendaciones/nuevo" className="btn btn-primary text-sm shrink-0">
          ＋ Nueva recomendación
        </Link>
      </div>

      <div className="space-y-4 pb-16">
        {recommendations.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title="Todavía no hay recomendaciones cargadas."
            description={'Creá la primera con el botón "＋ Nueva recomendación".'}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title="Sin resultados para tu búsqueda."
            action={{ label: 'Limpiar búsqueda', onClick: () => setSearch(''), variant: 'ghost' }}
          />
        ) : (
          filtered.map((r) => (
            <div key={r.id} className="card-flat rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 shadow-sm">
              {/* Miniatura de la imagen o bloque de color */}
              <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
                {r.image ? (
                  <img src={getImageUrl(r.image)} alt={r.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-primary-soft flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5 text-primary" strokeWidth={1.5} />
                  </div>
                )}
              </div>

              {/* Información */}
              <div className="flex-grow min-w-0">
                <h3 className="font-body text-text-ink text-lg font-bold leading-tight truncate">{r.title}</h3>
                {r.link && (
                  <p className="text-xs text-text-tan font-medium mt-1 truncate">{r.link}</p>
                )}
              </div>

              {/* Acciones (cluster que envuelve en mobile) */}
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <Link to={`/admin/recomendaciones/editar/${r.id}`} className="btn btn-primary text-sm w-full sm:w-auto">
                  Editar
                </Link>
                <button onClick={() => handleDelete(r)} className="btn btn-ghost text-sm w-full sm:w-auto text-danger border-danger/30">
                  Eliminar
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}