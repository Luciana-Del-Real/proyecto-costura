import { ShoppingBag } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';

// Gestión de recomendaciones: el formulario todavía no tiene diseño
// definido, por ahora esta ventana queda en blanco con un placeholder
// "En construcción".
export default function AdminProductos() {
  return (
    <div className="w-full px-4 py-8 animate-fade-in">
      <PageHeader title="Recomendaciones" subtitle="Gestión de recomendaciones" />
      <EmptyState
        icon={ShoppingBag}
        title="En construcción"
        description="El formulario de recomendaciones todavía no está diseñado. Muy pronto vas a poder cargar recomendaciones acá."
      />
    </div>
  );
}