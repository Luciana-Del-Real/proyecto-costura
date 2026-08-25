import { useState } from 'react';
import { get, post } from '../services/api';

// Máquina de estados de comentarios/preguntas por lección, antes duplicada en
// CourseDetail (alumna) y AdminCourseForm (profesora). Acá vive la carga lazy
// con guard de loaded, el envío optimista y los drafts por lección.
export default function useLessonComments() {
  const [commentsByLesson, setCommentsByLesson] = useState({});
  const [drafts, setDrafts] = useState({});
  const [sendingFor, setSendingFor] = useState(null);

  // Fetch lazy: solo descarga una vez por lección (guard de loaded).
  const loadComments = async (lessonId) => {
    if (commentsByLesson[lessonId]?.loaded) return;
    setCommentsByLesson(prev => ({ ...prev, [lessonId]: { loaded: false, items: [], loading: true } }));
    try {
      const items = await get(`/lessons/${lessonId}/comments`);
      setCommentsByLesson(prev => ({ ...prev, [lessonId]: { loaded: true, items, loading: false } }));
    } catch (e) {
      console.error('Error cargando comentarios', e);
      setCommentsByLesson(prev => ({ ...prev, [lessonId]: { loaded: true, items: [], loading: false } }));
    }
  };

  // Envío optimista: agrega el comentario creado al final de la lista y
  // limpia el draft. El mensaje se trima y vacío no envía nada.
  const sendComment = async (lessonId, message) => {
    const trimmed = (message || '').trim();
    if (!trimmed) return;
    setSendingFor(lessonId);
    try {
      const created = await post(`/lessons/${lessonId}/comments`, { message: trimmed });
      setCommentsByLesson(prev => ({
        ...prev,
        [lessonId]: { loaded: true, loading: false, items: [...(prev[lessonId]?.items || []), created] },
      }));
      setDrafts(prev => ({ ...prev, [lessonId]: '' }));
    } catch (e) {
      console.error('Error enviando la pregunta', e);
      alert('No se pudo enviar tu pregunta. Probá de nuevo en un momento.');
    } finally {
      setSendingFor(null);
    }
  };

  const setDraft = (lessonId, value) => {
    setDrafts(prev => ({ ...prev, [lessonId]: value }));
  };

  return {
    commentsByLesson,
    loadComments,
    sendComment,
    drafts,
    setDraft,
    sendingFor,
  };
}