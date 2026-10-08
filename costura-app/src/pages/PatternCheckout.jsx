import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, Clock, Copy } from 'lucide-react';
import { get, requestPatternPurchase } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getImageUrl } from '../utils/media';
import LoadingState from '../components/LoadingState';

// Datos de transferencia según el país/moneda de la compradora (mismos que
// el checkout de cursos).
const PAYMENT_INFO = {
  ARS: [
    { key: 'cvu', label: 'CVU / CBU', value: '0000000000000000000000' },
    { key: 'alias', label: 'Alias', value: 'grow.costura' },
    { key: 'accountName', label: 'Nombre de cuenta', value: 'Daiana Belén Lubo' }
  ],
  AUD: [
    { key: 'square', label: 'Link de pago', value: 'https://square.link/u/8DRRqm48', link: true },
  ],
};

export default function PatternCheckout() {
  const { id } = useParams();
  const { user } = useAuth();
  const [pattern, setPattern] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requested, setRequested] = useState(false);
  const [copied, setCopied] = useState('');

  useEffect(() => {
    let cancelled = false;
    get(`/patterns/${id}`)
      .then((data) => { if (!cancelled) setPattern(data); })
      .catch((err) => console.error('Error cargando el patrón:', err))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return <LoadingState size="page" />;
  }

  if (!pattern) {
    return (
      <div className="min-h-screen bg-bg-surface flex items-center justify-center px-4">
        <p className="text-text-ink">Patrón no encontrado.</p>
      </div>
    );
  }

  if (pattern.hasAccess) {
    return (
      <div className="min-h-screen bg-bg-surface flex items-center justify-center px-4">
        <div className="text-center">
          <CheckCircle2 className="w-14 h-14 text-success mx-auto" strokeWidth={1.5} />
          <h2 className="font-display font-bold text-text-ink text-2xl mt-4">Ya tenés este patrón</h2>
          <Link to="/patrones-gratis" className="btn btn-primary mt-4 inline-block">
            Volver a patrones
          </Link>
        </div>
      </div>
    );
  }

  if (pattern.purchaseStatus === 'PENDING' || requested) {
    const userIdentifier = user?.name || user?.email || 'mi usuario';
    const whatsappMessage = `¡Hola! Acabo de abonar el patrón "${pattern.titulo}". Mi usuario es ${userIdentifier}. ¡Les paso mi comprobante!`;
    const whatsappUrl = `https://wa.me/5493447404952?text=${encodeURIComponent(whatsappMessage)}`;

    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-surface px-4">
        <div className="text-center card-flat p-8 rounded-2xl max-w-md w-full">
          <Clock className="w-14 h-14 text-primary mx-auto mb-4" strokeWidth={1.5} />
          <h2 className="font-display text-2xl font-bold text-text-ink mb-3">Solicitud de compra enviada</h2>
          <p className="text-text-ink mb-6">
            {user?.country === 'AUD'
              ? 'Tu pago está en revisión por el admin. Te notificaremos cuando se confirme.'
              : 'Tu comprobante está en revisión por el admin. Te notificaremos cuando se confirme.'}
          </p>

          {user?.country !== 'AUD' && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary w-full font-semibold mb-3"
            >
              Enviar comprobante por WhatsApp
            </a>
          )}

          <Link to="/patrones-gratis" className="block text-primary text-sm hover:text-primary-hover transition-colors mt-2 text-center">
            Volver a patrones
          </Link>
        </div>
      </div>
    );
  }

  const handleRequest = async () => {
    try {
      await requestPatternPurchase(pattern.id);
      setRequested(true);
    } catch (err) {
      console.error('Error al solicitar el patrón:', err);
    }
  };

  const moneda = user?.country === 'AUD' ? 'AUD' : 'ARS';
  const precio = moneda === 'AUD' ? pattern.precioAUD : pattern.precioARS;

  return (
    <div className="min-h-screen bg-bg-surface py-10 px-4">
      <div className="w-full">
        <Link to="/patrones-gratis" className="text-primary text-sm hover:text-primary-hover mb-6 inline-block">← Volver a patrones</Link>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="card-glow p-6 h-fit">
            <h2 className="font-display font-bold text-text-ink text-2xl mb-4">Resumen del pedido</h2>
            <img src={getImageUrl(pattern.imagen)} alt={pattern.titulo} className="w-full h-40 object-cover rounded-xl mb-4" />
            <h3 className="font-body text-text-ink text-lg font-bold mb-1.5 leading-snug line-clamp-1">{pattern.titulo}</h3>
            <p className="text-text-ink text-sm mb-4">{pattern.descripcion}</p>
            <div className="border-t border-border pt-4 flex justify-between items-center">
              <span className="text-text-ink font-medium">Total</span>
              <span className="text-2xl font-bold text-text-ink">${precio.toLocaleString()}</span>
            </div>
          </div>

          <div className="p-6">
            <h2 className="font-display font-bold text-text-ink text-2xl mb-4">Instrucciones de pago</h2>

            <div className="mb-4 text-sm text-text-ink">
              <p className="mb-3"><strong>1) Transferí a la cuenta:</strong></p>

              <div className="mb-4">
                {PAYMENT_INFO[moneda].map((field) => (
                  field.link ? (
                    <div key={field.key} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                      <div className="min-w-0">
                        <span className="text-xs text-text-tan block mb-0.5">{field.label}</span>
                        <span className="text-text-ink font-semibold truncate block">{field.value}</span>
                      </div>
                      <a
                        href={field.value}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-primary text-xs flex-shrink-0 ml-3"
                      >
                        Ir al pago
                      </a>
                    </div>
                  ) : (
                    <div key={field.key} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                      <div className="min-w-0">
                        <span className="text-xs text-text-tan block mb-0.5">{field.label}</span>
                        <span className="font-mono text-text-ink font-semibold truncate block">{field.value}</span>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(field.value);
                          setCopied(field.key);
                          setTimeout(() => setCopied(''), 2000);
                        }}
                        className="btn btn-ghost text-xs text-primary hover:text-primary-hover"
                      >
                        {copied === field.key ? '¡Copiado!' : <span className="flex items-center gap-1"><Copy className="w-3.5 h-3.5" strokeWidth={1.5} /> Copiar</span>}
                      </button>
                    </div>
                  )
                ))}
              </div>

              <p className="mt-6"><strong>2) Hacé clic en "Solicitar acceso"</strong> debajo para registrar tu pedido en la plataforma.</p>
            </div>

            <button
              onClick={handleRequest}
              className="btn btn-primary w-full font-semibold"
            >
              Solicitar acceso
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}