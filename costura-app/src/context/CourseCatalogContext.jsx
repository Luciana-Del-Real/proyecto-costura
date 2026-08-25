import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { get, postForm, putForm, del } from '../services/api';

const CourseCatalogContext = createContext(null);

export function CourseCatalogProvider({ children }) {
  const [courses, setCourses] = useState([]);

  // Fetch the catalog from the backend on app start.
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

  // Contenido completo de un curso (videoUrl/pdf/attachments + material del
  // curso) desde el endpoint protegido. El catálogo público solo trae
  // títulos; los alumnos con compra aprobada cargan acá lo demás.
  const getCourseLessons = useCallback(async (courseId) => {
    return get(`/courses/${courseId}/lessons`);
  }, []);

  // --- Admin: gestión de cursos ---
  const updateCourse = useCallback(async (courseId, formData) => {
    try {
      const updatedCourse = await putForm(`/courses/${courseId}`, formData);
      setCourses(prev => prev.map(c => c.id === courseId ? updatedCourse : c));
      return updatedCourse;
    } catch (e) {
      console.error(e);
      throw e;
    }
  }, []);

  const addCourse = useCallback(async (formData) => {
    try {
      const newCourse = await postForm('/courses', formData);
      setCourses(prev => [...prev, newCourse]);
      return newCourse;
    } catch (e) {
      console.error(e);
      throw e;
    }
  }, []);

  const deleteCourse = useCallback(async (courseId) => {
    try {
      await del(`/courses/${courseId}`);
      setCourses(prev => prev.filter(c => c.id !== courseId));
    } catch (e) {
      console.error("Error al eliminar el curso:", e);
      throw e;
    }
  }, []);

  // Valor memoizado: las funciones son estables y el valor solo cambia cuando
  // cambia `courses`, así los consumidores no re-renderizan en cada render del
  // provider. Las acciones de lecciones (addLesson/updateLesson/deleteLesson)
  // y saveCourses se eliminaron: no tenían consumidores (AdminCourseForm
  // llama postForm/putForm/del directo).
  const value = useMemo(() => ({
    courses,
    getCourseLessons,
    updateCourse,
    addCourse,
    deleteCourse,
  }), [courses, getCourseLessons, updateCourse, addCourse, deleteCourse]);

  return (
    <CourseCatalogContext.Provider value={value}>
      {children}
    </CourseCatalogContext.Provider>
  );
}
// eslint-disable-next-line react-refresh/only-export-components
export const useCourseCatalog = () => useContext(CourseCatalogContext);