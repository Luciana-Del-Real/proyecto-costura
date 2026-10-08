import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarHeart } from 'lucide-react';
import { listAdminEvents, deleteEvent } from '../../services/api';
import { useDialog } from '../../context/DialogContext';
import { EVENT_ICONS } from '../../utils/eventIcons';
import PageHeader from '../../components/PageHeader';

// Gestión de eventos del admin: lista los folletos (visibles y ocultos),
// permite editar, borrar y crear nuevos desde /admin/eventos/nuevo.
export default function AdminEvents() {
  const { confirmDialog, alertDialog } = useDialog();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const filtered = events.filter(e =>
    (e.title || '').toLowerCase().includes(search.toLowerCase())
  );

  const load = async () => {
    try {
      const data = await listAdminEvents();
      setEvents(data);
    } catch (error) {
      console.error('Error cargando eventos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (e) => {
    if (!await confirmDialog(`¿Borrar el evento "${e.title}"? Esta acción no se puede deshacer.`)) return;
    try {
      await deleteEvent(e.id);
      await load();
    } catch (error) {
      console.error('Error borrando el evento:', error);
      alertDialog('No se pudo borrar el evento');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-24 animate-fade-in"><span className="text-4xl">🎉</span></div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in">
      <PageHeader title="Gestión de eventos" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="relative w-full max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar evento..."
            className="w-full pl-10 pr-4 py-2 text-sm border-2 border-gray-300 hover:border-gray-400 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white text-gray-700 placeholder-gray-400 shadow-sm transition-all duration-300"
          />
        </div>
        <Link to="/admin/eventos/nuevo" className="btn btn-primary text-sm shrink-0">
          ＋ Nuevo evento
        </Link>
      </div>

      <div className="space-y-4 pb-16">
        {events.length === 0 ? (
          <div className="text-center py-16 card-flat rounded-2xl">
            <CalendarHeart className="w-12 h-12 text-primary mx-auto" strokeWidth={1.5} />
            <h2 className="font-display font-bold text-text-ink text-2xl mt-4">Todavía no hay eventos cargados.</h2>
            <p className="text-sm text-text-ink mt-2">Creá el primero con el botón "＋ Nuevo evento".</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 card-flat rounded-2xl">
            <CalendarHeart className="w-12 h-12 text-primary mx-auto" strokeWidth={1.5} />
            <h2 className="font-display font-bold text-text-ink text-2xl mt-4">Sin resultados para tu búsqueda.</h2>
            <button onClick={() => setSearch('')} className="btn btn-ghost mt-3 text-sm text-primary">
              Limpiar búsqueda
            </button>
          </div>
        ) : (
          filtered.map((e) => {
            const Icon = EVENT_ICONS[e.icon] || EVENT_ICONS.Sparkles;
            return (
              <div key={e.id} className="card-flat rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 shadow-sm">
                {/* Ícono del evento (chip plano, no una caja anidada) */}
                <div className="w-16 h-16 rounded-2xl bg-primary-soft border border-border flex items-center justify-center text-primary flex-shrink-0">
                  <Icon className="w-7 h-7" strokeWidth={1.5} />
                </div>

                {/* Información */}
                <div className="flex-grow min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-body text-text-ink text-lg font-bold leading-tight">{e.title}</h3>
                    {!e.active && (
                      <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                        Oculto
                      </span>
                    )}
                  </div>
                  {e.detail && (
                    <div className="flex gap-4 text-xs text-black/70 font-medium mt-1">
                      <span className="truncate max-w-[280px]">{e.detail}</span>
                    </div>
                  )}
                </div>

                {/* Acciones */}
                <Link to={`/admin/eventos/editar/${e.id}`} className="btn btn-primary text-sm w-full sm:w-auto">
                  Editar
                </Link>
                <button onClick={() => handleDelete(e)} className="btn btn-ghost text-sm w-full sm:w-auto text-danger border-danger/30">
                  Borrar
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
