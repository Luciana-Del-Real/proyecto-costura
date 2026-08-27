import { useEffect, useState } from 'react';
import { useCourseCatalog } from '../../context/CourseCatalogContext';
import { usePurchases } from '../../context/PurchaseContext';
import { sumByCurrency, formatMoney } from '../../utils/currency';
import { getImageUrl } from '../../utils/media';
import PageHeader from '../../components/PageHeader';

export default function AdminSales() {
  const { courses } = useCourseCatalog();
  const { getAllPurchases, getPendingRequests, approvePurchase, denyPurchase } = usePurchases();
  const [allPurchases, setAllPurchases] = useState([]);
  const [, setPendingRequests] = useState([]);
  const [filter, setFilter] = useState('todos');

  // getAllPurchases/getPendingRequests se recrean en cada render de
  // PurchaseProvider (no están memoizadas), así que incluirlas en las
  // dependencias haría que este efecto se re-ejecute en re-renders ajenos y
  // vuelva a fetchear. Mantenemos la carga solo al montar.
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    const load = async () => {
      setAllPurchases(await getAllPurchases());
      setPendingRequests(await getPendingRequests());
    };
    load();
  }, []);
  /* eslint-enable react-hooks/exhaustive-deps */

  const filtered = filter === 'todos'
      ? allPurchases
      : allPurchases.filter(p => p.course.id === filter);

  const reload = async () => {
    setAllPurchases(await getAllPurchases());
    setPendingRequests(await getPendingRequests());
  };

  const handleReapprove = async (p) => {
    if (!window.confirm(`¿Reaprobar el acceso de ${p.user.name} al curso ${p.course.title}?`)) return;
    await approvePurchase(p.id);
    await reload();
  };

  const handleDeny = async (p) => {
    if (!window.confirm(`¿Denegar y revocar el acceso de ${p.user.name} al curso ${p.course.title}?`)) return;
    await denyPurchase(p.id);
    await reload();
  };

  // Solo las compras aprobadas cuentan como venta real para los resúmenes
  // financieros; el detalle de la tabla muestra todos los estados.
  const approved = allPurchases.filter(p => p.status === 'APPROVED');

  const revenueFiltered = sumByCurrency(filtered.filter(p => p.status === 'APPROVED'));

  // Ventas por curso para el mini gráfico (cantidad de ventas, ya que sumar
  // ARS y AUD directamente en una sola barra no tendría sentido)
  const salesPerCourse = courses.map(c => ({
    ...c,
    revenueByCurrency: sumByCurrency(approved.filter(p => p.course.id === c.id)),
    count: approved.filter(p => p.course.id === c.id).length,
  })).filter(c => c.count > 0).sort((a, b) => b.count - a.count);

  const maxCount = salesPerCourse[0]?.count || 1;

  return (
    <div className="max-w-6xl mx-auto px-1 py-1 animate-fade-in">
      <PageHeader title="Historial de ventas" />

      {/* Summary cards */}
        <div className="grid grid-cols-2 gap-4 mb-8 mt-6">
          {/* Card de Ingresos Totales */}
          <div className="card-glow rounded-2xl p-6 animate-fade-up">
            <p className="text-xs uppercase tracking-wider font-bold text-text-tan mb-2">Ingresos totales</p>
            <p className="text-lg font-bold text-text-ink">${revenueFiltered.ARS.toLocaleString()} ARS</p>
            <p className="text-lg font-bold text-text-ink">${revenueFiltered.AUD.toLocaleString()} AUD</p>
          </div>

          {/* Card de Total de Ventas */}
          <div className="card-glow rounded-2xl p-6 animate-fade-up-delay-1">
            <p className="text-xs uppercase tracking-wider font-bold text-text-tan mb-2">Total de ventas</p>
            <p className="text-3xl font-bold text-text-ink">{approved.length}</p>
          </div>
        </div>

        {/* Revenue bar chart */}
        {salesPerCourse.length > 0 && (
          <div className="card-glow rounded-2xl p-8 animate-fade-up mb-8">
            {/* Título con margen inferior para separar del contenido */}
            <h2 className="font-display font-bold text-text-ink text-2xl">Ventas por curso</h2>
            
            <div className="space-y-6">
              {salesPerCourse.map(c => (
                <div key={c.id} className="flex items-center gap-6">
                  {/* Título del curso */}
                  <p className="text-sm font-medium text-text-ink w-40 truncate flex-shrink-0">{c.title}</p>
                  
                  {/* Barra de progreso */}
                  <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-primary h-3 rounded-full transition-all duration-700"
                      style={{ width: `${(c.count / maxCount) * 100}%` }}
                    />
                  </div>
                  
                  {/* Estadísticas */}
                  <div className="text-right w-32">
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

        {/* Contenedor unificado: bg-white, border-gray-100, bordes redondeados */}
        <div className="card-glow rounded-2xl overflow-hidden animate-fade-up mb-8">
          
          {/* Cabecera con fondo sutil */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap bg-gray-50/50">
            <h2 className="font-display font-bold text-text-ink text-2xl">Detalle de ventas</h2>
            <select value={filter} onChange={e => setFilter(e.target.value)}
              className="border border-gray-100 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white text-text-ink">
              <option value="todos">Todos los cursos</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-text-tan text-sm">Sin ventas para mostrar.</p>
            </div>
          ) : (
            <>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="text-left px-8 py-4 text-text-ink font-bold text-xs uppercase tracking-wider">Alumna</th>
                    <th className="text-left px-4 py-4 text-text-ink font-bold text-xs uppercase tracking-wider hidden md:table-cell">Curso</th>
                    <th className="text-left px-4 py-4 text-text-ink font-bold text-xs uppercase tracking-wider">Estado</th>
                    <th className="text-right px-8 py-4 text-text-ink font-bold text-xs uppercase tracking-wider">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((p, i) => (
                    <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-8 py-4">
                        <p className="font-semibold text-text-ink">{p.user.name}</p>
                        <p className="text-xs text-text-tan">{p.user.email}</p>
                      </td>
                      <td className="px-4 py-4 hidden md:table-cell">
                        <div className="flex items-center gap-3">
                          <img src={getImageUrl(p.course.image)} alt={p.course.title} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                          <span className="text-text-ink font-medium truncate max-w-[180px]">{p.course.title}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${
                            p.status === 'APPROVED' ? 'bg-primary-soft text-primary' :
                            p.status === 'PENDING' ? 'bg-bg-soft text-text-tan' :
                            'bg-red-50 text-danger'
                          }`}>
                            {p.status === 'APPROVED' ? 'Aprobada' : p.status === 'PENDING' ? 'Pendiente' : 'Denegada'}
                          </span>
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
                          {formatMoney(p.total ?? p.course.priceARS, p.user?.country === 'AUD' ? 'AUD' : 'ARS')}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pie de tabla con estilo limpio */}
              <div className="px-8 py-4 border-t border-gray-100 flex justify-between items-center bg-gray-50/50">
                <span className="text-xs text-text-tan">{filtered.length} registro{filtered.length !== 1 ? 's' : ''}</span>
                <div className="text-right">
                    <p className="font-bold text-text-ink text-sm">Total: ${revenueFiltered.ARS.toLocaleString()} ARS</p>
                    <p className="font-bold text-text-ink text-xs">${revenueFiltered.AUD.toLocaleString()} AUD</p>
                </div>
              </div>
            </>
          )}
        </div>
    </div>
  );
}
