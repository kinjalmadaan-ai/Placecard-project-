import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Spinner } from './ui.jsx';

// Redirects signed-out visitors to /login; non-admins are kept out of /admin.
// (The real enforcement is on the server; this only keeps the UI tidy.)
export default function Protected({ admin = false }) {
  const { user, isAdmin, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname + loc.search }} />;
  if (admin && !isAdmin) return <Navigate to="/portal" replace />;
  return <Outlet />;
}
