export default function PageHeader({ title, subtitle, accent = true }) {
  return <header className="max-w-6xl mx-auto px-1 pt-6 pb-2 animate-fade-up">
    <h1 className="font-display text-3xl md:text-4xl font-bold text-text-ink">{title}</h1>
    {subtitle && <p className="text-text-muted mt-1">{subtitle}</p>}
    {accent && <span aria-hidden="true" className="block w-16 h-1 bg-primary mt-3" />}
  </header>;
}