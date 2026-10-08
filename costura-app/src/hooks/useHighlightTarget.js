import { useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';

// Al llegar desde una notificación (link con ?highlight=<id> o #<id>),
// scrollea hasta el elemento con ese id y lo marca en gris unos segundos
// (clase .highlight-gray). Luego limpia el query/hash para no repetirlo.
//
// El destino suele renderizarse DESPUÉS del montaje (listas que cargan async),
// así que reintenta buscar el elemento por un rato acotado en vez de rendirse
// al primer intento.
export default function useHighlightTarget() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const target = searchParams.get('highlight') || location.hash.replace(/^#/, '') || null;

  useEffect(() => {
    if (!target) return undefined;
    let attempts = 0;
    let timer;

    const attempt = () => {
      const el = document.getElementById(target);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('highlight-gray');
        setTimeout(() => el.classList.remove('highlight-gray'), 3000);
        setSearchParams({}, { replace: true });
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
        return;
      }
      attempts += 1;
      if (attempts < 20) timer = setTimeout(attempt, 150);
    };

    timer = setTimeout(attempt, 150);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);
}
