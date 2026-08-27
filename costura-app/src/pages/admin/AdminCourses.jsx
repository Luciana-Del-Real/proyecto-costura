import { useState } from 'react';
import { useCourseCatalog } from '../../context/CourseCatalogContext';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import CourseCover from '../../components/CourseCover';

export default function AdminCourses() {
  const { courses, deleteCourse } = useCourseCatalog();
  const [search, setSearch] = useState('');

  const filtered = courses.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );
  
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

        <div className="relative max-w-sm mb-6">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar curso..."
            className="w-full pl-10 pr-4 py-2 text-sm border-2 border-gray-300 hover:border-gray-400 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white text-gray-700 placeholder-gray-400 shadow-sm transition-all duration-300"
          />
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 card-flat rounded-2xl">
            <h2 className="font-display font-bold text-text-ink text-2xl">
              {courses.length === 0 ? 'Todavía no hay cursos cargados.' : 'Sin resultados para tu búsqueda.'}
            </h2>
            {search && (
              <button onClick={() => setSearch('')} className="btn btn-ghost mt-3 text-sm text-primary hover:text-primary-hover">
                Limpiar búsqueda
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((course) => (
              <div key={course.id} className="card-flat rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 shadow-sm">
                {/* Portada: CourseCover resuelve la URL y muestra el nombre si no hay imagen */}
                <div className="w-24 h-16 bg-bg-soft rounded-lg overflow-hidden flex-shrink-0">
                  <CourseCover course={course} className="w-full h-full object-cover" />
                </div>

                {/* Información */}
                <div className="flex-grow min-w-0">
                  <h3 className="font-body text-text-ink text-lg font-bold mb-2 leading-tight">{course.title}</h3>
                  <div className="flex gap-4 text-xs text-black/70 font-medium">
                    <span>ARS: ${course.priceARS}</span>
                    <span>AUD: ${course.priceAUD}</span>
                  </div>
                </div>

                {/* Botón de acción */}
                <Link 
                  to={`/admin/courses/edit/${course.id}`} 
                  className="btn btn-primary text-sm w-full sm:w-auto"
                >
                  Editar
                </Link>
                <button 
                  onClick={async () => {
                    if (window.confirm("¿Estás seguro de que quieres eliminar este curso?")) {
                      await deleteCourse(course.id);
                    }
                  }} 
                  className="btn btn-danger text-sm w-full sm:w-auto"
                >
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}