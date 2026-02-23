<<<<<<< HEAD
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RoleBasedRedirect = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const roleRoutes = {
    student: '/dashboard/student',
    candidate: '/dashboard/student',  // candidate = student
    college_admin: '/dashboard/college-admin',
    super_admin: '/dashboard/super-admin',
  };

  const destination = roleRoutes[user.role];

  if (!destination) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={destination} replace />;
};

=======
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RoleBasedRedirect = () => {
  const { user, isLoading } = useAuth();

  // Still restoring session — don't redirect yet
  if (isLoading) return null;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const roleRoutes = {
    student: '/dashboard/student',
    candidate: '/dashboard/student',  // candidate = student
    college_admin: '/dashboard/college-admin',
    super_admin: '/dashboard/super-admin',
  };

  const destination = roleRoutes[user.role];

  if (!destination) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={destination} replace />;
};

>>>>>>> sanjay
export default RoleBasedRedirect;