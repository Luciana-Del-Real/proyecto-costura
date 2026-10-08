// Shared loading indicator: the centred "hilo" (🧵) with a subtle pulse.
//
// Three sizes by context:
//   - `page`    whole-route / provider gates (min-h-screen, optional label).
//   - `section` a page area or list that is loading (py-24 block).
//   - `inline`  dropdowns, modal bodies and small in-card areas (text row).
//
// `emoji` defaults to 🧵 so every loader looks the same across the app.
export default function LoadingState({ size = 'section', label, emoji = '🧵' }) {
  const a11y = { role: 'status', 'aria-live': 'polite', 'aria-label': 'Cargando' };

  if (size === 'inline') {
    return (
      <div className="py-3 flex items-center justify-center text-sm text-accent" {...a11y}>
        {label || 'Cargando...'}
      </div>
    );
  }

  if (size === 'page') {
    return (
      <div className="min-h-screen flex items-center justify-center" {...a11y}>
        <div className="text-center">
          <span className="text-4xl animate-pulse" aria-hidden="true">{emoji}</span>
          {label && <p className="text-text-ink mt-3">{label}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-24 animate-fade-in" {...a11y}>
      <span className="text-4xl animate-pulse" aria-hidden="true">{emoji}</span>
    </div>
  );
}
