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
  // - Students are added by college admins with a temporary password → must change it.
  // - Trainers are added by super admins with an auto-generated password → must change it.
  // - Candidates self-register and create their own password → skip change-password.
  if (user.isFirstLogin && (user.role === 'student' || user.role === 'trainer')) {
    return <Navigate to="/change-password" replace />;
  }

  const roleRoutes = {
    student:       '/dashboard/student',
    candidate:     '/dashboard/candidate',
    college_admin: '/dashboard/college-admin',
    super_admin:   '/dashboard/super-admin',
    trainer:       '/dashboard/trainer',
  };

  const destination = roleRoutes[user.role];

  if (!destination) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={destination} replace />;
};

export default RoleBasedRedirect;