import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePurchases } from '../context/PurchaseContext';
import { formatMoney } from '../utils/currency';
import { getImageUrl } from '../utils/media';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import SuccessBanner from '../components/SuccessBanner';
import PageHeader from '../components/PageHeader';
import { getLevelLabel } from '../utils/levels';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const { purchaseRecords, patternPurchaseRecords = [], purchasesLoading, purchasesError } = usePurchases();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    country: user?.country || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  // Historial real: cursos + patrones aprobados, unificados por fecha.
  const approvedCourseRecords = Array.isArray(purchaseRecords)
    ? purchaseRecords.filter(r => r.status === 'APPROVED')
    : [];
  const approvedPatternRecords = Array.isArray(patternPurchaseRecords)
    ? patternPurchaseRecords.filter(r => r.status === 'APPROVED')
    : [];

  const historyRecords = [
    ...approvedCourseRecords.map(record => ({
      key: `course-${record.id}`,
      type: 'Curso',
      record,
      title: record.course?.title,
      level: getLevelLabel(record.course?.level),
      image: record.course?.image,
      amount: record.total ?? record.course?.priceARS ?? 0,
    })),
    ...approvedPatternRecords.map(record => ({
      key: `pattern-${record.id}`,
      type: 'Patrón',
      record,
      title: record.pattern?.titulo,
      level: getLevelLabel(record.pattern?.nivel),
      image: record.pattern?.imagen,
      amount: record.total ?? record.pattern?.precioARS ?? 0,
    })),
  ].sort((a, b) => new Date(b.record.createdAt ?? 0) - new Date(a.record.createdAt ?? 0));

  const totalInvested = historyRecords.reduce((sum, item) => sum + item.amount, 0);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await updateUser({
        name: form.name.trim(),
        email: form.email.trim(),
        country: form.country,
      });
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.message || 'No se pudieron guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full px-4 py-1 animate-fade-in">
      <PageHeader title={user?.name} subtitle={user?.email} />

      <div className="card-flat rounded-2xl px-4 py-10 animate-fade-up mt-5 mb-5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-primary-soft rounded-full flex items-center justify-center text-xl font-bold text-text-ink flex-shrink-0">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <h2 className="text-2xl font-display font-bold text-text-ink">Información personal</h2>
            </div>
            {!editing && (
              <button onClick={() => setEditing(true)} className="btn btn-ghost text-sm">
                Editar
              </button>
            )}
          </div>

          {saved && (
            <SuccessBanner>Cambios guardados correctamente</SuccessBanner>
          )}

          {error && (
            <div className="mb-4">
              <ErrorState variant="banner" description={error} />
            </div>
          )}

          {editing ? (
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-ink mb-1.5">Nombre</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-secondary bg-bg-soft"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-ink mb-1.5">Email</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-secondary bg-bg-soft"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-ink mb-1.5">País</label>
                <select
                  required
                  value={form.country}
                  onChange={e => setForm({ ...form, country: e.target.value })}
                  className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-secondary bg-bg-soft"
                >
                  <option value="">Seleccioná un país</option>
                  <option value="ARS">Argentina (ARS)</option>
                  <option value="AUD">Australia (AUD)</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={saving} className="btn btn-primary text-sm disabled:opacity-60">
                  {saving ? 'Guardando...' : 'Guardar cambios'}
                </button>
                <button type="button" onClick={() => { setEditing(false); setForm({ name: user.name, email: user.email, country: user.country }); setError(null); }} className="btn btn-ghost text-sm">
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-text-ink text-sm w-16">Nombre</span>
                <span className="text-text-ink font-medium">{user?.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-text-ink text-sm w-16">Email</span>
                <span className="text-text-ink font-medium">{user?.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-text-ink text-sm w-16">País</span>
                <span className="text-text-ink font-medium">{user?.country || 'No especificado'}</span>
              </div>
            </div>
          )}
        </div>

        <div className="px-1 py-10 animate-fade-up mt-5 mb-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-2xl font-display font-bold text-text-ink">Historial de compras</h2>
          </div>
          {purchasesLoading ? (
            <LoadingState size="inline" />
          ) : purchasesError ? (
            <ErrorState variant="inline" description="No se pudieron cargar tus compras. Verificá tu conexión e intentá de nuevo más tarde." />
          ) : historyRecords.length === 0 ? (
            <EmptyState variant="inline" title="Todavía no realizaste ninguna compra." />
          ) : (
            <div className="space-y-3">
              {historyRecords.map(item => (
                <div key={item.key} className="flex items-center gap-4 py-3 border-b border-border last:border-0">
                  <img src={getImageUrl(item.image)} alt={item.title} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text-ink text-sm truncate">{item.title}</p>
                    <p className="text-text-ink text-xs">
                      <span className="inline-block rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">{item.type}</span>
                      {item.level && <span className="ml-2">{item.level}</span>}
                    </p>
                    {item.record.createdAt && (
                      <p className="text-text-ink text-xs">{new Date(item.record.createdAt).toLocaleDateString()}</p>
                    )}
                  </div>
                  <span className="font-semibold text-text-ink text-sm flex-shrink-0">
                    {formatMoney(item.amount, user?.country === 'AUD' ? 'AUD' : 'ARS')}
                  </span>
                </div>
              ))}
              <div className="pt-2 flex justify-between text-sm font-semibold text-text-ink">
                <span>Total invertido</span>
                <span>{formatMoney(totalInvested, user?.country === 'AUD' ? 'AUD' : 'ARS')}</span>
              </div>
            </div>
          )}
        </div>
    </div>
  );
}
