import { ShoppingBag } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';

// Gestión de productos: el formulario todavía no tiene diseño definido, por
// ahora esta ventana queda en blanco con un placeholder "En construcción".
export default function AdminProductos() {
  return (
    <div className="w-full px-4 py-8 animate-fade-in">
      <PageHeader title="Productos" subtitle="Gestión de productos" />
      <EmptyState
        icon={ShoppingBag}
        title="En construcción"
        description="El formulario de productos todavía no está diseñado. Muy pronto vas a poder cargar productos acá."
      />
    </div>
  );
}