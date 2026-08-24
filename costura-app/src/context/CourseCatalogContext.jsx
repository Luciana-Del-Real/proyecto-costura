import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { get, postForm, putForm, post, put, del } from '../services/api';

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

  const saveCourses = (updated) => setCourses(updated);

  // --- Admin: gestión de cursos ---
  const updateCourse = async (courseId, formData) => {
    try {
      const updatedCourse = await putForm(`/courses/${courseId}`, formData);
      setCourses(prev => prev.map(c => c.id === courseId ? updatedCourse : c));
      return updatedCourse;
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const addCourse = async (formData) => {
    try {
      const newCourse = await postForm('/courses', formData);
      setCourses(prev => [...prev, newCourse]);
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

  return (
    <CourseCatalogContext.Provider value={{
      courses,
      saveCourses,
      getCourseLessons,
      updateCourse, addCourse, deleteCourse,
      addLesson, updateLesson, deleteLesson,
    }}>
      {children}
    </CourseCatalogContext.Provider>
  );
}
// eslint-disable-next-line react-refresh/only-export-components
export const useCourseCatalog = () => useContext(CourseCatalogContext);