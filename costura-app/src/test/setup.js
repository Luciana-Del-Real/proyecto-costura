import { beforeEach } from 'vitest';
import i18n from '../i18n';

/**
 * Global test setup for the es/en pilot.
 *
 * The app is Spanish-first, and the existing suite asserts Spanish copy.
 * jsdom/node expose an English `navigator.language` ('en-US'), so raw device
 * detection would activate English and break those assertions. Pin the active
 * language to 'es' before every test; a test can still switch to 'en'
 * explicitly through `changeAppLanguage` / `i18n.changeLanguage`.
 */
beforeEach(async () => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('costura_lang', 'es');
  }
  await i18n.changeLanguage('es');
});
