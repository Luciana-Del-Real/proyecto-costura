import { ShoppingBag } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';

// Sección pública de productos y servicios: todavía no hay diseño definido,
// por ahora es una ventana en blanco con un placeholder "Muy pronto".
export default function Productos() {
  return (
    <div className="w-full px-4 py-8 animate-fade-in">
      <PageHeader title="Productos" subtitle="Muy pronto..." />
      <EmptyState
        icon={ShoppingBag}
        title="Esta sección está en construcción"
        description="Pronto vas a encontrar acá los productos y servicios de Grow."
      />
    </div>
  );
}