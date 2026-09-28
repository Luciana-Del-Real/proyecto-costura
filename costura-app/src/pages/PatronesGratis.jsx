import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { get } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getImageUrl } from '../utils/media';
import PageHeader from '../components/PageHeader';

export default function PatronesGratis() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [patrones, setPatrones] = useState([]);
  const [loading, setLoading] = useState(true);
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
    return matchSearch;
  });

  // Compra del patrón de pago: lleva al checkout (formulario de transferencia
  // según la moneda), igual que los cursos. Sin sesión pide login.
  const handleBuy = (p) => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate(`/checkout-patron/${p.id}`);
  };

  // Mensaje de comprobante por WhatsApp (igual que el checkout de cursos).
  const waComprobanteUrl = (p) => {
    const userIdentifier = user?.name || user?.email || 'mi usuario';
    const message = `¡Hola! Acabo de abonar el patrón "${p.titulo}". Mi usuario es ${userIdentifier}. ¡Les paso mi comprobante!`;
    return `https://wa.me/5493447404952?text=${encodeURIComponent(message)}`;
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><span className="text-4xl">🧵</span></div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-1 py-1 animate-fade-in">
      <PageHeader
        title="Patrones"
        subtitle="Descargá patrones en PDF para coser en casa, paso a paso"
      />

      {/* Buscador */}
      <div className="max-w-6xl mx-auto px-1 mt-6 mb-8 flex justify-end">
        <div className="relative w-full md:w-72">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar patrón..."
            className="w-full pl-10 pr-4 py-2 text-sm border-2 border-gray-300 hover:border-gray-400 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white text-gray-700 placeholder-gray-400 shadow-sm transition-all duration-300"
          />
        </div>
      </div>

      {/* Galería de patrones */}
      <div className="max-w-6xl mx-auto px-1 pb-16">
        {filtered.length === 0 ? (
          <div className="text-center py-16 card-flat rounded-2xl">
            <FileText className="w-12 h-12 text-primary mx-auto" strokeWidth={1.5} />
            <h2 className="font-display font-bold text-text-ink text-2xl mt-4">
              {search ? 'No encontramos patrones con esa búsqueda.' : 'Todavía no hay patrones de ese nivel.'}
            </h2>
            {search && (
              <button onClick={() => setSearch('')} className="btn btn-ghost mt-3 text-sm bg-white hover:bg-white text-primary border border-primary/30 hover:border-primary">
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

                    {/* Etiqueta Gratis/De pago */}
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {p.esPago ? (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-success/10 text-success">De pago</span>
                      ) : (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary-soft text-primary">Gratis</span>
                      )}
                    </div>

                    <h3 className="font-body text-text-ink text-lg font-bold mb-2 leading-tight">{p.titulo}</h3>
                    <p className="text-text-ink text-sm leading-relaxed mb-4 flex-1">{p.descripcion}</p>

                    {/* Acción según el tipo de patrón y el estado de la alumna */}
                    {(() => {
                      // Gratis o compra aprobada (o admin): descarga libre.
                      if (!p.esPago || p.hasAccess) {
                        return p.archivo ? (
                          <a
                            href={p.archivo.startsWith('/uploads/') ? getImageUrl(p.archivo) : p.archivo}
                            download
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-primary w-full text-sm"
                          >
                            Descargar PDF
                          </a>
                        ) : (
                          <span className="btn w-full text-sm bg-stone-200 text-stone-500 cursor-not-allowed" aria-disabled="true">
                            PDF en preparación
                          </span>
                        );
                      }

                      // Patrón de pago con solicitud pendiente.
                      if (p.purchaseStatus === 'PENDING') {
                        return (
                          <div className="space-y-2">
                            <div className="text-center">
                              <p className="text-xs font-bold text-primary">Solicitud enviada</p>
                              <p className="text-xs text-text-muted mt-1">
                                Tu pago está en revisión. Te notificamos cuando se confirme.
                              </p>
                            </div>
                            {user?.country !== 'AUD' && (
                              <a
                                href={waComprobanteUrl(p)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-primary w-full text-sm font-semibold"
                              >
                                Enviar comprobante por WhatsApp
                              </a>
                            )}
                          </div>
                        );
                      }

                      // Patrón de pago sin compra: precio + botón Comprar que
                      // lleva al formulario de transferencia (como los cursos).
                      return (
                        <div className="space-y-2">
                          {user ? (
                            <p className="text-center text-lg font-bold text-text-ink">
                              ${(user.country === 'AUD' ? p.precioAUD : p.precioARS).toLocaleString()} {user.country === 'AUD' ? 'AUD' : 'ARS'}
                            </p>
                          ) : (
                            <div className="flex items-center justify-center gap-3 text-center">
                              <p className="text-lg font-bold text-text-ink">${p.precioARS.toLocaleString()} ARS</p>
                              <span className="text-text-muted">·</span>
                              <p className="text-lg font-bold text-text-ink">${p.precioAUD.toLocaleString()} AUD</p>
                            </div>
                          )}
                          <button
                            onClick={() => handleBuy(p)}
                            className="btn btn-primary w-full text-sm font-semibold"
                          >
                            {user ? 'Comprar' : 'Iniciar sesión para comprar'}
                          </button>
                        </div>
                      );
                    })()}

                    {p.attachments?.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {p.attachments.map(att => (
                          <a
                            key={att.id}
                            href={getImageUrl(att.url)}
                            download
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-primary underline block truncate"
                          >
                            {att.filename}
                          </a>
                        ))}
                      </div>
                    )}
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