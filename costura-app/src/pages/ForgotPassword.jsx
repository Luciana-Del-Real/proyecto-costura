import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { post } from '../services/api';

export default function ForgotPassword() {
  const { t } = useTranslation();
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
      setMessage(res?.message || t('forgotPassword.successFallback'));
    } catch (err) {
      setError(err.message || t('forgotPassword.errorFallback'));
    } finally {
      setLoading(false);
    }
  };

  return (
    // Quitamos el min-h-screen aquí porque el Layout ya gestiona el alto
    <div className="flex items-center justify-center px-4 py-12">
      <div className="card-glow-fixed rounded-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold text-text-ink mb-2">{t('forgotPassword.title')}</h1>
          <p className="text-text-muted text-sm">{t('forgotPassword.subtitle')}</p>
        </div>

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
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('common.email')}</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full rounded-xl px-4 py-3 border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              placeholder={t('forgotPassword.emailPlaceholder')}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full font-semibold"
          >
            {loading ? t('forgotPassword.sending') : t('forgotPassword.submit')}
          </button>

          <div className="text-center mt-4">
            <Link to="/login" className="text-sm text-primary font-medium hover:underline">{t('forgotPassword.backToLogin')}</Link>
          </div>
        </form>
      </div>
    </div>
  );
}