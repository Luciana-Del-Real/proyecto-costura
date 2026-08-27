import { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
import { get } from '../services/api';
import { getImageUrl } from '../utils/media';
import PageHeader from '../components/PageHeader';

const niveles = ['Todos', 'Principiante', 'Intermedio', 'Avanzado'];

export default function PatronesGratis() {
  const [patrones, setPatrones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nivel, setNivel] = useState('Todos');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await get('/patterns');
        if (active) setPatrones(data);
      } catch (error) {
        console.error('Error cargando patrones:', error);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  // Normalizamos quitando acentos y pasando todo a minúsculas
  const normalizeText = (text) =>
    text ? text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "";

  const filtered = patrones.filter(p => {
    const matchSearch = normalizeText(p.titulo).includes(normalizeText(search)) ||
      normalizeText(p.descripcion).includes(normalizeText(search));
    const matchLevel = nivel === 'Todos' || p.nivel === nivel;
    return matchSearch && matchLevel;
  });

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><span className="text-4xl">🧵</span></div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-1 py-1 animate-fade-in">
      <PageHeader
        title="Patrones gratis"
        subtitle="Descargá patrones en PDF para coser en casa, paso a paso"
      />

      {/* Filtro por nivel + buscador */}
      <div className="max-w-6xl mx-auto px-1 mt-6 mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-wrap gap-3">
          {niveles.map(n => (
            <button
              key={n}
              onClick={() => setNivel(n)}
              className={`btn text-sm tracking-wide transition-all duration-300 shadow-sm ${
                nivel === n
                  ? 'btn-primary shadow-md scale-105'
                  : 'btn-ghost border border-primary/30 hover:border-primary'
              }`}
            >
              {n}
            </button>
          ))}
        </div>

        {/* Buscador */}
        <div className="relative w-full md:w-72">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar patrón..."
            className="w-full pl-10 pr-4 py-2 text-sm border-2 border-primary/40 hover:border-primary/70 rounded-full focus:outline-none focus:ring-2 focus:ring-primary bg-white text-gray-700 placeholder-gray-400 shadow-sm transition-all duration-300"
          />
        </div>
      </div>

      {/* Galería de patrones */}
      <div className="max-w-6xl mx-auto px-1 pb-16">
        {filtered.length === 0 ? (
          <div className="text-center py-16 card-glow rounded-2xl">
            <FileText className="w-12 h-12 text-primary mx-auto" strokeWidth={1.5} />
            <h2 className="font-display font-bold text-text-ink text-2xl mt-4">
              {search ? 'No encontramos patrones con esa búsqueda.' : 'Todavía no hay patrones de ese nivel.'}
            </h2>
            {search && (
              <button onClick={() => setSearch('')} className="btn btn-ghost mt-3 text-sm text-primary hover:text-primary-hover">
                Limpiar búsqueda
              </button>
            )}
          </div>
        ) : (
          <>
            <p className="text-text-muted text-sm mb-6 font-medium pl-1">
              {filtered.length} patrón{filtered.length !== 1 ? 'es' : ''} disponible{filtered.length !== 1 ? 's' : ''}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filtered.map((p, index) => (
                <div key={p.id} className={`animate-stagger delay-${(index % 6) + 1}`}>
                  <div className="card-glow rounded-2xl p-6 h-full flex flex-col">
                    {/* Vista previa: imagen de portada o bloque de color con ícono */}
                    <div className="rounded-xl h-36 overflow-hidden mb-4">
                      {p.imagen ? (
                        <img src={getImageUrl(p.imagen)} alt={p.titulo} className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        <div className={`${index % 2 === 0 ? 'bg-primary-soft' : 'bg-accent-soft'} w-full h-full flex items-center justify-center`}>
                          <svg className="w-12 h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary-soft text-primary">{p.nivel}</span>
                      <span className="text-xs text-text-muted">{p.categoria}</span>
                    </div>

                    <h3 className="font-body text-text-ink text-lg font-bold mb-2 leading-tight">{p.titulo}</h3>
                    <p className="text-text-ink text-sm leading-relaxed mb-4 flex-1">{p.descripcion}</p>

                    <a
                      href={p.archivo.startsWith('/uploads/') ? getImageUrl(p.archivo) : p.archivo}
                      download
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-primary w-full text-sm"
                    >
                      Descargar PDF
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}