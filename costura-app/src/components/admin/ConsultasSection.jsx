import { useEffect, useMemo, useState } from 'react';
import { get, post, postForm } from '../../services/api';
import { groupCommentsByParent } from '../../utils/commentTree';
import { getImageUrl } from '../../utils/media';
import ImagePicker from '../ImagePicker';

// Bandeja de consultas del dashboard del admin: todas las preguntas de las
// alumnas agrupadas por curso → lección, sin responder primero (FIFO), con
// respuesta inline (mismo contrato de hilos que el editor de curso) y filtros
// por curso y por alumna. Una consulta está respondida cuando tiene algún
// descendiente escrito por un ADMIN.
export default function ConsultasSection() {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [courseFilter, setCourseFilter] = useState('all');
  const [studentFilter, setStudentFilter] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyDraft, setReplyDraft] = useState('');
  const [replyImage, setReplyImage] = useState(null);
  const [replyPreview, setReplyPreview] = useState('');
  const [sending, setSending] = useState(false);
  const [showAnswered, setShowAnswered] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await get('/admin/comments');
      setComments(data);
      setError(false);
    } catch (e) {
      console.error('Error cargando consultas:', e);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const { childrenOf, topLevel } = useMemo(() => groupCommentsByParent(comments), [comments]);

  const hasAdminDescendant = (commentId, depth = 0) => {
    if (depth > 8) return false;
    const replies = childrenOf.get(commentId) || [];
    for (const r of replies) {
      if (r.user?.role === 'ADMIN') return true;
      if (hasAdminDescendant(r.id, depth + 1)) return true;
    }
    return false;
  };

  // Agrupar por curso → lección → preguntas (top-level). Solo las preguntas de
  // alumnas son consultas; los comentarios del admin solo aparecen como
  // respuestas dentro de un hilo (renderReply), nunca como pregunta.
  const byCourse = useMemo(() => {
    const map = new Map();
    for (const c of topLevel) {
      if (c.user?.role === 'ADMIN') continue;
      const courseId = c.lesson?.course?.id || 'sin-curso';
      const courseTitle = c.lesson?.course?.title || 'Sin curso';
      const lessonId = c.lesson?.id || 'sin-leccion';
      const lessonTitle = c.lesson?.title || 'Sin lección';
      if (!map.has(courseId)) {
        map.set(courseId, { id: courseId, title: courseTitle, lessons: new Map() });
      }
      const course = map.get(courseId);
      if (!course.lessons.has(lessonId)) {
        course.lessons.set(lessonId, { id: lessonId, title: lessonTitle, questions: [] });
      }
      course.lessons.get(lessonId).questions.push(c);
    }
    return map;
  }, [topLevel]);

  const courseOptions = useMemo(
    () => [...byCourse.values()].map(c => ({ id: c.id, title: c.title })),
    [byCourse],
  );

  const filteredByCourse = courseFilter === 'all'
    ? byCourse
    : new Map([...byCourse].filter(([id]) => id === courseFilter));

  const matchesStudent = (q) => {
    const needle = studentFilter.trim().toLowerCase();
    if (!needle) return true;
    return (q.user?.name || '').toLowerCase().includes(needle);
  };

  const items = [];
  for (const course of filteredByCourse.values()) {
    for (const lesson of course.lessons.values()) {
      for (const q of lesson.questions) {
        if (matchesStudent(q)) items.push({ course, lesson, q });
      }
    }
  }

  const unanswered = items
    .filter(({ q }) => !hasAdminDescendant(q.id))
    .sort((a, b) => new Date(a.q.createdAt) - new Date(b.q.createdAt));
  const answered = items
    .filter(({ q }) => hasAdminDescendant(q.id))
    .sort((a, b) => new Date(b.q.createdAt) - new Date(a.q.createdAt));

  const handleReplyImageChange = (file) => {
    setReplyImage(prev => {
      if (prev) URL.revokeObjectURL(prev);
      return file || null;
    });
    setReplyPreview(file ? URL.createObjectURL(file) : '');
  };

  const clearReplyImage = () => {
    setReplyImage(prev => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setReplyPreview('');
  };

  const handleReply = async (lessonId, questionId) => {
    const msg = replyDraft.trim();
    if (!msg) return;
    setSending(true);
    try {
      if (replyImage) {
        const formData = new FormData();
        formData.append('message', msg);
        formData.append('parentId', questionId);
        formData.append('image', replyImage);
        await postForm(`/lessons/${lessonId}/comments`, formData);
      } else {
        await post(`/lessons/${lessonId}/comments`, { message: msg, parentId: questionId });
      }
      setReplyDraft('');
      clearReplyImage();
      setReplyingTo(null);
      await load();
    } catch (e) {
      console.error(e);
      alert('No se pudo enviar la respuesta');
    } finally {
      setSending(false);
    }
  };

  const renderReply = (r, depth) => (
    <div key={r.id} className={depth > 0 ? 'ml-4 border-l-2 border-border-sage pl-3 mt-2' : 'mt-0'}>
      <div className={`rounded-xl p-3 border text-sm ${r.user?.role === 'ADMIN' ? 'bg-white border-border' : 'bg-white border-border-sage'}`}>
        <div className="flex items-center justify-between gap-2 mb-1">
          <p className="text-xs font-bold uppercase tracking-wide text-accent">
            {r.user?.role === 'ADMIN' ? 'Profesora' : r.user?.name}
          </p>
          <p className="text-[11px] text-accent/70">
            {new Date(r.createdAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
        <p className="text-text-ink leading-relaxed">{r.message}</p>
        {r.image && (
          <a href={getImageUrl(r.image)} target="_blank" rel="noreferrer" className="block w-fit" title="Abrir imagen">
            <img
              src={getImageUrl(r.image)}
              alt="Imagen adjunta"
              className="mt-2 rounded-lg border border-border max-h-64 w-auto cursor-pointer"
            />
          </a>
        )}
      </div>
      {(childrenOf.get(r.id) || []).map(c => renderReply(c, depth + 1))}
    </div>
  );

  const renderQuestion = (q, lesson) => {
    const answeredQ = hasAdminDescendant(q.id);
    const replies = childrenOf.get(q.id) || [];
    return (
      <div key={q.id} className="rounded-xl border border-border bg-white p-4">
        <div className="flex items-center justify-between gap-2 mb-1">
          <p className="text-sm font-semibold text-text-ink">{q.user?.name || 'Alumna'}</p>
          <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${answeredQ ? 'bg-success/10 text-success' : 'bg-primary-soft text-primary'}`}>
            {answeredQ ? 'Respondida' : 'Sin responder'}
          </span>
        </div>
        <p className="text-text-ink leading-relaxed mb-1">{q.message}</p>
        {q.image && (
          <a href={getImageUrl(q.image)} target="_blank" rel="noreferrer" className="block w-fit" title="Abrir imagen">
            <img
              src={getImageUrl(q.image)}
              alt="Imagen adjunta"
              className="mt-2 rounded-lg border border-border max-h-64 w-auto cursor-pointer"
            />
          </a>
        )}
        <p className="text-[11px] text-accent/70 mb-2">
          {new Date(q.createdAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
        {replies.map(r => renderReply(r, 0))}
        {replyingTo === q.id ? (
          <div className="mt-2 space-y-2">
            <div className="flex gap-2">
              <textarea
                value={replyDraft}
                onChange={e => setReplyDraft(e.target.value)}
                rows={1}
                placeholder="Escribí tu respuesta..."
                className="flex-1 rounded-xl border border-border bg-white px-3 py-2 text-sm text-text-ink focus:outline-none focus:ring-2 focus:ring-secondary/30"
              />
              <button
                type="button"
                onClick={() => handleReply(lesson.id, q.id)}
                disabled={sending}
                className="btn btn-primary text-sm font-semibold self-start"
              >
                Enviar
              </button>
              <button
                type="button"
                onClick={() => { setReplyingTo(null); setReplyDraft(''); clearReplyImage(); }}
                className="btn btn-ghost text-sm self-start"
              >
                Cancelar
              </button>
            </div>
            <ImagePicker preview={replyPreview} onPick={handleReplyImageChange} onRemove={clearReplyImage} />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => { setReplyingTo(q.id); setReplyDraft(''); clearReplyImage(); }}
            className="text-xs text-primary hover:text-primary-hover mt-1"
          >
            Responder
          </button>
        )}
      </div>
    );
  };

  const renderGroup = (group) => (
    <div key={`${group.course.id}-${group.lesson.id}`} className="mb-4">
      <p className="text-xs font-bold uppercase tracking-wide text-text-ink mb-1">{group.course.title}</p>
      <p className="text-xs text-accent mb-2">{group.lesson.title}</p>
      <div className="space-y-2">{group.questions.map(q => renderQuestion(q, group.lesson))}</div>
    </div>
  );

  // Agrupar items sin responder / respondidas por curso+lección (en orden)
  const groupItems = (list) => {
    const groups = [];
    for (const item of list) {
      const last = groups[groups.length - 1];
      if (last && last.course.id === item.course.id && last.lesson.id === item.lesson.id) {
        last.questions.push(item.q);
      } else {
        groups.push({ course: item.course, lesson: item.lesson, questions: [item.q] });
      }
    }
    return groups;
  };

  return (
    <div id="consultas" className="card-glow rounded-xl p-6 mt-6">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="font-display font-bold text-text-ink text-2xl">Consultas</h2>
          <p className="font-dancing text-xl text-primary leading-tight">Consultas de tus alumnas</p>
        </div>
        <span className="text-xs font-bold bg-primary-soft text-primary px-3 py-1 rounded-full">
          {unanswered.length} sin responder
        </span>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-5">
        <select
          value={courseFilter}
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
          value={studentFilter}
          onChange={e => setStudentFilter(e.target.value)}
          placeholder="Filtrar por alumna..."
          className="border border-border rounded-xl px-3 py-2 text-sm bg-white text-text-ink focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {loading && <p className="text-sm text-accent">Cargando consultas...</p>}
      {!loading && error && <p className="text-sm text-danger">No se pudieron cargar las consultas.</p>}

      {!loading && !error && items.length === 0 && (
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