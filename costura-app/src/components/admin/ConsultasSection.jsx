import { useMemo, useState } from 'react';
import useAdminComments from '../../hooks/useAdminComments';
import CommentThread from '../CommentThread';

// Bandeja de consultas del admin: vista pura sobre useAdminComments (fetch,
// filtros, partición y envío viven en el hook). Acá quedan encabezados,
// filtros, toggle de respondidas y estado de envío del formulario inline.
export default function ConsultasSection() {
  const {
    items, filters, setCourseFilter, setStudentFilter,
    courseOptions, unanswered, answered, loading, error, reply,
  } = useAdminComments();
  const [sending, setSending] = useState(false);
  const [showAnswered, setShowAnswered] = useState(false);
  const [replyPreview, setReplyPreview] = useState('');

  const answeredIds = useMemo(() => new Set(answered.map(({ q }) => q.id)), [answered]);

  const updateReplyPreview = (file) => {
    setReplyPreview(prev => {
      if (prev) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : '';
    });
  };
  const clearReplyImage = () => updateReplyPreview(null);

  const handleReply = async (comment, message, imageFile) => {
    setSending(true);
    try {
      await reply(comment.lesson.id, comment.id, message, imageFile);
      return true;
    } catch (e) {
      console.error(e);
      alert('No se pudo enviar la respuesta');
      return false;
    } finally {
      setSending(false);
    }
  };

  const labels = {
    admin: 'Profesora',
    author: (c) => c.user?.name || 'Alumna',
    date: true,
    reply: 'Responder', cancel: 'Cancelar', send: 'Enviar',
    placeholder: 'Escribí tu respuesta...',
    badge: (c) => c.parentId ? null : (
      <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${answeredIds.has(c.id) ? 'bg-success/10 text-success' : 'bg-primary-soft text-primary'}`}>
        {answeredIds.has(c.id) ? 'Respondida' : 'Sin responder'}
      </span>
    ),
  };

  // Hilo completo de una lección; el admin solo responde, nunca pregunta.
  const threadFor = (lessonId) =>
    items.filter(c => c.lesson?.id === lessonId && !(c.user?.role === 'ADMIN' && !c.parentId));

  const renderGroup = (group) => (
    <div key={`${group.course.id}-${group.lesson.id}`} className="mb-4">
      <p className="text-xs font-bold uppercase tracking-wide text-text-ink mb-1">{group.course.title}</p>
      <p className="text-xs text-accent mb-2">{group.lesson.title}</p>
      <CommentThread
        items={threadFor(group.lesson.id)}
        onReply={handleReply}
        labels={labels}
        canReply
        replySending={sending}
        image={{ preview: replyPreview, onChange: updateReplyPreview, onRemove: clearReplyImage }}
      />
    </div>
  );

  const groupItems = (list) => {
    const groups = [];
    for (const item of list) {
      const last = groups[groups.length - 1];
      if (last && last.course.id === item.course.id && last.lesson.id === item.lesson.id) last.questions.push(item.q);
      else groups.push({ course: item.course, lesson: item.lesson, questions: [item.q] });
    }
    return groups;
  };

  return (
    <div id="consultas" className="card-flat rounded-xl p-6 mt-6">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="font-display font-bold text-text-ink text-2xl">Consultas</h2>
          <p className="font-dancing text-xl text-primary leading-tight">Consultas de tus alumnas</p>
        </div>
        <span className="text-xs font-bold bg-primary-soft text-primary px-3 py-1 rounded-full">
          {unanswered.length} sin responder
        </span>
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <select
          value={filters.course}
          onChange={e => setCourseFilter(e.target.value)}
          className="border border-border rounded-xl px-3 py-2 text-sm bg-white text-text-ink"
        >
          <option value="all">Todos los cursos</option>
          {courseOptions.map(c => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
        <input
          type="text"
          value={filters.student}
          onChange={e => setStudentFilter(e.target.value)}
          placeholder="Filtrar por alumna..."
          className="border border-border rounded-xl px-3 py-2 text-sm bg-white text-text-ink focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {loading && <p className="text-sm text-accent">Cargando consultas...</p>}
      {!loading && error && <p className="text-sm text-danger">No se pudieron cargar las consultas.</p>}

      {!loading && !error && unanswered.length === 0 && answered.length === 0 && (
        <p className="text-sm text-text-ink">Sin consultas todavía.</p>
      )}

      {!loading && !error && unanswered.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-wide text-primary mb-3">Sin responder</p>
          {groupItems(unanswered).map(renderGroup)}
        </div>
      )}

      {!loading && !error && answered.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setShowAnswered(s => !s)}
            className="text-sm text-primary hover:text-primary-hover font-medium mb-3"
          >
            {showAnswered ? '▾ Ocultar respondidas' : `▸ Ver respondidas (${answered.length})`}
          </button>
          {showAnswered && (
            <div className="mt-3">
              <p className="text-xs font-bold uppercase tracking-wide text-text-ink mb-3">Respondidas</p>
              {groupItems(answered).map(renderGroup)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}