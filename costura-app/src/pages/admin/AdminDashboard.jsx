import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Coins, ShoppingBag, Inbox, Users } from 'lucide-react';
import { useCourseCatalog } from '../../context/CourseCatalogContext';
import { usePurchases } from '../../context/PurchaseContext';
import { useAdmin } from '../../context/AdminContext';
import { sumByCurrency } from '../../utils/currency';
import CourseCover from '../../components/CourseCover';
import WelcomeToast from '../../components/WelcomeToast';
import PageHeader from '../../components/PageHeader';
import LoadingState from '../../components/LoadingState';
import ConsultasSection from '../../components/admin/ConsultasSection';
import useHighlightTarget from '../../hooks/useHighlightTarget';

export default function AdminDashboard() {
  const { courses } = useCourseCatalog();
  const { getAllPurchases, getPendingRequests } = usePurchases();
  const { getAllUsers } = useAdmin();
  const [allPurchases, setAllPurchases] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Al llegar desde una notificación con #consultas (o ?highlight=), scrollear
  // hasta la bandeja y marcarla en gris unos segundos.
  useHighlightTarget();

  useEffect(() => {
    const load = async () => {
      try {
        setAllPurchases(await getAllPurchases());
        setAllUsers(await getAllUsers());
        setPendingRequests(await getPendingRequests());
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [getAllPurchases, getAllUsers, getPendingRequests]);

  const revenueByCurrency = sumByCurrency(allPurchases);
  const topCourses = courses
    .map(c => ({ ...c, buyers: allPurchases.filter(p => p.course?.id === c.id).length }))
    .sort((a, b) => b.buyers - a.buyers)
    .slice(0, 5);

  const stats = [
    {
      label: 'Ingresos totales',
      values: { ars: revenueByCurrency.ARS, aud: revenueByCurrency.AUD },
      Icon: Coins,
    },
    { label: 'Ventas totales', value: allPurchases.length, Icon: ShoppingBag },
    { label: 'Solicitudes pendientes', value: pendingRequests.length, Icon: Inbox },
    { label: 'Alumnos', value: allUsers.length, Icon: Users },
  ];

  return (
    <div className="w-full px-4 py-8 animate-fade-in">
      <PageHeader title="Panel" subtitle="Resumen de tu academia." />

      <WelcomeToast message="¡Bienvenida!" />

      {loading ? (
        <LoadingState size="section" />
      ) : (
        <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-6">
        {stats.map((s, i) => (
          <div key={i} className="card-flat rounded-xl p-5 transition-all flex flex-col h-full">

            {/* Contenedor del label */}
            <div className="flex items-center gap-3 mb-3">
              <s.Icon className="w-10 h-10 text-primary" strokeWidth={1.5} />
              <p className="font-body text-text-ink text-sm font-medium">{s.label}</p>
            </div>

            {/* Valores */}
            <div className="flex-grow">
              {s.label === 'Ingresos totales' ? (
                <div className="flex flex-col">
                  <p className="font-body text-lg font-bold text-text-ink">${s.values.ars.toLocaleString()} ARS</p>
                  <p className="font-body text-lg font-bold text-text-ink">${s.values.aud.toLocaleString()} AUD</p>
                </div>
              ) : (
                <p className="font-body text-2xl font-bold text-text-ink">{s.value}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Grid inferior */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top courses */}
        <div className="card-flat rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-bold text-text-ink text-2xl">Cursos</h2>
            <Link to="/admin/cursos" className="text-text-tan text-sm mt-0.5 hover:underline">Ver todos →</Link>
          </div>
          {topCourses.length === 0 ? (
            <p className="text-text-ink text-sm">Sin ventas aún.</p>
          ) : (
            <div className="space-y-4">
              {topCourses.map((c, i) => (
                <div key={c.id} className="flex items-center gap-3">
                  <span className="text-text-ink text-sm w-5">{i + 1}</span>
                  <CourseCover course={c} className="w-10 h-10 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-ink truncate">{c.title}</p>
                    <p className="text-xs text-text-ink opacity-70">{c.buyers} venta{c.buyers !== 1 ? 's' : ''}</p>
                  </div>
                  <span className="text-sm font-semibold text-accent">${c.priceARS.toLocaleString()} ARS</span>
                  <span className="text-sm text-text-ink hidden sm:inline">${c.priceAUD.toLocaleString()} AUD</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent users */}
        <div className="card-flat rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-bold text-text-ink text-2xl">Alumnos</h2>
            <Link to="/admin/usuarios" className="text-text-tan text-sm mt-0.5 hover:underline">Ver todos →</Link>
          </div>
          {allUsers.length === 0 ? (
            <p className="text-text-ink text-sm">Sin alumnos registrados aún.</p>
          ) : (
            <div className="space-y-4">
              {allUsers.slice(-5).reverse().map(u => (
                <div key={u.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-bg-surface rounded-full flex items-center justify-center text-primary text-xs font-bold">
                    {u.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-ink truncate">{u.name}</p>
                    <p className="text-xs text-text-ink opacity-70 truncate">{u.email}</p>
                  </div>
                  <span className="text-xs bg-bg-surface text-text-ink px-2 py-0.5 rounded-full">
                    {u.purchases?.length || 0} curso{u.purchases?.length !== 1 ? 's' : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
        </>
      )}

      {/* Bandeja de consultas: todas las preguntas de las alumnas */}
      <ConsultasSection />
    </div>
  );
}
