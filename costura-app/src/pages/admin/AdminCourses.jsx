import { useCourseCatalog } from '../../context/CourseCatalogContext';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import CourseCover from '../../components/CourseCover';

export default function AdminCourses() {
  const { courses, deleteCourse } = useCourseCatalog();
  
  return (
    <div className="min-h-screen bg-bg-surface">
      <div className="max-w-6xl mx-auto px-1 py-1 animate-fade-in">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
          <div className="min-w-0">
            <PageHeader title="Gestión de cursos" />
          </div>
          <Link 
            to="/admin/courses/new" 
            className="btn btn-primary text-sm mt-6"
          >
            + Nuevo curso
          </Link>
        </div>

        <div className="space-y-4">
          {courses.map((course) => (
            <div key={course.id} className="card-glow rounded-2xl p-5 flex items-center gap-6 shadow-sm">
              {/* Portada: CourseCover resuelve la URL y muestra el nombre si no hay imagen */}
              <div className="w-24 h-16 bg-bg-soft rounded-lg overflow-hidden flex-shrink-0">
                <CourseCover course={course} className="w-full h-full object-cover" />
              </div>

              {/* Información */}
              <div className="flex-grow">
                <h3 className="font-body text-text-ink text-lg font-bold mb-2 leading-tight">{course.title}</h3>
                <div className="flex gap-4 text-xs text-black/70 font-medium">
                  <span>ARS: ${course.priceARS}</span>
                  <span>AUD: ${course.priceAUD}</span>
                </div>
              </div>

              {/* Botón de acción */}
              <Link 
                to={`/admin/courses/edit/${course.id}`} 
                className="btn btn-primary text-sm"
              >
                Editar
              </Link>
              <button 
                onClick={async () => {
                  if (window.confirm("¿Estás seguro de que quieres eliminar este curso?")) {
                    await deleteCourse(course.id);
                  }
                }} 
                className="btn btn-danger text-sm"
              >
                Eliminar
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}