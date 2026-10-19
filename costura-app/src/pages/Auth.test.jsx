// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';

const mocks = vi.hoisted(() => ({ nav: vi.fn(), logout: vi.fn(), user: null }));

vi.mock('react-router-dom', () => ({ useNavigate: () => mocks.nav, Link: () => null }));
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: mocks.user, login: vi.fn(), register: vi.fn(), logout: mocks.logout }),
}));

import Auth from './Auth';

describe('Auth con sesión iniciada', () => {
  beforeEach(() => {
    mocks.nav.mockClear();
    mocks.logout.mockClear();
  });

  // El contrato nuevo: si ya hay sesión, se redirige a la home del rol con
  // replace y NO se cierra la sesión (antes: logout al montar, que expulsaba
  // a la alumna recién logueada).
  it.each([['ADMIN', '/admin'], ['ALUMNO', '/dashboard']])(
    'redirige al %s a %s sin cerrar la sesión',
    (role, to) => {
      mocks.user = { role };
      render(<Auth />);
      expect(mocks.nav).toHaveBeenCalledWith(to, { replace: true });
      expect(mocks.logout).not.toHaveBeenCalled();
    },
  );
});
