import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePurchases } from '../context/PurchaseContext';
import { formatMoney } from '../utils/currency';
import { getImageUrl } from '../utils/media';
import PageHeader from '../components/PageHeader';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const { purchaseRecords, purchasesLoading, purchasesError } = usePurchases();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    country: user?.country || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  // Historial real: solo las compras aprobadas que devuelve el backend.
  const approvedRecords = Array.isArray(purchaseRecords)
    ? purchaseRecords.filter(r => r.status === 'APPROVED')
    : [];
  const totalInvested = approvedRecords.reduce(
    (sum, r) => sum + (r.total ?? r.course?.priceARS ?? 0),
    0,
  );

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
    <div className="max-w-6xl mx-auto px-1 py-1 animate-fade-in">
      <PageHeader title={user?.name} />

      {/* Identidad: avatar plano (fuera de toda caja) */}
      <div className="flex items-center px-1 pt-2 pb-1">
        <div className="w-16 h-16 bg-primary-soft rounded-full flex items-center justify-center text-2xl font-bold text-text-ink">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
      </div>

      <div className="card-glow rounded-2xl px-4 py-10 animate-fade-up mt-5 mb-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-text-ink text-3xl">Información personal</h2>
            {!editing && (
              <button onClick={() => setEditing(true)} className="btn btn-ghost text-sm">
                Editar
              </button>
            )}
          </div>

          {saved && (
            <div className="text-primary text-sm px-0 py-2 mb-4">
              ✓ Cambios guardados correctamente
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
              {error}
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
            <h2 className="font-display text-text-ink text-3xl">Historial de compras</h2>
          </div>
          {purchasesLoading ? (
            <p className="text-text-ink text-sm">Cargando tus compras...</p>
          ) : purchasesError ? (
            <p className="text-text-ink text-sm">No se pudieron cargar tus compras. Verificá tu conexión e intentá de nuevo más tarde.</p>
          ) : approvedRecords.length === 0 ? (
            <p className="text-text-ink text-sm">Todavía no realizaste ninguna compra.</p>
          ) : (
            <div className="space-y-3">
              {approvedRecords.map(record => {
                const course = record.course || {};
                return (
                  <div key={record.id} className="flex items-center gap-4 py-3 border-b border-border last:border-0">
                    <img src={getImageUrl(course.image)} alt={course.title} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-text-ink text-sm truncate">{course.title}</p>
                      <p className="text-text-ink text-xs">{course.level}</p>
                      {record.createdAt && (
                        <p className="text-text-ink text-xs">{new Date(record.createdAt).toLocaleDateString()}</p>
                      )}
                    </div>
                    <span className="font-semibold text-text-ink text-sm flex-shrink-0">
                      {formatMoney(record.total ?? course.priceARS ?? 0, user?.country === 'AUD' ? 'AUD' : 'ARS')}
                    </span>
                  </div>
                );
              })}
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
