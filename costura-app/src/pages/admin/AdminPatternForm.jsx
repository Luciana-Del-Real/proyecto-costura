import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { get, postForm, putForm } from '../../services/api';
import { getImageUrl } from '../../utils/media';

const EMPTY_FORM = {
  titulo: '',
  descripcion: '',
  nivel: 'Principiante',
  categoria: '',
};

export default function AdminPatternForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [form, setForm] = useState(EMPTY_FORM);
  const [imagenFile, setImagenFile] = useState(null);
  const [archivoFile, setArchivoFile] = useState(null);
  const [pattern, setPattern] = useState(null);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const reloadPattern = useCallback(async () => {
    if (!id) return;
    try {
      const data = await get(`/patterns/${id}`);
      setPattern(data);
      setForm({
        titulo: data.titulo || '',
        descripcion: data.descripcion || '',
        nivel: data.nivel || 'Principiante',
        categoria: data.categoria || '',
      });
    } catch (error) {
      console.error('Error cargando el patrón:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { reloadPattern(); }, [reloadPattern]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('titulo', form.titulo);
      formData.append('descripcion', form.descripcion);
      formData.append('nivel', form.nivel);
      formData.append('categoria', form.categoria);
      if (imagenFile) formData.append('imagen', imagenFile);
      if (archivoFile) formData.append('archivo', archivoFile);

      if (isEditing) {
        await putForm(`/patterns/${id}`, formData);
        setImagenFile(null);
        setArchivoFile(null);
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
        await reloadPattern();
      } else {
        await postForm('/patterns', formData);
        navigate('/admin/patrones');
      }
    } catch (error) {
      console.error('Error guardando el patrón:', error);
      alert('Error guardando el patrón');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-bg-surface flex items-center justify-center"><span className="text-4xl">🧵</span></div>;
  }

  return (
    <div className="min-h-screen bg-bg-surface py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Link to="/admin/patrones" className="btn btn-ghost mb-6 text-sm">← Volver al listado</Link>

        <div className="card-glow rounded-2xl p-8">
          <h2 className="font-display font-bold text-text-ink text-2xl mb-8 border-b pb-4">{isEditing ? 'Editar patrón' : 'Nuevo patrón'}</h2>
          {saved && <div className="bg-primary-soft text-success text-sm rounded-xl px-4 py-3 mb-4">✓ Guardado correctamente</div>}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-black mb-1.5">Título</label>
              <input
                required
                value={form.titulo}
                onChange={e => setForm({ ...form, titulo: e.target.value })}
                placeholder="Título del patrón"
                className="w-full border-2 border-border rounded-xl px-4 py-3"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-black mb-1.5">Descripción</label>
              <textarea
                required
                value={form.descripcion}
                onChange={e => setForm({ ...form, descripcion: e.target.value })}
                placeholder="Descripción del patrón"
                className="w-full border-2 border-border rounded-xl px-4 py-3"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-black mb-1.5">Nivel</label>
                <select
                  value={form.nivel}
                  onChange={e => setForm({ ...form, nivel: e.target.value })}
                  className="w-full border-2 border-border rounded-xl px-4 py-3"
                >
                  <option>Principiante</option>
                  <option>Intermedio</option>
                  <option>Avanzado</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-black mb-1.5">Categoría</label>
                <input
                  value={form.categoria}
                  onChange={e => setForm({ ...form, categoria: e.target.value })}
                  placeholder="Ej: Accesorios, Hogar"
                  className="w-full border-2 border-border rounded-xl px-4 py-3"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-black mb-1.5">📷 Imagen de portada</label>
              <input
                type="file"
                accept="image/*"
                onChange={e => setImagenFile(e.target.files?.[0] || null)}
                className="w-full border-2 border-border rounded-xl px-4 py-3"
              />
              {isEditing && pattern?.imagen && (
                <img src={getImageUrl(pattern.imagen)} alt={pattern.titulo} className="mt-3 h-28 w-40 object-cover rounded-xl border border-border" />
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-black mb-1.5 flex items-center gap-1.5"><FileText className="w-4 h-4" strokeWidth={1.5} /> PDF</label>
              <input
                type="file"
                accept=".pdf"
                required={!isEditing}
                onChange={e => setArchivoFile(e.target.files?.[0] || null)}
                className="w-full border-2 border-border rounded-xl px-4 py-3"
              />
              {isEditing && pattern?.archivo && (
                <a
                  href={pattern.archivo.startsWith('/uploads/') ? getImageUrl(pattern.archivo) : pattern.archivo}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block mt-3 text-sm text-primary font-medium hover:underline"
                >
                  Ver PDF actual
                </a>
              )}
            </div>

            <button type="submit" disabled={saving} className="btn btn-primary w-full">
              {saving ? 'Guardando...' : (isEditing ? 'Guardar cambios' : 'Crear patrón')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}