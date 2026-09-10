import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import es from './locales/es.json';
import en from './locales/en.json';

/**
 * i18n bootstrap for the es/en pilot.
 *
 * Language resolution order (device/browser based, never geolocation):
 *   1. Explicit user choice persisted in localStorage under `costura_lang`.
 *   2. `navigator.language` when it starts with `en`.
 *   3. Fallback `es` (the app's original language).
 */

export const SUPPORTED_LANGUAGES = ['es', 'en'];
export const DEFAULT_LANGUAGE = 'es';
export const LANGUAGE_STORAGE_KEY = 'costura_lang';

export function isSupportedLanguage(language) {
  return SUPPORTED_LANGUAGES.includes(language);
}

function readStoredLanguage() {
  try {
    if (typeof localStorage === 'undefined') return null;
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return isSupportedLanguage(stored) ? stored : null;
  } catch {
    // Storage can be blocked (private mode, sandboxed iframe); ignore and detect.
    return null;
  }
}

function detectLanguage() {
  const stored = readStoredLanguage();
  if (stored) return stored;

  try {
    if (typeof navigator !== 'undefined') {
      const deviceLanguage = navigator.language || navigator.languages?.[0];
      if (deviceLanguage && deviceLanguage.toLowerCase().startsWith('en')) {
        return 'en';
      }
    }
  } catch {
    // navigator may be unavailable (SSR / node test env); fall through to default.
  }

  return DEFAULT_LANGUAGE;
}

function syncDocumentLanguage(language) {
  if (typeof document !== 'undefined' && document.documentElement) {
    document.documentElement.lang = isSupportedLanguage(language) ? language : DEFAULT_LANGUAGE;
  }
}

i18n.use(initReactI18next).init({
  resources: {
    es: { translation: es },
    en: { translation: en },
  },
  lng: detectLanguage(),
  fallbackLng: DEFAULT_LANGUAGE,
  supportedLngs: SUPPORTED_LANGUAGES,
  interpolation: { escapeValue: false },
  returnNull: false,
});

i18n.on('languageChanged', (language) => {
  syncDocumentLanguage(language);
});

// Keep <html lang> in sync with the initial language too.
syncDocumentLanguage(i18n.resolvedLanguage || i18n.language);

/**
 * Change the active language and persist it as the explicit user choice.
 * Returns the i18next changeLanguage promise.
 */
export function changeAppLanguage(language) {
  const next = isSupportedLanguage(language) ? language : DEFAULT_LANGUAGE;

  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, next);
    }
  } catch {
    // Persisting is best-effort; the in-memory language still changes.
  }

  return i18n.changeLanguage(next);
}

export default i18n;
