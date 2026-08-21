import { createContext, useContext } from 'react';
import { get, del, patch } from '../services/api';

const AdminContext = createContext(null);

export function AdminProvider({ children }) {
  const getAllUsers = async () => get('/users');
  const deleteUser = async (userId) => del(`/users/${userId}`);
  const toggleUserActive = async (userId) => patch(`/users/${userId}/active`);

  return (
    <AdminContext.Provider value={{
      getAllUsers, deleteUser, toggleUserActive,
    }}>
      {children}
    </AdminContext.Provider>
  );
}
// eslint-disable-next-line react-refresh/only-export-components
export const useAdmin = () => useContext(AdminContext);