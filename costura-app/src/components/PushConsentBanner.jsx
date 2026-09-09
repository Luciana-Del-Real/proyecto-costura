import { createPortal } from 'react-dom';

/**
 * Banner de consentimiento de notificaciones push (spec pwa-installability,
 * "Gesture-Wired Consent and Subscribe"). Se renderiza SOLO cuando el provider
 * lo pide (usuario con sesión y permiso en 'default' no descartado); el botón
 * "Activar" es el gesto que dispara requestPermission, porque los navegadores
 * rechazan los pedidos de permiso que no nacen de un gesto del usuario.
 * Componente controlado: toda la lógica vive en PushProvider.
 *
 * Strings en español (registro neutro), exactas a la spec "Spanish Consent and
 * Install UI Copy".
 */
export default function PushConsentBanner({ open, busy, onEnable, onDismiss }) {
  if (!open) return null;

  return createPortal(
    <div
      data-testid="push-consent-banner"
      className="fixed inset-x-0 bottom-4 z-[70] flex justify-center px-4 pointer-events-none"
      role="region"
      aria-live="polite"
    >
      <div className="pointer-events-auto w-full max-w-md rounded-2xl border border-border bg-white p-5 shadow-[0_8px_30px_rgba(29,29,27,0.12)] animate-fade-in">
        <p className="font-display text-lg font-bold text-text-ink">Activa las notificaciones</p>
        <p className="mt-1 text-sm text-text-ink">
          Recibe avisos de respuestas, compras y novedades incluso sin estar en la página.
        </p>
        <p className="mt-2 text-xs text-text-ink/70">
          Instala la aplicación en tu pantalla de inicio para recibir notificaciones.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            data-testid="push-consent-dismiss"
            onClick={onDismiss}
            disabled={busy}
            className="btn btn-ghost text-sm"
          >
            Ahora no
          </button>
          <button
            type="button"
            data-testid="push-consent-accept"
            onClick={onEnable}
            disabled={busy}
            className="btn btn-primary text-sm font-semibold"
          >
            Activar
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
