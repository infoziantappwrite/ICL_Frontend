import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RoleBasedRedirect = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const roleRoutes = {
    student: '/dashboard/student',
    college_admin: '/dashboard/college-admin',
    super_admin: '/dashboard/super-admin',
  };

  const destination = roleRoutes[user.role];

  if (!destination) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={destination} replace />;
};

export default RoleBasedRedirect;