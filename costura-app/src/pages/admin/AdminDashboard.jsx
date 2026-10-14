import { useState, useEffect } from 'react';
import { Coins, ShoppingBag, Inbox, Users } from 'lucide-react';
import { usePurchases } from '../../context/PurchaseContext';
import { useAdmin } from '../../context/AdminContext';
import { sumByCurrency } from '../../utils/currency';
import { listAllPatternPurchases } from '../../services/api';
import WelcomeToast from '../../components/WelcomeToast';
import PageHeader from '../../components/PageHeader';
import LoadingState from '../../components/LoadingState';
import ConsultasSection from '../../components/admin/ConsultasSection';
import useHighlightTarget from '../../hooks/useHighlightTarget';

// Panel de inicio del admin: solo las métricas de resumen. Los listados de
// cursos y alumnas viven en sus propias pantallas (/admin/cursos y
// /admin/usuarios), así que acá no se repiten.
export default function AdminDashboard() {
  const { getAllPurchases, getPendingRequests } = usePurchases();
  const { getAllUsers } = useAdmin();
  const [allPurchases, setAllPurchases] = useState([]);
  const [patternPurchases, setPatternPurchases] = useState([]);
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
        setPatternPurchases(await listAllPatternPurchases());
        setAllUsers(await getAllUsers());
        setPendingRequests(await getPendingRequests());
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [getAllPurchases, getAllUsers, getPendingRequests]);

  // Ventas de cursos + patrones: el panel contabiliza las dos.
  const allSales = [...allPurchases, ...patternPurchases];
  const revenueByCurrency = sumByCurrency(allSales);

  const stats = [
    {
      label: 'Ingresos totales',
      values: { ars: revenueByCurrency.ARS, aud: revenueByCurrency.AUD },
      Icon: Coins,
    },
    { label: 'Ventas totales', value: allSales.length, Icon: ShoppingBag },
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
      )}

      {/* Bandeja de consultas: todas las preguntas de las alumnas */}
      <ConsultasSection />
    </div>
  );
}
