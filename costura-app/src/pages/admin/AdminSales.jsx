import { useMemo, useState } from 'react';
import { useCourses } from '../../context/CoursesContext';

export default function AdminSales() {
  const { courses, getAllPurchases, getPendingRequests, approvePurchase, denyPurchase } = useCourses();
  const allPurchases = useMemo(() => getAllPurchases(), [getAllPurchases]);
  const pendingRequests = useMemo(() => getPendingRequests(), [getPendingRequests]);
  const [filter, setFilter] = useState('todos');

  const filtered = filter === 'todos'
    ? allPurchases
    : allPurchases.filter(p => p.course.id === Number(filter));

  const totalRevenue = filtered.reduce((sum, p) => sum + p.course.price, 0);

  // Revenue per course for mini chart
  const revenuePerCourse = courses.map(c => ({
    ...c,
    revenue: allPurchases.filter(p => p.course.id === c.id).reduce((s, p) => s + p.course.price, 0),
    count: allPurchases.filter(p => p.course.id === c.id).length,
  })).filter(c => c.count > 0).sort((a, b) => b.revenue - a.revenue);

  const maxRevenue = revenuePerCourse[0]?.revenue || 1;

  return (
    <div className="min-h-screen bg-[#F9F5F0]">
      <div className="bg-[#F5EFE6] py-8 px-4 border-b border-[#EDE4D6]">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-[#3D2B1F]">Historial de ventas</h1>
          <p className="text-[#A08060] text-sm mt-0.5">{allPurchases.length} venta{allPurchases.length !== 1 ? 's' : ''} en total</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Pending approvals */}
        <div className="bg-white rounded-2xl border border-[#EDE4D6] p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-[#3D2B1F]">Solicitudes pendientes de pago</h2>
            <span className="text-xs text-[#A08060]">{pendingRequests.length} solicitud{pendingRequests.length !== 1 ? 'es' : ''}</span>
          </div>
          {pendingRequests.length === 0 ? (
            <p className="text-[#A08060] text-sm">No hay solicitudes pendientes.</p>
          ) : (
            <div className="grid gap-3">
              {pendingRequests.map((req, idx) => (
                <div key={`${req.user.id}-${req.course.id}-${idx}`} className="bg-[#F9F5F0] rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-[#3D2B1F]">{req.user.name} ({req.user.email})</p>
                    <p className="text-xs text-[#6B4C3B]">{req.course.title} - {req.course.price ? `$${req.course.price.toLocaleString()}` : ''}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => approvePurchase(req.course.id)} className="px-3 py-1.5 text-xs bg-[#7A9E7E] text-white rounded-lg hover:bg-[#5E8262]">Aprobar</button>
                    <button onClick={() => denyPurchase(req.course.id)} className="px-3 py-1.5 text-xs bg-[#EDE4D6] text-[#6B4C3B] rounded-lg hover:bg-[#D4C2B5]">Rechazar</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-[#EDE4D6] p-5 animate-fade-up">
            <p className="text-[#A08060] text-xs mb-1">Ingresos totales</p>
            <p className="text-2xl font-bold text-[#3D2B1F]">${allPurchases.reduce((s, p) => s + p.course.price, 0).toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-2xl border border-[#EDE4D6] p-5 animate-fade-up-delay-1">
            <p className="text-[#A08060] text-xs mb-1">Total de ventas</p>
            <p className="text-2xl font-bold text-[#3D2B1F]">{allPurchases.length}</p>
          </div>
          <div className="bg-white rounded-2xl border border-[#EDE4D6] p-5 animate-fade-up-delay-2">
            <p className="text-[#A08060] text-xs mb-1">Ticket promedio</p>
            <p className="text-2xl font-bold text-[#3D2B1F]">
              ${allPurchases.length > 0 ? Math.round(allPurchases.reduce((s, p) => s + p.course.price, 0) / allPurchases.length).toLocaleString() : 0}
            </p>
          </div>
        </div>

        {/* Revenue bar chart */}
        {revenuePerCourse.length > 0 && (
          <div className="bg-white rounded-2xl border border-[#EDE4D6] p-6 mb-8 animate-fade-up">
            <h2 className="font-bold text-[#3D2B1F] mb-5">Ingresos por curso</h2>
            <div className="space-y-3">
              {revenuePerCourse.map(c => (
                <div key={c.id} className="flex items-center gap-3">
                  <p className="text-xs text-[#6B4C3B] w-40 truncate flex-shrink-0">{c.title}</p>
                  <div className="flex-1 bg-[#F5EFE6] rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-[#7A9E7E] h-2.5 rounded-full transition-all duration-700"
                      style={{ width: `${(c.revenue / maxRevenue) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-[#3D2B1F] w-20 text-right flex-shrink-0">${c.revenue.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filter + table */}
        <div className="bg-white rounded-2xl border border-[#EDE4D6] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#F5EFE6] flex items-center justify-between gap-3 flex-wrap">
            <h2 className="font-bold text-[#3D2B1F] text-sm">Detalle de ventas</h2>
            <select value={filter} onChange={e => setFilter(e.target.value)}
              className="border border-[#EDE4D6] rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7A9E7E] bg-[#F9F5F0] text-[#6B4C3B]">
              <option value="todos">Todos los cursos</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-4xl">💳</span>
              <p className="text-[#A08060] mt-3 text-sm">Sin ventas para mostrar.</p>
            </div>
          ) : (
            <>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#F9F5F0] border-b border-[#EDE4D6]">
                    <th className="text-left px-4 py-3 text-[#6B4C3B] font-semibold text-xs">Alumna</th>
                    <th className="text-left px-4 py-3 text-[#6B4C3B] font-semibold text-xs hidden sm:table-cell">Curso</th>
                    <th className="text-right px-4 py-3 text-[#6B4C3B] font-semibold text-xs">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F5EFE6]">
                  {filtered.map((p, i) => (
                    <tr key={i} className="stagger-item hover:bg-[#F9F5F0] transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-[#3D2B1F]">{p.user.name}</p>
                        <p className="text-xs text-[#A08060]">{p.user.email}</p>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <div className="flex items-center gap-2">
                          <img src={p.course.image} alt={p.course.title} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                          <span className="text-[#3D2B1F] truncate max-w-[180px]">{p.course.title}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-[#7A9E7E]">${p.course.price.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-4 py-3 border-t border-[#F5EFE6] flex justify-between items-center">
                <span className="text-xs text-[#A08060]">{filtered.length} registro{filtered.length !== 1 ? 's' : ''}</span>
                <span className="font-bold text-[#3D2B1F] text-sm">Total: ${totalRevenue.toLocaleString()}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
