import { Navigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthProvider';
import { Role } from '../../types/models';

export function RequireRole({ children, allowedRoles = [] }) {
  const { userRole, isAdmin } = useAuth();

  // Admin has access to everything
  if (isAdmin) {
    return children;
  }

  // Check if user has any of the allowed roles
  if (allowedRoles.length === 0 || allowedRoles.includes(userRole)) {
    return children;
  }

  // Redirect to dashboard if access denied
  return <Navigate to="/" replace />;
} 