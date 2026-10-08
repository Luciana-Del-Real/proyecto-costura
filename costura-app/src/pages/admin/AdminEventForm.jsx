import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { getEvent, createEvent, updateEvent } from '../../services/api';
import { useDialog } from '../../context/DialogContext';
import PageHeader from '../../components/PageHeader';

const EMPTY_FORM = {
  title: '',
  subtitle: '',
  detail: '',
};

// Formulario de creación/edición de eventos: título, descripción y detalle
// (el folleto se arma con texto, sin imágenes).
export default function AdminEventForm() {
  const { alertDialog } = useDialog();
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const reloadEvent = useCallback(async () => {
    if (!id) return;
    try {
      const data = await getEvent(id);
      setForm({
        title: data.title || '',
        subtitle: data.subtitle || '',
        detail: data.detail || '',
      });
    } catch (error) {
      console.error('Error cargando el evento:', error);
      alertDialog('No se pudo cargar el evento');
      navigate('/admin/eventos');
    } finally {
      setLoading(false);
    }
  }, [id, navigate, alertDialog]);

  useEffect(() => { reloadEvent(); }, [reloadEvent]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        subtitle: form.subtitle.trim(),
        detail: form.detail.trim(),
      };
      if (isEditing) {
        await updateEvent(id, payload);
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
        await reloadEvent();
      } else {
        await createEvent(payload);
        navigate('/admin/eventos');
      }
    } catch (error) {
      console.error('Error guardando el evento:', error);
      alertDialog('Error guardando el evento');
    } finally {
      setSaving(false);
    }
  };

  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  if (loading) {
    return <div className="flex items-center justify-center py-24 animate-fade-in"><span className="text-4xl">🎉</span></div>;
  }

  return (
    <div className="w-full px-4 py-8 animate-fade-in">
      <PageHeader
        title={isEditing ? 'Editar evento' : 'Nuevo evento'}
        subtitle="Cargá el texto del folleto del evento."
      />

      <Link to="/admin/eventos" className="text-primary text-sm hover:text-primary-hover inline-flex items-center gap-1 mb-4">← Volver al listado</Link>

      <div className="card-flat rounded-2xl p-8">
        {saved && <div className="bg-primary-soft text-success text-sm rounded-xl px-4 py-3 mb-4">✓ Guardado correctamente</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-black mb-1.5">Título</label>
            <input
              required
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="Ej: Clase Personalizada"
              className="w-full border-2 border-border rounded-xl px-4 py-3"
            />
            <p className="text-xs text-text-ink mt-1">
              Es la primera línea del folleto (en rosa). Si el título tiene dos palabras, la segunda va en verde.
            </p>
          </div>

          <div>
            <label className="block text-sm font-bold text-black mb-1.5">Descripción</label>
            <textarea
              required
              value={form.subtitle}
              onChange={e => set('subtitle', e.target.value)}
              placeholder="Texto de presentación del evento (se muestra debajo del título)"
              rows={4}
              className="w-full border-2 border-border rounded-xl px-4 py-3"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-black mb-1.5">Detalle</label>
            <textarea
              required
              value={form.detail}
              onChange={e => set('detail', e.target.value)}
              placeholder="Ej: Materiales + brunch + guías paso a paso."
              rows={3}
              className="w-full border-2 border-border rounded-xl px-4 py-3"
            />
            <p className="text-xs text-text-ink mt-1">
              Se muestra como líneas separadas en el folleto. Separalas con " + " o con puntos para que queden como ítems distintos.
            </p>
          </div>

          <button type="submit" disabled={saving} className="btn btn-primary w-full">
            {saving ? 'Guardando...' : (isEditing ? 'Guardar cambios' : 'Guardar evento')}
          </button>
        </form>
      </div>
    </div>
  );
}
