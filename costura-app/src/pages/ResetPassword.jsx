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
    console.log("Token:", token, "Password:", form.password);
  };

  return (
    <div className="flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Título */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#6B4C3B] mb-2">Nueva contraseña</h1>
          <p className="text-gray-500">Ingresá tu nueva clave segura</p>
        </div>

        {/* Tarjeta - ESTÉTICAMENTE IGUAL AL LOGIN */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              required
              placeholder="Nueva contraseña"
              className="w-full rounded-xl px-4 py-3 border border-gray-200 focus:ring-2 focus:ring-[#4E6D5B] outline-none"
              onChange={e => setForm({...form, password: e.target.value})}
            />
            <input
              type="password"
              required
              placeholder="Confirmar contraseña"
              className="w-full rounded-xl px-4 py-3 border border-gray-200 focus:ring-2 focus:ring-[#4E6D5B] outline-none"
              onChange={e => setForm({...form, confirmPassword: e.target.value})}
            />
            <button className="w-full bg-[#4E6D5B] text-white py-3 rounded-xl font-semibold hover:bg-[#3D5749] transition-colors">
              {loading ? 'Actualizando...' : 'Actualizar contraseña'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}