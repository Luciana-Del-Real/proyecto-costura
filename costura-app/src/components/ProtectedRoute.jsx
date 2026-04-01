import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><span className="text-4xl">🧵</span></div>;
  if (!user) return <Navigate to="/" replace />;
  if (isAdmin) return <Navigate to="/admin" replace />;
  return children;
}
