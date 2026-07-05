import { useEffect, useState } from 'react';
import { useCourses } from '../../context/CoursesContext';

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

  const totalRevenueARS = filtered.reduce((sum, p) => sum + (p.course.priceARS || 0), 0);
  const totalRevenueAUD = filtered.reduce((sum, p) => sum + (p.course.priceAUD || 0), 0);

  // Revenue per course for mini chart
  const revenuePerCourse = courses.map(c => ({
    ...c,
    revenueARS: allPurchases.filter(p => p.course.id === c.id).reduce((s, p) => s + (p.course.priceARS || 0), 0),
    revenueAUD: allPurchases.filter(p => p.course.id === c.id).reduce((s, p) => s + (p.course.priceAUD || 0), 0),
    count: allPurchases.filter(p => p.course.id === c.id).length,
  })).filter(c => c.count > 0).sort((a, b) => b.revenueARS - a.revenueARS);

  const maxRevenue = revenuePerCourse[0]?.revenueARS || 1;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="bg-[#F5EFE6] py-8 px-4 border-b border-[#EDE4D6]">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-[#6B4C3B]">Historial de ventas</h1>
          <p className="text-[#A08060] text-sm mt-0.5">{allPurchases.length} venta{allPurchases.length !== 1 ? 's' : ''} en total</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-[#EDE4D6] p-5 animate-fade-up">
            <p className="text-[#A08060] text-sm mt-0.5">Ingresos totales</p>
            <p className="text-md font-bold text-[#3D2B1F]">${totalRevenueARS.toLocaleString()} ARS</p>
            <p className="text-md font-bold text-[#3D2B1F]">${totalRevenueAUD.toLocaleString()} AUD</p>
          </div>
          <div className="bg-white rounded-2xl border border-[#EDE4D6] p-5 animate-fade-up-delay-1">
            <p className="text-[#A08060] text-sm mt-0.5">Total de ventas</p>
            <p className="text-2xl font-bold text-[#3D2B1F]">{allPurchases.length}</p>
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
                      style={{ width: `${(c.revenueARS / maxRevenue) * 100}%` }}
                    />
                  </div>
                  <div className="text-right w-24">
                      <span className="text-xs font-semibold text-[#3D2B1F] block">${c.revenueARS.toLocaleString()} ARS</span>
                      <span className="text-[10px] text-[#A08060] block">${c.revenueAUD.toLocaleString()} AUD</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filter + table */}
        <div className="bg-white rounded-2xl border border-[#EDE4D6] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#F5EFE6] flex items-center justify-between gap-3 flex-wrap">
            <h2 className="font-bold text-black text-xl">Detalle de ventas</h2>
            <select value={filter} onChange={e => setFilter(e.target.value)}
              className="border border-[#EDE4D6] rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7A9E7E] bg-[#F9F5F0] text-[#6B4C3B]">
              <option value="todos">Todos los cursos</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[#A08060] text-sm mt-0.5">Sin ventas para mostrar.</p>
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
                      <td className="px-4 py-3 text-right">
                        <p className="font-semibold text-[#7A9E7E] text-sm">${p.course.priceARS.toLocaleString()} ARS</p>
                        <p className="text-xs text-[#A08060]">${p.course.priceAUD.toLocaleString()} AUD</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-4 py-3 border-t border-[#F5EFE6] flex justify-between items-center">
                <span className="text-xs text-[#A08060]">{filtered.length} registro{filtered.length !== 1 ? 's' : ''}</span>
                <div className="text-right">
                    <p className="font-bold text-[#3D2B1F] text-sm">Total: ${totalRevenueARS.toLocaleString()} ARS</p>
                    <p className="font-bold text-[#6B4C3B] text-xs">${totalRevenueAUD.toLocaleString()} AUD</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}