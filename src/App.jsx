// src/App.jsx - Complete routing - All routes working
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProfileProvider } from './context/Profilecontext';
import ProtectedRoute from './components/ProtectedRoutes';
import RoleBasedRedirect from './components/RoleBasedRedirect';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useEffect } from 'react';

// ==================== AUTH PAGES ====================
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import VerifyOtp from './pages/VerifyOtp';

// ==================== PROFILE PAGES ====================
import ProfileDashboard from './pages/ProfileDashboard';
import ProfileEdit from './pages/ProfileEdit';
import MyProfile from './pages/MyProfile';

// ==================== STUDENT PAGES ====================
import JobList from './pages/JobList';
import JobDetail from './pages/Jobs/JobDetail';
import StudentNotifications from './pages/Notifications';
import StudentSettings from './pages/Settings';

// ==================== COLLEGE ADMIN PAGES ====================
import CollegeAdminDashboard from './pages/CollegeAdmin/Dashboard';
import CollegeAdminJobManagement from './pages/CollegeAdmin/JobManagement';
import CollegeAdminJobForm from './pages/CollegeAdmin/JobForm';
import CollegeAdminCompanyManagement from './pages/CollegeAdmin/CompanyManagement';
import CollegeAdminCompanyList from './pages/CollegeAdmin/CompanyList';
import CollegeAdminCompanyForm from './pages/CollegeAdmin/CompanyForm';
import CollegeAdminCompanyDetail from './pages/CollegeAdmin/CompanyDetail';
import CollegeAdminApplicationManagement from './pages/CollegeAdmin/ApplicationManagement';
import CollegeAdminAnalytics from './pages/CollegeAdmin/Analytics';
import CollegeAdminNotifications from './pages/CollegeAdmin/Notification';
import CollegeAdminSettings from './pages/CollegeAdmin/Settings';
// ⭐ Group Management → "Students" in sidebar for College Admin
import GroupManagement from './pages/CollegeAdmin/GroupManagement';
import StudentManagement from './pages/CollegeAdmin/StudentManagement';
// ==================== SUPER ADMIN PAGES ====================
import SuperAdminDashboard from './pages/SuperAdmin/Dashboard';
import SuperAdminCollegeManagement from './pages/SuperAdmin/CollegeManagement';
import SuperAdminCollegeForm from './pages/SuperAdmin/CollegeForm';
import SuperAdminCollegeDetail from './pages/SuperAdmin/CollegeDetail';
import SuperAdminCompanyManagement from './pages/SuperAdmin/CompanyManagement';
import SuperAdminCompanyForm from './pages/SuperAdmin/CompanyForm';
import SuperAdminCompanyDetail from './pages/SuperAdmin/CompanyDetail';
import SuperAdminAdminManagement from './pages/SuperAdmin/AdminManagement';
import SuperAdminAdminForm from './pages/SuperAdmin/AdminForm';
import SuperAdminAdminDetail from './pages/SuperAdmin/AdminDetail';
import SuperAdminApplicationManagement from './pages/SuperAdmin/ApplicationManagement';
import SuperAdminApplicationDetail from './pages/SuperAdmin/ApplicationDetail';
import SuperAdminAnalytics from './pages/SuperAdmin/Analytics';
import SuperAdminNotifications from './pages/SuperAdmin/Notification';
import SuperAdminSettings from './pages/SuperAdmin/Settings';
import SubscriptionManagement from './pages/SuperAdmin/SubscriptionManagement';
// ⭐ Group Management → "Students" in sidebar for Super Admin
import SuperAdminGroupManagement from './pages/SuperAdmin/GroupManagement';

// ==================== ROLE-BASED REDIRECTS ====================
const RoleBasedNotifications = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  useEffect(() => {
    if (user?.role === 'super_admin') navigate('/dashboard/super-admin/notifications', { replace: true });
    else if (user?.role === 'college_admin') navigate('/dashboard/college-admin/notifications', { replace: true });
    else navigate('/dashboard/notifications', { replace: true });
  }, [user, navigate]);
  return null;
};

const RoleBasedSettings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  useEffect(() => {
    if (user?.role === 'super_admin') navigate('/dashboard/super-admin/settings', { replace: true });
    else if (user?.role === 'college_admin') navigate('/dashboard/college-admin/settings', { replace: true });
    else navigate('/dashboard/settings', { replace: true });
  }, [user, navigate]);
  return null;
};

