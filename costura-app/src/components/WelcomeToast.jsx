import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

// Ventana de bienvenida: aparece centrada en la pantalla al entrar al dashboard
// y se desvanece sola a los pocos segundos. No bloquea la interacción.
// Se renderiza con portal a document.body para que ningún transform de un
// ancestro rompa el posicionamiento fixed.
export default function WelcomeToast({ message }) {
  // Solo se muestra cuando se acaba de iniciar sesión (flag seteado por
  // AuthContext en login/register). Se consume al mostrarse, así navegar
  // entre paneles y volver al dashboard no la vuelve a disparar.
  const [show, setShow] = useState(() => sessionStorage.getItem('costura_welcome') === '1');
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (!show) return;
    sessionStorage.removeItem('costura_welcome');

    const fadeTimer = setTimeout(() => setFading(true), 1500);
    const removeTimer = setTimeout(() => setShow(false), 1900);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, [show]);

  if (!show) return null;

  return createPortal(
    <div className={`fixed inset-0 z-[70] grid place-items-center pointer-events-none transition-opacity duration-500 ${fading ? 'opacity-0' : 'opacity-100'}`}>
      <div className="absolute inset-0 backdrop-blur-[2px]" />
      <div className="relative bg-white rounded-2xl border-2 border-primary shadow-2xl px-10 py-8 text-center max-w-sm mx-4 animate-fade-in">
        <p className="font-display text-2xl font-bold text-text-ink">{message}</p>
      </div>
    </div>,
    document.body
  );
}