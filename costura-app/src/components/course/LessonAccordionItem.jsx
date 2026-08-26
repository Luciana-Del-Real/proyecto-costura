import { getImageUrl } from '../../utils/media';
import LessonCommentsSection from './LessonCommentsSection';

// Fila del acordeón de lecciones (vista alumna): cabecera con estados
// bloqueado/completado, video, PDFs descargables, botones de completar/avanzar
// y el bloque de preguntas a la profesora.
export default function LessonAccordionItem({
  lesson, idx, total, isOpen, blocked, completed,
  comments, drafts, sendingFor,
  onToggle, onComplete, onSendComment, onDraftChange, onNext,
}) {
  const canComplete = !completed && !blocked;
  const allPdfs = [
    ...(lesson.pdf ? [{ id: 'legacy', filename: 'PDF de la lección', url: lesson.pdf }] : []),
    ...(lesson.attachments || []),
  ];

  return (
    <div className={`bg-white border rounded-2xl shadow-sm overflow-hidden transition-colors ${isOpen ? 'border-secondary' : 'border-border'}`}>
      {/* Cabecera de la lección */}
      <button
        onClick={() => onToggle(lesson, blocked)}
        disabled={blocked}
        className={`w-full flex items-center gap-3 p-4 lg:p-5 text-left ${blocked ? 'opacity-60 cursor-not-allowed' : 'hover:bg-bg-soft/60'} transition-colors`}
      >
        <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold ${
          completed ? 'bg-success text-white' : blocked ? 'bg-stone-200 text-stone-400' : 'bg-bg-soft text-text-ink'
        }`}>
          {completed ? '✓' : blocked ? '🔒' : idx + 1}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-text-ink truncate">{lesson.title}</p>
          <p className="text-xs text-accent mt-0.5">
            ⏱ {lesson.duration}
            {blocked && <span className="text-danger"> · Completá la lección anterior para desbloquear</span>}
          </p>
        </div>
        {!blocked && (
          <span className={`text-text-ink transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}>▾</span>
        )}
      </button>

      {/* Contenido de la lección, solo si está abierta */}
      {isOpen && !blocked && (
        <div className="border-t border-border p-4 lg:p-6 space-y-5">
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
                    className="btn btn-ghost text-sm w-fit"
                  >
                    📄 {att.filename || 'Ver PDF'}
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
            draft={drafts[lesson.id] || ''}
            sendingFor={sendingFor}
            onSend={onSendComment}
            onDraftChange={onDraftChange}
          />
        </div>
      )}
    </div>
  );
}