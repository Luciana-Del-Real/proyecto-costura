import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { post } from '../services/api';

export default function ResetPassword() {
  const { t } = useTranslation();
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
      setError(t('resetPassword.invalidLink'));
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError(t('resetPassword.mismatch'));
      return;
    }

    setLoading(true);
    try {
      const res = await post('/auth/reset-password', { token, password: form.password });
      setMessage(res?.message || t('resetPassword.successFallback'));
      setForm({ password: '', confirmPassword: '' });
    } catch (err) {
      setError(err.message || t('resetPassword.errorFallback'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Título */}
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold text-text-ink mb-2">{t('resetPassword.title')}</h1>
          <p className="text-text-muted">{t('resetPassword.subtitle')}</p>
        </div>

        {/* Tarjeta - ESTÉTICAMENTE IGUAL AL LOGIN */}
        <div className="card-glow-fixed rounded-2xl p-8">
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
              placeholder={t('resetPassword.newPassword')}
              value={form.password}
              className="w-full rounded-xl px-4 py-3 border border-gray-200 focus:ring-2 focus:ring-primary outline-none"
              onChange={e => setForm({...form, password: e.target.value})}
            />
            <input
              type="password"
              required
              placeholder={t('resetPassword.confirmPassword')}
              value={form.confirmPassword}
              className="w-full rounded-xl px-4 py-3 border border-gray-200 focus:ring-2 focus:ring-primary outline-none"
              onChange={e => setForm({...form, confirmPassword: e.target.value})}
            />
            <button type="submit" disabled={loading} className="btn btn-primary w-full font-semibold">
              {loading ? t('resetPassword.updating') : t('resetPassword.submit')}
            </button>
          </form>

          <div className="text-center mt-4">
            <Link to="/login" className="text-sm text-primary font-medium hover:underline">{t('resetPassword.backToLogin')}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}