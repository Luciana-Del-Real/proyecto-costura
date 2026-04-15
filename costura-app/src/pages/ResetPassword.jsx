import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { post } from '../services/api';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = searchParams.get('token') || '';
    setToken(t);
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!token) return setError('Token inválido');
    if (password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres');
    if (password !== confirm) return setError('Las contraseñas no coinciden');

    setLoading(true);
    try {
      const res = await post('/auth/reset-password', { token, password });
      setMessage(res?.message || 'Contraseña restablecida correctamente');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.message || 'Ocurrió un error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5EFE6] flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-3xl shadow-sm border border-[#EDE4D6] p-8 w-full max-w-md animate-fade-up">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-[#3D2B1F]">Restablecer contraseña</h1>
          <p className="text-[#A08060] text-sm mt-1">Ingresá tu nueva contraseña</p>
        </div>

        {message && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 mb-4">
            {message}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#6B4C3B] mb-1.5">Nueva contraseña</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border border-[#EDE4D6] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7A9E7E] focus:border-transparent bg-[#F9F5F0]"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#6B4C3B] mb-1.5">Confirmar contraseña</label>
            <input
              type="password"
              required
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              className="w-full border border-[#EDE4D6] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7A9E7E] focus:border-transparent bg-[#F9F5F0]"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#7A9E7E] text-white py-3 rounded-xl font-semibold hover:bg-[#5E8262] transition-colors disabled:opacity-60"
          >
            {loading ? 'Procesando...' : 'Restablecer contraseña'}
          </button>

          <div className="text-center">
            <Link to="/login" className="text-sm text-[#A08060] hover:text-[#6B4C3B]">Volver al login</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
