import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { get, postForm, putForm, post, put, patch, del } from '../services/api';

const CoursesContext = createContext(null);

export function CoursesProvider({ children }) {
  const { user, isAdmin } = useAuth();
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

  // State for user-scoped data. We'll load/normalize when `user` changes to avoid stale initializers.
  const [purchases, setPurchases] = useState([]);
  const [pendingPurchases, setPendingPurchases] = useState([]);
  const [progress, setProgress] = useState({});
  const [favorites, setFavorites] = useState([]);

  // Load from localStorage whenever the user changes (handles login/logout and initial load)
  useEffect(() => {
    if (!storageKey) {
      setPurchases([]);
      setPendingPurchases([]);
      setProgress({});
      setFavorites([]);
      return;
    }
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey) || '{}');
      setPurchases(Array.isArray(stored.purchases) ? stored.purchases : []);
      setPendingPurchases(Array.isArray(stored.pendingPurchases) ? stored.pendingPurchases : []);
      setProgress(stored.progress && typeof stored.progress === 'object' ? stored.progress : {});
      setFavorites(Array.isArray(stored.favorites) ? stored.favorites : []);
    } catch (e) {
      console.error('Error parsing stored user data:', e);
      setPurchases([]);
      setPendingPurchases([]);
      setProgress({});
      setFavorites([]);
    }
  }, [storageKey]);

  const save = (p, pp, pr, f) => {
    if (!storageKey) return;
    const payload = {
      purchases: Array.isArray(p) ? p : purchases,
      pendingPurchases: Array.isArray(pp) ? pp : pendingPurchases,
      progress: pr && typeof pr === 'object' ? pr : progress,
      favorites: Array.isArray(f) ? f : favorites,
    };
    try {
      localStorage.setItem(storageKey, JSON.stringify(payload));
    } catch (e) {
      console.error('Error saving user data:', e);
    }
  };

  const saveCourses = (updated) => {
    setCourses(updated);
  };

  // --- Alumno ---
  const buyCourse = (courseId) => {
    if (purchases.includes(courseId)) return;
    const updated = [...purchases, courseId];
    const updatedProgress = { ...progress, [courseId]: { completed: [], lastLesson: 0 } };
    setPurchases(updated);
    setPendingPurchases(pendingPurchases.filter(id => id !== courseId));
    save(updated, pendingPurchases.filter(id => id !== courseId), updatedProgress, favorites);
  };

  const requestPurchase = async (courseId) => {
    if (!user) throw new Error('Debes iniciar sesión para solicitar un curso');
    if (Array.isArray(purchases) && purchases.includes(courseId)) return;
    if (Array.isArray(pendingPurchases) && pendingPurchases.includes(courseId)) return;

    try {
      // Intentar crear la solicitud en el backend
      const res = await post('/purchases', { courseId });
      // Actualizar estado local
      const updatedPending = [...(Array.isArray(pendingPurchases) ? pendingPurchases : []), courseId];
      setPendingPurchases(updatedPending);
      save(purchases, updatedPending, progress, favorites);
      return res;
    } catch (err) {
      // Fallback offline/localStorage behavior
      console.error('Error creando solicitud en backend, guardando localmente', err);
      const updatedPending = [...(Array.isArray(pendingPurchases) ? pendingPurchases : []), courseId];
      setPendingPurchases(updatedPending);
      save(purchases, updatedPending, progress, favorites);
      throw err;
    }
  };

  const approvePurchase = async (idOrCourseId) => {
    try {
      if (isAdmin) {
        // idOrCourseId is purchase id
        const res = await patch(`/purchases/${idOrCourseId}/approve`);
        return res;
      }

      // Fallback for student/local: idOrCourseId is courseId
      const courseId = idOrCourseId;
      if (Array.isArray(purchases) && purchases.includes(courseId)) return;
      const updated = [...(Array.isArray(purchases) ? purchases : []), courseId];
      const updatedPending = (Array.isArray(pendingPurchases) ? pendingPurchases : []).filter(id => id !== courseId);
      const updatedProgress = { ...progress, [courseId]: { completed: [], lastLesson: 0 } };
      setPurchases(updated);
      setPendingPurchases(updatedPending);
      setProgress(updatedProgress);
      save(updated, updatedPending, updatedProgress, favorites);
    } catch (err) {
      console.error('approvePurchase error', err);
      throw err;
    }
  };

  const denyPurchase = async (idOrCourseId) => {
    try {
      if (isAdmin) {
        // idOrCourseId is purchase id
        const res = await patch(`/purchases/${idOrCourseId}/reject`);
        return res;
      }

      // Fallback local
      const courseId = idOrCourseId;
      const updatedPending = (Array.isArray(pendingPurchases) ? pendingPurchases : []).filter(id => id !== courseId);
      setPendingPurchases(updatedPending);
      save(purchases, updatedPending, progress, favorites);
    } catch (err) {
      console.error('denyPurchase error', err);
      throw err;
    }
  };

  const completeLesson = (courseId, lessonId) => {
    const cp = progress[courseId] || { completed: [], lastLesson: 0 };
    if (cp.completed.includes(lessonId)) return;

    const course = courses.find(c => c.id === courseId);
    if (!course) return;

    const lessonIndex = course.lessons.findIndex(l => l.id === lessonId);
    if (lessonIndex === -1) return;

    // Secuencia obligatoria: solo se puede completar si la lecciÃƒÂ³n anterior estÃƒÂ¡ completa
    if (lessonIndex > 0 && !cp.completed.includes(course.lessons[lessonIndex - 1].id)) return;

    const completed = [...cp.completed, lessonId];
    const updatedProgress = { ...progress, [courseId]: { ...cp, completed, lastLesson: lessonId } };
    setProgress(updatedProgress);
    save(purchases, pendingPurchases, updatedProgress, favorites);
  };

  const toggleFavorite = (courseId) => {
    const updated = Array.isArray(favorites) && favorites.includes(courseId)
      ? favorites.filter(id => id !== courseId)
      : [...(Array.isArray(favorites) ? favorites : []), courseId];
    setFavorites(updated);
    save(purchases, pendingPurchases, progress, updated);
  };

  const getProgress = (courseId, totalLessons) => {
    const p = progress[courseId];
    if (!p || totalLessons === 0) return 0;
    return Math.round((p.completed.length / totalLessons) * 100);
  };

  const hasCourse = (courseId) => Array.isArray(purchases) && purchases.includes(courseId);
  const isPending = (courseId) => Array.isArray(pendingPurchases) && pendingPurchases.includes(courseId);
  const isFavorite = (courseId) => Array.isArray(favorites) && favorites.includes(courseId);

  // --- Admin: gestiÃƒÂ³n de cursos ---
  const updateCourse = async (courseId, formData) => {
    try {
      const updatedCourse = await putForm(`/courses/${courseId}`, formData);
      setCourses(courses.map(c => c.id === courseId ? updatedCourse : c));
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const addCourse = async (formData) => {
    try {
      const newCourse = await postForm('/courses', formData);
      setCourses([...courses, newCourse]);
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const deleteCourse = async (courseId) => {
    try {
      await del(`/courses/${courseId}`);
      setCourses(courses.filter(c => c.id !== courseId));
    } catch (e) {
      console.error(e);
    }
  };

  const addLesson = async (courseId, lesson) => {
    try {
      // Find the current course to determine the next order index
      const targetCourse = courses.find(c => c.id === courseId);
      const nextOrder = targetCourse && targetCourse.lessons ? targetCourse.lessons.length + 1 : 1;

      const payload = {
        ...lesson,
        courseId: courseId,
        order: nextOrder
      };
      const newLesson = await post(`/courses/${courseId}/lessons`, payload);
      const data = await get('/courses');
      setCourses(data);
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const updateLesson = async (courseId, lessonId, dataPayload) => {
    try {
      await put(`/courses/${courseId}/lessons/${lessonId}`, dataPayload);
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

  // --- Admin: estadÃƒsticas globales ---
  const getAllPurchases = async () => {
    try {
      if (!user) return [];
      if (isAdmin || user.role === 'ADMIN') {
        return await get('/purchases/all');
      }
      return await get(`/purchases/user/${user.id}`);
    } catch (err) {
      console.error('getAllPurchases error, falling back to local', err);
      const rawUsers = JSON.parse(localStorage.getItem('costura_users') || '[]');
      const users = rawUsers.map(u => ({ ...u, role: u.role ? String(u.role).toUpperCase() : u.role }));
      const result = [];
      users.forEach(u => {
        if (u.role === 'ADMIN') return;
        const data = JSON.parse(localStorage.getItem(`costura_data_${u.id}`) || '{}');
        const userPurchases = data.purchases || [];
        userPurchases.forEach(courseId => {
          const course = courses.find(c => c.id === courseId);
          if (course) result.push({ user: u, course, date: u.createdAt });
        });
      });
      return result;
    }
  };

  const deleteUser = (userId) => {
    const users = JSON.parse(localStorage.getItem('costura_users') || '[]');
    const updated = users.filter(u => u.id !== userId);
    localStorage.setItem('costura_users', JSON.stringify(updated));
    localStorage.removeItem(`costura_data_${userId}`);
  };

  const toggleUserActive = (userId) => {
    const users = JSON.parse(localStorage.getItem('costura_users') || '[]');
    const updated = users.map(u =>
      u.id === userId ? { ...u, active: u.active === false ? true : false } : u
    );
    localStorage.setItem('costura_users', JSON.stringify(updated));
  };

  const getAllUsers = () => {
    const rawUsers = JSON.parse(localStorage.getItem('costura_users') || '[]');
    const users = rawUsers.map(u => ({ ...u, role: u.role ? String(u.role).toUpperCase() : u.role }));
    return users
      .filter(u => u.role !== 'ADMIN')
      .map(u => {
        const data = JSON.parse(localStorage.getItem(`costura_data_${u.id}`) || '{}');
        return { ...u, purchases: data.purchases || [], progress: data.progress || {} };
      });
  };

  const getPendingRequests = async (page = 1, limit = 100) => {
    try {
      if (isAdmin || user?.role === 'ADMIN') {
        return await get(`/purchases/pending?page=${page}&limit=${limit}`);
      }
      const rawUsers = JSON.parse(localStorage.getItem('costura_users') || '[]');
      const users = rawUsers.map(u => ({ ...u, role: u.role ? String(u.role).toUpperCase() : u.role }));
      const result = [];
      users.forEach(u => {
        if (u.role === 'ADMIN') return;
        const data = JSON.parse(localStorage.getItem(`costura_data_${u.id}`) || '{}');
        const requests = data.pendingPurchases || [];
        requests.forEach(courseId => {
          const course = courses.find(c => c.id === courseId);
          if (course) result.push({ user: u, course, date: u.createdAt });
        });
      });
      return result;
    } catch (err) {
      console.error('getPendingRequests error', err);
      return [];
    }
  };
  return (
    <CoursesContext.Provider value={{
      courses,
      purchases, progress, favorites,
      buyCourse, requestPurchase, approvePurchase, denyPurchase, completeLesson, toggleFavorite,
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
