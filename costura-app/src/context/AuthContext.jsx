import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

// Cuenta admin por defecto — se crea si no existe
const ADMIN_SEED = {
  id: 'admin-001',
  name: 'Daia',
  email: 'admin@grow.com',
  password: 'grow2026',
  role: 'admin',
  createdAt: '2026-01-01T00:00:00.000Z',
};

function seedAdmin() {
  const users = JSON.parse(localStorage.getItem('costura_users') || '[]');
  if (!users.find(u => u.id === ADMIN_SEED.id)) {
    users.unshift(ADMIN_SEED);
    localStorage.setItem('costura_users', JSON.stringify(users));
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    seedAdmin();
    const stored = localStorage.getItem('costura_user');
    if (stored) setUser(JSON.parse(stored));
    setLoading(false);
  }, []);

  const register = (name, email, password) => {
    const users = JSON.parse(localStorage.getItem('costura_users') || '[]');
    if (users.find(u => u.email === email)) throw new Error('El email ya está registrado');
    const newUser = {
      id: Date.now(),
      name,
      email,
      password,
      role: 'alumno',
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    localStorage.setItem('costura_users', JSON.stringify(users));
    const { password: _, ...safeUser } = newUser;
    setUser(safeUser);
    localStorage.setItem('costura_user', JSON.stringify(safeUser));
    return safeUser;
  };

  const login = (email, password) => {
    const users = JSON.parse(localStorage.getItem('costura_users') || '[]');
    const found = users.find(u => u.email === email && u.password === password);
    if (!found) throw new Error('Email o contraseña incorrectos');
    if (found.active === false) throw new Error('Tu cuenta está suspendida. Contactá al administrador.');
    const { password: _, ...safeUser } = found;
    setUser(safeUser);
    localStorage.setItem('costura_user', JSON.stringify(safeUser));
    return safeUser;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('costura_user');
  };

  const updateUser = (data) => {
    const updated = { ...user, ...data };
    setUser(updated);
    localStorage.setItem('costura_user', JSON.stringify(updated));
    const users = JSON.parse(localStorage.getItem('costura_users') || '[]');
    const idx = users.findIndex(u => u.id === user.id);
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...data };
      localStorage.setItem('costura_users', JSON.stringify(users));
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout, updateUser, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
