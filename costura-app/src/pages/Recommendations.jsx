import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { listPublicRecommendations } from '../services/api';
import { getImageUrl } from '../utils/media';
import PageHeader from '../components/PageHeader';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';

// Página pública de recomendaciones: la misma tarjeta de patrones (imagen o
// bloque pastel con ícono, título, descripción y botón "Ver más" que abre el
// enlace externo en otra pestaña).
export default function Recommendations() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listPublicRecommendations()
      .then((data) => {
        if (cancelled) return;
        setRecommendations(data);
        setError(false);
      })
      .catch((err) => {
        console.error('Error cargando recomendaciones:', err);
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="w-full px-4 py-1 animate-fade-in">
      <PageHeader
        title="Recomendaciones"
        subtitle="Lo mejor de Grow, recomendado para vos."
      />

      <div className="w-full px-4 mt-6 mb-10">

        {loading && (
          <LoadingState size="section" />
        )}

        {!loading && error && (
          <ErrorState
            icon={Sparkles}
            title="No se pudieron cargar las recomendaciones"
            description="Probá de nuevo en un momento."
          />
        )}

        {!loading && !error && recommendations.length === 0 && (
          <EmptyState
            icon={Sparkles}
            title="Todavía no hay recomendaciones cargadas"
            description="Volvé a visitarnos pronto."
          />
        )}

        {/* Grilla de tarjetas estilo patrones: 4 columnas en desktop ancho,
            3 en desktop, 2 en tablet, 1 en mobile */}
        {!loading && !error && recommendations.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {recommendations.map((r, index) => (
              <div key={r.id} className={`animate-stagger delay-${(index % 6) + 1}`}>
                <div className="card-glow rounded-2xl p-6 h-full flex flex-col">
                  {/* Vista previa: imagen de portada o bloque de color con ícono */}
                  <div className="rounded-xl h-36 overflow-hidden mb-4">
                    {r.image ? (
                      <img src={getImageUrl(r.image)} alt={r.title} className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <div className={`${index % 2 === 0 ? 'bg-primary-soft' : 'bg-accent-soft'} w-full h-full flex items-center justify-center`}>
                        <Sparkles className="w-12 h-12 text-primary" strokeWidth={1.5} />
                      </div>
                    )}
                  </div>

                  <h3 className="font-body text-text-ink text-lg font-bold mb-2 leading-tight">{r.title}</h3>
                  {r.description && <p className="text-text-ink text-sm leading-relaxed mb-4 flex-1">{r.description}</p>}

                  {/* CTA: abre el enlace externo en otra pestaña, o un botón
                      deshabilitado si la recomendación no tiene link */}
                  {r.link ? (
                    <a
                      href={r.link.match(/^https?:\/\//i) ? r.link : `https://${r.link}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-primary w-full text-sm"
                    >
                      Ver más
                    </a>
                  ) : (
                    <span className="btn w-full text-sm bg-stone-200 text-stone-500 cursor-not-allowed" aria-disabled="true">
                      Sin enlace
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}