import { useState, useEffect, useCallback } from 'react';
import { get, post, postForm } from '../services/api';
import { groupCommentsByParent } from '../utils/commentTree';

// Agrupa las preguntas top-level (de alumnas) por alumna → curso → lección, en
// el orden estable de la lista plana (createdAt asc). Cada alumna queda en su
// propia sección para que los hilos de distintas alumnas no se mezclen.
function buildByStudent(topLevel) {
  const students = new Map();
  for (const c of topLevel) {
    if (c.user?.role === 'ADMIN') continue;
    const studentId = c.user?.id || 'sin-alumna';
    const studentName = c.user?.name || 'Alumna';
    const courseId = c.lesson?.course?.id || 'sin-curso';
    const courseTitle = c.lesson?.course?.title || 'Sin curso';
    const lessonId = c.lesson?.id || 'sin-leccion';
    const lessonTitle = c.lesson?.title || 'Sin lección';

    if (!students.has(studentId)) {
      students.set(studentId, { id: studentId, name: studentName, courses: new Map() });
    }
    const student = students.get(studentId);
    if (!student.courses.has(courseId)) {
      student.courses.set(courseId, { id: courseId, title: courseTitle, lessons: new Map() });
    }
    const course = student.courses.get(courseId);
    if (!course.lessons.has(lessonId)) {
      course.lessons.set(lessonId, { id: lessonId, title: lessonTitle, questions: [] });
    }
    course.lessons.get(lessonId).questions.push(c);
  }
  return students;
}

// Lógica de la bandeja de consultas del admin: fetch de /admin/comments,
// filtros por curso y por alumna, partición en sin responder (FIFO) y
// respondidas (desc por fecha), y envío de respuestas con refresh posterior.
// ConsultasSection queda como vista pura consumiendo esto.
export default function useAdminComments() {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [courseFilter, setCourseFilter] = useState('all');
  const [studentFilter, setStudentFilter] = useState('');

  const refresh = useCallback(async () => {
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
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const { childrenOf, topLevel } = groupCommentsByParent(comments);

  // Una consulta está respondida cuando tiene algún descendiente escrito por
  // un ADMIN (recursivo, con tope de profundidad por seguridad).
  const hasAdminDescendant = useCallback((commentId, depth = 0) => {
    if (depth > 8) return false;
    const replies = childrenOf.get(commentId) || [];
    for (const r of replies) {
      if (r.user?.role === 'ADMIN') return true;
      if (hasAdminDescendant(r.id, depth + 1)) return true;
    }
    return false;
  }, [childrenOf]);

  // Agrupar por alumna → curso → lección → preguntas (top-level). Solo las
  // preguntas de alumnas son consultas; los comentarios del admin solo
  // aparecen como respuestas dentro de un hilo, nunca como pregunta.
  const byStudent = buildByStudent(topLevel);

  const courseOptions = [];
  const seenCourses = new Set();
  for (const student of byStudent.values()) {
    for (const course of student.courses.values()) {
      if (!seenCourses.has(course.id)) {
        seenCourses.add(course.id);
        courseOptions.push({ id: course.id, title: course.title });
      }
    }
  }

  const matchesStudent = (q) => {
    const needle = studentFilter.trim().toLowerCase();
    if (!needle) return true;
    return (q.user?.name || '').toLowerCase().includes(needle);
  };

  // Items filtrados con su grupo (alumna + curso + lección) para renderizar
  // encabezados. El filtro de curso se aplica a nivel curso.
  const filtered = [];
  for (const student of byStudent.values()) {
    for (const course of student.courses.values()) {
      if (courseFilter !== 'all' && course.id !== courseFilter) continue;
      for (const lesson of course.lessons.values()) {
        for (const q of lesson.questions) {
          if (matchesStudent(q)) filtered.push({ student, course, lesson, q });
        }
      }
    }
  }

  // Sin responder: FIFO por fecha ascendente. Respondidas: descendente.
  const unanswered = filtered
    .filter(({ q }) => !hasAdminDescendant(q.id))
    .sort((a, b) => new Date(a.q.createdAt) - new Date(b.q.createdAt));
  const answered = filtered
    .filter(({ q }) => hasAdminDescendant(q.id))
    .sort((a, b) => new Date(b.q.createdAt) - new Date(a.q.createdAt));

  // Envía una respuesta y refresca la bandeja. Re-lanza el error para que la
  // vista decida cómo informarlo (alert).
  const reply = useCallback(async (lessonId, questionId, message, imageFile) => {
    if (imageFile) {
      const formData = new FormData();
      formData.append('message', message);
      formData.append('parentId', questionId);
      formData.append('image', imageFile);
      await postForm(`/lessons/${lessonId}/comments`, formData);
    } else {
      await post(`/lessons/${lessonId}/comments`, { message, parentId: questionId });
    }
    await refresh();
  }, [refresh]);

  return {
    items: comments,
    filters: { course: courseFilter, student: studentFilter },
    setCourseFilter,
    setStudentFilter,
    courseOptions,
    unanswered,
    answered,
    loading,
    error,
    refresh,
    reply,
  };
}