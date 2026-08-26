import { useState } from 'react';
import { get, post, postForm } from '../services/api';

// Máquina de estados de comentarios/preguntas por lección, antes duplicada en
// CourseDetail (alumna) y AdminCourseForm (profesora). Acá vive la carga lazy
// con guard de loaded, el envío optimista y los drafts por lección.
export default function useLessonComments() {
  const [commentsByLesson, setCommentsByLesson] = useState({});
  const [drafts, setDrafts] = useState({});
  const [sendingFor, setSendingFor] = useState(null);

  // Fetch por lección: SIEMPRE refetchea al abrir (sin guard de loaded) para
  // que las respuestas nuevas de la profesora aparezcan aunque la alumna ya
  // hubiera abierto la lección antes. Mantiene los items previos mientras
  // refresca para no parpadear vacío.
  const loadComments = async (lessonId) => {
    setCommentsByLesson(prev => ({ ...prev, [lessonId]: { loaded: false, items: prev[lessonId]?.items || [], loading: true } }));
    try {
      const items = await get(`/lessons/${lessonId}/comments`);
      setCommentsByLesson(prev => ({ ...prev, [lessonId]: { loaded: true, items, loading: false } }));
    } catch (e) {
      console.error('Error cargando comentarios', e);
      setCommentsByLesson(prev => ({ ...prev, [lessonId]: { loaded: true, items: prev[lessonId]?.items || [], loading: false } }));
    }
  };

  // Envío optimista: agrega el comentario creado al final de la lista y
  // limpia el draft (solo del input principal; las respuestas de un hilo usan
  // su propio draft local). Acepta un parentId opcional para responder dentro
  // de un hilo y un imageFile opcional (File) que se envía como multipart.
  // Devuelve el comentario creado, o undefined si no se envió.
  const sendComment = async (lessonId, message, parentId, imageFile) => {
    const trimmed = (message || '').trim();
    if (!trimmed) return undefined;
    setSendingFor(lessonId);
    try {
      let created;
      if (imageFile) {
        const formData = new FormData();
        formData.append('message', trimmed);
        if (parentId) formData.append('parentId', parentId);
        formData.append('image', imageFile);
        created = await postForm(`/lessons/${lessonId}/comments`, formData);
      } else {
        const body = { message: trimmed };
        if (parentId) body.parentId = parentId;
        created = await post(`/lessons/${lessonId}/comments`, body);
      }
      setCommentsByLesson(prev => ({
        ...prev,
        [lessonId]: { loaded: true, loading: false, items: [...(prev[lessonId]?.items || []), created] },
      }));
      if (!parentId) {
        setDrafts(prev => ({ ...prev, [lessonId]: '' }));
      }
      return created;
    } catch (e) {
      console.error('Error enviando la pregunta', e);
      alert('No se pudo enviar tu pregunta. Probá de nuevo en un momento.');
      return undefined;
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