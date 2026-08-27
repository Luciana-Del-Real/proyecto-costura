// Formulario de nueva lección dentro de la edición de un curso (rol profesora).
// El estado del borrador y el submit viven en AdminCourseForm.
import FilePicker from '../FilePicker';

export default function NewLessonForm({ newLesson, setNewLesson, setPdfs, creating, onSubmit }) {
  return (
    <form onSubmit={onSubmit} className="p-4 space-y-3">
      <p className="text-sm font-bold text-text-ink">+ Agregar nueva lección</p>
      <input
        required
        placeholder="Título"
        value={newLesson.title}
        onChange={e => setNewLesson({ ...newLesson, title: e.target.value })}
        className="w-full p-2 rounded-lg border border-border"
      />
      <textarea
        required
        placeholder="Descripción"
        value={newLesson.description || ''}
        onChange={e => setNewLesson({ ...newLesson, description: e.target.value })}
        className="w-full p-2 rounded-lg border border-border h-20"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          required
          placeholder="Duración (ej. 12 min)"
          value={newLesson.duration}
          onChange={e => setNewLesson({ ...newLesson, duration: e.target.value })}
          className="w-full p-2 rounded-lg border border-border"
        />
        <input
          required
          placeholder="Link de video"
          value={newLesson.videoUrl}
          onChange={e => setNewLesson({ ...newLesson, videoUrl: e.target.value })}
          className="w-full p-2 rounded-lg border border-border"
        />
      </div>
      <div>
        <label className="block text-xs font-bold text-text-ink mb-2">📎 PDFs de la lección (podés elegir varios)</label>
        <FilePicker accept=".pdf" multiple onChange={e => setPdfs(Array.from(e.target.files))} />
      </div>
      <button type="submit" disabled={creating} className="btn btn-primary w-full text-sm">
        {creating ? 'Creando...' : '+ Crear lección'}
      </button>
    </form>
  );
}