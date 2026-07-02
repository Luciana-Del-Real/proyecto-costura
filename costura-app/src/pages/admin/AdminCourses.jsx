import { useState, useEffect } from 'react';
import { useCourses } from '../../context/CoursesContext';

const EMPTY_COURSE = {
  title: '', description: '', longDescription: '', 
  priceARS: '', priceAUD: '', // Campos corregidos para ambos precios
  level: 'Principiante', image: '', instructor: '', duration: '',
  featured: false, lessons: [],
};
const EMPTY_LESSON = { title: '', duration: '', videoUrl: '' };
const levels = ['Principiante', 'Intermedio', 'Avanzado'];

export default function AdminCourses() {
  const { courses, updateCourse, addCourse, deleteCourse, addLesson, updateLesson, deleteLesson, getAllPurchases } = useCourses();
  const [allPurchases, setAllPurchases] = useState([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await getAllPurchases();
        if (mounted) setAllPurchases(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error cargando compras:', err);
        if (mounted) setAllPurchases([]);
      }
    };
    load();
    return () => { mounted = false; };
  }, [getAllPurchases]);

  const [view, setView] = useState('list');
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY_COURSE);
  const [lessonForm, setLessonForm] = useState(EMPTY_LESSON);
  const [editingLesson, setEditingLesson] = useState(null);
  const [saved, setSaved] = useState(false);

  const openEdit = (course) => { setSelected(course); setForm({ ...course }); setView('edit'); setSaved(false); };
  const openNew = () => { setSelected(null); setForm(EMPTY_COURSE); setView('edit'); setSaved(false); };
  const openLessons = (course) => { setSelected(course); setLessonForm(EMPTY_LESSON); setEditingLesson(null); setView('lessons'); };

  const handleSave = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('title', form.title);
    formData.append('description', form.description);
    if (form.longDescription) formData.append('longDescription', form.longDescription);
    if (form.instructor) formData.append('instructor', form.instructor);
    if (form.duration) formData.append('duration', form.duration);
    
    // Guardamos ambos precios
    formData.append('priceARS', Number(form.priceARS));
    formData.append('priceAUD', Number(form.priceAUD));
    
    formData.append('level', form.level.toUpperCase());
    formData.append('featured', form.featured ? 'true' : 'false');
    
    if (form._imageFile) formData.append('image', form._imageFile);
    else if (form.image && typeof form.image === 'string') formData.append('image', form.image);

    try {
      if (selected) await updateCourse(selected.id, formData);
      else await addCourse(formData);
      setSaved(true);
      setTimeout(() => { setSaved(false); setView('list'); }, 1200);
    } catch (err) { console.error(err); alert('Error guardando el curso'); }
  };

  if (view === 'edit') return (
    <div className="min-h-screen bg-[#F9F5F0]">
      <div className="max-w-2xl mx-auto py-12 px-4">
        <button onClick={() => setView('list')} className="text-white text-sm mb-6 hover:underline">← Volver al listado</button>
        <div className="bg-white rounded-2xl border border-[#EDE4D6] p-8 shadow-sm">
          <h2 className="font-bold text-[#3D2B1F] text-xl mb-6">{selected ? 'Editar curso' : 'Nuevo curso'}</h2>
          {saved && <div className="bg-[#EAF0EA] text-[#5E8262] text-sm rounded-xl px-4 py-3 mb-4">✓ Guardado correctamente</div>}
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#6B4C3B] mb-1.5">Título</label>
              <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full border border-[#EDE4D6] rounded-xl px-4 py-2.5 bg-[#F9F5F0]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#6B4C3B] mb-1.5">Descripción corta</label>
              <input required value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full border border-[#EDE4D6] rounded-xl px-4 py-2.5 bg-[#F9F5F0]" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#6B4C3B] mb-1.5">Precio (ARS $)</label>
                <input type="number" required min={0} value={form.priceARS} onChange={e => setForm({ ...form, priceARS: e.target.value })} className="w-full border border-[#EDE4D6] rounded-xl px-4 py-2.5 bg-[#F9F5F0]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#6B4C3B] mb-1.5">Precio (AUD $)</label>
                <input type="number" required min={0} value={form.priceAUD} onChange={e => setForm({ ...form, priceAUD: e.target.value })} className="w-full border border-[#EDE4D6] rounded-xl px-4 py-2.5 bg-[#F9F5F0]" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#6B4C3B] mb-1.5">Nivel</label>
              <select value={form.level} onChange={e => setForm({ ...form, level: e.target.value })} className="w-full border border-[#EDE4D6] rounded-xl px-4 py-2.5 bg-[#F9F5F0]">
                {levels.map(l => <option key={l}>{l}</option>)}
              </select>
            </div>

            <button type="submit" className="w-full bg-[#3D2B1F] text-white py-3 rounded-xl font-semibold hover:bg-[#5C4535] transition-colors">
              {selected ? 'Guardar cambios' : 'Crear curso'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F9F5F0]">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-[#6B4C3B]">Gestión de cursos</h1>
          <button onClick={openNew} 
            style={{ backgroundColor: '#3D2B1F', color: 'white' }}
            className="bg-[#3D2B1F] hover:bg-[#5C4535] text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors">+ Nuevo curso
          </button>
        </div>
        <div className="space-y-3">
          {courses.map((course) => (
            <div key={course.id} className="bg-white rounded-2xl border border-[#EDE4D6] p-4 flex items-center justify-between">
              <h3 className="font-semibold text-[#3D2B1F]">{course.title}</h3>
              <div className="flex gap-2">
                <button onClick={() => openEdit(course)} className="text-[#7A9E7E] px-3 py-1 border border-[#7A9E7E] rounded-lg">Editar</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}