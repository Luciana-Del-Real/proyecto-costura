import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  // Estado inicial actualizado con el campo country
  const [form, setForm] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    confirm: '', 
    country: 'ARS' 
  });
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
      // Enviamos el nuevo parámetro country a la función de registro
      await register(form.name.trim(), form.email, form.password, form.country);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const location = useLocation();
  const isRegister = location.pathname === '/registro' || location.pathname === '/register';

  return (
    <div className="min-h-screen auth-page-bg flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Left: large logo and branding */}
        <div className="flex flex-col items-center md:items-start">
          <div className="w-64 h-64 rounded-full bg-white flex items-center justify-center border border-theme shadow-lg">
              <img src="/Images/logo-nuevo-grow.png" alt="Grow" className="w-40 h-40 object-contain" />
          </div>
          <div className="mt-4 text-center md:text-left">
            <h2 className="text-lg font-semibold text-secondary">Creative Education Studio</h2>
            <p className="text-sm text-theme mt-1">Un estudio creativo dedicado a la costura, el bordado y el diseño.</p>
          </div>
        </div>

        {/* Right: auth card with tabs */}
        <div className="auth-card bg-white rounded-xl shadow-sm border border-theme p-6 w-full max-w-md animate-fade-up">
          <div className="flex items-center gap-2 mb-6 bg-white rounded-xl p-1 auth-tabs">
            <Link to="/login" className={`flex-1 text-center py-2 rounded-xl ${!isRegister ? 'text-secondary bg-white font-semibold border-b-4' : 'text-theme'}`} style={!isRegister ? { borderColor: 'var(--secondary)' } : undefined}>
              Iniciar sesión
            </Link>
            <Link to="/registro" className={`flex-1 text-center py-2 rounded-xl ${isRegister ? 'text-accent bg-white font-semibold border-b-4 border-accent' : 'text-theme'}`} style={isRegister ? { borderColor: 'var(--accent)' } : undefined}>
              Registrarse
            </Link>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-theme mb-1.5">Nombre completo</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none auth-input"
                placeholder="Tu nombre"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-theme mb-1.5">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none auth-input"
                placeholder="tu@email.com"
              />
            </div>

            {/* Nuevo Selector de País */}
            <div>
              <label className="block text-sm font-medium text-theme mb-1.5">País de residencia</label>
              <select
                required
                value={form.country}
                onChange={