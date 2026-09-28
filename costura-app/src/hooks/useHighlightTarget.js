import { useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';

// Al llegar desde una notificación (link con ?highlight=<id> o #<id>),
// scrollea hasta el elemento con ese id y lo marca en gris unos segundos
// (clase .highlight-gray). Luego limpia el query/hash para no repetirlo.
export default function useHighlightTarget() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const target = searchParams.get('highlight') || location.hash.replace(/^#/, '') || null;

  useEffect(() => {
    if (!target) return undefined;
    const timer = setTimeout(() => {
      const el = document.getElementById(target);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('highlight-gray');
        setTimeout(() => el.classList.remove('highlight-gray'), 3000);
      }
      setSearchParams({}, { replace: true });
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }, 150);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);
}