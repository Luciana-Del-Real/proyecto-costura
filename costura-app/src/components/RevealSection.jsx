import { useInView } from '../hooks/useInView';

export default function RevealSection({ children, className = '', animation = 'reveal', delay = '' }) {
  const [ref, inView] = useInView();
  return (
    <div ref={ref} className={`${animation} ${delay} ${inView ? 'visible' : ''} ${className}`}>
      {children}
    </div>
  );
}
