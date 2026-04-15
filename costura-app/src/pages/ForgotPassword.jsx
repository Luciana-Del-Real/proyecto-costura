import { useState } from 'react';
import { Link } from 'react-router-dom';
import { post } from '../services/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const res = await post('/auth/forgot-password', { email });
      setMessage(res?.message || 'Si existe una cuenta recibirás un email.');
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
          <h1 className="text-2xl font-bold text-[#3D2B1F]">Recuperar contraseña</h1>
          <p className="text-[#A08060] text-sm mt-1">Te enviaremos un correo con el enlace de recuperación</p>
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
            <label className="block text-sm font-medium text-[#6B4C3B] mb-1.5">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full border border-[#EDE4D6] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7A9E7E] focus:border-transparent bg-[#F9F5F0]"
              placeholder="tu@email.com"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#7A9E7E] text-white py-3 rounded-xl font-semibold hover:bg-[#5E8262] transition-colors disabled:opacity-60"
          >
            {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
          </button>

          <div className="text-center">
            <Link to="/login" className="text-sm text-[#A08060] hover:text-[#6B4C3B]">Volver al login</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
