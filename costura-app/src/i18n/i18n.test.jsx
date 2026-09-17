// @vitest-environment jsdom
import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Home from '../pages/Home';
import ForgotPassword from '../pages/ForgotPassword';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { changeAppLanguage, LANGUAGE_STORAGE_KEY } from './index';

/**
 * Pilot coverage for the es/en landing shell: Spanish is the default, switching
 * to English re-renders the shell, the explicit choice is persisted, and the
 * document language stays in sync. The global setup pins 'es' before each test.
 */
function renderHome() {
  return render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>,
  );
}

describe('es/en i18n pilot', () => {
  beforeEach(async () => {
    cleanup();
    await changeAppLanguage('es');
  });

  it('renders the landing shell in Spanish by default', () => {
    renderHome();

    expect(screen.getByText('propias manos')).toBeTruthy();
    expect(screen.getByText(/Cursos online de costura/)).toBeTruthy();
    expect(screen.getByText('Ver cursos')).toBeTruthy();
    expect(screen.getByText('¿Por qué elegirnos?')).toBeTruthy();
    expect(screen.getByText('CLASES GRABADAS')).toBeTruthy();
    expect(screen.getByText('¿Quiénes somos?')).toBeTruthy();
    expect(screen.getByText('Empezar ahora')).toBeTruthy();
  });

  it('renders the landing shell in English after switching language', async () => {
    await changeAppLanguage('en');
    renderHome();

    expect(screen.getByText('own hands')).toBeTruthy();
    expect(screen.getByText(/Online sewing, embroidery/)).toBeTruthy();
    expect(screen.getByText('View courses')).toBeTruthy();
    expect(screen.getByText('Why choose us?')).toBeTruthy();
    expect(screen.getByText('RECORDED CLASSES')).toBeTruthy();
    expect(screen.getByText('Who are we?')).toBeTruthy();
    expect(screen.getByText('Start now')).toBeTruthy();
  });

  it('persists the explicit choice and keeps <html lang> in sync', async () => {
    await changeAppLanguage('en');
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('en');
    expect(document.documentElement.lang).toBe('en');

    await changeAppLanguage('es');
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('es');
    expect(document.documentElement.lang).toBe('es');
  });

  it('LanguageSwitcher reflects the active language and toggles on click', async () => {
    render(<LanguageSwitcher />);

    const esButton = screen.getByRole('button', { name: 'ES' });
    const enButton = screen.getByRole('button', { name: 'EN' });
    expect(esButton.getAttribute('aria-pressed')).toBe('true');
    expect(enButton.getAttribute('aria-pressed')).toBe('false');

    fireEvent.click(enButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'EN' }).getAttribute('aria-pressed')).toBe('true');
    });
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('en');
    expect(document.documentElement.lang).toBe('en');
  });

  it('renders the forgot-password page in Spanish by default', () => {
    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>,
    );

    expect(screen.getByText('Recuperar contraseña')).toBeTruthy();
    expect(screen.getByText('Enviar instrucciones')).toBeTruthy();
  });

  it('renders the forgot-password page in English after switching language', async () => {
    await changeAppLanguage('en');
    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>,
    );

    expect(screen.getByText('Recover password')).toBeTruthy();
    expect(screen.getByText('Send instructions')).toBeTruthy();
  });
});
