import { useTranslation } from 'react-i18next';
import { changeAppLanguage } from '../i18n';

const LANGUAGES = [
  { code: 'es', label: 'ES' },
  { code: 'en', label: 'EN' },
];

/**
 * Compact ES/EN toggle. Shows the active language and persists the user's
 * choice through `changeAppLanguage` (localStorage `costura_lang`).
 *
 * `variant="dark"` adapts the control to dark surfaces (e.g. the Footer).
 */
export default function LanguageSwitcher({ variant = 'default', className = '' }) {
  const { i18n, t } = useTranslation();
  const activeLanguage = String(i18n.resolvedLanguage || i18n.language || 'es').slice(0, 2);
  const isDark = variant === 'dark';

  return (
    <div
      role="group"
      aria-label={t('common.changeLanguage')}
      className={`inline-flex items-center rounded-xl border overflow-hidden ${
        isDark ? 'border-white/30' : 'border-border'
      } ${className}`}
    >
      {LANGUAGES.map(({ code, label }) => {
        const isActive = activeLanguage === code;
        return (
          <button
            key={code}
            type="button"
            onClick={() => changeAppLanguage(code)}
            aria-pressed={isActive}
            className={`px-2.5 py-1 text-xs font-semibold uppercase transition-colors ${
              isActive
                ? 'bg-primary text-white'
                : isDark
                  ? 'text-white hover:bg-white/10'
                  : 'text-text-ink hover:bg-bg-soft'
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
