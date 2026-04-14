import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { get, postForm, putForm, post, put, del } from '../services/api';

const CoursesContext = createContext(null);

export function CoursesProvider({ children }) {
  const { user } = useAuth();
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

  const [purchases, setPurchases] = useState(() => {
    if (!storageKey) return [];
    const stored = JSON.parse(localStorage.getItem(storageKey) || '{}');
    return stored.purchases || [];
  });
  const [pendingPurchases, setPendingPurchases] = useState(() => {
    if (!storageKey) return [];
    const stored = JSON.parse(localStorage.getItem(storageKey) || '{}');
    return stored.pendingPurchases || [];
  });
  const [progress, setProgress] = useState(() => {
    if (!storageKey) return {};
    const stored = JSON.parse(localStorage.getItem(storageKey) || '{}');
    return stored.progress || {};
  });
  const [favorites, setFavorites] = useState(() => {
    if (!storageKey) return [];
    const stored = JSON.parse(localStorage.getItem(storageKey) || '{}');
    return stored.favorites || [];
  });
  const save = (p, pp, pr, f) => {
    if (!storageKey) return;
    localStorage.setItem(storageKey, JSON.stringify({ purchases: p, pendingPurchases: pp, progress: pr, favorites: f }));
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

  const requestPurchase = (courseId) => {
    if (purchases.includes(courseId) || pendingPurchases.includes(courseId)) return;
    const updatedPending = [...pendingPurchases, courseId];
    setPendingPurchases(updatedPending);
    save(purchases, updatedPending, progress, favorites);
  };

  const approvePurchase = (courseId) => {
    if (purchases.includes(courseId)) return;
    const updated = [...purchases, courseId];
    const updatedPending = pendingPurchases.filter(id => id !== courseId);
    const updatedProgress = { ...progress, [courseId]: { completed: [], lastLesson: 0 } };
    setPurchases(updated);
    setPendingPurchases(updatedPending);
    setProgress(updatedProgress);
    save(updated, updatedPending, updatedProgress, favorites);
  };

  const denyPurchase = (courseId) => {
    const updatedPending = pendingPurchases.filter(id => id !== courseId);
    setPendingPurchases(updatedPending);
    save(purchases, updatedPending, progress, favorites);
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
    const updated = favorites.includes(courseId)
      ? favorites.filter(id => id !== courseId)
      : [...favorites, courseId];
    setFavorites(updated);
    save(purchases, progress, updated);
  };

  const getProgress = (courseId, totalLessons) => {
    const p = progress[courseId];
    if (!p || totalLessons === 0) return 0;
    return Math.round((p.completed.length / totalLessons) * 100);
  };

  const hasCourse = (courseId) => purchases.includes(courseId);
  const isPending = (courseId) => pendingPurchases.includes(courseId);
  const isFavorite = (courseId) => favorites.includes(courseId);

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
  const getAllPurchases = () => {
    const users = JSON.parse(localStorage.getItem('costura_users') || '[]');
    const result = [];
    users.forEach(u => {
      if (u.role === 'admin') return;
      const data = JSON.parse(localStorage.getItem(`costura_data_${u.id}`) || '{}');
      const userPurchases = data.purchases || [];
      userPurchases.forEach(courseId => {
        const course = courses.find(c => c.id === courseId);
        if (course) result.push({ user: u, course, date: u.createdAt });
      });
    });
    return result;
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
    const users = JSON.parse(localStorage.getItem('costura_users') || '[]');
    return users
      .filter(u => u.role !== 'admin')
      .map(u => {
        const data = JSON.parse(localStorage.getItem(`costura_data_${u.id}`) || '{}');
        return { ...u, purchases: data.purchases || [], progress: data.progress || {} };
      });
  };

  const getPendingRequests = () => {
    const users = JSON.parse(localStorage.getItem('costura_users') || '[]');
    const result = [];
    users.forEach(u => {
      if (u.role === 'admin') return;
      const data = JSON.parse(localStorage.getItem(`costura_data_${u.id}`) || '{}');
      const requests = data.pendingPurchases || [];
      requests.forEach(courseId => {
        const course = courses.find(c => c.id === courseId);
        if (course) result.push({ user: u, course, date: u.createdAt });
      });
    });
    return result;
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
