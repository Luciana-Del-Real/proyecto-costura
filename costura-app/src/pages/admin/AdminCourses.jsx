import { useState } from 'react';
import { Search } from 'lucide-react';
import { useCourseCatalog } from '../../context/CourseCatalogContext';
import { useDialog } from '../../context/DialogContext';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import CourseCover from '../../components/CourseCover';
import Pagination from '../../components/Pagination';
import EmptyState from '../../components/EmptyState';
import SearchInput from '../../components/SearchInput';

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
    <div className="w-full px-4 py-8 animate-fade-in">
      <PageHeader title="Gestión de cursos" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <SearchInput
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Buscar curso..."
          className="w-full max-w-sm"
        />
        <Link
          to="/admin/cursos/nuevo"
          className="btn btn-primary text-sm shrink-0"
        >
          + Nuevo curso
        </Link>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title={courses.length === 0 ? 'Todavía no hay cursos cargados.' : 'Sin resultados para tu búsqueda.'}
          action={search && {
            label: 'Limpiar búsqueda',
            onClick: () => { setSearch(''); setPage(1); },
            variant: 'ghost',
          }}
        />
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
