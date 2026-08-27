import { getImageUrl } from '../../utils/media';
import FilePicker from '../FilePicker';

// Sección de adjuntos del curso dentro del formulario: portada + PDFs
// generales (nuevos a subir y ya subidos). El estado de archivos y el delete
// viven en AdminCourseForm; acá solo se reciben y se renderizan.
export default function CourseAttachmentsSection({ setImageFile, coursePdfFiles, setCoursePdfFiles, course, isEditing, onDeleteAttachment }) {
  return (
    <>
      <div className="bg-white border border-border rounded-xl p-4 md:col-span-2">
        <label className="block text-sm font-bold text-black mb-2">📷 Portada</label>
        <FilePicker accept="image/*" onChange={e => setImageFile(e.target.files[0])} />
      </div>
      {/* PDFs adicionales del curso (multiples) */}
      <div className="bg-white border border-border rounded-xl p-4">
        <label className="block text-sm font-bold text-black mb-2">📎 PDF's (podés elegir varios)</label>
        <FilePicker accept=".pdf" multiple onChange={e => setCoursePdfFiles(Array.from(e.target.files))} />
        {coursePdfFiles.length > 0 && (
          <p className="text-xs text-text-ink mt-2">{coursePdfFiles.length} archivo(s) seleccionados para subir al guardar.</p>
        )}

        {isEditing && course?.attachments?.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-bold text-text-ink">PDFs ya subidos:</p>
            {course.attachments.map(att => (
              <div key={att.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-border">
                <a href={getImageUrl(att.url)} target="_blank" rel="noreferrer" className="text-sm text-primary underline truncate">{att.filename}</a>
                <button type="button" onClick={() => onDeleteAttachment(att.id)} className="text-danger text-xs font-bold hover:underline flex-shrink-0 ml-3">Eliminar</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}