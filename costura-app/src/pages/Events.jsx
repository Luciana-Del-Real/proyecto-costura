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
        className="card-glow-soft relative overflow-hidden flex flex-col @container h-full min-h-[300px] md:min-h-[480px] rounded-3xl bg-white @min-[320px]:flex-row @min-[320px]:items-stretch"
      >
        {/* Celular (2 cards por fila): la imagen va ARRIBA a todo el ancho y el
            contenido debajo, así la card queda más alta que ancha. Desde sm
            (640px) pasa a mitad izquierda a todo el alto, como en desktop.
            El wrapper es un div (se estira como flex item) y la imagen va
            absoluta adentro: un <img> con self-stretch no siempre se estira. */}
        <div className="relative w-full h-40 lg:w-1/2 lg:h-auto lg:shrink-0">
          <img
            src={getImageUrl(event.image)}
            alt={event.title || 'Evento'}
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
        {/* Contenido: título (alineado a la derecha), bajada, características
            centradas y botón centrado en su lado. */}
        <div className="flex flex-col p-4 lg:p-6 text-center flex-1 min-w-0">
          <h3 className="font-display uppercase leading-none text-center lg:text-right break-words">
            <span className="text-event-pink block text-2xl lg:text-4xl font-bold">{first}</span>
            <span className="text-event-green-deep block text-base lg:text-2xl font-normal">{second}</span>
          </h3>

          {event.subtitle && (
            <p className="font-body text-[11px] lg:text-sm text-event-rose-deep mt-1 lg:mt-2 leading-relaxed">{event.subtitle}</p>
          )}

          {features.length > 0 && (
            <div className="flex-1 flex flex-col justify-center space-y-2 lg:space-y-4 mt-4">
              {features.map((f) => (
                <p key={f} className="font-body text-[11px] lg:text-sm text-text-ink leading-snug">{f}</p>
              ))}
            </div>
          )}

          {/* Botón CONSULTAR: píldora rosa centrada en su mitad (igual que la
              descripción) y con ancho tope para que nunca toque los bordes de
              la card. mt-auto lo empuja al fondo para que todas las cards de la
              fila queden a la misma altura. */}
          <div className="mt-auto pt-3 md:pt-5 flex justify-center">
            <a
              href={whatsappUrl(event)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center max-w-full bg-event-pink hover:bg-event-pink-hover text-white font-bold text-[11px] lg:text-sm uppercase tracking-wide rounded-full px-3 lg:px-6 py-2 lg:py-2.5 transition-colors"
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
      className="flex flex-col items-center h-full text-center rounded-3xl border p-4 sm:p-6 md:p-8"
    >
      {/* Título principal: 1ra línea rosa (más grande y en negrita), 2da
          verde oscuro (más chica y sin negrita). Bebas = font-display,
          coherente con el resto de la página. En celular baja un escalón
          porque con 2 cards por fila el ancho es la mitad. */}
      <h3 className="font-display uppercase leading-none break-words">
        <span className="text-event-pink block text-2xl sm:text-4xl md:text-5xl font-bold">{first}</span>
        <span className="text-event-green-deep block text-base sm:text-2xl md:text-3xl font-normal">{second}</span>
      </h3>

      {/* Bajada: texto corto centrado en rosa (Montserrat = font-body) */}
      {event.subtitle && (
        <p className="font-body text-sm md:text-base text-event-rose-deep mt-2 leading-relaxed">{event.subtitle}</p>
      )}

      {/* Detalles: líneas independientes sin viñetas, separadas por space-y-2 */}
      {features.length > 0 && (
        <div className="space-y-2 mt-4">
          {features.map((f) => (
            <p key={f} className="font-body text-sm text-text-ink leading-snug">{f}</p>
          ))}
        </div>
      )}

      {/* Botón CONSULTAR: píldora rosa centrada, empujado al fondo (mt-auto)
          para que todos los folletos de la misma fila queden a la misma altura.
          En celular achica padding y texto: con 2 cards por fila el ancho es
          la mitad y el botón no debe tocar los bordes. */}
      <div className="mt-auto pt-6 flex justify-center w-full">
        <a
          href={whatsappUrl(event)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center max-w-full bg-event-pink hover:bg-event-pink-hover text-white font-bold text-[11px] sm:text-sm uppercase tracking-wide rounded-full px-5 sm:px-10 py-2.5 sm:py-3 transition-colors"
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
            2 en tablet Y en celular (en celular la card se apila: imagen
            arriba, contenido abajo) */}
        {!loading && !error && events.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
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