import { useState } from 'react';
import { getImageUrl } from '../../utils/media';
import { FileText } from 'lucide-react';
import ImagePicker from '../ImagePicker';
import { useProgress } from '../../context/ProgressContext';
import LessonCommentsSection from './LessonCommentsSection';

// Contenido de una lección (descripción, video, PDFs descargables, botones de
// completar/avanzar y preguntas a la profesora). Se reutiliza en el acordeón
// (mobile) y en el panel derecho del layout de dos paneles (desktop), por eso
// el bloque vive fuera del ítem de acordeón.
//
// La acción "Marcar como completada" ahora pide EVIDENCIA: una imagen
// obligatoria (via ImagePicker) + una nota opcional. El envío va al contexto
// de progreso (multipart) y, al completarse, se muestra la evidencia guardada.
export default function LessonContent({
  lesson, idx, total, completed,
  comments, draft, sendingFor,
  onSendComment, onDraftChange, onNext, canComplete,
}) {
  const progressCtx = useProgress();
  const completeLesson = progressCtx?.completeLesson;
  const getLessonEvidence = progressCtx?.getLessonEvidence;

  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState('');
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const evidence = completed ? getLessonEvidence?.(lesson.courseId, lesson.id) : null;

  const pickImage = (file) => {
    setImage(file || null);
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : '';
    });
  };

  const clearImage = () => pickImage(null);

  const handleSubmit = async () => {
    if (!image || sending || !completeLesson) return;
    setSending(true);
    setError('');
    try {
      await completeLesson(lesson.id, { image, note: note.trim() });
      clearImage();
      setNote('');
    } catch (e) {
      setError(e?.message || 'No se pudo completar la lección. Probá de nuevo.');
    } finally {
      setSending(false);
    }
  };

  const allPdfs = [
    ...(lesson.pdf ? [{ id: 'legacy', filename: 'PDF de la lección', url: lesson.pdf }] : []),
    ...(lesson.attachments || []),
  ];

  return (
    <div className="space-y-5">
      {lesson.description && (
        <p className="text-sm text-text-ink leading-relaxed">{lesson.description}</p>
      )}

      {/* Video contenido (no a pantalla completa) */}
      {lesson.videoUrl && (
        <div className="max-w-xl mx-auto lg:mx-0">
          <div className="aspect-video rounded-2xl overflow-hidden bg-black shadow-md relative">
            <iframe
              src={lesson.videoUrl.replace('watch?v=', 'embed/')}
              title="Video de la lección"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute top-0 left-0 w-full h-full"
            />
          </div>
        </div>
      )}

      {/* PDFs de la lección */}
      {allPdfs.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-wide text-accent mb-2">Material descargable</p>
          <div className="space-y-2">
            {allPdfs.map(att => (
              <a
                key={att.id}
                href={getImageUrl(att.url)}
                target="_blank"
                rel="noreferrer"
                className="btn btn-ghost text-sm w-fit flex items-center gap-1.5"
              >
                <FileText className="w-4 h-4" strokeWidth={1.5} /> {att.filename || 'Ver PDF'}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Preguntas a la profesora (real, conectado al backend) */}
      <LessonCommentsSection
        lessonId={lesson.id}
        comments={comments}
        draft={draft}
        sendingFor={sendingFor}
        onSend={onSendComment}
        onDraftChange={onDraftChange}
      />

      {/* Marcar como completada (con evidencia) / estado completado + evidencia */}
      {completed ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="btn bg-success text-white text-sm font-semibold inline-flex items-center gap-1.5">
              ✓ Completada
            </span>
            {idx < total - 1 && (
              <button
                onClick={onNext}
                className="btn btn-ghost text-sm"
              >
                Ir a la siguiente lección →
              </button>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-white p-4 space-y-3">
            <p className="text-xs uppercase tracking-wide text-accent">Evidencia de la muestra</p>
            {evidence?.image ? (
              <a href={getImageUrl(evidence.image)} target="_blank" rel="noreferrer" className="block w-fit">
                <img
                  src={getImageUrl(evidence.image)}
                  alt="Evidencia de la lección"
                  className="max-h-64 rounded-xl border border-border object-contain"
                />
              </a>
            ) : (
              <p className="text-sm text-text-ink opacity-70">
                Esta lección se completó antes de que la evidencia fuera obligatoria.
              </p>
            )}
            {evidence?.note && (
              <p className="text-sm text-text-ink whitespace-pre-line">{evidence.note}</p>
            )}
          </div>
        </div>
      ) : (
        <div data-testid="lesson-evidence-form" className="rounded-2xl border border-border bg-white p-4 space-y-3">
          <ImagePicker preview={preview} onPick={pickImage} onRemove={clearImage} />
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="Nota opcional (qué aprendiste, dudas, detalles de tu muestra...)"
            className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm text-text-ink focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleSubmit}
              disabled={!canComplete || !image || sending}
              className={`btn text-sm font-semibold ${
                !canComplete
                  ? 'bg-stone-200 text-stone-500 cursor-not-allowed'
                  : !image || sending
                  ? 'bg-stone-200 text-stone-500 cursor-not-allowed'
                  : 'bg-primary text-white hover:bg-primary-hover'
              }`}
            >
              {sending ? 'Guardando...' : 'Marcar como completada'}
            </button>
            {canComplete && !image && (
              <span className="text-xs text-accent">Seleccioná una imagen para habilitar el botón.</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
