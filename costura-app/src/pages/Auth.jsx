import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

export default function Auth({ defaultTab = 'login' }) {
  const { t } = useTranslation();
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
      setError(err.message || t('auth.genericError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-bg-surface">
      <div className="w-full max-w-md animate-fade-up">
        
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold text-text-ink mb-2">
            {tab === 'login' ? t('auth.loginTitle') : t('auth.registerTitle')}
          </h1>
          <p className="text-text-muted">
            {tab === 'login' ? t('auth.loginSubtitle') : t('auth.registerSubtitle')}
          </p>
        </div>

        <div className="card-glow-fixed rounded-2xl p-8">
          {error && <p className="text-danger text-sm mb-4 text-center">{error}</p>}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === 'register' && (
              <input type="text" placeholder={t('auth.fullName')} className="bg-white w-full rounded-xl px-4 py-3 border border-gray-200 focus:ring-2 focus:ring-primary outline-none" onChange={e => setForm({...form, name: e.target.value})} />
            )}
            
            <input type="email" placeholder={t('common.email')} className="bg-white w-full rounded-xl px-4 py-3 border border-gray-200 focus:ring-2 focus:ring-primary outline-none" onChange={e => setForm({...form, email: e.target.value})} />

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
                placeholder={t('auth.password')} 
                className="bg-white w-full rounded-xl px-4 py-3 border border-gray-200 focus:ring-2 focus:ring-primary outline-none pr-16" 
                onChange={e => setForm({...form, password: e.target.value})} 
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-ink transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-5 h-5" strokeWidth={1.8} /> : <Eye className="w-5 h-5" strokeWidth={1.8} />}
              </button>
            </div>

            {tab === 'register' && (
              <div className="relative">
                <input 
                  type="password" 
                  placeholder={t('auth.confirmPassword')} 
                  className="bg-white w-full rounded-xl px-4 py-3 border border-gray-200 focus:ring-2 focus:ring-primary outline-none" 
                  onChange={e => setForm({...form, confirm: e.target.value})} 
                />
              </div>
            )}

            {tab === 'login' && (
              <div className="text-right">
                <Link to="/forgot-password" className="text-sm text-text-ink hover:underline font-medium">{t('auth.forgot')}</Link>
              </div>
            )}

            <button type="submit" className="btn btn-primary w-full mt-2">
              {loading ? t('auth.processing') : (tab === 'login' ? t('auth.submitLogin') : t('auth.submitRegister'))}
            </button>
          </form>
        </div>

        <p className="text-center text-sm mt-6 text-text-ink">
          {tab === 'login' ? t('auth.noAccount') : t('auth.hasAccount')}
          <span className="text-text-ink font-bold cursor-pointer hover:underline" onClick={() => switchTab(tab === 'login' ? 'register' : 'login')}>
            {tab === 'login' ? t('auth.goRegister') : t('auth.goLogin')}
          </span>
        </p>
      </div>
    </div>
  );
}