import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { get, del, put } from '../../services/api';
import { useDialog } from '../../context/DialogContext';
import PageHeader from '../../components/PageHeader';
import CourseCover from '../../components/CourseCover';
import Pagination from '../../components/Pagination';
import LoadingState from '../../components/LoadingState';
import EmptyState from '../../components/EmptyState';
import SearchInput from '../../components/SearchInput';
import Badge from '../../components/Badge';

// La rama admin de GET /courses trae TODOS (activos + ocultos) con el conteo
// de ventas (`_count.purchases`), que es lo que decide el botón por curso:
// - oculto (active=false)  -> "Mostrar" (PUT active:true, reactiva)
// - visible con ventas      -> "Ocultar"  (DELETE: el backend lo oculta)
// - visible sin ventas      -> "Eliminar" (DELETE: borrado definitivo)
// DELETE devuelve { id, title, action: 'hidden' | 'deleted' }.
export default function AdminCourses() {
  const { confirmDialog, alertDialog } = useDialog();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  const salesCount = (course) => course._count?.purchases ?? 0;

  const filtered = courses.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  const pageItems = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const load = async () => {
    try {
      const data = await get('/courses?limit=100');
      setCourses(data);
    } catch (error) {
      console.error('Error cargando cursos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleShow = async (course) => {
    if (!await confirmDialog('¿Volver a mostrar este curso en el catálogo?')) return;
    try {
      await put(`/courses/${course.id}`, { active: true });
      await load();
    } catch (error) {
      console.error('Error reactivando el curso:', error);
      alertDialog('No se pudo reactivar el curso');
    }
  };

  const handleHideOrDelete = async (course) => {
    const sales = salesCount(course);
    if (sales > 0) {
      if (!await confirmDialog(`Este curso tiene ${sales} venta(s): se va a OCULTAR del catálogo conservando el historial.`)) return;
    } else if (!await confirmDialog('Se va a ELIMINAR definitivamente. No se puede deshacer.')) {
      return;
    }
    try {
      const result = await del(`/courses/${course.id}`);
      await alertDialog(
        result?.action === 'hidden'
          ? 'El curso se ocultó: conserva el historial de ventas y podés mostrarlo cuando quieras.'
          : 'El curso se eliminó definitivamente.',
        result?.action === 'hidden' ? 'Curso ocultado' : 'Curso eliminado',
      );
      await load();
    } catch (error) {
      console.error('Error ocultando/eliminando el curso:', error);
      alertDialog('No se pudo ocultar/eliminar el curso');
    }
  };

  if (loading) {
    return <LoadingState size="section" />;
  }

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

      {courses.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Todavía no hay cursos cargados."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Sin resultados para tu búsqueda."
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
                <h3 className="font-body text-text-ink text-lg font-bold mb-2 leading-tight flex items-center gap-2">
                  {course.title}
                  {course.active === false && <Badge tone="neutral">Oculto</Badge>}
                </h3>
                <div className="flex gap-4 text-xs text-black/70 font-medium">
                  <span>ARS: ${course.priceARS}</span>
                  <span>AUD: ${course.priceAUD}</span>
                  <span>{salesCount(course)} venta{salesCount(course) === 1 ? '' : 's'}</span>
                </div>
              </div>

              {/* Acciones */}
              <Link
                to={`/admin/cursos/editar/${course.id}`}
                className="btn btn-primary text-sm w-full sm:w-auto"
              >
                Editar
              </Link>
              {course.active === false ? (
                <button
                  onClick={() => handleShow(course)}
                  className="btn btn-ghost text-sm w-full sm:w-auto"
                >
                  Mostrar
                </button>
              ) : salesCount(course) > 0 ? (
                <button
                  onClick={() => handleHideOrDelete(course)}
                  className="btn btn-ghost text-sm w-full sm:w-auto text-accent"
                >
                  Ocultar
                </button>
              ) : (
                <button
                  onClick={() => handleHideOrDelete(course)}
                  className="btn btn-ghost text-sm w-full sm:w-auto text-danger border-danger/30"
                >
                  Eliminar
                </button>
              )}
            </div>
          ))}
        </div>
        <Pagination page={page} total={filtered.length} perPage={PER_PAGE} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}