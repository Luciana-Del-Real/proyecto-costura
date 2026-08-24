import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Aquí irá tu lógica de envío al backend
  };

  return (
    <div className="flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Título */}
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold text-text-ink mb-2">Nueva contraseña</h1>
          <p className="text-text-muted">Ingresá tu nueva clave segura</p>
        </div>

        {/* Tarjeta - ESTÉTICAMENTE IGUAL AL LOGIN */}
        <div className="bg-white rounded-2xl shadow-sm border border-border p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              required
              placeholder="Nueva contraseña"
              className="w-full rounded-xl px-4 py-3 border border-gray-200 focus:ring-2 focus:ring-primary outline-none"
              onChange={e => setForm({...form, password: e.target.value})}
            />
            <input
              type="password"
              required
              placeholder="Confirmar contraseña"
              className="w-full rounded-xl px-4 py-3 border border-gray-200 focus:ring-2 focus:ring-primary outline-none"
              onChange={e => setForm({...form, confirmPassword: e.target.value})}
            />
            <button className="btn btn-primary w-full font-semibold">
              {loading ? 'Actualizando...' : 'Actualizar contraseña'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}