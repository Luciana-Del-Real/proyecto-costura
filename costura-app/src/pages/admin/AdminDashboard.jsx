import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCourses } from '../../context/CoursesContext';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { courses, getAllPurchases, getAllUsers, getPendingRequests } = useCourses();
  const [allPurchases, setAllPurchases] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);

  useEffect(() => {
    const load = async () => {
      setAllPurchases(await getAllPurchases());
      setAllUsers(await getAllUsers());
      setPendingRequests(await getPendingRequests());
    };
    load();
  }, [getAllPurchases, getAllUsers, getPendingRequests]);

  const totalRevenue = allPurchases.reduce((sum, p) => sum + (p.course?.price || 0), 0);
  const topCourses = courses
    .map(c => ({ ...c, buyers: allPurchases.filter(p => p.course?.id === c.id).length }))
    .sort((a, b) => b.buyers - a.buyers)
    .slice(0, 5);

  const stats = [
    { label: 'Ingresos totales', value: `$${totalRevenue.toLocaleString()}`, icon: '💰', color: 'bg-[#EAF0EA] text-[#5E8262]' },
    { label: 'Ventas totales', value: allPurchases.length, icon: '🛒', color: 'bg-[#F5E8E2] text-[#A85E42]' },
    { label: 'Solicitudes pendientes', value: pendingRequests.length, icon: '⏳', color: 'bg-[#F5E8E2] text-[#A36700]' },
    { label: 'Alumnos', value: allUsers.length, icon: '👩‍🎓', color: 'bg-[#EDE4D6] text-[#6B4C3B]' },
  ];

  return (
    <div className="min-h-screen auth-page-bg px-4 py-12 flex justify-center">
      <div className="w-full max-w-6xl animate-fade-up">
        
        {/* Cabecera interna */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#6B4C3B]">Bienvenida, {user?.name} 👋</h1>
          <p className="text-theme mt-1">Resumen general de Grow-Creative Education Studio</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((s, i) => (
            <div key={i} className="bg-white rounded-xl p-5 border border-theme shadow-sm hover:shadow-md transition-all">
              <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl text-xl mb-3 ${s.color}`}>
                {s.icon}
              </div>
              <p className="text-2xl font-bold text-theme">{s.value}</p>
              <p className="text-theme text-sm">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Grid inferior */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top courses */}
          <div className="bg-white rounded-xl border border-theme p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-[#6B4C3B]">Cursos más vendidos</h2>
              <Link to="/admin/cursos" className="text-accent text-sm hover:underline">Ver todos →</Link>
            </div>
            {topCourses.length === 0 ? (
              <p className="text-theme text-sm">Sin ventas aún.</p>
            ) : (
              <div className="space-y-4">
                {topCourses.map((c, i) => (
                  <div key={c.id} className="flex items-center gap-3">
                    <span className="text-theme text-sm w-5">{i + 1}</span>
                    <img src={c.image} alt={c.title} className="w-10 h-10 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-theme truncate">{c.title}</p>
                      <p className="text-xs text-theme opacity-70">{c.buyers} venta{c.buyers !== 1 ? 's' : ''}</p>
                    </div>
                    <span className="text-sm font-semibold text-accent">${c.price.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent users */}
          <div className="bg-white rounded-xl border border-theme p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-[#6B4C3B]">Alumnos recientes</h2>
              <Link to="/admin/usuarios" className="text-accent text-sm hover:underline">Ver todos →</Link>
            </div>
            {allUsers.length === 0 ? (
              <p className="text-theme text-sm">Sin alumnos registrados aún.</p>
            ) : (
              <div className="space-y-4">
                {allUsers.slice(-5).reverse().map(u => (
                  <div key={u.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-theme/10 rounded-full flex items-center justify-center text-secondary text-xs font-bold">
                      {u.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-theme truncate">{u.name}</p>
                      <p className="text-xs text-theme opacity-70 truncate">{u.email}</p>
                    </div>
                    <span className="text-xs bg-theme/5 text-theme px-2 py-0.5 rounded-full">
                      {u.purchases?.length || 0} curso{u.purchases?.length !== 1 ? 's' : ''}
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