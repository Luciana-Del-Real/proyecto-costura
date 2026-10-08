import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingState from './LoadingState';

export default function ProtectedRoute({ children }) {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <LoadingState size="page" />;
  if (!user) return <Navigate to="/" replace />;
  if (isAdmin) return <Navigate to="/admin" replace />;
  return children;
}
