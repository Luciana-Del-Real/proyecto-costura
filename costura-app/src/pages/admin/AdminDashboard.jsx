import { useMemo } from 'react';
import { Link } from 'react-router-dom';import { useAuth } from '../../context/AuthContext';
import { useCourses } from '../../context/CoursesContext';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { courses, getAllPurchases, getAllUsers } = useCourses();

  const allPurchases = useMemo(() => getAllPurchases(), []);
  const allUsers = useMemo(() => getAllUsers(), []);

  const totalRevenue = allPurchases.reduce((sum, p) => sum + p.course.price, 0);
  const topCourses = courses
    .map(c => ({ ...c, buyers: allPurchases.filter(p => p.course.id === c.id).length }))
    .sort((a, b) => b.buyers - a.buyers)
    .slice(0, 5);

  const stats = [
    { label: 'Ingresos totales', value: `$${totalRevenue.toLocaleString()}`, icon: '💰', color: 'bg-[#EAF0EA] text-[#5E8262]' },
    { label: 'Ventas totales', value: allPurchases.length, icon: '🛒', color: 'bg-[#F5E8E2] text-[#A85E42]' },
    { label: 'Alumnos', value: allUsers.length, icon: '👩‍🎓', color: 'bg-[#EDE4D6] text-[#6B4C3B]' },
    { label: 'Cursos activos', value: courses.length, icon: '📚', color: 'bg-[#F5EFE6] text-[#3D2B1F]' },
  ];

  return (
    <div className="min-h-screen bg-[#F9F5F0]">
      <div className="bg-[#3D2B1F] px-4 py-10 animate-fade-up">
        <div className="max-w-7xl mx-auto">
          <p className="text-[#C4A882] text-sm mb-1">Panel de administración</p>
          <h1 className="text-3xl font-bold text-[#F5EFE6]">Bienvenida, {user?.name} 👋</h1>
          <p className="text-[#A08060] text-sm mt-1">Resumen general de Grow Textil Creative Institute</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {stats.map((s, i) => (
            <div key={i} className={`stagger-item bg-white rounded-2xl p-5 border border-[#EDE4D6] hover:-translate-y-1 hover:shadow-md transition-all duration-300`}>
              <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl text-xl mb-3 ${s.color}`}>
                {s.icon}
              </div>
              <p className="text-2xl font-bold text-[#3D2B1F]">{s.value}</p>
              <p className="text-[#A08060] text-sm mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top courses */}
          <div className="bg-white rounded-2xl border border-[#EDE4D6] p-6 animate-fade-up">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-[#3D2B1F]">Cursos más vendidos</h2>
              <Link to="/admin/cursos" className="text-[#7A9E7E] text-sm hover:text-[#5E8262]">Ver todos →</Link>
            </div>
            {topCourses.length === 0 ? (
              <p className="text-[#A08060] text-sm">Sin ventas aún.</p>
            ) : (
              <div className="space-y-3">
                {topCourses.map((c, i) => (
                  <div key={c.id} className="flex items-center gap-3">
                    <span className="text-[#A08060] text-sm w-5 text-right">{i + 1}</span>
                    <img src={c.image} alt={c.title} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#3D2B1F] truncate">{c.title}</p>
                      <p className="text-xs text-[#A08060]">{c.buyers} venta{c.buyers !== 1 ? 's' : ''}</p>
                    </div>
                    <span className="text-sm font-semibold text-[#7A9E7E]">${c.price.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent users */}
          <div className="bg-white rounded-2xl border border-[#EDE4D6] p-6 animate-fade-up-delay-1">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-[#3D2B1F]">Alumnos recientes</h2>
              <Link to="/admin/usuarios" className="text-[#7A9E7E] text-sm hover:text-[#5E8262]">Ver todos →</Link>
            </div>
            {allUsers.length === 0 ? (
              <p className="text-[#A08060] text-sm">Sin alumnos registrados aún.</p>
            ) : (
              <div className="space-y-3">
                {allUsers.slice(-5).reverse().map(u => (
                  <div key={u.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#EAF0EA] rounded-full flex items-center justify-center text-[#5E8262] text-sm font-bold flex-shrink-0">
                      {u.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#3D2B1F] truncate">{u.name}</p>
                      <p className="text-xs text-[#A08060] truncate">{u.email}</p>
                    </div>
                    <span className="text-xs bg-[#EDE4D6] text-[#6B4C3B] px-2 py-0.5 rounded-full">
                      {u.purchases.length} curso{u.purchases.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
