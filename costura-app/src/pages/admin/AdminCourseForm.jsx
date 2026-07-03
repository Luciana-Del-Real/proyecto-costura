import { useState, useEffect } from 'react';
import { useCourses } from '../../context/CoursesContext';
import { useNavigate, useParams } from 'react-router-dom';

const EMPTY_COURSE = {
  title: '', description: '', priceARS: '', priceAUD: '',
  level: 'Principiante', image: '', lessons: [], 
};

export default function AdminCourseForm() {
  const { courses, addCourse, updateCourse } = useCourses();
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY_COURSE);
  const [imageFile, setImageFile] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);

  useEffect(() => {
    if (id) {
      const courseToEdit = courses.find((c) => c.id === id);
      if (courseToEdit) setForm(courseToEdit);
    }
  }, [id, courses]);

  const handleSave = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('title', form.title);
    formData.append('description', form.description);
    formData.append('priceARS', Number(form.priceARS));
    formData.append('priceAUD', Number(form.priceAUD));
    if (imageFile) formData.append('image', imageFile);
    if (pdfFile) formData.append('pdfGuide', pdfFile);

    try {
      const course = id ? await updateCourse(id, formData) : await addCourse(formData);
      await fetch(`/api/courses/${id || course.id}/lessons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form.lessons)
      });
      navigate('/admin/courses');
    } catch (err) { alert('Error guardando'); }
  };

  const addLesson = () => setForm({ ...form, lessons: [...form.lessons, { title: '', description: '', youtubeUrl: '', pdfFile: null }] });
  
  const removeLesson = (index) => {
    const newLessons = form.lessons.filter((_, i) => i !== index);
    setForm({ ...form, lessons: newLessons });
  };

  const updateLesson = (index, field, value) => {
    const newLessons = [...form.lessons];
    newLessons[index][field] = value;
    setForm({ ...form, lessons: newLessons });
  };

  return (
    <div className="min-h-screen bg-[#F9F5F0] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <button onClick={() => navigate(-1)} className="text-white mb-6 hover:underline font-bold">← Volver atrás</button>
        
        <div className="bg-white rounded-2xl border border-[#EDE4D6] p-8 shadow-sm">
          <h2 className="font-bold text-[#6B4C3B] text-2xl mb-8 border-b pb-4">{id ? 'Editar curso' : 'Nuevo curso'}</h2>
          
          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-black mb-1.5">Título y Descripción</label>
              <input required value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Título" className="w-full border-2 border-[#EDE4D6] rounded-xl px-4 py-3 mb-3" />
              <textarea required value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Descripción general" className="w-full border-2 border-[#EDE4D6] rounded-xl px-4 py-3" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <input type="number" placeholder="Precio ARS" value={form.priceARS} onChange={e => setForm({...form, priceARS: e.target.value})} className="border-2 border-[#EDE4D6] rounded-xl px-4 py-3" />
              <input type="number" placeholder="Precio AUD" value={form.priceAUD} onChange={e => setForm({...form, priceAUD: e.target.value})} className="border-2 border-[#EDE4D6] rounded-xl px-4 py-3" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="bg-[#F9F5F0] p-4 rounded-xl border border-[#EDE4D6]">
                <label className="block text-sm font-bold text-black mb-2">🖼️ Portada</label>
                <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files[0])} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#4E6D5B] file:text-white hover:file:bg-[#3e5849] cursor-pointer" />
              </div>
              <div className="bg-[#F9F5F0] p-4 rounded-xl border border-[#EDE4D6]">
                <label className="block text-sm font-bold text-black mb-2">📄 PDF del curso</label>
                <input type="file" accept=".pdf" onChange={e => setPdfFile(e.target.files[0])} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#4E6D5B] file:text-white hover:file:bg-[#3e5849] cursor-pointer" />
              </div>
            </div>

            {/* Lecciones */}
            <div className="border-t pt-6">
              <h3 className="font-bold text-[#6B4C3B] text-xl mb-4">Lecciones</h3>
              {form.lessons.map((lesson, index) => (
                <div key={index} className="bg-[#F9F5F0] p-4 rounded-xl mb-4 space-y-3 border border-[#EDE4D6]">
                  <input placeholder="Título de lección" value={lesson.title} onChange={e => updateLesson(index, 'title', e.target.value)} className="w-full p-2 rounded-lg" />
                  <input placeholder="Descripción de lección" value={lesson.description} onChange={e => updateLesson(index, 'description', e.target.value)} className="w-full p-2 rounded-lg" />
                  <input placeholder="Link de YouTube" value={lesson.youtubeUrl} onChange={e => updateLesson(index, 'youtubeUrl', e.target.value)} className="w-full p-2 rounded-lg" />
                  
                  {/* Input de PDF por lección */}
                  <div className="mt-4 p-4 bg-white rounded-xl border border-[#EDE4D6]">
  <label className="block text-xs font-bold text-[#6B4C3B] mb-2">📄 PDF de la lección</label>
  <input 
    type="file" 
    accept=".pdf" 
    onChange={e => updateLesson(index, 'pdfFile', e.target.files[0])} 
    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#4E6D5B] file:text-white hover:file:bg-[#3e5849] cursor-pointer" 
  />
</div>

                  <button type="button" onClick={() => removeLesson(index)} className="text-red-600 text-xs font-bold hover:underline">Eliminar lección</button>
                </div>
              ))}
              <button type="button" onClick={addLesson} className="w-full py-3 bg-[#6B4C3B] text-white font-bold rounded-xl text-sm">+ Agregar lección</button>
            </div>

            <button type="submit" className="w-full bg-[#4E6D5B] text-white py-3 rounded-xl font-bold">Guardar Cambios</button>
          </form>
        </div>
      </div>
    </div>
  );
}