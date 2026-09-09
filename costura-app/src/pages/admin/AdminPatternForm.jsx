import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { get, postForm, putForm, del } from '../../services/api';
import { useDialog } from '../../context/DialogContext';
import { getImageUrl } from '../../utils/media';
import FilePicker from '../../components/FilePicker';

const EMPTY_FORM = {
  titulo: '',
  descripcion: '',
  nivel: 'Principiante',
  categoria: '',
};

export default function AdminPatternForm() {
  const { alertDialog, confirmDialog } = useDialog();
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [form, setForm] = useState(EMPTY_FORM);
  const [imagenFile, setImagenFile] = useState(null);
  const [patternPdfFiles, setPatternPdfFiles] = useState([]); // PDFs nuevos a subir (múltiples)
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
    if (!isEditing && patternPdfFiles.length === 0) {
      alertDialog('Tenés que adjuntar el PDF del patrón.');
      return;
    }
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('titulo', form.titulo);
      formData.append('descripcion', form.descripcion);
      formData.append('nivel', form.nivel);
      formData.append('categoria', form.categoria);
      if (imagenFile) formData.append('imagen', imagenFile);
      // Todos los PDFs van por `pdfs`: el primero se guarda como PDF
      // principal (`archivo`) y el resto como attachments en el backend.
      patternPdfFiles.forEach((file) => formData.append('pdfs', file));

      if (isEditing) {
        await putForm(`/patterns/${id}`, formData);
        setImagenFile(null);
        setPatternPdfFiles([]);
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
        await reloadPattern();
      } else {
        await postForm('/patterns', formData);
        navigate('/admin/patrones');
      }
    } catch (error) {
      console.error('Error guardando el patrón:', error);
      alertDialog('Error guardando el patrón');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    if (!await confirmDialog('¿Eliminar este PDF del patrón?')) return;
    try {
      await del(`/patterns/${id}/attachments/${attachmentId}`);
      await reloadPattern();
    } catch (error) {
      console.error(error);
      alertDialog('No se pudo eliminar el PDF');
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-bg-surface flex items-center justify-center"><span className="text-4xl">🧵</span></div>;
  }

  return (
    <div className="min-h-screen bg-bg-surface py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Link to="/admin/patrones" className="btn btn-ghost mb-6 text-sm">← Volver al listado</Link>

        <div className="card-flat rounded-2xl p-8">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <FilePicker
                accept="image/*"
                onChange={e => setImagenFile(e.target.files?.[0] || null)}
              />
              {isEditing && pattern?.imagen && (
                <img src={getImageUrl(pattern.imagen)} alt={pattern.titulo} className="mt-3 h-28 w-40 object-cover rounded-xl border border-border" />
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-black mb-1.5 flex items-center gap-1.5"><FileText className="w-4 h-4" strokeWidth={1.5} /> PDFs (podés elegir varios)</label>
              <FilePicker
                accept=".pdf"
                multiple
                onChange={e => setPatternPdfFiles(Array.from(e.target.files || []))}
              />
              {patternPdfFiles.length > 0 && (
                <p className="text-xs text-text-ink mt-2">
                  {patternPdfFiles.length} archivo(s) seleccionados para agregar al guardar.
                </p>
              )}

              {(isEditing && (pattern?.archivo || pattern?.attachments?.length > 0)) && (
                <div className="mt-4">
                  <p className="text-xs font-bold text-text-ink mb-2">PDFs ya subidos:</p>
                  {pattern?.archivo && (
                    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <a
                        href={pattern.archivo.startsWith('/uploads/') ? getImageUrl(pattern.archivo) : pattern.archivo}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-primary underline truncate"
                      >
                        {pattern.titulo} (PDF principal)
                      </a>
                      <span className="text-xs text-text-muted flex-shrink-0 ml-3">principal</span>
                    </div>
                  )}
                  {pattern?.attachments?.map(att => (
                    <div key={att.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <a href={getImageUrl(att.url)} target="_blank" rel="noreferrer" className="text-sm text-primary underline truncate">{att.filename}</a>
                      <button type="button" onClick={() => handleDeleteAttachment(att.id)} className="text-danger text-xs font-bold hover:underline flex-shrink-0 ml-3">Eliminar</button>
                    </div>
                  ))}
                </div>
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