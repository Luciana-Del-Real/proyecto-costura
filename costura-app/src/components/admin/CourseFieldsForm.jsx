import CourseAttachmentsSection from './CourseAttachmentsSection';

// Campos generales del curso (título/descripción/precios/nivel) + sección de
// adjuntos + botón de guardado. El estado y el submit viven en
// AdminCourseForm; acá solo se reciben y se reparten a los subcomponentes.
export default function CourseFieldsForm({ form, onChange, saving, isEditing, onSubmit, setImageFile, coursePdfFiles, setCoursePdfFiles, course, onDeleteAttachment }) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-bold text-black mb-1.5">Título y Descripción</label>
        <input required value={form.title} onChange={e => onChange({ ...form, title: e.target.value })} placeholder="Título" className="w-full border-2 border-border rounded-xl px-4 py-3 mb-3" />
        <textarea required value={form.description} onChange={e => onChange({ ...form, description: e.target.value })} placeholder="Descripción general" className="w-full border-2 border-border rounded-xl px-4 py-3" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <input type="number" required min={0} placeholder="Precio ARS" value={form.priceARS} onChange={e => onChange({ ...form, priceARS: e.target.value })} className="border-2 border-border rounded-xl px-4 py-3" />
        <input type="number" required min={0} placeholder="Precio AUD" value={form.priceAUD} onChange={e => onChange({ ...form, priceAUD: e.target.value })} className="border-2 border-border rounded-xl px-4 py-3" />
      </div>

      <div>
        <label className="block text-sm font-bold text-black mb-1.5">Nivel</label>
        <select value={form.level} onChange={e => onChange({ ...form, level: e.target.value })} className="w-full border-2 border-border rounded-xl px-4 py-3">
          <option>Principiante</option>
          <option>Intermedio</option>
          <option>Avanzado</option>
        </select>
      </div>

      <CourseAttachmentsSection
        setImageFile={setImageFile}
        coursePdfFiles={coursePdfFiles}
        setCoursePdfFiles={setCoursePdfFiles}
        course={course}
        isEditing={isEditing}
        onDeleteAttachment={onDeleteAttachment}
      />

      <button type="submit" disabled={saving} className="btn btn-primary w-full">
        {saving ? 'Guardando...' : (isEditing ? 'Guardar' : 'Crear curso')}
      </button>
    </form>
  );
}