import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { post, patch } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // logout se declara antes del useEffect que lo usa (evita el acceso TDZ) y se
  // memoiza con useCallback para que sea estable como dependencia de efectos.
  const logout = useCallback(() => {
    setUser(null);
    sessionStorage.removeItem('costura_token');
    sessionStorage.removeItem('costura_user');
    sessionStorage.removeItem('costura_welcome');
  }, []);

  useEffect(() => {
    // Check if user is logged in on app start
    const token = sessionStorage.getItem('costura_token');
    const storedUser = sessionStorage.getItem('costura_user');
    if (token && storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed && parsed.role) parsed.role = String(parsed.role).toUpperCase();
        // Restaurar la sesión persistida al montar es el caso legítimo de
        // "sincronizar estado con un sistema externo"; el setState síncrono
        // acá es intencional y corre una sola vez al montar.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setUser(parsed);
      } catch {
        logout(); // Si falla el parseo, limpiamos todo
      }
    } else {
      // Si no hay datos, aseguramos que el estado esté limpio
      setUser(null);
    }
    setLoading(false);
  }, [logout]);

  const register = async (name, email, password, country) => {
    try {
      const response = await post('/auth/register', { name, email, password, country });
      const { token, user: userData } = response;
      const normalized = { ...userData, role: userData.role ? String(userData.role).toUpperCase() : userData.role };
      sessionStorage.setItem('costura_token', token);
      sessionStorage.setItem('costura_user', JSON.stringify(normalized)); 
      sessionStorage.setItem('costura_welcome', '1');
      setUser(normalized);
      return userData;
    } catch (error) {
      throw new Error(error.message || 'Error en el registro');
    }
  };

  const login = async (email, password) => {
    try {
      const response = await post('/auth/login', { email, password });
      const { token, user: userData } = response;
      const normalized = { ...userData, role: userData.role ? String(userData.role).toUpperCase() : userData.role };
      sessionStorage.setItem('costura_token', token);
      sessionStorage.setItem('costura_user', JSON.stringify(normalized));
      sessionStorage.setItem('costura_welcome', '1');
      setUser(normalized);
      return normalized;
    } catch (error) {
      throw new Error(error.message || 'Email o contraseña incorrectos');
    }
  };

  const updateUser = async (data) => {
    if (!user?.id) {
      throw new Error('No hay usuario autenticado');
    }
    try {
      const response = await patch(`/users/${user.id}`, data);
      const updated = {
        ...user,
        ...response,
        role: response.role ? String(response.role).toUpperCase() : user.role,
      };
      setUser(updated);
      sessionStorage.setItem('costura_user', JSON.stringify(updated));
      return updated;
    } catch (error) {
      throw new Error(error.message || 'Error al actualizar el perfil');
    }
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
