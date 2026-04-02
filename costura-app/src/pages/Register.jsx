import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres');
    if (form.password !== form.confirm) return setError('Las contraseñas no coinciden');
    setLoading(true);
    try {
      await register(form.name.trim(), form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5EFE6] flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-3xl shadow-sm border border-[#EDE4D6] p-8 w-full max-w-md animate-fade-up">
        <div className="text-center mb-8">
          <span className="text-4xl">🧵</span>
          <h1 className="text-2xl font-bold text-[#3D2B1F] mt-3">Creá tu cuenta en Grow</h1>
          <p className="text-[#A08060] text-sm mt-1">Empezá a crear con tus propias manos</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#6B4C3B] mb-1.5">Nombre completo</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full border border-[#EDE4D6] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7A9E7E] focus:border-transparent bg-[#F9F5F0]"
              placeholder="Tu nombre"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#6B4C3B] mb-1.5">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className="w-full border border-[#EDE4D6] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7A9E7E] focus:border-transparent bg-[#F9F5F0]"
              placeholder="tu@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#6B4C3B] mb-1.5">Contraseña</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className="w-full border border-[#EDE4D6] rounded-xl px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#7A9E7E] focus:border-transparent bg-[#F9F5F0]"
                placeholder="Mínimo 6 caracteres"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A08060] hover:text-[#6B4C3B] transition-colors">
                {showPassword
                  ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#6B4C3B] mb-1.5">Confirmar contraseña</label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                required
                value={form.confirm}
                onChange={e => setForm({ ...form, confirm: e.target.value })}
                className="w-full border border-[#EDE4D6] rounded-xl px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#7A9E7E] focus:border-transparent bg-[#F9F5F0]"
                placeholder="Repetí tu contraseña"
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A08060] hover:text-[#6B4C3B] transition-colors">
                {showConfirm
                  ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#7A9E7E] text-white py-3 rounded-xl font-semibold hover:bg-[#5E8262] transition-colors disabled:opacity-60 mt-2"
          >
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full text-[#A08060] py-2.5 rounded-xl text-sm hover:text-[#6B4C3B] transition-colors"
          >
            Cancelar
          </button>
        </form>

        <p className="text-center text-sm text-[#A08060] mt-6">
          ¿Ya tenés cuenta?{' '}
          <Link to="/login" className="text-[#C4785A] font-medium hover:text-[#A85E42]">
            Iniciá sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
