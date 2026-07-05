import { useState, useEffect, useCallback } from 'react';
import { useCourses } from '../../context/CoursesContext';
import { useNavigate, useParams } from 'react-router-dom';
import { get, postForm, putForm, del } from '../../services/api';

const EMPTY_COURSE = {
  title: '', description: '', priceARS: '', priceAUD: '', level: 'Principiante',
};
const EMPTY_LESSON = { title: '', duration: '', videoUrl: '' };

export default function AdminCourseForm() {
  const { addCourse, updateCourse } = useCourses();
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [form, setForm] = useState(EMPTY_COURSE);
  const [imageFile, setImageFile] = useState(null);
  const [pdfGuideFile, setPdfGuideFile] = useState(null);
  const [coursePdfFiles, setCoursePdfFiles] = useState([]); // PDFs nuevos a subir (multiples)
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Curso completo (con lecciones y adjuntos), lo cargamos aparte de la lista general
  const [course, setCourse] = useState(null);
  const [loadingCourse, setLoadingCourse] = useState(isEditing);

  const reloadCourse = useCallback(async () => {
    if (!id) return;
    try {
      const data = await get(`/courses/${id}`);
      setCourse(data);
      setForm({
        title: data.title || '',
        description: data.description || '',
        priceARS: data.priceARS ?? '',
        priceAUD: data.priceAUD ?? '',
        level: data.level ? data.level.charAt(0) + data.level.slice(1).toLowerCase() : 'Principiante',
      });
    } catch (err) {
      console.error('Error cargando el curso:', err);
    } finally {
      setLoadingCourse(false);
    }
  }, [id]);

  useEffect(() => { reloadCourse(); }, [reloadCourse]);

  // --- Guardar datos generales del curso (incluye subir nuevos PDFs del curso) ---
  const handleSaveCourse = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('priceARS', Number(form.priceARS));
      formData.append('priceAUD', Number(form.priceAUD));
      formData.append('level', form.level.toUpperCase());
      if (imageFile) formData.append('image', imageFile);
      if (pdfGuideFile) formData.append('pdfGuide', pdfGuideFile);
      coursePdfFiles.forEach((file) => formData.append('pdfs', file));

      if (isEditing) {
        await updateCourse(id, formData);
        setCoursePdfFiles([]);
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
        await reloadCourse();
      } else {
        const created = await addCourse(formData);
        navigate(`/admin/courses/edit/${created.id}`);
      }
    } catch (err) {
      console.error(err);
      alert('Error guardando el curso');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCourseAttachment = async (attachmentId) => {
    if (!confirm('¿Eliminar este PDF del curso?')) return;
    try {
      await del(`/attachments/${attachmentId}`);
      await reloadCourse();
    } catch (err) {
      console.error(err);
      alert('No se pudo eliminar el PDF');
    }
  };

  // --- Lecciones existentes: edición individual ---
  const [editedLessons, setEditedLessons] = useState({});
  const [lessonPdfFiles, setLessonPdfFiles] = useState({});
  const [savingLessonId, setSavingLessonId] = useState(null);

  const getLessonField = (lesson, field) =>
    editedLessons[lesson.id]?.[field] ?? lesson[field];

  const setLessonField = (lessonId, field, value) => {
    setEditedLessons((prev) => ({
      ...prev,
      [lessonId]: { ...prev[lessonId], [field]: value },
    }));
  };

  const handleSaveLesson = async (lesson) => {
    setSavingLessonId(lesson.id);
    try {
      const formData = new FormData();
      formData.append('title', getLessonField(lesson, 'title'));
      formData.append('duration', getLessonField(lesson, 'duration'));
      formData.append('videoUrl', getLessonField(lesson, 'videoUrl'));
      formData.append('order', String(lesson.order ?? 0));
      formData.append('courseId', id);
      const filesToUpload = lessonPdfFiles[lesson.id] || [];
      filesToUpload.forEach((file) => formData.append('pdfs', file));

      await putForm(`/courses/${id}/lessons/${lesson.id}`, formData);
      setLessonPdfFiles((prev) => ({ ...prev, [lesson.id]: [] }));
      await reloadCourse();
    } catch (err) {
      console.error(err);
      alert('Error guardando la lección');
    } finally {
      setSavingLessonId(null);
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    if (!confirm('¿Eliminar esta lección? Esta acción no se puede deshacer.')) return;
    try {
      await del(`/courses/${id}/lessons/${lessonId}`);
      await reloadCourse();
    } catch (err) {
      console.error(err);
      alert('No se pudo eliminar la lección');
    }
  };

  const handleDeleteLessonAttachment = async (attachmentId) => {
    if (!confirm('¿Eliminar este PDF de la lección?')) return;
    try {
      await del(`/attachments/${attachmentId}`);
      await reloadCourse();
    } catch (err) {
      console.error(err);
      alert('No se pudo eliminar el PDF');
    }
  };

  // --- Nueva lección ---
  const [newLesson, setNewLesson] = useState(EMPTY_LESSON);
  const [newLessonPdfs, setNewLessonPdfs] = useState([]);
  const [creatingLesson, setCreatingLesson] = useState(false);

  const handleCreateLesson = async (e) => {
    e.preventDefault();
    setCreatingLesson(true);
    try {
      const formData = new FormData();
      formData.append('title', newLesson.title);
      formData.append('duration', newLesson.duration);
      formData.append('videoUrl', newLesson.videoUrl);
      formData.append('order', String((course?.lessons?.length || 0)));
      formData.append('courseId', id);
      newLessonPdfs.forEach((file) => formData.append('pdfs', file));

      await postForm(`/courses/${id}/lessons`, formData);
      setNewLesson(EMPTY_LESSON);
      setNewLessonPdfs([]);
      await reloadCourse();
    } catch (err) {
      console.error(err);
      alert('Error creando la lección');
    } finally {
      setCreatingLesson(false);
    }
  };

  if (loadingCourse) {
    return <div className="min-h-screen bg-[#F9F5F0] flex items-center justify-center"><span className="text-4xl">🧵</span></div>;
  }

  return (
    <div className="min-h-screen bg-[#F9F5F0] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <button onClick={() => navigate('/admin/cursos')} className="text-white mb-6 hover:underline font-bold">← Volver al listado</button>

        <div className="bg-white rounded-2xl border border-[#EDE4D6] p-8 shadow-sm mb-8">
          <h2 className="font-bold text-[#6B4C3B] text-2xl mb-8 border-b pb-4">{isEditing ? 'Editar curso' : 'Nuevo curso'}</h2>
          {saved && <div className="bg-[#EAF0EA] text-[#5E8262] text-sm rounded-xl px-4 py-3 mb-4">✓ Guardado correctamente</div>}

          <form onSubmit={handleSaveCourse} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-black mb-1.5">Título y Descripción</label>
              <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Título" className="w-full border-2 border-[#EDE4D6] rounded-xl px-4 py-3 mb-3" />
              <textarea required value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Descripción general" className="w-full border-2 border-[#EDE4D6] rounded-xl px-4 py-3" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <input type="number" required min={0} placeholder="Precio ARS" value={form.priceARS} onChange={e => setForm({ ...form, priceARS: e.target.value })} className="border-2 border-[#EDE4D6] rounded-xl px-4 py-3" />
              <input type="number" required min={0} placeholder="Precio AUD" value={form.priceAUD} onChange={e => setForm({ ...form, priceAUD: e.target.value })} className="border-2 border-[#EDE4D6] rounded-xl px-4 py-3" />
            </div>

            <div>
              <label className="block text-sm font-bold text-black mb-1.5">Nivel</label>
              <select value={form.level} onChange={e => setForm({ ...form, level: e.target.value })} className="w-full border-2 border-[#EDE4D6] rounded-xl px-4 py-3">
                <option>Principiante</option>
                <option>Intermedio</option>
                <option>Avanzado</option>
              </select>
            </div>

            <div className="bg-[#F9F5F0] p-4 rounded-xl border border-[#EDE4D6] md:col-span-2">
              <label className="block text-sm font-bold text-black mb-2">🖼️ Portada</label>
              <input 
                type="file" 
                lang="es" 
                accept="image/*" 
                onChange={e => setImageFile(e.target.files[0])} 
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#4E6D5B] file:text-white hover:file:bg-[#3e5849] cursor-pointer" 
              />
            </div>
            {/* PDFs adicionales del curso (multiples) */}
            <div className="bg-[#F9F5F0] p-4 rounded-xl border border-[#EDE4D6]">
              <label className="block text-sm font-bold text-black mb-2">📎 PDF's (podés elegir varios)</label>
              <input
                type="file"
                accept=".pdf"
                multiple
                onChange={e => setCoursePdfFiles(Array.from(e.target.files))}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#4E6D5B] file:text-white hover:file:bg-[#3e5849] cursor-pointer"
              />
              {coursePdfFiles.length > 0 && (
                <p className="text-xs text-[#6B4C3B] mt-2">{coursePdfFiles.length} archivo(s) seleccionados para subir al guardar.</p>
              )}

              {isEditing && course?.attachments?.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-bold text-[#6B4C3B]">PDFs ya subidos:</p>
                  {course.attachments.map(att => (
                    <div key={att.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-[#EDE4D6]">
                      <a href={`http://localhost:3000${att.url}`} target="_blank" rel="noreferrer" className="text-sm text-[#4E6D5B] underline truncate">{att.filename}</a>
                      <button type="button" onClick={() => handleDeleteCourseAttachment(att.id)} className="text-red-600 text-xs font-bold hover:underline flex-shrink-0 ml-3">Eliminar</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button type="submit" disabled={saving} className="w-full bg-[#4E6D5B] text-white py-3 rounded-xl font-bold disabled:opacity-60">
              {saving ? 'Guardando...' : (isEditing ? 'Guardar' : 'Crear curso')}
            </button>
          </form>
        </div>

        {/* Lecciones: solo disponible una vez que el curso ya existe */}
        {isEditing && (
          <div className="bg-white rounded-2xl border border-[#EDE4D6] p-8 shadow-sm">
            <h3 className="font-bold text-[#6B4C3B] text-xl mb-6 border-b pb-4">Lecciones</h3>

            <div className="space-y-4 mb-8">
              {(course?.lessons || []).map((lesson) => (
                <div key={lesson.id} className="bg-[#F9F5F0] p-4 rounded-xl space-y-3 border border-[#EDE4D6]">
                  <input
                    placeholder="Título"
                    value={getLessonField(lesson, 'title')}
                    onChange={e => setLessonField(lesson.id, 'title', e.target.value)}
                    className="w-full p-2 rounded-lg border border-[#EDE4D6]"
                  />
                  <textarea
                    required
                    placeholder="Descripción"
                    value={newLesson.description || ''}
                    onChange={e => setNewLesson({ ...newLesson, description: e.target.value })}
                    className="w-full p-2 rounded-lg border border-[#EDE4D6] h-20"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      placeholder="Duración (ej. 12 min)"
                      value={getLessonField(lesson, 'duration')}
                      onChange={e => setLessonField(lesson.id, 'duration', e.target.value)}
                      className="w-full p-2 rounded-lg border border-[#EDE4D6]"
                    />
                    <input
                      placeholder="Link de video"
                      value={getLessonField(lesson, 'videoUrl')}
                      onChange={e => setLessonField(lesson.id, 'videoUrl', e.target.value)}
                      className="w-full p-2 rounded-lg border border-[#EDE4D6]"
                    />
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-[#EDE4D6]">
                    <label className="block text-xs font-bold text-[#6B4C3B] mb-2">📎 Agregar PDFs a esta lección (podés elegir varios)</label>
                    <input
                      type="file"
                      accept=".pdf"
                      multiple
                      onChange={e => setLessonPdfFiles(prev => ({ ...prev, [lesson.id]: Array.from(e.target.files) }))}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#4E6D5B] file:text-white hover:file:bg-[#3e5849] cursor-pointer"
                    />
                    {lesson.attachments?.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {lesson.attachments.map(att => (
                          <div key={att.id} className="flex items-center justify-between bg-[#F9F5F0] rounded-lg px-3 py-2">
                            <a href={`http://localhost:3000${att.url}`} target="_blank" rel="noreferrer" className="text-sm text-[#4E6D5B] underline truncate">{att.filename}</a>
                            <button type="button" onClick={() => handleDeleteLessonAttachment(att.id)} className="text-red-600 text-xs font-bold hover:underline flex-shrink-0 ml-3">Eliminar</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button type="button" onClick={() => handleDeleteLesson(lesson.id)} className="bg-[#bf6b6b] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#bf5b6b] transition-colors">Eliminar lección</button>
                    <button
                      type="button"
                      onClick={() => handleSaveLesson(lesson)}
                      disabled={savingLessonId === lesson.id}
                      className="text-red-600 px-4 py-2 rounded-lg text-sm font-bold"
                    >
                      {savingLessonId === lesson.id ? 'Guardando...' : 'Guardar lección'}
                    </button>
                  </div>
                </div>
              ))}

              {(!course?.lessons || course.lessons.length === 0) && (
                <p className="text-sm text-[#6B4C3B]">Este curso todavía no tiene lecciones.</p>
              )}
            </div>

            {/* Nueva lección */}
            <form onSubmit={handleCreateLesson} className="bg-[#F9F5F0] p-4 rounded-xl space-y-3 border-2 border-dashed border-[#EDE4D6]">
              <p className="text-sm font-bold text-[#6B4C3B]">+ Agregar nueva lección</p>
              <input
                required
                placeholder="Título"
                value={newLesson.title}
                onChange={e => setNewLesson({ ...newLesson, title: e.target.value })}
                className="w-full p-2 rounded-lg border border-[#EDE4D6]"
              />
              <textarea
                required
                placeholder="Descripción"
                value={newLesson.description || ''}
                onChange={e => setNewLesson({ ...newLesson, description: e.target.value })}
                className="w-full p-2 rounded-lg border border-[#EDE4D6] h-20"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  required
                  placeholder="Duración (ej. 12 min)"
                  value={newLesson.duration}
                  onChange={e => setNewLesson({ ...newLesson, duration: e.target.value })}
                  className="w-full p-2 rounded-lg border border-[#EDE4D6]"
                />
                <input
                  required
                  placeholder="Link de video"
                  value={newLesson.videoUrl}
                  onChange={e => setNewLesson({ ...newLesson, videoUrl: e.target.value })}
                  className="w-full p-2 rounded-lg border border-[#EDE4D6]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#6B4C3B] mb-2">📎 PDFs de la lección (podés elegir varios)</label>
                <input
                  type="file"
                  accept=".pdf"
                  multiple
                  onChange={e => setNewLessonPdfs(Array.from(e.target.files))}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#4E6D5B] file:text-white hover:file:bg-[#3e5849] cursor-pointer"
                />
              </div>
              <button type="submit" disabled={creatingLesson} className="w-full py-3 bg-[#4E6D5B] text-white font-bold rounded-xl text-sm disabled:opacity-60">
                {creatingLesson ? 'Creando...' : '+ Crear lección'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
