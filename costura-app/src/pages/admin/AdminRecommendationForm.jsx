import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getRecommendation, createRecommendation, updateRecommendation } from '../../services/api';
import { useDialog } from '../../context/DialogContext';
import PageHeader from '../../components/PageHeader';
import LoadingState from '../../components/LoadingState';
import BackLink from '../../components/BackLink';
import SuccessBanner from '../../components/SuccessBanner';
import FilePicker from '../../components/FilePicker';
import { getImageUrl } from '../../utils/media';

const EMPTY_FORM = {
  title: '',
  description: '',
  link: '',
  image: '',
};

// Formulario de creación/edición de recomendaciones: imagen, título,
// descripción y un enlace externo opcional (se abre con "Ver más" en la
// tarjeta pública).
export default function AdminRecommendationForm() {
  const { alertDialog } = useDialog();
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const reloadRecommendation = useCallback(async () => {
    if (!id) return;
    try {
      const data = await getRecommendation(id);
      setForm({
        title: data.title || '',
        description: data.description || '',
        link: data.link || '',
        image: data.image || '',
      });
    } catch (error) {
      console.error('Error cargando la recomendación:', error);
      alertDialog('No se pudo cargar la recomendación');
      navigate('/admin/recomendaciones');
    } finally {
      setLoading(false);
    }
  }, [id, navigate, alertDialog]);

  useEffect(() => { reloadRecommendation(); }, [reloadRecommendation]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Sin imagen nueva se manda JSON como siempre; con imagen, FormData
      // (createRecommendation/updateRecommendation ya eligen el helper
      // correcto según el tipo).
      let data = {
        title: form.title.trim(),
        description: form.description.trim(),
        link: form.link.trim(),
      };
      if (imageFile) {
        const fd = new FormData();
        fd.append('title', form.title.trim());
        fd.append('description', form.description.trim());
        fd.append('link', form.link.trim());
        fd.append('image', imageFile);
        data = fd;
      }
      if (isEditing) {
        await updateRecommendation(id, data);
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
        await reloadRecommendation();
        setImageFile(null);
      } else {
        await createRecommendation(data);
        navigate('/admin/recomendaciones');
      }
    } catch (error) {
      console.error('Error guardando la recomendación:', error);
      alertDialog('Error guardando la recomendación');
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
        title={isEditing ? 'Editar recomendación' : 'Nueva recomendación'}
        subtitle="Cargá la imagen, el título, la descripción y el enlace de la recomendación."
      />

      <BackLink to="/admin/recomendaciones">← Volver al listado</BackLink>

      <div className="card-flat rounded-2xl p-8">
        {saved && <SuccessBanner>Guardado correctamente</SuccessBanner>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-text-ink mb-1.5">Imagen (opcional)</label>
            <FilePicker accept="image/*" onChange={e => setImageFile(e.target.files[0])} />
            <p className="text-xs text-text-ink mt-1">
              La imagen se muestra como portada de la tarjeta. Si no elegís ninguna, se usa un bloque de color con ícono.
            </p>
            {imageFile ? (
              <img src={URL.createObjectURL(imageFile)} alt="Vista previa de la imagen" className="mt-3 h-28 w-40 object-cover rounded-xl border border-border" />
            ) : form.image ? (
              <img src={getImageUrl(form.image)} alt="Imagen actual" className="mt-3 h-28 w-40 object-cover rounded-xl border border-border" />
            ) : null}
          </div>

          <div>
            <label className="block text-sm font-medium text-text-ink mb-1.5">Título</label>
            <input
              required
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="Ej: Máquina Brother para empezar"
              className="w-full border-2 border-border rounded-xl px-4 py-3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-ink mb-1.5">Descripción</label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Texto breve sobre la recomendación (se muestra debajo del título)"
              rows={4}
              className="w-full border-2 border-border rounded-xl px-4 py-3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-ink mb-1.5">Link</label>
            <input
              value={form.link}
              onChange={e => set('link', e.target.value)}
              placeholder="Ej: https://www.ejemplo.com/recomendacion"
              className="w-full border-2 border-border rounded-xl px-4 py-3"
            />
            <p className="text-xs text-text-ink mt-1">
              Se abre en otra pestaña con el botón "Ver más". Podés escribirlo con o sin "https://".
            </p>
          </div>

          <button type="submit" disabled={saving} className="btn btn-primary w-full">
            {saving ? 'Guardando...' : (isEditing ? 'Guardar cambios' : 'Guardar recomendación')}
          </button>
        </form>
      </div>
    </div>
  );
}