// ==================== APP ====================
function App() {
  return (
    <AuthProvider>
      <ProfileProvider>
        <Router>
          <Routes>

            {/* ===== PUBLIC ===== */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/verify-otp" element={<VerifyOtp />} />

            {/* ===== ROLE-BASED REDIRECT ===== */}
            <Route path="/dashboard" element={<ProtectedRoute><RoleBasedRedirect /></ProtectedRoute>} />

            {/* ===== STUDENT ===== */}
            {/* /profile alias — fixes "back to dashboard" from older nav references */}
            <Route path="/profile" element={<ProtectedRoute><ProfileDashboard /></ProtectedRoute>} />
            <Route path="/dashboard/student" element={<ProtectedRoute><ProfileDashboard /></ProtectedRoute>} />
            <Route path="/dashboard/student/jobs" element={<ProtectedRoute><JobList /></ProtectedRoute>} />
            <Route path="/dashboard/student/jobs/:jobId" element={<ProtectedRoute><JobDetail /></ProtectedRoute>} />
            <Route path="/dashboard/student/notifications" element={<ProtectedRoute><StudentNotifications /></ProtectedRoute>} />
            <Route path="/dashboard/student/settings" element={<ProtectedRoute><StudentSettings /></ProtectedRoute>} />

            {/* ===== COLLEGE ADMIN ===== */}
            <Route path="/dashboard/college-admin" element={<ProtectedRoute><CollegeAdminDashboard /></ProtectedRoute>} />

            {/* ⭐ Students = Groups — sidebar "Students" link goes here */}
            <Route path="/dashboard/college-admin/groups" element={<ProtectedRoute><GroupManagement /></ProtectedRoute>} />
            {/* Alias: old /students path → redirect to /groups */}
            <Route path="/dashboard/college-admin/students" element={<Navigate to="/dashboard/college-admin/groups" replace />} />

            {/* Jobs */}
            <Route path="/dashboard/college-admin/jobs" element={<ProtectedRoute><CollegeAdminJobManagement /></ProtectedRoute>} />
            <Route path="/dashboard/college-admin/jobs/create" element={<ProtectedRoute><CollegeAdminJobForm /></ProtectedRoute>} />
            <Route path="/dashboard/college-admin/jobs/edit/:jobId" element={<ProtectedRoute><CollegeAdminJobForm /></ProtectedRoute>} />
            <Route path="/dashboard/college-admin/jobs/view/:jobId" element={<ProtectedRoute><JobDetail /></ProtectedRoute>} />

            {/* Companies */}
            <Route path="/dashboard/college-admin/companies" element={<ProtectedRoute><CollegeAdminCompanyManagement /></ProtectedRoute>} />
            <Route path="/dashboard/college-admin/companies/list" element={<ProtectedRoute><CollegeAdminCompanyList /></ProtectedRoute>} />
            <Route path="/dashboard/college-admin/companies/create" element={<ProtectedRoute><CollegeAdminCompanyForm /></ProtectedRoute>} />
            <Route path="/dashboard/college-admin/companies/edit/:companyId" element={<ProtectedRoute><CollegeAdminCompanyForm /></ProtectedRoute>} />
            <Route path="/dashboard/college-admin/companies/:companyId" element={<ProtectedRoute><CollegeAdminCompanyDetail /></ProtectedRoute>} />

            {/* Applications */}
            <Route path="/dashboard/college-admin/applications" element={<ProtectedRoute><CollegeAdminApplicationManagement /></ProtectedRoute>} />

            {/* Analytics */}
            <Route path="/dashboard/college-admin/analytics" element={<ProtectedRoute><CollegeAdminAnalytics /></ProtectedRoute>} />

            {/* Notifications & Settings */}
            <Route path="/dashboard/college-admin/notifications" element={<ProtectedRoute><CollegeAdminNotifications /></ProtectedRoute>} />
            <Route path="/dashboard/college-admin/settings" element={<ProtectedRoute><CollegeAdminSettings /></ProtectedRoute>} />

            {/* ===== SUPER ADMIN ===== */}
            <Route path="/dashboard/super-admin" element={<ProtectedRoute><SuperAdminDashboard /></ProtectedRoute>} />

            {/* ⭐ Students = Groups for Super Admin */}
            <Route path="/dashboard/super-admin/groups" element={<ProtectedRoute><SuperAdminGroupManagement /></ProtectedRoute>} />
            <Route path="/dashboard/super-admin/students" element={<Navigate to="/dashboard/super-admin/groups" replace />} />

            {/* Colleges */}
            <Route path="/dashboard/super-admin/colleges" element={<ProtectedRoute><SuperAdminCollegeManagement /></ProtectedRoute>} />
            <Route path="/dashboard/super-admin/colleges/new" element={<ProtectedRoute><SuperAdminCollegeForm /></ProtectedRoute>} />
            <Route path="/dashboard/super-admin/colleges/:collegeId" element={<ProtectedRoute><SuperAdminCollegeDetail /></ProtectedRoute>} />
            <Route path="/dashboard/super-admin/colleges/:collegeId/edit" element={<ProtectedRoute><SuperAdminCollegeForm /></ProtectedRoute>} />

            {/* Companies */}
            <Route path="/dashboard/super-admin/companies" element={<ProtectedRoute><SuperAdminCompanyManagement /></ProtectedRoute>} />
            <Route path="/dashboard/super-admin/companies/create" element={<ProtectedRoute><SuperAdminCompanyForm /></ProtectedRoute>} />
            <Route path="/dashboard/super-admin/companies/edit/:companyId" element={<ProtectedRoute><SuperAdminCompanyForm /></ProtectedRoute>} />
            <Route path="/dashboard/super-admin/companies/:companyId" element={<ProtectedRoute><SuperAdminCompanyDetail /></ProtectedRoute>} />

            {/* Admins */}
            <Route path="/dashboard/super-admin/admins" element={<ProtectedRoute><SuperAdminAdminManagement /></ProtectedRoute>} />
            <Route path="/dashboard/super-admin/admins/create" element={<ProtectedRoute><SuperAdminAdminForm /></ProtectedRoute>} />
            <Route path="/dashboard/super-admin/admins/edit/:adminId" element={<ProtectedRoute><SuperAdminAdminForm /></ProtectedRoute>} />
            <Route path="/dashboard/super-admin/admins/:adminId" element={<ProtectedRoute><SuperAdminAdminDetail /></ProtectedRoute>} />

            {/* Applications */}
            <Route path="/dashboard/super-admin/applications" element={<ProtectedRoute><SuperAdminApplicationManagement /></ProtectedRoute>} />
            <Route path="/dashboard/super-admin/applications/:applicationId" element={<ProtectedRoute><SuperAdminApplicationDetail /></ProtectedRoute>} />

            {/* Analytics */}
            <Route path="/dashboard/super-admin/analytics" element={<ProtectedRoute><SuperAdminAnalytics /></ProtectedRoute>} />

            {/* Subscriptions */}
            <Route path="/dashboard/super-admin/subscriptions" element={<ProtectedRoute><SubscriptionManagement /></ProtectedRoute>} />

            {/* Notifications & Settings */}
            <Route path="/dashboard/super-admin/notifications" element={<ProtectedRoute><SuperAdminNotifications /></ProtectedRoute>} />
            <Route path="/dashboard/super-admin/settings" element={<ProtectedRoute><SuperAdminSettings /></ProtectedRoute>} />

            {/* ===== PROFILE (All Roles) ===== */}
            <Route path="/profile/edit" element={<ProtectedRoute><ProfileEdit /></ProtectedRoute>} />
            <Route path="/profile/my-info" element={<ProtectedRoute><MyProfile /></ProtectedRoute>} />

            {/* ===== SHARED FALLBACKS ===== */}
            <Route path="/notifications" element={<ProtectedRoute><RoleBasedNotifications /></ProtectedRoute>} />
            <Route path="/profile/settings" element={<ProtectedRoute><RoleBasedSettings /></ProtectedRoute>} />

            {/* ===== 404 ===== */}
            <Route
              path="*"
              element={
                <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 flex items-center justify-center">
                  <div className="text-center bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-12 max-w-md border border-white/50">
                    <div className="text-8xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-4">404</div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h2>
                    <p className="text-gray-600 mb-8">The page you're looking for doesn't exist or has been moved.</p>
                    <button
                      onClick={() => window.location.href = '/dashboard'}
                      className="px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg font-medium"
                    >
                      Back to Dashboard
                    </button>
                  </div>
                </div>
              }
            />
          </Routes>
        </Router>
      </ProfileProvider>
    </AuthProvider>
  );
}

export default App;