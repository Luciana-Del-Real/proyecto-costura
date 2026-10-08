import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

// Shared error state used across pages, form banners and inline rows.
//   - `card`   (default) centred icon + title + description (page-level error).
//   - `banner` a danger-token alert box (form feedback).
//   - `inline` a single small danger paragraph (in-card areas).
//
// `action` is `{ label, to }` (router Link) or `{ label, onClick }` (button),
// with an optional `variant: 'ghost'` for secondary actions.
function renderAction(action) {
  if (!action) return null;
  const className = action.variant === 'ghost'
    ? 'btn btn-ghost text-sm text-primary'
    : 'btn btn-primary font-medium';
  return action.to
    ? <Link to={action.to} className={className}>{action.label}</Link>
    : <button type="button" onClick={action.onClick} className={className}>{action.label}</button>;
}

export default function ErrorState({ icon, title, description, action, variant = 'card' }) {
  const Icon = icon || AlertTriangle;

  if (variant === 'inline') {
    return <p className="text-sm text-danger">{description || title}</p>;
  }

  if (variant === 'banner') {
    return (
      <div role="alert" className="flex items-start gap-2 rounded-xl border px-4 py-3 text-sm bg-danger/10 border-danger/30 text-danger">
        {Icon && <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" strokeWidth={1.5} aria-hidden="true" />}
        <span className="min-w-0">{description || title}</span>
      </div>
    );
  }

  return (
    <div className="text-center py-16 card-flat rounded-2xl">
      {Icon && <Icon className="w-12 h-12 text-primary mx-auto" strokeWidth={1.5} aria-hidden="true" />}
      <h2 className="font-display font-bold text-text-ink text-2xl mt-4">{title}</h2>
      {description && <p className="text-sm text-text-ink mt-2">{description}</p>}
      {action && <div className="mt-3">{renderAction(action)}</div>}
    </div>
  );
}
