import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { get, postForm, putForm, post, put, patch, del } from '../services/api';

const CoursesContext = createContext(null);

export function CoursesProvider({ children }) {
  const { user, isAdmin } = useAuth();
  // Favoritos y progreso siguen guardándose por usuario en el navegador
  // (todavía no están conectados al backend real: ver informe de producción, punto 1).
  const storageKey = user ? `costura_data_${user.id}` : null;

  const [courses, setCourses] = useState([]);

  // Fetch courses from backend when initializing
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const data = await get('/courses');
        setCourses(data);
      } catch (error) {
        console.error('Error fetching courses:', error);
      }
    };
    fetchCourses();
  }, []);

  // purchases / pendingPurchases: se cargan SIEMPRE desde el backend real
  // (antes se guardaban en el navegador; por eso una vez que el admin
  // aprobaba una compra, la alumna nunca se enteraba sin cerrar y volver
  // a entrar). progress y favorites, por ahora, se mantienen locales.
  const [purchases, setPurchases] = useState([]);
  const [pendingPurchases, setPendingPurchases] = useState([]);
  const [progress, setProgress] = useState({});
  const [favorites, setFavorites] = useState([]);

  const refreshMyPurchases = useCallback(async () => {
    if (!user) {
      setPurchases([]);
      setPendingPurchases([]);
      return [];
    }
    try {
      const data = await get(`/purchases/user/${user.id}`);
      const approved = data.filter(p => p.status === 'APPROVED').map(p => p.course.id);
      const pending = data.filter(p => p.status === 'PENDING').map(p => p.course.id);
      setPurchases(approved);
      setPendingPurchases(pending);
      return approved;
    } catch (e) {
      console.error('Error cargando tus compras:', e);
      return [];
    }
  }, [user]);

  // Progreso real de lecciones, por curso (viene del backend, ya no del navegador)
  const refreshMyProgress = useCallback(async (courseIds) => {
    if (!user || !courseIds?.length) return;
    try {
      const entries = await Promise.all(
        courseIds.map(async (courseId) => {
          const data = await get(`/progress/courses/${courseId}`);
          const completed = data.lessons.filter(l => l.completed).map(l => l.id);
          return [courseId, { completed, lastLesson: completed[completed.length - 1] || 0 }];
        })
      );
      setProgress(prev => ({ ...prev, ...Object.fromEntries(entries) }));
    } catch (e) {
      console.error('Error cargando tu progreso:', e);
    }
  }, [user]);

  // Cargar compras y progreso reales al iniciar sesión / cambiar de usuario
  useEffect(() => {
    (async () => {
      const approved = await refreshMyPurchases();
      await refreshMyProgress(approved);
    })();
  }, [refreshMyPurchases, refreshMyProgress]);

  // Si la alumna vuelve a la pestaña (por ejemplo, después de que el admin
  // le aprobó la compra en otro momento), refrescamos el estado real.
  useEffect(() => {
    if (!user) return;
    const onFocus = async () => {
      const approved = await refreshMyPurchases();
      await refreshMyProgress(approved);
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [user, refreshMyPurchases, refreshMyProgress]);

  // Favoritos: se cargan desde el navegador (ver nota arriba)
  useEffect(() => {
    if (!storageKey) {
      setFavorites([]);
      return;
    }
    try {
      const stored = JSON.parse(sessionStorage.getItem(storageKey) || '{}');
      setFavorites(Array.isArray(stored.favorites) ? stored.favorites : []);
    } catch (e) {
      console.error('Error parsing stored user data:', e);
      setFavorites([]);
    }
  }, [storageKey]);

  const saveLocal = (f) => {
    if (!storageKey) return;
    const payload = {
      favorites: Array.isArray(f) ? f : favorites,
    };
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(payload));
    } catch (e) {
      console.error('Error saving user data:', e);
    }
  };

  const saveCourses = (updated) => {
    setCourses(updated);
  };

  // --- Alumno ---
  const requestPurchase = async (courseId) => {
    if (!user) throw new Error('Debes iniciar sesión para solicitar un curso');
    if (purchases.includes(courseId) || pendingPurchases.includes(courseId)) return;

    const res = await post('/purchases', { courseId });
    // Volvemos a pedirle al backend el estado real, en vez de asumirlo local
    await refreshMyPurchases();
    return res;
  };

  const approvePurchase = async (purchaseId) => {
    const res = await patch(`/purchases/${purchaseId}/approve`);
    return res;
  };

  const denyPurchase = async (purchaseId) => {
    const res = await patch(`/purchases/${purchaseId}/reject`);
    return res;
  };

  const completeLesson = async (courseId, lessonId) => {
    const cp = progress[courseId] || { completed: [], lastLesson: 0 };
    if (cp.completed.includes(lessonId)) return;

    // El backend ya valida el orden secuencial (no se puede completar una
    // lección sin haber completado la anterior), así que confiamos en su
    // respuesta en vez de duplicar esa lógica acá.
    await patch(`/progress/lessons/${lessonId}`, { completed: true });

    const completed = [...cp.completed, lessonId];
    const updatedProgress = { ...progress, [courseId]: { ...cp, completed, lastLesson: lessonId } };
    setProgress(updatedProgress);
  };

  const toggleFavorite = (courseId) => {
    const updated = Array.isArray(favorites) && favorites.includes(courseId)
      ? favorites.filter(id => id !== courseId)
      : [...(Array.isArray(favorites) ? favorites : []), courseId];
    setFavorites(updated);
    saveLocal(updated);
  };

  const getProgress = (courseId, totalLessons) => {
    const p = progress[courseId];
    if (!p || totalLessons === 0) return 0;
    return Math.round((p.completed.length / totalLessons) * 100);
  };

  const hasCourse = (courseId) => Array.isArray(purchases) && purchases.includes(courseId);
  const isPending = (courseId) => Array.isArray(pendingPurchases) && pendingPurchases.includes(courseId);
  const isFavorite = (courseId) => Array.isArray(favorites) && favorites.includes(courseId);

  // --- Admin: gestión de cursos ---
  const updateCourse = async (courseId, formData) => {
    try {
      const updatedCourse = await putForm(`/courses/${courseId}`, formData);
      setCourses(courses.map(c => c.id === courseId ? updatedCourse : c));
      return updatedCourse;
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const addCourse = async (formData) => {
    try {
      const newCourse = await postForm('/courses', formData);
      setCourses([...courses, newCourse]);
      return newCourse;
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const deleteCourse = async (courseId) => {
    try {
      await del(`/courses/${courseId}`);
      setCourses(prev => prev.filter(c => c.id !== courseId));
    } catch (e) {
      console.error("Error al eliminar el curso:", e);
      throw e;
    }
  };

  const addLesson = async (courseId, lesson) => {
    try {
      const targetCourse = courses.find(c => c.id === courseId);
      const nextOrder = targetCourse && targetCourse.lessons ? targetCourse.lessons.length + 1 : 1;
      if (lesson && lesson._pdfFile) {
        const formData = new FormData();
        formData.append('title', lesson.title);
        formData.append('duration', lesson.duration);
        if (lesson.videoUrl) formData.append('videoUrl', lesson.videoUrl);
        formData.append('courseId', courseId);
        formData.append('order', String(nextOrder));
        formData.append('pdf', lesson._pdfFile);
        await postForm(`/courses/${courseId}/lessons`, formData);
      } else {
        const payload = {
          ...lesson,
          courseId: courseId,
          order: nextOrder
        };
        await post(`/courses/${courseId}/lessons`, payload);
      }

      const data = await get('/courses');
      setCourses(data);
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const updateLesson = async (courseId, lessonId, dataPayload) => {
    try {
      if (dataPayload && dataPayload._pdfFile) {
        const formData = new FormData();
        if (dataPayload.title) formData.append('title', dataPayload.title);
        if (dataPayload.duration) formData.append('duration', dataPayload.duration);
        if (dataPayload.videoUrl) formData.append('videoUrl', dataPayload.videoUrl);
        if (dataPayload.courseId) formData.append('courseId', dataPayload.courseId);
        if (dataPayload.order) formData.append('order', String(dataPayload.order));
        formData.append('pdf', dataPayload._pdfFile);
        await putForm(`/courses/${courseId}/lessons/${lessonId}`, formData);
      } else {
        await put(`/courses/${courseId}/lessons/${lessonId}`, dataPayload);
      }

      const data = await get('/courses');
      setCourses(data);
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const deleteLesson = async (courseId, lessonId) => {
    try {
      await del(`/courses/${courseId}/lessons/${lessonId}`);
      const data = await get('/courses');
      setCourses(data);
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  // --- Admin: estadísticas globales ---
  const getAllPurchases = async () => {
    try {
      if (!user) return [];
      if (isAdmin || user.role === 'ADMIN') {
        return await get('/purchases/all');
      }
      return await get(`/purchases/user/${user.id}`);
    } catch (err) {
      console.error('getAllPurchases error', err);
      return [];
    }
  };

  const deleteUser = async (userId) => {
    await del(`/users/${userId}`);
  };

  const toggleUserActive = async (userId) => {
    return patch(`/users/${userId}/active`);
  };

  const getAllUsers = async () => {
    return get('/users');
  };

  const getPendingRequests = async (page = 1, limit = 100) => {
    try {
      if (isAdmin || user?.role === 'ADMIN') {
        return await get(`/purchases/pending?page=${page}&limit=${limit}`);
      }
      return [];
    } catch (err) {
      console.error('getPendingRequests error', err);
      return [];
    }
  };
  return (
    <CoursesContext.Provider value={{
      courses,
      purchases, progress, favorites,
      requestPurchase, approvePurchase, denyPurchase, completeLesson, toggleFavorite,
      refreshMyPurchases,
      getProgress, hasCourse, isFavorite, isPending,
      updateCourse, addCourse, deleteCourse,
      addLesson, updateLesson, deleteLesson,
      getAllPurchases, getPendingRequests, getAllUsers, deleteUser, toggleUserActive,
    }}>
      {children}
    </CoursesContext.Provider>
  );
}
export const useCourses = () => useContext(CoursesContext);
