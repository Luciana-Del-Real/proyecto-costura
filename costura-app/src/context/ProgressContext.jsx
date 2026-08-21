import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { usePurchases } from './PurchaseContext';
import { get, patch } from '../services/api';

const ProgressContext = createContext(null);

export function ProgressProvider({ children }) {
  const { user } = useAuth();
  const { purchases } = usePurchases();

  const [progress, setProgress] = useState({});

  // Progreso real de lecciones, por curso (viene del backend, ya no del navegador).
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

  // El progreso sigue al conjunto de cursos comprados: cada vez que cambia la
  // lista de compras (login, foco de la pestaña, aprobación del admin), se
  // vuelve a pedir el progreso real de esos cursos. El refresco se difiere a un
  // microtask para que el setState quede fuera de la fase síncrona del efecto.
  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (cancelled) return undefined;
      return refreshMyProgress(purchases);
    });
    return () => { cancelled = true; };
  }, [refreshMyProgress, purchases]);

  const completeLesson = async (courseId, lessonId) => {
    const cp = progress[courseId] || { completed: [], lastLesson: 0 };
    if (cp.completed.includes(lessonId)) return;

    // El backend ya valida el orden secuencial (no se puede completar una
    // lección sin haber completado la anterior), así que confiamos en su
    // respuesta en vez de duplicar esa lógica acá.
    await patch(`/progress/lessons/${lessonId}`, { completed: true });

    setProgress(prev => {
      const current = prev[courseId] || { completed: [], lastLesson: 0 };
      const completed = [...current.completed, lessonId];
      return { ...prev, [courseId]: { ...current, completed, lastLesson: lessonId } };
    });
  };

  const getProgress = (courseId, totalLessons) => {
    const p = progress[courseId];
    if (!p || totalLessons === 0) return 0;
    return Math.round((p.completed.length / totalLessons) * 100);
  };

  return (
    <ProgressContext.Provider value={{
      progress,
      refreshMyProgress, completeLesson, getProgress,
    }}>
      {children}
    </ProgressContext.Provider>
  );
}
// eslint-disable-next-line react-refresh/only-export-components
export const useProgress = () => useContext(ProgressContext);