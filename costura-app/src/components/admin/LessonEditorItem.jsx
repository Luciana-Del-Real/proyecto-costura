import { getImageUrl } from '../../utils/media';
import FilePicker from '../FilePicker';

// Fila de edición de una lección existente en el curso (rol profesora):
// campos editables, PDFs a subir/ya subidos y botones de guardar/eliminar.
export default function LessonEditorItem({
  lesson, editedLessons, onFieldChange, onLessonPdfChange,
  savingLessonId, onSaveLesson, onDeleteLesson, onDeleteLessonAttachment,
}) {
  const getLessonField = (field) =>
    editedLessons[lesson.id]?.[field] ?? lesson[field];

  return (
    <div id={`lesson-${lesson.id}`} className="card-glow p-4 rounded-xl space-y-3">
      <input
        placeholder="Título"
        value={getLessonField('title')}
        onChange={e => onFieldChange(lesson.id, 'title', e.target.value)}
        className="w-full p-2 rounded-lg border border-border"
      />
      <textarea
        placeholder="Descripción"
        value={getLessonField('description') || ''}
        onChange={e => onFieldChange(lesson.id, 'description', e.target.value)}
        className="w-full p-2 rounded-lg border border-border h-20"
      />
      <div className="grid grid-cols-2 gap-3">
        <input
          placeholder="Duración (ej. 12 min)"
          value={getLessonField('duration')}
          onChange={e => onFieldChange(lesson.id, 'duration', e.target.value)}
          className="w-full p-2 rounded-lg border border-border"
        />
        <input
          placeholder="Link de video"
          value={getLessonField('videoUrl')}
          onChange={e => onFieldChange(lesson.id, 'videoUrl', e.target.value)}
          className="w-full p-2 rounded-lg border border-border"
        />
      </div>

      <div className="p-3 bg-white rounded-xl border border-border">
        <label className="block text-xs font-bold text-text-ink mb-2">📎 Agregar PDFs a esta lección (podés elegir varios)</label>
        <FilePicker accept=".pdf" multiple onChange={e => onLessonPdfChange(lesson.id, Array.from(e.target.files))} />
        {lesson.attachments?.length > 0 && (
          <div className="mt-3 space-y-2">
            {lesson.attachments.map(att => (
              <div key={att.id} className="flex items-center justify-between bg-white border border-border rounded-lg px-3 py-2">
                <a href={getImageUrl(att.url)} target="_blank" rel="noreferrer" className="text-sm text-primary underline truncate">{att.filename}</a>
                <button type="button" onClick={() => onDeleteLessonAttachment(att.id)} className="text-danger text-xs font-bold hover:underline flex-shrink-0 ml-3">Eliminar</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-1">
        <button type="button" onClick={() => onDeleteLesson(lesson.id)} className="btn btn-danger text-sm">Eliminar lección</button>
        <button
          type="button"
          onClick={() => onSaveLesson(lesson)}
          disabled={savingLessonId === lesson.id}
          className="btn btn-ghost text-sm text-danger"
        >
          {savingLessonId === lesson.id ? 'Guardando...' : 'Guardar lección'}
        </button>
      </div>
    </div>
  );
}