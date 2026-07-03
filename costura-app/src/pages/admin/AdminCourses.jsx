import { useState, useEffect } from 'react';
import { useCourses } from '../../context/CoursesContext';

const EMPTY_COURSE = {
  title: '', description: '', longDescription: '', 
  priceARS: '', priceAUD: '',
  level: 'Principiante', image: '', instructor: '', duration: '',
  featured: false, lessons: [], 
};

const levels = ['Principiante', 'Intermedio', 'Avanzado'];

export default function AdminCourses() {
  const { courses, updateCourse, addCourse, getAllPurchases } = useCourses();
  
  const [view, setView] = useState('list');
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY_COURSE);
  const [imageFile, setImageFile] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [saved, setSaved] = useState(false);

  const openEdit = (course) => { setSelected(course); setForm({ ...course }); setView('edit'); setSaved(false); };
  const openNew = () => { setSelected(null); setForm(EMPTY_COURSE); setView('edit'); setSaved(false); };

  const addLesson = () => {
    setForm({ ...form, lessons: [...form.lessons, { title: '', description: '', pdfFile: null }] });
  };

  const removeLesson = (index) => {
    const newLessons = form.lessons.filter((_, i) => i !== index);
    setForm({ ...form, lessons: newLessons });
  };

  const updateLesson = (index, field, value) => {
    const newLessons = [...form.lessons];
    newLessons[index][field] = value;
    setForm({ ...form, lessons: newLessons });
  };

const handleSave = async (e) => {
  e.preventDefault();
  const formData = new FormData();
  
  // 1. Datos básicos
  formData.append('title', form.title);
  formData.append('description', form.description);
  formData.append('priceARS', Number(form.priceARS));
  formData.append('priceAUD', Number(form.priceAUD));
  formData.append('level', form.level);
  if (imageFile) formData.append('image', imageFile);

  try {
    // 2. Guardar curso (esto sí pasa por el interceptor de archivos)
    const course = selected 
      ? await updateCourse(selected.id, formData) 
      : await addCourse(formData);
    
    const courseId = selected ? selected.id : course.id;

    // 3. NUEVO: Enviar lecciones por separado como JSON puro
    // Usamos un endpoint nuevo o una lógica separada
    await fetch(`/api/courses/${courseId}/lessons`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form.lessons)
    });
    
    setSaved(true);
    setTimeout(() => { setSaved(false); setView('list'); }, 1200);
  } catch (err) { 
    console.error(err); 
    alert('Error guardando el curso'); 
  }
};
  if (view === 'edit') return (
    <div className="min-h-screen bg-[#F9F5F0] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <button onClick={() => setView('list')} className="text-white text-sm mb-6 hover:underline">← Volver al listado</button>
        <div className="bg-white rounded-2xl border border-[#EDE4D6] p-8 shadow-sm">
          <h2 className="font-bold text-[#6B4C3B] text-xl mb-6">{selected ? 'Editar curso' : 'Nuevo curso'}</h2>
          
          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-[#4E6D5B] mb-1.5">Título</label>
              <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full border-2 border-[#EDE4D6] rounded-xl px-4 py-3 bg-white shadow-sm focus:border-[#4E6D5B] focus:ring-2 focus:ring-[#4E6D5B]/20 outline-none transition-all" />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#4E6D5B] mb-1.5">Descripción</label>
              <input required value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full border-2 border-[#EDE4D6] rounded-xl px-4 py-3 bg-white shadow-sm focus:border-[#4E6D5B] focus:ring-2 focus:ring-[#4E6D5B]/20 outline-none transition-all" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-[#4E6D5B] mb-1.5">Precio (ARS $)</label>
                <input type="number" required value={form.priceARS} onChange={e => setForm({ ...form, priceARS: e.target.value })} className="w-full border-2 border-[#EDE4D6] rounded-xl px-4 py-3 bg-white shadow-sm focus:border-[#4E6D5B] focus:ring-2 focus:ring-[#4E6D5B]/20 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#4E6D5B] mb-1.5">Precio (AUD $)</label>
                <input type="number" required value={form.priceAUD} onChange={e => setForm({ ...form, priceAUD: e.target.value })} className="w-full border-2 border-[#EDE4D6] rounded-xl px-4 py-3 bg-white shadow-sm focus:border-[#4E6D5B] focus:ring-2 focus:ring-[#4E6D5B]/20 outline-none transition-all" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-[#4E6D5B] mb-1.5">Nivel</label>
              <select value={form.level} onChange={e => setForm({ ...form, level: e.target.value })} className="w-full border-2 border-[#EDE4D6] rounded-xl px-4 py-3 bg-white shadow-sm focus:border-[#4E6D5B] focus:ring-2 focus:ring-[#4E6D5B]/20 outline-none transition-all">
                {levels.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-[#4E6D5B] mb-1.5">Portada del curso</label>
              <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files[0])} className="w-full" />
            </div>

            <div>
              <label className="block text-sm font-bold text-[#4E6D5B] mb-1.5">PDFs Adjuntos</label>
              <input type="file" multiple accept=".pdf" onChange={e => setAttachments(Array.from(e.target.files))} className="w-full" />
            </div>

            {/* SECCIÓN DE LECCIONES */}
            <div className="border-t border-[#EDE4D6] pt-6 mt-6">
              <h3 className="font-bold text-[#6B4C3B] mb-4">Lecciones</h3>
              {form.lessons.map((lesson, index) => (
                <div key={index} className="bg-[#F9F5F0] p-4 rounded-xl mb-4 border-2 border-[#EDE4D6] flex flex-col gap-2">
                  <div className="flex justify-end">
                    <button type="button" onClick={() => removeLesson(index)} className="bg-[#4E6D5B] text-white px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-[#4E6D5B] transition-colors">
                      Eliminar
                    </button>
                  </div>
                  <input placeholder="Título" value={lesson.title} onChange={e => updateLesson(index, 'title', e.target.value)} className="w-full p-2.5 rounded-lg border-2 border-[#EDE4D6] bg-white text-sm" />
                  <input placeholder="Descripción" value={lesson.description} onChange={e => updateLesson(index, 'description', e.target.value)} className="w-full p-2.5 rounded-lg border-2 border-[#EDE4D6] bg-white text-sm" />
                  <input type="file" accept=".pdf" onChange={e => updateLesson(index, 'pdfFile', e.target.files[0])} className="w-full text-xs p-2 border-2 border-[#EDE4D6] rounded-lg bg-white" />
                </div>
              ))}
              <button type="button" onClick={addLesson} className="w-full py-3 border-2 border-[#4E6D5B] bg-[#4E6D5B] text-white font-bold rounded-xl text-sm">+ Agregar lección</button>
            </div>

            <button type="submit" className="w-full bg-[#4E6D5B] text-white py-3 rounded-xl font-bold hover:bg-[#5E8262] transition-colors shadow-lg">
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
            <button onClick={openNew} className="bg-[#4E6D5B] text-white px-5 py-2.5 rounded-xl text-sm font-bold">+ Nuevo curso</button>
            </div>
            <div className="space-y-3">
            {courses.map((course) => (
                <div key={course.id} className="bg-white rounded-2xl border border-[#EDE4D6] p-5 flex items-center justify-between shadow-sm">
                <h3 className="font-bold text-[#6B4C3B]">{course.title}</h3>
                <button onClick={() => openEdit(course)} className="bg-[#4E6D5B] text-white px-5 py-2.5 rounded-xl text-sm font-bold">Editar</button>
                </div>
            ))}
            </div>
        </div>
    </div>
  );
}