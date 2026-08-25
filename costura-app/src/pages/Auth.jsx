import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Auth({ defaultTab = 'login' }) {
  const navigate = useNavigate();
  const { login, register, logout } = useAuth();
  const [tab, setTab] = useState(defaultTab);
  const [showPassword, setShowPassword] = useState(false);
  useEffect(() => {
    // Si entras a la página de Auth, cerramos la sesión actual 
    // para que no se superpongan estados
    logout(); 
    // logout es estable (useCallback en AuthContext), el efecto corre una sola vez
  }, [logout]);
  
  // Agregamos 'country' al estado inicial del formulario
  const [form, setForm] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    confirm: '', 
    country: 'ARS' 
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const switchTab = (t) => {
    setTab(t);
    navigate(t === 'login' ? '/login' : '/registro');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if (tab === 'register') {
        await register(form.name, form.email, form.password, form.country);
      } else {
        await login(form.email, form.password);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Error al procesar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-bg-surface">
      <div className="w-full max-w-md animate-fade-up">
        
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold text-text-ink mb-2">
            {tab === 'login' ? 'Bienvenida de nuevo' : 'Crear cuenta'}
          </h1>
          <p className="text-text-muted">
            {tab === 'login' ? 'Ingresá para continuar aprendiendo' : 'Formá parte de nuestra comunidad'}
          </p>
        </div>

        <div className="bg-bg-soft rounded-2xl shadow-sm border border-gray-100 p-8">
          {error && <p className="text-danger text-sm mb-4 text-center">{error}</p>}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === 'register' && (
              <input type="text" placeholder="Nombre completo" className="bg-white w-full rounded-xl px-4 py-3 border border-gray-200 focus:ring-2 focus:ring-primary outline-none" onChange={e => setForm({...form, name: e.target.value})} />
            )}
            
            <input type="email" placeholder="Email" className="bg-white w-full rounded-xl px-4 py-3 border border-gray-200 focus:ring-2 focus:ring-primary outline-none" onChange={e => setForm({...form, email: e.target.value})} />

            {/* Selector de país - Solo visible en registro */}
            {tab === 'register' && (
              <select 
                required
                className="w-full rounded-xl px-4 py-3 border border-gray-200 focus:ring-2 focus:ring-primary outline-none bg-white text-gray-600"
                value={form.country}
                onChange={e => setForm({...form, country: e.target.value})}
              >
                <option value="ARS">Argentina (ARS)</option>
                <option value="AUD">Australia (AUD)</option>
              </select>
            )}

            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="Contraseña" 
                className="bg-white w-full rounded-xl px-4 py-3 border border-gray-200 focus:ring-2 focus:ring-primary outline-none pr-16" 
                onChange={e => setForm({...form, password: e.target.value})} 
              />
              <button type="button" className="btn btn-ghost absolute right-1 top-1/2 -translate-y-1/2 text-sm text-primary" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? "Ocultar" : "Ver"}
              </button>
            </div>

            {tab === 'register' && (
              <div className="relative">
                <input 
                  type="password" 
                  placeholder="Confirmar contraseña" 
                  className="bg-white w-full rounded-xl px-4 py-3 border border-gray-200 focus:ring-2 focus:ring-primary outline-none" 
                  onChange={e => setForm({...form, confirm: e.target.value})} 
                />
              </div>
            )}

            {tab === 'login' && (
              <div className="text-right">
                <Link to="/forgot-password" className="text-sm text-text-ink hover:underline font-medium">¿Olvidaste tu contraseña?</Link>
              </div>
            )}

            <button type="submit" className="btn btn-primary w-full mt-2">
              {loading ? 'Procesando...' : (tab === 'login' ? 'Iniciar sesión' : 'Registrarse')}
            </button>
          </form>
        </div>

        <p className="text-center text-sm mt-6 text-text-ink">
          {tab === 'login' ? '¿No tenés cuenta? ' : '¿Ya tenés cuenta? '}
          <span className="text-text-ink font-bold cursor-pointer hover:underline" onClick={() => switchTab(tab === 'login' ? 'register' : 'login')}>
            {tab === 'login' ? 'Registrate gratis' : 'Iniciá sesión'}
          </span>
        </p>
      </div>
    </div>
  );
}