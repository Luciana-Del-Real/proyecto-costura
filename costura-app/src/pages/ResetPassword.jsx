import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { post } from '../services/api';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!token) {
      setError('El enlace es inválido o está incompleto. Solicita un nuevo enlace.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      const res = await post('/auth/reset-password', { token, password: form.password });
      setMessage(res?.message || 'Contraseña actualizada correctamente');
      setForm({ password: '', confirmPassword: '' });
    } catch (err) {
      setError(err.message || 'Ocurrió un error al restablecer la contraseña');
    } finally {
      setLoading(false);
    }
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
        <div className="card-flat rounded-2xl p-8">
          {message && (
            <div className="bg-primary-soft border border-border-sage text-success text-sm rounded-xl px-4 py-3 mb-6">
              {message}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3 mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              required
              placeholder="Nueva contraseña"
              value={form.password}
              className="w-full rounded-xl px-4 py-3 border border-gray-200 focus:ring-2 focus:ring-primary outline-none"
              onChange={e => setForm({...form, password: e.target.value})}
            />
            <input
              type="password"
              required
              placeholder="Confirmar contraseña"
              value={form.confirmPassword}
              className="w-full rounded-xl px-4 py-3 border border-gray-200 focus:ring-2 focus:ring-primary outline-none"
              onChange={e => setForm({...form, confirmPassword: e.target.value})}
            />
            <button type="submit" disabled={loading} className="btn btn-primary w-full font-semibold">
              {loading ? 'Actualizando...' : 'Actualizar contraseña'}
            </button>
          </form>

          <div className="text-center mt-4">
            <Link to="/login" className="text-sm text-primary font-medium hover:underline">Volver al inicio de sesión</Link>
          </div>
        </div>
      </div>
    </div>
  );
}