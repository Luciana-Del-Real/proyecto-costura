// Bloque de preguntas a la profesora dentro de una lección del curso
// (vista alumna). Recibe el estado de useLessonComments resuelto por el padre.
export default function LessonCommentsSection({ lessonId, comments, draft, sendingFor, onSend, onDraftChange }) {
  return (
    <div className="card-glow rounded-2xl p-4 lg:p-5">
      <h4 className="font-bold text-text-ink text-sm mb-3">Preguntas sobre esta lección</h4>

      {comments?.loading && (
        <p className="text-sm text-accent">Cargando...</p>
      )}

      {comments?.loaded && comments.items.length === 0 && (
        <p className="text-sm text-accent mb-3">Todavía no hay preguntas en esta lección. La profesora va a responder acá cuando dejes la tuya.</p>
      )}

      {comments?.loaded && comments.items.length > 0 && (
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1 mb-3">
          {comments.items.map(c => (
            <div
              key={c.id}
              className={`rounded-xl p-3 border text-sm ${c.user?.role === 'ADMIN' ? 'bg-white border-border' : 'bg-white border-border-sage ml-4 sm:ml-8'}`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="text-xs font-bold uppercase tracking-wide text-accent">
                  {c.user?.role === 'ADMIN' ? 'Profesora' : 'Vos'}
                </p>
                <p className="text-[11px] text-accent/70">{c.user?.name}</p>
              </div>
              <p className="text-text-ink leading-relaxed">{c.message}</p>
            </div>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => { e.preventDefault(); onSend(lessonId, draft); }}
        className="space-y-2"
      >
        <textarea
          value={draft}
          onChange={(e) => onDraftChange(lessonId, e.target.value)}
          rows={2}
          placeholder="Escribí tu duda sobre esta lección..."
          className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm text-text-ink focus:outline-none focus:ring-2 focus:ring-secondary/30"
        />
        <button
          type="submit"
          disabled={sendingFor === lessonId}
          className="btn btn-primary text-sm font-semibold"
        >
          {sendingFor === lessonId ? 'Enviando...' : 'Enviar pregunta'}
        </button>
      </form>
    </div>
  );
}