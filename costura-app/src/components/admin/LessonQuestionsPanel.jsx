// Panel de preguntas de alumnas por lección, usado en la edición del curso
// (rol profesora). Recibe el estado de useLessonComments resuelto por el padre.
export default function LessonQuestionsPanel({ lessonId, open, comments, drafts, sendingFor, onToggle, onSend, onDraftChange }) {
  return (
    <div className="pt-2 border-t border-border">
      <button
        type="button"
        onClick={() => onToggle(lessonId)}
        className="btn btn-ghost text-xs text-primary"
      >
        💬 {open ? 'Ocultar preguntas de alumnas' : 'Ver preguntas de alumnas'}
      </button>

      {open && (
        <div className="mt-3 bg-white rounded-xl border border-border p-3">
          {comments?.loading && (
            <p className="text-xs text-text-ink">Cargando...</p>
          )}
          {comments?.loaded && comments.items.length === 0 && (
            <p className="text-xs text-text-ink">Todavía no hay preguntas en esta lección.</p>
          )}
          {comments?.loaded && comments.items.length > 0 && (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1 mb-3">
              {comments.items.map(c => (
                <div key={c.id} className={`rounded-lg p-2.5 text-xs border ${c.user?.role === 'ADMIN' ? 'bg-primary-soft border-border-sage' : 'bg-bg-soft border-border'}`}>
                  <p className="font-bold text-text-ink mb-0.5">{c.user?.role === 'ADMIN' ? 'Vos (profesora)' : c.user?.name}</p>
                  <p className="text-text-ink">{c.message}</p>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input
              value={drafts[lessonId] || ''}
              onChange={e => onDraftChange(lessonId, e.target.value)}
              placeholder="Responder..."
              className="flex-1 p-2 rounded-lg border border-border text-sm"
            />
            <button
              type="button"
              onClick={() => onSend(lessonId, drafts[lessonId])}
              disabled={sendingFor === lessonId}
              className="btn btn-primary text-xs"
            >
              Enviar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}