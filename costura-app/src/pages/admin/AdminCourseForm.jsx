import { useState, useEffect, useCallback } from 'react';
import { useCourseCatalog } from '../../context/CourseCatalogContext';
import { useNavigate, useParams } from 'react-router-dom';
import { get, postForm, putForm, del } from '../../services/api';
import CourseFieldsForm from '../../components/admin/CourseFieldsForm';
import LessonEditorItem from '../../components/admin/LessonEditorItem';
import NewLessonForm from '../../components/admin/NewLessonForm';

const EMPTY_COURSE = {
  title: '', description: '', priceARS: '', priceAUD: '', level: 'Principiante',
};
const EMPTY_LESSON = { title: '', duration: '', videoUrl: '' };

export default function AdminCourseForm() {
  const { addCourse, updateCourse } = useCourseCatalog();
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [form, setForm] = useState(EMPTY_COURSE);
  const [imageFile, setImageFile] = useState(null);
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

  const setLessonField = (lessonId, field, value) => {
    setEditedLessons((prev) => ({
      ...prev,
      [lessonId]: { ...prev[lessonId], [field]: value },
    }));
  };

  const handleLessonPdfChange = (lessonId, files) => {
    setLessonPdfFiles((prev) => ({ ...prev, [lessonId]: files }));
  };

  const handleSaveLesson = async (lesson) => {
    setSavingLessonId(lesson.id);
    try {
      const formData = new FormData();
      formData.append('title', editedLessons[lesson.id]?.title ?? lesson.title);
      formData.append('description', lesson.description);
      formData.append('duration', editedLessons[lesson.id]?.duration ?? lesson.duration);
      formData.append('videoUrl', editedLessons[lesson.id]?.videoUrl ?? lesson.videoUrl);
      formData.append('order', String(lesson.order ?? 0));
      formData.append('courseId', id);
      const filesToUpload = lessonPdfFiles[lesson.id] || [];
      filesToUpload.forEach((file) => formData.append('pdfs', file));

      await putForm(`/courses/${id}/lessons/${lesson.id}`, formData);
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
      formData.append('description', newLesson.description || '');
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
    return <div className="min-h-screen bg-bg-surface flex items-center justify-center"><span className="text-4xl">🧵</span></div>;
  }

  return (
    <div className="min-h-screen bg-bg-surface py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <button onClick={() => navigate('/admin/cursos')} className="btn btn-ghost mb-6 text-sm">← Volver al listado</button>

        <div className="card-glow rounded-2xl p-8 mb-8">
          <h2 className="font-display font-bold text-text-ink text-2xl mb-8 border-b pb-4">{isEditing ? 'Editar curso' : 'Nuevo curso'}</h2>
          {saved && <div className="bg-primary-soft text-success text-sm rounded-xl px-4 py-3 mb-4">✓ Guardado correctamente</div>}

          <CourseFieldsForm
            form={form}
            onChange={setForm}
            saving={saving}
            isEditing={isEditing}
            onSubmit={handleSaveCourse}
            setImageFile={setImageFile}
            coursePdfFiles={coursePdfFiles}
            setCoursePdfFiles={setCoursePdfFiles}
            course={course}
            onDeleteAttachment={handleDeleteCourseAttachment}
          />
        </div>

        {/* Lecciones: solo disponible una vez que el curso ya existe */}
        {isEditing && (
          <div className="card-glow rounded-2xl p-8">
            <h3 className="font-display font-bold text-text-ink text-2xl mb-6 border-b pb-4">Lecciones</h3>

            <div className="space-y-4 mb-8">
              {(course?.lessons || []).map((lesson) => (
                <LessonEditorItem
                  key={lesson.id}
                  lesson={lesson}
                  editedLessons={editedLessons}
                  onFieldChange={setLessonField}
                  onLessonPdfChange={handleLessonPdfChange}
                  savingLessonId={savingLessonId}
                  onSaveLesson={handleSaveLesson}
                  onDeleteLesson={handleDeleteLesson}
                  onDeleteLessonAttachment={handleDeleteLessonAttachment}
                />
              ))}

              {(!course?.lessons || course.lessons.length === 0) && (
                <p className="text-sm text-text-ink">Este curso todavía no tiene lecciones.</p>
              )}
            </div>

            {/* Nueva lección */}
            <NewLessonForm
              newLesson={newLesson}
              setNewLesson={setNewLesson}
              setPdfs={setNewLessonPdfs}
              creating={creatingLesson}
              onSubmit={handleCreateLesson}
            />
          </div>
        )}
      </div>
    </div>
  );
}