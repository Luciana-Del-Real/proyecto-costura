import { createContext, useContext, useState, useEffect } from 'react';
import { post } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on app start
    const token = localStorage.getItem('costura_token');
    const storedUser = localStorage.getItem('costura_user');
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const register = async (name, email, password) => {
    try {
      const response = await post('/auth/register', { name, email, password });
      const { token, user: userData } = response;
      localStorage.setItem('costura_token', token);
      localStorage.setItem('costura_user', JSON.stringify(userData));
      setUser(userData);
      return userData;
    } catch (error) {
      throw new Error(error.message || 'Error en el registro');
    }
  };

  const login = async (email, password) => {
    try {
      const response = await post('/auth/login', { email, password });
      const { token, user: userData } = response;
      localStorage.setItem('costura_token', token);
      localStorage.setItem('costura_user', JSON.stringify(userData));
      setUser(userData);
      return userData;
    } catch (error) {
      throw new Error(error.message || 'Email o contraseña incorrectos');
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('costura_token');
    localStorage.removeItem('costura_user');
  };

  const updateUser = (data) => {
    const updated = { ...user, ...data };
    setUser(updated);
    localStorage.setItem('costura_user', JSON.stringify(updated));
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
