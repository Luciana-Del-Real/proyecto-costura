import { Clock, Lock, Check } from 'lucide-react';
import LessonContent from './LessonContent';

// Fila del acordeón de lecciones (vista alumna, mobile): cabecera con estados
// bloqueado/completado que expande el contenido inline (LessonContent) al
// abrirse. En desktop el contenido lo muestra el panel derecho del layout de
// dos paneles (CourseDetail), no esta fila.
export default function LessonAccordionItem({
  lesson, idx, total, isOpen, blocked, completed,
  comments, drafts, sendingFor,
  onToggle, onComplete, onSendComment, onDraftChange, onNext,
}) {
  const canComplete = !completed && !blocked;

  return (
    <div id={`lesson-${lesson.id}`} className={`bg-white border rounded-2xl shadow-sm overflow-hidden transition-colors ${isOpen ? 'border-secondary' : 'border-border'}`}>
      {/* Cabecera de la lección */}
      <button
        onClick={() => onToggle(lesson, blocked)}
        disabled={blocked}
        className={`w-full flex items-center gap-3 p-4 lg:p-5 text-left ${blocked ? 'opacity-60 cursor-not-allowed' : 'hover:bg-bg-soft/60'} transition-colors`}
      >
        <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold ${
          completed ? 'bg-success text-white' : blocked ? 'bg-stone-200 text-stone-400' : 'bg-bg-soft text-text-ink'
        }`}>
          {completed ? <Check className="w-4 h-4" strokeWidth={2.5} /> : blocked ? <Lock className="w-4 h-4" strokeWidth={2} /> : idx + 1}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-text-ink truncate">{lesson.title}</p>
          <p className="text-xs text-accent mt-0.5 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" strokeWidth={1.5} /> {lesson.duration}
            {blocked && <span className="text-danger"> · Completá la lección anterior para desbloquear</span>}
          </p>
        </div>
        {!blocked && (
          <span className={`text-text-ink transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}>▾</span>
        )}
      </button>

      {/* Contenido de la lección, solo si está abierta */}
      {isOpen && !blocked && (
        <div className="border-t border-border p-4 lg:p-6">
          <LessonContent
            lesson={lesson}
            idx={idx}
            total={total}
            completed={completed}
            comments={comments}
            draft={drafts[lesson.id] || ''}
            sendingFor={sendingFor}
            onComplete={onComplete}
            onSendComment={onSendComment}
            onDraftChange={onDraftChange}
            onNext={onNext}
            canComplete={canComplete}
          />
        </div>
      )}
    </div>
  );
}