import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

// One shared centered modal (WU4): overlay + panel with a header (title,
// optional subtitle, close button), a scrollable body and an optional footer
// slot. Portals straight into <body> so no ancestor `transform`/`overflow`
// breaks the fixed positioning, and uses a single z-index scale: drawers /
// toasts / banners live below (z-50 / z-70) and the modal defaults to z-100.
// The fuchsia accent bar is part of the panel identity (every migrated modal
// carried it), so it is baked in rather than repeated per caller.
const sizes = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
};

export default function Modal({ open, onClose, title, subtitle, children, footer, size = 'md', zIndex = 100 }) {
  const closeRef = useRef(null);

  // Esc closes the modal (window listener so it also works while focus is
  // anywhere in the page, not only inside the panel).
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Basic focus management: move focus to the close button on open.
  useEffect(() => {
    if (open) closeRef.current?.focus();
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 animate-fade-in" style={{ zIndex }} role="dialog" aria-modal="true" aria-label={title}>
      {/* Overlay: click on the backdrop closes the modal */}
      <div className="absolute inset-0 bg-black/40" aria-hidden="true" onClick={onClose} />

      {/* Centered panel (wrapper caps the width; the box below is the panel) */}
      <div
        className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full ${sizes[size]} px-4`}
        style={{ maxHeight: '90vh' }}
      >
        <div
          className="w-full bg-white rounded-2xl border border-border shadow-[0_12px_40px_rgba(29,29,27,0.15)] animate-fade-up flex flex-col max-h-[90vh]"
          style={{ maxHeight: '90vh', overflow: 'hidden' }}
        >
          {/* Fuchsia accent bar, Grow identity */}
          <div className="h-1 bg-primary shrink-0" aria-hidden="true" />

          {/* Header: title (+ optional subtitle) + close */}
          <div className="p-5 pb-3 border-b border-border flex items-start justify-between gap-4 shrink-0">
            <div className="min-w-0">
              <h3 className="font-display font-bold text-2xl text-text-ink">{title}</h3>
              {subtitle && <p className="text-sm text-text-muted mt-1 truncate">{subtitle}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              ref={closeRef}
              aria-label="Cerrar"
              className="btn btn-icon text-xl leading-none text-text-tan hover:text-text-ink shrink-0"
            >
              ×
            </button>
          </div>

          {/* Scrollable body */}
          <div className="p-5 overflow-y-auto flex-1 min-h-0">{children}</div>

          {/* Optional footer slot */}
          {footer && <div className="px-5 py-4 border-t border-border shrink-0">{footer}</div>}
        </div>
      </div>
    </div>,
    document.body,
  );
}