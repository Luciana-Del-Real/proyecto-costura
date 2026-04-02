import { useState } from 'react';
import { useCourses } from '../../context/CoursesContext';

const EMPTY_COURSE = {
  title: '', description: '', longDescription: '', price: '',
  level: 'Principiante', image: '', instructor: '', duration: '',
  featured: false, lessons: [],
};
const EMPTY_LESSON = { title: '', duration: '', videoUrl: '' };
const levels = ['Principiante', 'Intermedio', 'Avanzado'];

export default function AdminCourses() {
  const { courses, updateCourse, addCourse, deleteCourse, addLesson, updateLesson, deleteLesson, getAllPurchases } = useCourses();
  const allPurchases = getAllPurchases();

  const [view, setView] = useState('list'); // list | edit | lessons
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY_COURSE);
  const [lessonForm, setLessonForm] = useState(EMPTY_LESSON);
  const [editingLesson, setEditingLesson] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [saved, setSaved] = useState(false);

  const openEdit = (course) => {
    setSelected(course);
    setForm({ ...course });
    setView('edit');
    setSaved(false);
  };

  const openNew = () => {
    setSelected(null);
    setForm(EMPTY_COURSE);
    setView('edit');
    setSaved(false);
  };

  const openLessons = (course) => {
    setSelected(course);
    setLessonForm(EMPTY_LESSON);
    setEditingLesson(null);
    setView('lessons');
  };

  const handleSave = (e) => {
    e.preventDefault();
    const data = { ...form, price: Number(form.price) };
    if (selected) updateCourse(selected.id, data);
    else addCourse(data);
    setSaved(true);
    setTimeout(() => { setSaved(false); setView('list'); }, 1200);
  };

  const handleDelete = (id) => {
    deleteCourse(id);
    setConfirmDelete(null);
  };

  const handleAddLesson = (e) => {
    e.preventDefault();
    if (editingLesson !== null) {
      updateLesson(selected.id, editingLesson, lessonForm);
      setEditingLesson(null);
    } else {
      addLesson(selected.id, lessonForm);
    }
    setLessonForm(EMPTY_LESSON);
    // refresh selected
    const updated = JSON.parse(localStorage.getItem('costura_courses') || '[]');
    setSelected(updated.find(c => c.id === selected.id));
  };

  const startEditLesson = (lesson) => {
    setEditingLesson(lesson.id);
    setLessonForm({ title: lesson.title, duration: lesson.duration, videoUrl: lesson.videoUrl });
  };

  const handleDeleteLesson = (lessonId) => {
    deleteLesson(selected.id, lessonId);
    const updated = JSON.parse(localStorage.getItem('costura_courses') || '[]');
    setSelected(updated.find(c => c.id === selected.id));
  };

  const getBuyers = (courseId) => allPurchases.filter(p => p.course.id === courseId).length;

  if (view === 'edit') return (
    <div className="min-h-screen bg-[#F9F5F0] py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <button onClick={() => setView('list')} className="text-[#7A9E7E] text-sm mb-6 inline-block hover:text-[#5E8262]">← Volver</button>
        <div className="bg-white rounded-2xl border border-[#EDE4D6] p-6 animate-fade-up">
          <h2 className="font-bold text-[#3D2B1F] text-xl mb-6">{selected ? 'Editar curso' : 'Nuevo curso'}</h2>
          {saved && <div className="bg-[#EAF0EA] border border-[#7A9E7E] text-[#5E8262] text-sm rounded-xl px-4 py-3 mb-4">✓ Guardado correctamente</div>}
          <form onSubmit={handleSave} className="space-y-4">
            {[
              { label: 'Título', key: 'title', type: 'text', required: true },
              { label: 'Descripción corta', key: 'description', type: 'text', required: true },
              { label: 'Imagen (URL)', key: 'image', type: 'text' },
              { label: 'Instructora', key: 'instructor', type: 'text' },
              { label: 'Duración total', key: 'duration', type: 'text', placeholder: 'ej: 8 horas' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-sm font-medium text-[#6B4C3B] mb-1.5">{f.label}</label>
                <input type={f.type} required={f.required} value={form[f.key]} placeholder={f.placeholder || ''}
                  onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                  className="w-full border border-[#EDE4D6] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7A9E7E] bg-[#F9F5F0]" />
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium text-[#6B4C3B] mb-1.5">Descripción larga</label>
              <textarea rows={3} value={form.longDescription}
                onChange={e => setForm({ ...form, longDescription: e.target.value })}
                className="w-full border border-[#EDE4D6] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7A9E7E] bg-[#F9F5F0] resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#6B4C3B] mb-1.5">Precio ($)</label>
                <input type="number" required min={0} value={form.price}
                  onChange={e => setForm({ ...form, price: e.target.value })}
                  className="w-full border border-[#EDE4D6] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7A9E7E] bg-[#F9F5F0]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#6B4C3B] mb-1.5">Nivel</label>
                <select value={form.level} onChange={e => setForm({ ...form, level: e.target.value })}
                  className="w-full border border-[#EDE4D6] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7A9E7E] bg-[#F9F5F0]">
                  {levels.map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.featured} onChange={e => setForm({ ...form, featured: e.target.checked })}
                className="w-4 h-4 accent-[#7A9E7E]" />
              <span className="text-sm text-[#6B4C3B]">Destacar en la página de inicio</span>
            </label>
            <div className="flex gap-3 pt-2">
              <button type="submit" className="bg-[#7A9E7E] text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#5E8262] transition-colors">
                {selected ? 'Guardar cambios' : 'Crear curso'}
              </button>
              <button type="button" onClick={() => setView('list')} className="text-[#A08060] text-sm hover:text-[#6B4C3B]">Cancelar</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  if (view === 'lessons') {
    const currentCourse = courses.find(c => c.id === selected?.id) || selected;
    return (
      <div className="min-h-screen bg-[#F9F5F0] py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <button onClick={() => setView('list')} className="text-[#7A9E7E] text-sm mb-6 inline-block hover:text-[#5E8262]">← Volver</button>
          <div className="bg-white rounded-2xl border border-[#EDE4D6] p-6 mb-6 animate-fade-up">
            <h2 className="font-bold text-[#3D2B1F] text-xl mb-1">Lecciones — {currentCourse?.title}</h2>
            <p className="text-[#A08060] text-sm mb-5">{currentCourse?.lessons?.length || 0} lecciones</p>

            {currentCourse?.lessons?.length > 0 ? (
              <div className="space-y-2 mb-6">
                {currentCourse.lessons.map((lesson, idx) => (
                  <div key={lesson.id} className="flex items-center gap-3 p-3 bg-[#F9F5F0] rounded-xl border border-[#EDE4D6]">
                    <span className="text-[#A08060] text-xs w-5 text-center">{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#3D2B1F] truncate">{lesson.title}</p>
                      <p className="text-xs text-[#A08060]">{lesson.duration}</p>
                    </div>
                    <button onClick={() => startEditLesson(lesson)} className="text-xs text-[#7A9E7E] hover:text-[#5E8262] px-2 py-1">Editar</button>
                    <button onClick={() => handleDeleteLesson(lesson.id)} className="text-xs text-[#C4785A] hover:text-[#A85E42] px-2 py-1">Eliminar</button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[#A08060] text-sm mb-6">Sin lecciones aún.</p>
            )}

            <h3 className="font-semibold text-[#3D2B1F] text-sm mb-3">{editingLesson ? 'Editar lección' : 'Agregar lección'}</h3>
            <form onSubmit={handleAddLesson} className="space-y-3">
              <input required value={lessonForm.title} onChange={e => setLessonForm({ ...lessonForm, title: e.target.value })}
                placeholder="Título de la lección"
                className="w-full border border-[#EDE4D6] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7A9E7E] bg-[#F9F5F0]" />
              <div className="grid grid-cols-2 gap-3">
                <input required value={lessonForm.duration} onChange={e => setLessonForm({ ...lessonForm, duration: e.target.value })}
                  placeholder="Duración (ej: 20 min)"
                  className="w-full border border-[#EDE4D6] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7A9E7E] bg-[#F9F5F0]" />
                <input value={lessonForm.videoUrl} onChange={e => setLessonForm({ ...lessonForm, videoUrl: e.target.value })}
                  placeholder="URL del video (embed)"
                  className="w-full border border-[#EDE4D6] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7A9E7E] bg-[#F9F5F0]" />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="bg-[#7A9E7E] text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-[#5E8262] transition-colors">
                  {editingLesson ? 'Guardar cambios' : 'Agregar lección'}
                </button>
                {editingLesson && (
                  <button type="button" onClick={() => { setEditingLesson(null); setLessonForm(EMPTY_LESSON); }}
                    className="text-[#A08060] text-sm hover:text-[#6B4C3B]">Cancelar</button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F5F0]">
      <div className="bg-[#F5EFE6] py-8 px-4 border-b border-[#EDE4D6]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#3D2B1F]">Gestión de cursos</h1>
            <p className="text-[#A08060] text-sm mt-0.5">{courses.length} cursos en total</p>
          </div>
          <button onClick={openNew}
            className="bg-[#7A9E7E] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#5E8262] hover:scale-105 active:scale-95 transition-all duration-200">
            + Nuevo curso
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {confirmDelete && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl animate-fade-up">
              <h3 className="font-bold text-[#3D2B1F] mb-2">¿Eliminar curso?</h3>
              <p className="text-[#A08060] text-sm mb-5">Esta acción no se puede deshacer.</p>
              <div className="flex gap-3">
                <button onClick={() => handleDelete(confirmDelete)} className="bg-red-500 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-red-600 transition-colors">Eliminar</button>
                <button onClick={() => setConfirmDelete(null)} className="text-[#A08060] text-sm hover:text-[#6B4C3B]">Cancelar</button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {courses.map((course) => (
            <div key={course.id} className="stagger-item bg-white rounded-2xl border border-[#EDE4D6] p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 hover:shadow-sm transition-all duration-200">
              <img src={course.image} alt={course.title} className="w-full sm:w-20 h-16 object-cover rounded-xl flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-[#3D2B1F] text-sm">{course.title}</h3>
                  {course.featured && <span className="text-xs bg-[#EAF0EA] text-[#5E8262] px-2 py-0.5 rounded-full">Destacado</span>}
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-[#A08060] flex-wrap">
                  <span>{course.level}</span>
                  <span>·</span>
                  <span>{course.lessons?.length || 0} lecciones</span>
                  <span>·</span>
                  <span>{getBuyers(course.id)} alumna{getBuyers(course.id) !== 1 ? 's' : ''}</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-bold text-[#3D2B1F]">${course.price.toLocaleString()}</span>
                <div className="flex gap-2">
                  <button onClick={() => openLessons(course)} className="text-xs text-[#6B4C3B] border border-[#EDE4D6] px-3 py-1.5 rounded-lg hover:bg-[#F5EFE6] transition-colors">Lecciones</button>
                  <button onClick={() => openEdit(course)} className="text-xs text-[#7A9E7E] border border-[#7A9E7E] px-3 py-1.5 rounded-lg hover:bg-[#EAF0EA] transition-colors">Editar</button>
                  <button onClick={() => setConfirmDelete(course.id)} className="text-xs text-[#C4785A] border border-[#C4785A] px-3 py-1.5 rounded-lg hover:bg-[#F5E8E2] transition-colors">Eliminar</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
