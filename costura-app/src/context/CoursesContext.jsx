import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { courses as initialCourses } from '../data/courses';

const CoursesContext = createContext(null);

export function CoursesProvider({ children }) {
  const { user } = useAuth();
  const [purchases, setPurchases] = useState([]);
  const [progress, setProgress] = useState({});
  const [favorites, setFavorites] = useState([]);
  const [courses, setCourses] = useState(() => {
    const stored = localStorage.getItem('costura_courses');
    return stored ? JSON.parse(stored) : initialCourses;
  });

  const storageKey = user ? `costura_data_${user.id}` : null;

  useEffect(() => {
    if (!storageKey) { setPurchases([]); setProgress({}); setFavorites([]); return; }
    const stored = JSON.parse(localStorage.getItem(storageKey) || '{}');
    setPurchases(stored.purchases || []);
    setProgress(stored.progress || {});
    setFavorites(stored.favorites || []);
  }, [storageKey]);

  const save = (p, pr, f) => {
    if (!storageKey) return;
    localStorage.setItem(storageKey, JSON.stringify({ purchases: p, progress: pr, favorites: f }));
  };

  const saveCourses = (updated) => {
    setCourses(updated);
    localStorage.setItem('costura_courses', JSON.stringify(updated));
  };

  // --- Alumno ---
  const buyCourse = (courseId) => {
    if (purchases.includes(courseId)) return;
    const updated = [...purchases, courseId];
    const updatedProgress = { ...progress, [courseId]: { completed: [], lastLesson: 0 } };
    setPurchases(updated);
    setProgress(updatedProgress);
    save(updated, updatedProgress, favorites);
  };

  const completeLesson = (courseId, lessonId) => {
    const cp = progress[courseId] || { completed: [], lastLesson: 0 };
    const completed = cp.completed.includes(lessonId) ? cp.completed : [...cp.completed, lessonId];
    const updatedProgress = { ...progress, [courseId]: { ...cp, completed, lastLesson: lessonId } };
    setProgress(updatedProgress);
    save(purchases, updatedProgress, favorites);
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
  const isFavorite = (courseId) => favorites.includes(courseId);

  // --- Admin: gestión de cursos ---
  const updateCourse = (courseId, data) => {
    const updated = courses.map(c => c.id === courseId ? { ...c, ...data } : c);
    saveCourses(updated);
  };

  const addCourse = (courseData) => {
    const newCourse = { ...courseData, id: Date.now(), students: 0, rating: 5.0 };
    saveCourses([...courses, newCourse]);
  };

  const deleteCourse = (courseId) => {
    saveCourses(courses.filter(c => c.id !== courseId));
  };

  const addLesson = (courseId, lesson) => {
    const updated = courses.map(c => {
      if (c.id !== courseId) return c;
      const newLesson = { ...lesson, id: Date.now() };
      return { ...c, lessons: [...c.lessons, newLesson] };
    });
    saveCourses(updated);
  };

  const updateLesson = (courseId, lessonId, data) => {
    const updated = courses.map(c => {
      if (c.id !== courseId) return c;
      return { ...c, lessons: c.lessons.map(l => l.id === lessonId ? { ...l, ...data } : l) };
    });
    saveCourses(updated);
  };

  const deleteLesson = (courseId, lessonId) => {
    const updated = courses.map(c => {
      if (c.id !== courseId) return c;
      return { ...c, lessons: c.lessons.filter(l => l.id !== lessonId) };
    });
    saveCourses(updated);
  };

  // --- Admin: estadísticas globales ---
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

  return (
    <CoursesContext.Provider value={{
      courses,
      purchases, progress, favorites,
      buyCourse, completeLesson, toggleFavorite,
      getProgress, hasCourse, isFavorite,
      updateCourse, addCourse, deleteCourse,
      addLesson, updateLesson, deleteLesson,
      getAllPurchases, getAllUsers, deleteUser, toggleUserActive,
    }}>
      {children}
    </CoursesContext.Provider>
  );
}

export const useCourses = () => useContext(CoursesContext);
