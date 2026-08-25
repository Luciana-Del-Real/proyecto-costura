import { useEffect, useRef, useState } from 'react';

export function useInView(options = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  // Acepta un número (threshold directo, ej. useInView(0.2)) o un objeto de
  // opciones. Se dependen primitivas, no el objeto, para no recrear el
  // observer en cada render (el default {} sería nuevo en cada render).
  const opts = typeof options === 'number' ? { threshold: options } : options;
  const { threshold = 0.15, once = true, rootMargin } = opts;

  useEffect(() => {
    // SSR guard: IntersectionObserver solo existe en el navegador.
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (once) observer.disconnect();
        }
      },
      { threshold, rootMargin }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, once, rootMargin]);

  return [ref, inView];
}