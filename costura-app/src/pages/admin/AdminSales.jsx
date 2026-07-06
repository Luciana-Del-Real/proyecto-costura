import { useEffect, useState } from 'react';
import { useCourses } from '../../context/CoursesContext';
import { sumByCurrency, formatMoney } from '../../utils/currency';
import { getImageUrl } from '../../utils/media';

export default function AdminSales() {
  const { courses, getAllPurchases, getPendingRequests, approvePurchase, denyPurchase } = useCourses();
  const [allPurchases, setAllPurchases] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [filter, setFilter] = useState('todos');

  useEffect(() => {
    const load = async () => {
      setAllPurchases(await getAllPurchases());
      setPendingRequests(await getPendingRequests());
    };
    load();
  }, []);

  const filtered = filter === 'todos'
      ? allPurchases
      : allPurchases.filter(p => p.course.id === filter);

  const revenueFiltered = sumByCurrency(filtered);

  // Ventas por curso para el mini gráfico (cantidad de ventas, ya que sumar
  // ARS y AUD directamente en una sola barra no tendría sentido)
  const salesPerCourse = courses.map(c => ({
    ...c,
    revenueByCurrency: sumByCurrency(allPurchases.filter(p => p.course.id === c.id)),
    count: allPurchases.filter(p => p.course.id === c.id).length,
  })).filter(c => c.count > 0).sort((a, b) => b.count - a.count);

  const maxCount = salesPerCourse[0]?.count || 1;

  return (
    <div className="max-w-6xl mx-auto px-1 py-1 animate-fade-in">
      <div className="bg-[#F9F5F0] rounded-2xl shadow-sm border border-gray-100 px-4 py-10 animate-fade-up mt-5">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-[#6B4C3B]">Historial de ventas</h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-1 py-1 animate-fade-in mt-6 mb-5">
        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {/* Card de Ingresos Totales */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-fade-up">
            <p className="text-xs uppercase tracking-wider font-bold text-[#A08060] mb-2">Ingresos totales</p>
            <p className="text-lg font-bold text-[#3D2B1F]">${revenueFiltered.ARS.toLocaleString()} ARS</p>
            <p className="text-lg font-bold text-[#3D2B1F]">${revenueFiltered.AUD.toLocaleString()} AUD</p>
          </div>

          {/* Card de Total de Ventas */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-fade-up-delay-1">
            <p className="text-xs uppercase tracking-wider font-bold text-[#A08060] mb-2">Total de ventas</p>
            <p className="text-3xl font-bold text-[#3D2B1F]">{allPurchases.length}</p>
          </div>
        </div>

        {/* Revenue bar chart */}
        {salesPerCourse.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 animate-fade-up mb-8">
            {/* Título con margen inferior para separar del contenido */}
            <h2 className="font-bold text-[#6B4C3B] text-xl">Ventas por curso</h2>
            
            <div className="space-y-6">
              {salesPerCourse.map(c => (
                <div key={c.id} className="flex items-center gap-6">
                  {/* Título del curso */}
                  <p className="text-sm font-medium text-[#3D2B1F] w-40 truncate flex-shrink-0">{c.title}</p>
                  
                  {/* Barra de progreso */}
                  <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-[#4E6D5B] h-3 rounded-full transition-all duration-700"
                      style={{ width: `${(c.count / maxCount) * 100}%` }}
                    />
                  </div>
                  
                  {/* Estadísticas */}
                  <div className="text-right w-32">
                    <span className="text-xs font-bold text-[#3D2B1F] block">{c.count} venta{c.count !== 1 ? 's' : ''}</span>
                    <span className="text-[10px] text-[#A08060] block font-medium">
                      ${c.revenueByCurrency.ARS.toLocaleString()} ARS · ${c.revenueByCurrency.AUD.toLocaleString()} AUD
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contenedor unificado: bg-white, border-gray-100, bordes redondeados */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-fade-up mb-8">
          
          {/* Cabecera con fondo sutil */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap bg-gray-50/50">
            <h2 className="font-bold text-[#6B4C3B] text-xl">Detalle de ventas</h2>
            <select value={filter} onChange={e => setFilter(e.target.value)}
              className="border border-gray-100 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7A9E7E] bg-white text-[#6B4C3B]">
              <option value="todos">Todos los cursos</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[#A08060] text-sm">Sin ventas para mostrar.</p>
            </div>
          ) : (
            <>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="text-left px-8 py-4 text-[#6B4C3B] font-bold text-xs uppercase tracking-wider">Alumna</th>
                    <th className="text-left px-4 py-4 text-[#6B4C3B] font-bold text-xs uppercase tracking-wider hidden md:table-cell">Curso</th>
                    <th className="text-right px-8 py-4 text-[#6B4C3B] font-bold text-xs uppercase tracking-wider">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((p, i) => (
                    <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-8 py-4">
                        <p className="font-semibold text-[#3D2B1F]">{p.user.name}</p>
                        <p className="text-xs text-[#A08060]">{p.user.email}</p>
                      </td>
                      <td className="px-4 py-4 hidden md:table-cell">
                        <div className="flex items-center gap-3">
                          <img src={getImageUrl(p.course.image)} alt={p.course.title} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                          <span className="text-[#3D2B1F] font-medium truncate max-w-[180px]">{p.course.title}</span>
                        </div>
                      </td>
                      <td className="px-8 py-4 text-right">
                        <p className="font-bold text-[#5E8262] text-sm">
                          {formatMoney(p.total ?? p.course.priceARS, p.user?.country === 'AUD' ? 'AUD' : 'ARS')}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pie de tabla con estilo limpio */}
              <div className="px-8 py-4 border-t border-gray-100 flex justify-between items-center bg-gray-50/50">
                <span className="text-xs text-[#A08060]">{filtered.length} registro{filtered.length !== 1 ? 's' : ''}</span>
                <div className="text-right">
                    <p className="font-bold text-[#3D2B1F] text-sm">Total: ${revenueFiltered.ARS.toLocaleString()} ARS</p>
                    <p className="font-bold text-[#6B4C3B] text-xs">${revenueFiltered.AUD.toLocaleString()} AUD</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}