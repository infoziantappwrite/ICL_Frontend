// src/components/RoleBasedRedirect.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RoleBasedRedirect = () => {
  const { user, isLoading } = useAuth();

  // Still restoring session — don't redirect yet
  if (isLoading) return null;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // First-login flow:
  // - Students are added by college admins and given a temporary password,
  //   so they MUST change it on first login.
  // - Candidates self-register and create their own password during signup,
  //   so they skip the change-password step entirely and go straight to their dashboard.
  if (user.isFirstLogin && user.role === 'student') {
    return <Navigate to="/change-password" replace />;
  }

  const roleRoutes = {
    student:       '/dashboard/student',
    candidate:     '/dashboard/candidate',
    college_admin: '/dashboard/college-admin',
    super_admin:   '/dashboard/super-admin',
  };

  const destination = roleRoutes[user.role];

  if (!destination) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={destination} replace />;
};

export default RoleBasedRedirect;