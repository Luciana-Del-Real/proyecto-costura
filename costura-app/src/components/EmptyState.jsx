import { Link } from 'react-router-dom';

// Shared empty state used across public pages, admin lists, dropdowns and
// small in-card areas. Four layouts, one look:
//   - `card`    (default) a flat card for a whole page/list area. Keep it as a
//               top-level element so it never nests inside another box.
//   - `plain`   a centred block with no card surface (page areas already boxed
//               by their own container).
//   - `compact` a tight centred block for inside an already-boxed surface
//               (e.g. a card-flat section): no card, spacing via flex gap, and
//               a smaller icon so it never nests another box (depth rule).
//   - `inline`  a single small paragraph row (dropdowns, modals, in-card areas).
//
// `action` is `{ label, to }` (router Link) or `{ label, onClick }` (button),
// with an optional `variant: 'ghost'` for the "Limpiar…" secondary actions.
// `tone` switches the description colour: 'ink' (default) or 'accent'.
function renderAction(action) {
  if (!action) return null;
  const className = action.variant === 'ghost'
    ? 'btn btn-ghost text-sm text-primary'
    : 'btn btn-primary font-medium';
  return action.to
    ? <Link to={action.to} className={className}>{action.label}</Link>
    : <button type="button" onClick={action.onClick} className={className}>{action.label}</button>;
}

export default function EmptyState({ icon: Icon, title, description, action, variant = 'card', tone = 'ink' }) {
  if (variant === 'inline') {
    return <p className={`text-sm ${tone === 'accent' ? 'text-accent' : 'text-text-ink'}`}>{description || title}</p>;
  }

  const compact = variant === 'compact';
  const wrapper = variant === 'card'
    ? 'text-center py-16 card-flat rounded-2xl'
    : compact
      ? 'flex flex-col items-center text-center gap-3 py-6'
      : 'text-center py-20';

  return (
    <div className={wrapper}>
      {Icon && (
        <Icon
          className={`${compact ? 'w-10 h-10' : 'w-12 h-12'} text-primary mx-auto`}
          strokeWidth={1.5}
          aria-hidden="true"
        />
      )}
      <h2 className={`font-display font-bold text-text-ink text-2xl${compact ? '' : ' mt-4'}`}>{title}</h2>
      {description && (
        <p className={`text-sm${compact ? '' : ' mt-2'} ${tone === 'accent' ? 'text-accent' : 'text-text-ink'}`}>{description}</p>
      )}
      {action && <div className={compact ? '' : 'mt-3'}>{renderAction(action)}</div>}
    </div>
  );
}
