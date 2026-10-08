// Shared "saved successfully" banner: soft primary box with a ✓ and the
// message, shown after a form is saved. Rendered as a polite live region so
// assistive tech announces it.
export default function SuccessBanner({ children, className = '' }) {
  return (
    <div role="status" className={`bg-primary-soft text-success text-sm rounded-xl px-4 py-3 mb-4 flex items-start gap-2 ${className}`}>
      <span aria-hidden="true">✓</span>
      <span className="min-w-0">{children}</span>
    </div>
  );
}