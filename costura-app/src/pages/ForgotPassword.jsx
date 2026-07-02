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
      setMessage(res?.message || 'Si existe una cuenta, recibirás un email con los pasos.');
    } catch (err) {
      setError(err.message || 'Ocurrió un error al enviar el correo');
    } finally {
      setLoading(false);
    }
  };

  return (
    // Quitamos el min-h-screen aquí porque el Layout ya gestiona el alto
    <div className="flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#6B4C3B] mb-2">Recuperar contraseña</h1>
          <p className="text-gray-500 text-sm">Te enviaremos un correo con el enlace de recuperación</p>
        </div>

        {message && (
          <div className="bg-green-50 border border-green-100 text-green-700 text-sm rounded-xl px-4 py-3 mb-6">
            {message}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3 mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full rounded-xl px-4 py-3 border border-gray-200 focus:ring-2 focus:ring-[#4E6D5B] focus:border-transparent outline-none transition-all"
              placeholder="tu@email.com"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#4E6D5B] text-white py-3 rounded-xl font-semibold hover:bg-[#3d5648] transition-colors disabled:opacity-60"
          >
            {loading ? 'Enviando...' : 'Enviar instrucciones'}
          </button>

          <div className="text-center mt-4">
            <Link to="/login" className="text-sm text-[#4E6D5B] font-medium hover:underline">Volver al inicio de sesión</Link>
          </div>
        </form>
      </div>
    </div>
  );
}