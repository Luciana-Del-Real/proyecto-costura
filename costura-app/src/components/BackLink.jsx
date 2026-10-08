import { Link } from 'react-router-dom';

// Shared "back" link: the primary-coloured ← Volver link with the unified
// spacing used at the top of detail, checkout and admin form pages. Callers
// pass their own copy as children (e.g. "← Volver a mis cursos").
export default function BackLink({ to, children = '← Volver', className = '' }) {
  return (
    <Link to={to} className={`text-primary text-sm hover:text-primary-hover inline-flex items-center gap-1 mb-4 ${className}`}>
      {children}
    </Link>
  );
}