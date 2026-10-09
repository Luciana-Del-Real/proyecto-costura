import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getEvent, createEvent, updateEvent } from '../../services/api';
import { useDialog } from '../../context/DialogContext';
import PageHeader from '../../components/PageHeader';
import LoadingState from '../../components/LoadingState';
import BackLink from '../../components/BackLink';
import SuccessBanner from '../../components/SuccessBanner';
import FilePicker from '../../components/FilePicker';
import { getImageUrl } from '../../utils/media';

const EMPTY_FORM = {
  title: '',
  subtitle: '',
  detail: '',
  image: '',
};

// Formulario de creación/edición de eventos: título, descripción, detalle y
// una imagen de fondo opcional (se muestra difuminada en la tarjeta pública).
export default function AdminEventForm() {
  const { alertDialog } = useDialog();
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState(null);
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
        image: data.image || '',
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
      // Sin imagen nueva se manda JSON como siempre; con imagen, FormData
      // (createEvent/updateEvent ya eligen el helper correcto según el tipo).
      let data = {
        title: form.title.trim(),
        subtitle: form.subtitle.trim(),
        detail: form.detail.trim(),
      };
      if (imageFile) {
        const fd = new FormData();
        fd.append('title', form.title.trim());
        fd.append('subtitle', form.subtitle.trim());
        fd.append('detail', form.detail.trim());
        fd.append('image', imageFile);
        data = fd;
      }
      if (isEditing) {
        await updateEvent(id, data);
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
        await reloadEvent();
        setImageFile(null);
      } else {
        await createEvent(data);
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
    return <LoadingState size="section" />;
  }

  return (
    <div className="w-full px-4 py-8 animate-fade-in">
      <PageHeader
        title={isEditing ? 'Editar evento' : 'Nuevo evento'}
        subtitle="Cargá el texto del folleto del evento."
      />

      <BackLink to="/admin/eventos">← Volver al listado</BackLink>

      <div className="card-flat rounded-2xl p-8">
        {saved && <SuccessBanner>Guardado correctamente</SuccessBanner>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-text-ink mb-1.5">Título</label>
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
            <label className="block text-sm font-medium text-text-ink mb-1.5">Descripción</label>
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
            <label className="block text-sm font-medium text-text-ink mb-1.5">Detalle</label>
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

          <div>
            <label className="block text-sm font-medium text-text-ink mb-1.5">Imagen de fondo (opcional)</label>
            <FilePicker accept="image/*" onChange={e => setImageFile(e.target.files[0])} />
            <p className="text-xs text-text-ink mt-1">
              La imagen se muestra difuminada como fondo de la tarjeta del evento. Si no elegís ninguna, se usa el color pastel de siempre.
            </p>
            {imageFile ? (
              <img src={URL.createObjectURL(imageFile)} alt="Vista previa de la imagen" className="mt-3 h-28 w-40 object-cover rounded-xl border border-border" />
            ) : form.image ? (
              <img src={getImageUrl(form.image)} alt="Imagen de fondo actual" className="mt-3 h-28 w-40 object-cover rounded-xl border border-border" />
            ) : null}
          </div>

          <button type="submit" disabled={saving} className="btn btn-primary w-full">
            {saving ? 'Guardando...' : (isEditing ? 'Guardar cambios' : 'Guardar evento')}
          </button>
        </form>
      </div>
    </div>
  );
}
