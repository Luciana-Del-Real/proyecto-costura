// Shared status pill: ONE size scale (micro) and a fixed set of token tones.
// No forced casing: badges render in the natural case of the copy (sentence
// case is common, e.g. "De pago"). Callers keep their copy (the words) and
// pick the tone that matches the colour intent; `className` adds positioning
// extras.
const tones = {
  primary: 'bg-primary-soft text-primary',
  success: 'bg-success/10 text-success',
  accent: 'bg-accent/10 text-accent',
  danger: 'bg-danger/10 text-danger',
  neutral: 'bg-bg-soft text-text-ink',
  outline: 'bg-white border border-border text-text-ink',
};

export default function Badge({ children, tone = 'neutral', className = '' }) {
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center ${tones[tone]} ${className}`}>
      {children}
    </span>
  );
}