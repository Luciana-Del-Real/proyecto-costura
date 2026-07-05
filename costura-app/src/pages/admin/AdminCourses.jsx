import { useCourses } from '../../context/CoursesContext';
import { Link } from 'react-router-dom';

export default function AdminCourses() {
  const { courses, deleteCourse } = useCourses();
  
  return (
    <div className="min-h-screen bg-[#F9F5F0]">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8 w-full">
          <h1 className="text-3xl font-bold text-[#6B4C3B] m-0 p-0 leading-tight">Gestión de cursos</h1>
          <Link 
            to="/admin/courses/new" 
            className="bg-[#4E6D5B] !text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-[#3d5a4a] transition-all"
          >
            + Nuevo curso
          </Link>
        </div>

        <div className="space-y-4">
          {courses.map((course) => (
            <div key={course.id} className="bg-white rounded-2xl border border-[#EDE4D6] p-5 flex items-center gap-6 shadow-sm">
              {/* Portada */}
              <div className="w-24 h-16 bg-[#EDE4D6] rounded-lg overflow-hidden flex-shrink-0">
                {course.image && <img 
                src={`http://localhost:3000${course.image.startsWith('/') ? '' : '/'}${course.image}`} 
                alt={course.title} 
                className="w-full h-full object-cover"></img>}
              </div>

              {/* Información */}
              <div className="flex-grow">
                <h3 className="font-bold text-black text-xl">{course.title}</h3>
                <div className="flex gap-4 text-xs text-black/70 font-medium">
                  <span>ARS: ${course.priceARS}</span>
                  <span>AUD: ${course.priceAUD}</span>
                </div>
              </div>

              {/* Botón de acción */}
              <Link 
                to={`/admin/courses/edit/${course.id}`} 
                className="bg-[#4E6D5B] !text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-[#3d5a4a] transition-all"
              >
                Editar
              </Link>
              <button 
                onClick={async () => {
                  if (window.confirm("¿Estás seguro de que quieres eliminar este curso?")) {
                    await deleteCourse(course.id);
                  }
                }} 
                className="bg-[#bf6b6b] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#bf5b6b] transition-colors"
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