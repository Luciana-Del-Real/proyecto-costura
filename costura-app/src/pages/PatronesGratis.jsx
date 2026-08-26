import { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
import { get } from '../services/api';
import { getImageUrl } from '../utils/media';

const niveles = ['Todos', 'Principiante', 'Intermedio', 'Avanzado'];

export default function PatronesGratis() {
  const [patrones, setPatrones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nivel, setNivel] = useState('Todos');

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

  const filtered = nivel === 'Todos'
    ? patrones
    : patrones.filter(p => p.nivel === nivel);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><span className="text-4xl">🧵</span></div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-1 py-1 animate-fade-in">
      {/* Banner principal */}
      <div className="bg-white rounded-2xl border-2 border-primary shadow-md px-4 py-10 animate-fade-up mt-5 mb-5">
        <div className="max-w-6xl mx-auto">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-text-ink mb-2">Patrones gratis</h1>
          <p className="text-text-muted">Descargá patrones en PDF para coser en casa, paso a paso</p>
        </div>
      </div>

      {/* Filtro por nivel */}
      <div className="max-w-6xl mx-auto px-1 mt-6 mb-8 flex flex-wrap gap-3">
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

      {/* Galería de patrones */}
      <div className="max-w-6xl mx-auto px-1 pb-16">
        {filtered.length === 0 ? (
          <div className="text-center py-16 card-glow rounded-2xl">
            <FileText className="w-12 h-12 text-primary mx-auto" strokeWidth={1.5} />
            <h2 className="font-display font-bold text-text-ink text-2xl mt-4">Todavía no hay patrones de ese nivel.</h2>
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