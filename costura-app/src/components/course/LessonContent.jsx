import { getImageUrl } from '../../utils/media';
import { FileText } from 'lucide-react';
import LessonCommentsSection from './LessonCommentsSection';

// Contenido de una lección (descripción, video, PDFs descargables, botones de
// completar/avanzar y preguntas a la profesora). Componente presentacional:
// no maneja estado, todo llega por props. Se reutiliza en el acordeón (mobile)
// y en el panel derecho del layout de dos paneles (desktop), por eso el bloque
// vive fuera del ítem de acordeón.
export default function LessonContent({
  lesson, idx, total, completed,
  comments, draft, sendingFor,
  onComplete, onSendComment, onDraftChange, onNext, canComplete,
}) {
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

      {/* Marcar como completada / avanzar */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => onComplete(lesson.id)}
          disabled={!canComplete}
          className={`btn text-sm font-semibold ${
            completed
              ? 'bg-success text-white'
              : canComplete
              ? 'bg-primary text-white hover:bg-primary-hover'
              : 'bg-stone-200 text-stone-500 cursor-not-allowed'
          }`}
        >
          {completed ? '✓ Completada' : 'Marcar como completada'}
        </button>
        {completed && idx < total - 1 && (
          <button
            onClick={onNext}
            className="btn btn-ghost text-sm"
          >
            Ir a la siguiente lección →
          </button>
        )}
      </div>

      {/* Preguntas a la profesora (real, conectado al backend) */}
      <LessonCommentsSection
        lessonId={lesson.id}
        comments={comments}
        draft={draft}
        sendingFor={sendingFor}
        onSend={onSendComment}
        onDraftChange={onDraftChange}
      />
    </div>
  );
}