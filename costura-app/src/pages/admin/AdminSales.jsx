import { useEffect, useState } from 'react';
import { useCourseCatalog } from '../../context/CourseCatalogContext';
import { useDialog } from '../../context/DialogContext';
import { usePurchases } from '../../context/PurchaseContext';
import {
  listAllPatternPurchases,
  approvePatternPurchase,
  rejectPatternPurchase,
} from '../../services/api';
import { sumByCurrency, formatMoney } from '../../utils/currency';
import { getImageUrl } from '../../utils/media';
import PageHeader from '../../components/PageHeader';
import Pagination from '../../components/Pagination';
import LoadingState from '../../components/LoadingState';
import EmptyState from '../../components/EmptyState';
import Badge from '../../components/Badge';

export default function AdminSales() {
  const { confirmDialog } = useDialog();
  const { courses } = useCourseCatalog();
  const { getAllPurchases, getPendingRequests, approvePurchase, denyPurchase } = usePurchases();
  const [allPurchases, setAllPurchases] = useState([]);
  const [patternPurchases, setPatternPurchases] = useState([]);
  const [, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('todos');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  // getAllPurchases/getPendingRequests/listAllPatternPurchases se recrean en
  // cada render (no están memoizadas), así que incluirlas en las dependencias
  // haría que este efecto se re-ejecute en re-renders ajenos y vuelva a
  // fetchear. Mantenemos la carga solo al montar.
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    const load = async () => {
      try {
        setAllPurchases(await getAllPurchases());
        setPatternPurchases(await listAllPatternPurchases());
        setPendingRequests(await getPendingRequests());
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);
  /* eslint-enable react-hooks/exhaustive-deps */

  // Las compras de curso y de patrón se unifican en una sola lista de filas con
  // `kind` para poder filtrarlas, paginarlas y renderizarlas juntas.
  const courseRows = allPurchases.map(p => ({ ...p, kind: 'course' }));
  const patternRows = patternPurchases.map(p => ({ ...p, kind: 'pattern' }));

  const mergedRows = [...courseRows, ...patternRows].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  );

  // Filtro combinado: por producto (curso/patrón) + por estado.
  const matchesProduct = (p) => {
    if (filter === 'todos') return true;
    const [type, id] = filter.split(':');
    if (type === 'curso') return p.kind === 'course' && p.course.id === id;
    return p.kind === 'pattern' && p.pattern.id === id;
  };

  const filtered = mergedRows
    .filter(matchesProduct)
    .filter(p => statusFilter === 'todos' || p.status === statusFilter);

  const pageItems = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const reload = async () => {
    setAllPurchases(await getAllPurchases());
    setPatternPurchases(await listAllPatternPurchases());
    setPendingRequests(await getPendingRequests());
  };

  const handleReapprove = async (p) => {
    const label = p.kind === 'pattern' ? `al patrón ${p.pattern.titulo}` : `al curso ${p.course.title}`;
    if (!await confirmDialog(`¿Reaprobar el acceso de ${p.user.name} ${label}?`)) return;
    if (p.kind === 'pattern') await approvePatternPurchase(p.id);
    else await approvePurchase(p.id);
    await reload();
  };

  const handleDeny = async (p) => {
    const label = p.kind === 'pattern' ? `al patrón ${p.pattern.titulo}` : `al curso ${p.course.title}`;
    if (!await confirmDialog(`¿Denegar y revocar el acceso de ${p.user.name} ${label}?`)) return;
    if (p.kind === 'pattern') await rejectPatternPurchase(p.id);
    else await denyPurchase(p.id);
    await reload();
  };

  // Solo las compras aprobadas cuentan como venta real para los resúmenes
  // financieros; el detalle de la tabla muestra todos los estados.
  const approvedCourse = allPurchases.filter(p => p.status === 'APPROVED');
  const approvedPattern = patternPurchases.filter(p => p.status === 'APPROVED');
  const approved = [...approvedCourse, ...approvedPattern];

  const totalRevenue = sumByCurrency(approved);
  const revenueFiltered = sumByCurrency(filtered.filter(p => p.status === 'APPROVED'));

  // Ventas por curso para el mini gráfico (cantidad de ventas, ya que sumar
  // ARS y AUD directamente en una sola barra no tendría sentido).
  const salesPerCourse = courses.map(c => ({
    ...c,
    revenueByCurrency: sumByCurrency(approvedCourse.filter(p => p.course.id === c.id)),
    count: approvedCourse.filter(p => p.course.id === c.id).length,
  })).filter(c => c.count > 0).sort((a, b) => b.count - a.count);

  const maxCount = salesPerCourse[0]?.count || 1;

  // Ventas por patrón: agrupamos las compras aprobadas por pattern.id.
  const patternGroups = new Map();
  approvedPattern.forEach(p => {
    const entry = patternGroups.get(p.pattern.id) ?? {
      id: p.pattern.id,
      titulo: p.pattern.titulo,
      purchases: [],
    };
    entry.purchases.push(p);
    patternGroups.set(p.pattern.id, entry);
  });

  const salesPerPattern = [...patternGroups.values()]
    .map(g => ({
      id: g.id,
      titulo: g.titulo,
      count: g.purchases.length,
      revenueByCurrency: sumByCurrency(g.purchases),
    }))
    .filter(g => g.count > 0)
    .sort((a, b) => b.count - a.count);

  const maxPatternCount = salesPerPattern[0]?.count || 1;

  // Opciones del filtro por producto: cursos (curso:<id>) + patrones con compras (patron:<id>).
  const patternOptions = [...new Map(
    patternPurchases.map(p => [p.pattern.id, p.pattern]),
  ).values()];

  const rowImage = (p) => (p.kind === 'pattern' ? p.pattern.imagen : p.course.image);
  const rowTitle = (p) => (p.kind === 'pattern' ? p.pattern.titulo : p.course.title);
  const rowAmount = (p) => p.total ?? (p.kind === 'pattern' ? p.pattern.precioARS : p.course.priceARS);

  return (
    <div className="w-full px-4 py-8 animate-fade-in">
      <PageHeader title="Historial de ventas" />

      {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 mt-6">
          {/* Card de Ingresos Totales */}
          <div className="card-flat rounded-2xl p-6 animate-fade-up">
            <p className="text-xs uppercase tracking-wider font-bold text-text-tan mb-2">Ingresos totales</p>
            {loading ? (
              <LoadingState size="inline" />
            ) : (
              <>
                <p className="text-lg font-bold text-text-ink">${totalRevenue.ARS.toLocaleString()} ARS</p>
                <p className="text-lg font-bold text-text-ink">${totalRevenue.AUD.toLocaleString()} AUD</p>
              </>
            )}
          </div>

          {/* Card de Total de Ventas */}
          <div className="card-flat rounded-2xl p-6 animate-fade-up-delay-1">
            <p className="text-xs uppercase tracking-wider font-bold text-text-tan mb-2">Total de ventas</p>
            {loading ? (
              <LoadingState size="inline" />
            ) : (
              <p className="text-3xl font-bold text-text-ink">{approved.length}</p>
            )}
          </div>
        </div>

        {/* Mini gráficos: ventas por curso y por patrón, lado a lado (50/50) */}
        {(salesPerCourse.length > 0 || salesPerPattern.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {salesPerCourse.length > 0 && (
              <div className={`card-flat rounded-2xl p-8 animate-fade-up ${salesPerPattern.length === 0 ? 'lg:col-span-2' : ''}`}>
                {/* Título con margen inferior para separar del contenido */}
                <h2 className="font-display font-bold text-text-ink text-2xl mb-6">Ventas por curso</h2>

                <div className="space-y-6">
                  {salesPerCourse.map(c => (
                    <div key={c.id} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                      {/* Título del curso */}
                      <p className="text-sm font-medium text-text-ink w-full sm:w-40 truncate flex-shrink-0">{c.title}</p>

                      {/* Barra de progreso */}
                      <div className="flex-none sm:flex-1 w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-primary h-3 rounded-full transition-all duration-700"
                          style={{ width: `${(c.count / maxCount) * 100}%` }}
                        />
                      </div>

                      {/* Estadísticas */}
                      <div className="text-right w-full sm:w-32">
                        <span className="text-xs font-bold text-text-ink block">{c.count} venta{c.count !== 1 ? 's' : ''}</span>
                        <span className="text-[10px] text-text-tan block font-medium">
                          ${c.revenueByCurrency.ARS.toLocaleString()} ARS · ${c.revenueByCurrency.AUD.toLocaleString()} AUD
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {salesPerPattern.length > 0 && (
              <div className={`card-flat rounded-2xl p-8 animate-fade-up ${salesPerCourse.length === 0 ? 'lg:col-span-2' : ''}`}>
                <h2 className="font-display font-bold text-text-ink text-2xl mb-6">Ventas por patrones</h2>

                <div className="space-y-6">
                  {salesPerPattern.map(pat => (
                    <div key={pat.id} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                      {/* Título del patrón */}
                      <p className="text-sm font-medium text-text-ink w-full sm:w-40 truncate flex-shrink-0">{pat.titulo}</p>

                      {/* Barra de progreso */}
                      <div className="flex-none sm:flex-1 w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-primary h-3 rounded-full transition-all duration-700"
                          style={{ width: `${(pat.count / maxPatternCount) * 100}%` }}
                        />
                      </div>

                      {/* Estadísticas */}
                      <div className="text-right w-full sm:w-32">
                        <span className="text-xs font-bold text-text-ink block">{pat.count} venta{pat.count !== 1 ? 's' : ''}</span>
                        <span className="text-[10px] text-text-tan block font-medium">
                          ${pat.revenueByCurrency.ARS.toLocaleString()} ARS · ${pat.revenueByCurrency.AUD.toLocaleString()} AUD
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Contenedor unificado: bg-white, border-gray-100, bordes redondeados */}
        <div className="card-flat rounded-2xl overflow-x-auto animate-fade-up mb-8">

          {/* Cabecera con fondo sutil */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap bg-gray-50/50">
            <h2 className="font-display font-bold text-text-ink text-2xl">Detalle de ventas</h2>
            <div className="flex items-center gap-3 flex-wrap w-full sm:w-auto">
              <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                className="border border-gray-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white text-text-ink w-full sm:w-auto">
                <option value="todos">Todos los estados</option>
                <option value="APPROVED">Aprobada</option>
                <option value="PENDING">Pendiente</option>
                <option value="REJECTED">Denegada</option>
              </select>
              <select value={filter} onChange={e => { setFilter(e.target.value); setPage(1); }}
                className="border border-gray-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white text-text-ink w-full sm:w-auto">
                <option value="todos">Todos los productos</option>
                {courses.map(c => <option key={`curso-${c.id}`} value={`curso:${c.id}`}>{c.title}</option>)}
                {patternOptions.map(pat => <option key={`patron-${pat.id}`} value={`patron:${pat.id}`}>{pat.titulo}</option>)}
              </select>
            </div>
          </div>

          {loading ? (
            <LoadingState size="section" />
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <EmptyState variant="inline" title="Sin ventas para mostrar con los filtros seleccionados." />
            </div>
          ) : (
            <>
              <table className="w-full text-sm min-w-[480px]">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="text-left px-8 py-4 text-text-ink font-bold text-xs uppercase tracking-wider">Alumna</th>
                    <th className="text-left px-4 py-4 text-text-ink font-bold text-xs uppercase tracking-wider hidden md:table-cell">Producto</th>
                    <th className="text-left px-4 py-4 text-text-ink font-bold text-xs uppercase tracking-wider">Estado</th>
                    <th className="text-right px-8 py-4 text-text-ink font-bold text-xs uppercase tracking-wider">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pageItems.map((p) => (
                    <tr key={`${p.kind}-${p.id}`} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-8 py-4">
                        <p className="font-semibold text-text-ink">{p.user.name}</p>
                        <p className="text-xs text-text-tan">{p.user.email}</p>
                      </td>
                      <td className="px-4 py-4 hidden md:table-cell">
                        <div className="flex items-center gap-3">
                          <img src={getImageUrl(rowImage(p))} alt={rowTitle(p)} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-text-ink font-medium truncate max-w-[180px]">{rowTitle(p)}</span>
                            <Badge tone={p.kind === 'pattern' ? 'accent' : 'primary'} className="whitespace-nowrap">
                              {p.kind === 'pattern' ? 'Patrón' : 'Curso'}
                            </Badge>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            tone={p.status === 'APPROVED' ? 'success' : p.status === 'PENDING' ? 'neutral' : 'danger'}
                            className="whitespace-nowrap"
                          >
                            {p.status === 'APPROVED' ? 'Aprobada' : p.status === 'PENDING' ? 'Pendiente' : 'Denegada'}
                          </Badge>
                          {p.status === 'APPROVED' && (
                            <button onClick={() => handleDeny(p)} className="text-xs font-semibold text-danger hover:text-danger-hover whitespace-nowrap">
                              Denegar
                            </button>
                          )}
                          {p.status === 'REJECTED' && (
                            <button onClick={() => handleReapprove(p)} className="text-xs font-semibold text-primary hover:text-primary-hover whitespace-nowrap">
                              Reaprobar
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-4 text-right">
                        <p className="font-bold text-success text-sm">
                          {formatMoney(rowAmount(p), p.user?.country === 'AUD' ? 'AUD' : 'ARS')}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pie de tabla con estilo limpio */}
              <div className="px-8 py-4 border-t border-gray-100 flex justify-between items-center flex-wrap gap-2 bg-gray-50/50">
                <span className="text-xs text-text-tan">{filtered.length} registro{filtered.length !== 1 ? 's' : ''}</span>
                <div className="text-right">
                    <p className="font-bold text-text-ink text-sm">Total: ${revenueFiltered.ARS.toLocaleString()} ARS</p>
                    <p className="font-bold text-text-ink text-xs">${revenueFiltered.AUD.toLocaleString()} AUD</p>
                </div>
              </div>
              <Pagination page={page} total={filtered.length} perPage={PER_PAGE} onPageChange={setPage} />
            </>
          )}
        </div>
    </div>
  );
}
