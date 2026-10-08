import { useMemo, useState } from 'react';
import useAdminComments from '../../hooks/useAdminComments';
import { useDialog } from '../../context/DialogContext';
import CommentThread from '../CommentThread';

// Bandeja de consultas del admin: vista pura sobre useAdminComments (fetch,
// filtros, partición y envío viven en el hook). Acá quedan encabezados,
// filtros, toggle de respondidas y estado de envío del formulario inline.
export default function ConsultasSection() {
  const { alertDialog } = useDialog();
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
      alertDialog('No se pudo enviar la respuesta');
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

  // Hilo de una lista concreta de preguntas: devuelve esas preguntas + sus
  // descendientes (respuestas), sin arrastrar las demás consultas de la misma
  // lección. Así la sección "Sin responder" muestra solo las no respondidas y
  // "Respondidas" solo las respondidas, sin mezclar badges.
  const threadFor = (questions) => {
    const wanted = new Set(questions.map(q => q.id));
    const result = [];
    const addDescendants = (id) => {
      for (const c of items) {
        if (c.parentId === id && !wanted.has(c.id)) {
          wanted.add(c.id);
          result.push(c);
          addDescendants(c.id);
        }
      }
    };
    for (const q of questions) {
      result.push(q);
      addDescendants(q.id);
    }
    return result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  };

  // Sección por alumna → curso → lección. Cada alumna tiene su propio bloque
  // para que las consultas de distintas alumnas no se mezclen, aunque compartan
  // curso y lección.
  const groupByStudent = (list) => {
    const students = new Map();
    for (const item of list) {
      if (!students.has(item.student.id)) {
        students.set(item.student.id, { student: item.student, courses: new Map() });
      }
      const student = students.get(item.student.id);
      if (!student.courses.has(item.course.id)) {
        student.courses.set(item.course.id, { course: item.course, lessons: new Map() });
      }
      const course = student.courses.get(item.course.id);
      if (!course.lessons.has(item.lesson.id)) {
        course.lessons.set(item.lesson.id, { lesson: item.lesson, questions: [] });
      }
      course.lessons.get(item.lesson.id).questions.push(item.q);
    }
    return [...students.values()];
  };

  const renderStudent = (studentGroup) => (
    <div
      key={studentGroup.student.id}
      data-testid={`consulta-student-${studentGroup.student.id}`}
      className="mb-6 border-t border-border pt-4 first:border-t-0 first:pt-0"
    >
      <p className="text-sm font-bold text-text-ink mb-3">{studentGroup.student.name}</p>
      {[...studentGroup.courses.values()].map((courseGroup) => (
        <div key={courseGroup.course.id} className="mb-4">
          <p className="text-xs font-bold uppercase tracking-wide text-text-ink mb-1">{courseGroup.course.title}</p>
          {[...courseGroup.lessons.values()].map((lessonGroup) => (
            <div key={lessonGroup.lesson.id} className="mb-3">
              <p className="text-xs text-accent mb-2">{lessonGroup.lesson.title}</p>
              <CommentThread
                items={threadFor(lessonGroup.questions)}
                onReply={handleReply}
                labels={labels}
                canReply
                replySending={sending}
                image={{ preview: replyPreview, onChange: updateReplyPreview, onRemove: clearReplyImage }}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );

  return (
    <div id="consultas" className="card-flat rounded-xl p-6 mt-6">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="font-display font-bold text-text-ink text-2xl">Consultas</h2>
          <p className="font-body text-base text-primary leading-tight">Consultas de tus alumnas</p>
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
          {groupByStudent(unanswered).map(renderStudent)}
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
              {groupByStudent(answered).map(renderStudent)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}