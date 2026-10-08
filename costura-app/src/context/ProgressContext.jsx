import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { usePurchases } from './PurchaseContext';
import { get, patchForm } from '../services/api';

const ProgressContext = createContext(null);

export function ProgressProvider({ children }) {
  const { user } = useAuth();
  const { purchases } = usePurchases();

  const [progress, setProgress] = useState({});

  // Progreso real de lecciones, por curso (viene del backend, ya no del navegador).
  // Además de los ids completados guardamos las lecciones tal cual llegan del
  // backend para poder mostrar la evidencia (imagen + nota) sin otro fetch.
  const refreshMyProgress = useCallback(async (courseIds) => {
    if (!user || !courseIds?.length) return;
    try {
      const entries = await Promise.all(
        courseIds.map(async (courseId) => {
          const data = await get(`/progress/courses/${courseId}`);
          const completed = data.lessons.filter(l => l.completed).map(l => l.id);
          return [courseId, {
            completed,
            lastLesson: completed[completed.length - 1] || 0,
            lessons: data.lessons,
          }];
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

  const completeLesson = async (lessonId, { image, note } = {}) => {
    // El backend exige una imagen de evidencia para completar (o que la
    // lección ya tenga una guardada) y valida el orden secuencial; acá solo
    // armamos el multipart y refrescamos el progreso de los cursos comprados
    // para que la UI refleje la evidencia recién guardada.
    const formData = new FormData();
    formData.append('completed', 'true');
    if (note !== undefined && note !== null) formData.append('note', note);
    if (image) formData.append('image', image);

    const updated = await patchForm(`/progress/lessons/${lessonId}`, formData);
    await refreshMyProgress(purchases);
    return updated;
  };

  // Evidencia (imagen + nota) de una lección a partir del progreso ya cargado,
  // para que la vista de la lección la muestre al estar completada.
  const getLessonEvidence = (courseId, lessonId) => {
    const lesson = progress[courseId]?.lessons?.find(l => l.id === lessonId);
    return {
      image: lesson?.evidenceImage || null,
      note: lesson?.evidenceNote || null,
    };
  };

  const getProgress = (courseId, totalLessons) => {
    const p = progress[courseId];
    if (!p || totalLessons === 0) return 0;
    return Math.round((p.completed.length / totalLessons) * 100);
  };

  return (
    <ProgressContext.Provider value={{
      progress,
      refreshMyProgress, completeLesson, getProgress, getLessonEvidence,
    }}>
      {children}
    </ProgressContext.Provider>
  );
}
// eslint-disable-next-line react-refresh/only-export-components
export const useProgress = () => useContext(ProgressContext);