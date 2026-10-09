import { useEffect, useState } from 'react';
import { CalendarHeart } from 'lucide-react';
import { listPublicEvents } from '../services/api';
import { getImageUrl } from '../utils/media';
import PageHeader from '../components/PageHeader';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';

// Número de WhatsApp del estudio (el mismo que figura en el Footer:
// +61 401 956 520 → wa.me/61401956520). Si las consultas de eventos van a
// otro número, cambiarlo SOLO acá.
const WHATSAPP_NUMBER = '61401956520';

// Enlace directo a WhatsApp con el mensaje pre-cargado del evento. Si el
// evento no tiene mensaje propio, se arma uno por defecto con el nombre del
// evento; si tampoco tiene nombre, uno genérico.
function whatsappUrl(event) {
  const message = event.waMessage?.trim()
    || (event.title ? `Hola, quiero consultar sobre ${event.title}` : 'Hola, quiero consultar sobre este evento');
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

// Divide el título en dos líneas: la PRIMERA palabra en la línea 1 (rosa) y
// el resto en la línea 2 (verde). Ej: "Clase Personalizada" → "Clase" |
// "Personalizada"; "Club de Bordado" → "Club" | "de Bordado".
function splitTitle(title) {
  const words = title.trim().split(/\s+/).filter(Boolean);
  return {
    first: words[0] || '',
    second: words.slice(1).join(' '),
  };
}

// Convierte el detalle del evento en líneas de texto: separa por " + " y por
// puntos. Ej: "Materiales + brunch + guías paso a paso." → 3 líneas.
function toFeatures(detail) {
  return detail
    .split(/\s*\+\s*|\.\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

// Paleta de fondos suaves + bordes para diferenciar cada folleto. Rota por
// posición en la grilla: cada evento tiene su propio tono (rosa, verde,
// crema, lila, durazno, celeste).
const FLYER_VARIANTS = [
  { bg: 'var(--color-event-rose)', border: 'var(--color-event-rose-border)' }, // rosa
  { bg: 'var(--color-event-green)', border: 'var(--color-event-green-border)' }, // verde
  { bg: 'var(--color-event-cream)', border: 'var(--color-event-cream-border)' }, // crema
  { bg: 'var(--color-event-lilac)', border: 'var(--color-event-lilac-border)' }, // lila
  { bg: 'var(--color-event-peach)', border: 'var(--color-event-peach-border)' }, // durazno
  { bg: 'var(--color-event-sky)', border: 'var(--color-event-sky-border)' }, // celeste
];

// Card de evento en dos formas:
// - CON imagen: dos columnas — la imagen real y nítida a la izquierda (ocupa
//   todo el alto) y la información a la derecha con el botón de consultar.
// - SIN imagen: folleto pastel centrado de siempre (paleta del evento).
// En ambos casos: título bicolor en dos líneas, bajada en rosa, detalles
// como líneas independientes SIN viñetas y botón píldora rosa.
function EventCard({ event, variant }) {
  const { first, second } = splitTitle(event.title || '');
  const features = toFeatures(event.detail || '');

  if (event.image) {
    return (
      <div
        style={{ borderColor: variant.border }}
        className="relative overflow-hidden flex items-stretch h-full min-h-[360px] md:min-h-[480px] rounded-3xl border bg-white"
      >
        <img
          src={getImageUrl(event.image)}
          alt={event.title || 'Evento'}
          className="w-1/2 shrink-0 self-stretch object-cover"
        />
        <div className="flex flex-col p-5 md:p-6 text-center flex-1 min-w-0">
          <h3 className="font-display uppercase leading-none text-right">
            <span className="text-event-pink block text-3xl md:text-4xl font-bold">{first}</span>
            <span className="text-event-green-deep block text-xl md:text-2xl font-normal">{second}</span>
          </h3>

          {event.subtitle && (
            <p className="font-body text-xs md:text-sm text-event-rose-deep mt-2 leading-relaxed">{event.subtitle}</p>
          )}

          {features.length > 0 && (
            <div className="flex-1 flex flex-col justify-between py-3">
              {features.map((f) => (
                <p key={f} className="font-body text-xs md:text-sm text-text-ink leading-snug">{f}</p>
              ))}
            </div>
          )}

          {/* Botón CONSULTAR: píldora rosa, empujado al fondo (mt-auto) para
              que todas las cards de la fila queden a la misma altura */}
          <div className="mt-auto pt-5">
            <a
              href={whatsappUrl(event)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center bg-event-pink hover:bg-event-pink-hover text-white font-bold text-sm uppercase tracking-wide rounded-full px-6 py-2.5 transition-colors"
            >
              Consultar
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{ backgroundColor: variant.bg, borderColor: variant.border }}
      className="flex flex-col items-center h-full text-center rounded-3xl border p-6 md:p-8"
    >
      {/* Título principal: 1ra línea rosa (más grande y en negrita), 2da
          verde oscuro (más chica y sin negrita). Bebas = font-display,
          coherente con el resto de la página. */}
      <h3 className="font-display uppercase leading-none">
        <span className="text-event-pink block text-4xl md:text-5xl font-bold">{first}</span>
        <span className="text-event-green-deep block text-2xl md:text-3xl font-normal">{second}</span>
      </h3>

      {/* Bajada: texto corto centrado en rosa (Montserrat = font-body) */}
      {event.subtitle && (
        <p className="font-body text-sm md:text-base text-event-rose-deep mt-3 leading-relaxed">{event.subtitle}</p>
      )}

      {/* Detalles: líneas independientes sin viñetas, separadas por space-y-2 */}
      {features.length > 0 && (
        <div className="space-y-2 mt-4">
          {features.map((f) => (
            <p key={f} className="font-body text-sm text-text-ink leading-snug">{f}</p>
          ))}
        </div>
      )}

      {/* Botón CONSULTAR: píldora rosa, empujado al fondo (mt-auto) para que
          todos los folletos de la misma fila queden a la misma altura */}
      <div className="mt-auto pt-6">
        <a
          href={whatsappUrl(event)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center bg-event-pink hover:bg-event-pink-hover text-white font-bold text-sm uppercase tracking-wide rounded-full px-10 py-3 transition-colors"
        >
          Consultar
        </a>
      </div>
    </div>
  );
}

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listPublicEvents()
      .then((data) => {
        if (cancelled) return;
        setEvents(data);
        setError(false);
      })
      .catch((err) => {
        console.error('Error cargando eventos:', err);
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="min-h-screen bg-bg-surface">
      <div className="w-full px-4 py-1 animate-fade-in">
        {/* Encabezado idéntico al resto de las páginas (mismo PageHeader) */}
        <PageHeader
          title="Eventos"
          subtitle="Elegí la propuesta que más te guste y consultanos por WhatsApp: te contamos todos los detalles."
        />

        <div className="w-full px-4 mt-6 mb-10">

        {loading && (
          <LoadingState size="section" />
        )}

        {!loading && error && (
          <ErrorState
            icon={CalendarHeart}
            title="No se pudieron cargar los eventos"
            description="Probá de nuevo en un momento."
          />
        )}

        {!loading && !error && events.length === 0 && (
          <EmptyState
            icon={CalendarHeart}
            title="Todavía no hay eventos cargados"
            description="Volvé a visitarnos pronto."
          />
        )}

        {/* Grilla de tarjetas: 4 columnas en desktop ancho, 3 en desktop,
            2 en tablet, 1 en mobile (igual que la grilla de Cursos) */}
        {!loading && !error && events.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {events.map((event, i) => (
              <EventCard
                key={event.id}
                event={event}
                variant={FLYER_VARIANTS[i % FLYER_VARIANTS.length]}
              />
            ))}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}