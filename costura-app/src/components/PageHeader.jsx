export default function PageHeader({ title, subtitle, accent = true, action }) {
  const hasAction = action !== undefined && action !== null;
  return <header className="w-full px-4 pt-6 pb-2 animate-fade-up">
    <h1 className="font-display text-3xl md:text-4xl font-bold text-text-ink">{title}</h1>
    {subtitle && (hasAction ? (
      // Subtítulo y acción comparten la misma fila; el gap evita que se toquen
      // en pantallas angostas y items-baseline los alinea visualmente.
      <div className="flex items-baseline justify-between gap-4 mt-1">
        <p className="text-text-muted">{subtitle}</p>
        {action}
      </div>
    ) : (
      <p className="text-text-muted mt-1">{subtitle}</p>
    ))}
    {!subtitle && hasAction && <div className="flex justify-end mt-1">{action}</div>}
    {accent && <span aria-hidden="true" className="block w-16 h-1 bg-primary mt-3" />}
  </header>;
}