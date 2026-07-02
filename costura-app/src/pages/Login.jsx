import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const loggedUser = await login(form.email, form.password);
      navigate(loggedUser.role === 'ADMIN' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#F8F9FA]">
      <div className="w-full max-w-md">
        {/* Título */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#6B4C3B] mb-2">Bienvenida de nuevo</h1>
          <p className="text-gray-500">Ingresá para continuar aprendiendo</p>
        </div>

        {/* Tarjeta */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              required
              placeholder="Email"
              className="w-full rounded-xl px-4 py-3 border border-gray-200"
              onChange={e => setForm({...form, email: e.target.value})}
            />
            <input
              type="password"
              required
              placeholder="Contraseña"
              className="w-full rounded-xl px-4 py-3 border border-gray-200"
              onChange={e => setForm({...form, password: e.target.value})}
            />
            <button className="w-full bg-[#4E6D5B] text-white py-3 rounded-xl font-semibold">
              {loading ? 'Ingresando...' : 'Iniciar sesión'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}