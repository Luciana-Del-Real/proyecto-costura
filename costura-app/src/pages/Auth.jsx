import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Auth({ defaultTab = 'login' }) {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  console.log('[Auth] render start', { defaultTab });
  const [tab, setTab] = useState(defaultTab);
  const location = useLocation();

  useEffect(() => {
    console.log('[Auth] location changed', location.pathname);
    // Priorizar la ruta actual para decidir la pestaña activa
    if (location.pathname === '/registro' || location.pathname === '/register') {
      setTab('register');
    } else if (location.pathname === '/login') {
      setTab('login');
    } else {
      setTab(defaultTab);
    }
  }, [location.pathname, defaultTab]);

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const switchTab = (t) => {
    setTab(t);
    navigate(t === 'login' ? '/login' : '/registro');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (tab === 'login') {
        const user = await login(form.email, form.password);
        navigate(user.role === 'ADMIN' ? '/admin' : '/dashboard');
      } else {
        if (form.password.length < 6) throw new Error('La contraseña debe tener al menos 6 caracteres');
        if (form.password !== form.confirm) throw new Error('Las contraseñas no coinciden');
        await register(form.name.trim(), form.email, form.password);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Error en la operación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen auth-page-bg flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="auth-left flex items-center justify-center">
          <div className="auth-logo-wrapper bg-white flex items-center justify-center border border-theme shadow-lg">
            <img src="/Images/logo-nuevo-grow.png" alt="Grow" className="max-w-[72%] max-h-[72%] object-contain" />
          </div>
        </div>

        <div className="auth-card bg-white rounded-xl shadow-sm border border-theme p-6 w-full max-w-md animate-fade-up">
          <div className="auth-tabs flex items-center gap-2 mb-6 bg-white rounded-xl p-1">
            <button
              type="button"
              onClick={() => switchTab('login')}
              className={`auth-tab login-tab flex-1 text-center py-2 ${tab === 'login' ? 'active' : ''}`}
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              onClick={() => switchTab('register')}
              className={`auth-tab register-tab flex-1 text-center py-2 ${tab === 'register' ? 'active' : ''}`}
            >
              Registrarse
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === 'register' && (
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
            )}

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

            <div>
              <label className="block text-sm font-medium text-theme mb-1.5">Contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="w-full rounded-xl px-4 py-2.5 pr-10 text-sm focus:outline-none auth-input"
                  placeholder={tab === 'register' ? 'Mínimo 6 caracteres' : '••••••••'}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 btn-eye text-theme transition-colors" aria-label="Mostrar contraseña">
                  {showPassword
                    ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
                </button>
              </div>
            </div>

            {tab === 'register' && (
              <div>
                <label className="block text-sm font-medium text-theme mb-1.5">Confirmar contraseña</label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    required
                    value={form.confirm}
                    onChange={e => setForm({ ...form, confirm: e.target.value })}
                    className="w-full rounded-xl px-4 py-2.5 pr-10 text-sm focus:outline-none auth-input"
                    placeholder="Repetí tu contraseña"
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 btn-eye text-theme transition-colors" aria-label="Mostrar contraseña">
                    {showConfirm
                      ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                      : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent text-white py-3 rounded-xl font-semibold hover:opacity-95 transition-colors disabled:opacity-60 mt-2"
            >
              {loading ? (tab === 'login' ? 'Ingresando...' : 'Creando cuenta...') : (tab === 'login' ? 'Iniciar sesión' : 'Crear cuenta')}
            </button>

            <button
              type="button"
              onClick={() => navigate('/')}
              className="w-full text-theme py-2.5 rounded-xl text-sm transition-colors"
            >
              Cancelar
            </button>
          </form>

          <p className="text-center text-sm text-theme mt-6">
            {tab === 'login' ? (
              <>¿No tenés cuenta? <a onClick={() => switchTab('register')} className="text-accent font-medium cursor-pointer">Registrate gratis</a></>
            ) : (
              <>¿Ya tenés cuenta? <a onClick={() => switchTab('login')} className="text-accent font-medium cursor-pointer">Iniciá sesión</a></>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
