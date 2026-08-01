import { createContext, useContext, useState, useEffect } from 'react';
import { post } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on app start
    const token = sessionStorage.getItem('costura_token');
    const storedUser = sessionStorage.getItem('costura_user');
    if (token && storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed && parsed.role) parsed.role = String(parsed.role).toUpperCase();
        setUser(parsed);
      } catch (e) {
        logout(); // Si falla el parseo, limpiamos todo
      }
    } else {
      // Si no hay datos, aseguramos que el estado esté limpio
      setUser(null);
    }
    setLoading(false);
  }, []);

  const register = async (name, email, password, country) => {
    try {
      const response = await post('/api/auth/register', { name, email, password, country });
      const { token, user: userData } = response;
      const normalized = { ...userData, role: userData.role ? String(userData.role).toUpperCase() : userData.role };
      sessionStorage.setItem('costura_token', token);
      sessionStorage.setItem('costura_user', JSON.stringify(normalized)); 
      setUser(normalized);
      return userData;
    } catch (error) {
      throw new Error(error.message || 'Error en el registro');
    }
  };

  const login = async (email, password) => {
    try {
      const response = await post('/api/auth/login', { email, password });
      const { token, user: userData } = response;
      const normalized = { ...userData, role: userData.role ? String(userData.role).toUpperCase() : userData.role };
      sessionStorage.setItem('costura_token', token);
      sessionStorage.setItem('costura_user', JSON.stringify(normalized));
      setUser(normalized);
      return normalized;
    } catch (error) {
      throw new Error(error.message || 'Email o contraseña incorrectos');
    }
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('costura_token');
    sessionStorage.removeItem('costura_user');
  };

  const updateUser = (data) => {
    const updated = { ...user, ...data };
    setUser(updated);
    sessionStorage.setItem('costura_user', JSON.stringify(updated));
  };

  const isAdmin = user?.role === 'ADMIN';

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }

  return (
    <AuthContext.Provider value={{ user, register, login, logout, updateUser, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
