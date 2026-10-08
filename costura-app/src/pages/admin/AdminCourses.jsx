import { useState } from 'react';
import { useCourseCatalog } from '../../context/CourseCatalogContext';
import { useDialog } from '../../context/DialogContext';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import CourseCover from '../../components/CourseCover';
import Pagination from '../../components/Pagination';

export default function AdminCourses() {
  const { courses, deleteCourse } = useCourseCatalog();
  const { confirmDialog } = useDialog();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  const filtered = courses.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  const pageItems = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in">
      <PageHeader title="Gestión de cursos" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="relative w-full max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Buscar curso..."
            className="w-full pl-10 pr-4 py-2 text-sm border-2 border-gray-300 hover:border-gray-400 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white text-gray-700 placeholder-gray-400 shadow-sm transition-all duration-300"
          />
        </div>
        <Link
          to="/admin/cursos/nuevo"
          className="btn btn-primary text-sm shrink-0"
        >
          + Nuevo curso
        </Link>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 card-flat rounded-2xl">
          <h2 className="font-display font-bold text-text-ink text-2xl">
            {courses.length === 0 ? 'Todavía no hay cursos cargados.' : 'Sin resultados para tu búsqueda.'}
          </h2>
          {search && (
            <button onClick={() => { setSearch(''); setPage(1); }} className="btn btn-ghost mt-3 text-sm text-primary">
              Limpiar búsqueda
            </button>
          )}
        </div>
      ) : (
        <>
        <div className="space-y-4">
          {pageItems.map((course) => (
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
                to={`/admin/cursos/editar/${course.id}`}
                className="btn btn-primary text-sm w-full sm:w-auto"
              >
                Editar
              </Link>
              <button
                onClick={async () => {
                  if (await confirmDialog("¿Estás seguro de que quieres eliminar este curso?")) {
                    await deleteCourse(course.id);
                  }
                }}
                className="btn btn-ghost text-sm w-full sm:w-auto text-danger border-danger/30"
              >
                Eliminar
              </button>
            </div>
          ))}
        </div>
        <Pagination page={page} total={filtered.length} perPage={PER_PAGE} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
