import { Clock, Lock, Check } from 'lucide-react';

// Fila compacta de la lista de lecciones del panel izquierdo (desktop):
// misma cabecera visual que el acordeón (círculo con número/check/lock,
// título, duración y hint de bloqueo) pero sin contenido inline y sin chevron.
// El estado activo reemplaza al giro del chevron: la fila seleccionada se
// resalta y su contenido se muestra en el panel derecho.
export default function LessonListItem({ lesson, idx, isActive, blocked, completed, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={blocked}
      className={`w-full flex items-center gap-3 p-4 text-left bg-white border rounded-xl transition-colors ${
        isActive
          ? 'border-secondary bg-secondary/10'
          : blocked
          ? 'border-border opacity-60 cursor-not-allowed'
          : 'border-border hover:bg-bg-soft/60'
      }`}
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
    </button>
  );
}