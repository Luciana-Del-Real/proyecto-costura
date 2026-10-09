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

// Folleto de evento: flota sobre un fondo pastel propio con borde suave,
// todo centrado. Si el evento tiene imagen, esa imagen es el fondo completo
// de la tarjeta (difuminada y con una capa blanca suave encima para que el
// texto siga siendo 100% legible); sin imagen queda la paleta pastel de
// siempre. Título bicolor en dos líneas, bajada en rosa, detalles como
// líneas independientes SIN viñetas y botón píldora rosa.
function EventCard({ event, variant }) {
  const { first, second } = splitTitle(event.title || '');
  const features = toFeatures(event.detail || '');

  return (
    <div
      style={{ backgroundColor: variant.bg, borderColor: variant.border }}
      className="relative overflow-hidden flex flex-col items-center h-full text-center rounded-3xl border p-6 md:p-8"
    >
      {event.image && (
        <>
          {/* Imagen de fondo: cubre toda la tarjeta, difuminada y levemente
              ampliada (scale-110) para que el blur no deje bordes visibles.
              aria-hidden: es decorativa, el contenido real es el texto. */}
          <img
            src={getImageUrl(event.image)}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover blur scale-110"
          />
          {/* Capa suave blanca: garantiza contraste para el texto sin tapar
              del todo la imagen (queda "difuminada pero notable"). */}
          <div aria-hidden="true" className="absolute inset-0 bg-white/50" />
        </>
      )}

      <div className="relative z-10 flex flex-col items-center w-full h-full">
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