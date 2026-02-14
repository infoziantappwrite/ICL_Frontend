// src/App.jsx - COMPLETE FIXED VERSION
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProfileProvider } from './context/Profilecontext';
import ProtectedRoute from './components/ProtectedRoutes';
import RoleBasedRedirect from './components/RoleBasedRedirect';

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

// ==================== COLLEGE ADMIN PAGES ====================
import CollegeAdminDashboard from './pages/CollegeAdmin/Dashboard';
import CollegeAdminJobManagement from './pages/CollegeAdmin/JobManagement';
import CollegeAdminJobForm from './pages/CollegeAdmin/JobForm';
import CollegeAdminCompanyManagement from './pages/CollegeAdmin/CompanyManagement';
import CollegeAdminCompanyList from './pages/CollegeAdmin/CompanyList';
import CollegeAdminCompanyForm from './pages/CollegeAdmin/CompanyForm';
import CollegeAdminCompanyDetail from './pages/CollegeAdmin/CompanyDetail';
import CollegeAdminApplicationManagement from './pages/CollegeAdmin/ApplicationManagement';

// ==================== SUPER ADMIN PAGES ====================
import SuperAdminDashboard from './pages/SuperAdmin/Dashboard';
import SuperAdminCompanyManagement from './pages/SuperAdmin/CompanyManagement';
import SuperAdminCompanyForm from './pages/SuperAdmin/CompanyForm';
import SuperAdminCompanyDetail from './pages/SuperAdmin/CompanyDetail';
import SuperAdminAdminManagement from './pages/SuperAdmin/AdminManagement';
import SuperAdminAdminForm from './pages/SuperAdmin/AdminForm';
import SuperAdminAdminDetail from './pages/SuperAdmin/AdminDetail';
import SuperAdminApplicationManagement from './pages/SuperAdmin/ApplicationManagement';
import SuperAdminApplicationDetail from './pages/SuperAdmin/ApplicationDetail';
import SuperAdminAnalytics from './pages/SuperAdmin/Analytics';

function App() {
  return (
    <AuthProvider>
      <ProfileProvider>
        <Router>
          <Routes>
            {/* ==================== PUBLIC ROUTES ==================== */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/verify-otp" element={<VerifyOtp />} />

            {/* ==================== ROLE-BASED DASHBOARD REDIRECT ==================== */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <RoleBasedRedirect />
                </ProtectedRoute>
              }
            />

            {/* ==================== STUDENT ROUTES ==================== */}
            <Route
              path="/dashboard/student"
              element={
                <ProtectedRoute>
                  <ProfileDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard/student/jobs"
              element={
                <ProtectedRoute>
                  <JobList />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard/student/jobs/:jobId"
              element={
                <ProtectedRoute>
                  <JobDetail />
                </ProtectedRoute>
              }
            />

            {/* ==================== COLLEGE ADMIN ROUTES ==================== */}
            <Route
              path="/dashboard/college-admin"
              element={
                <ProtectedRoute>
                  <CollegeAdminDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard/college-admin/jobs"
              element={
                <ProtectedRoute>
                  <CollegeAdminJobManagement />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard/college-admin/jobs/create"
              element={
                <ProtectedRoute>
                  <CollegeAdminJobForm />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard/college-admin/jobs/edit/:jobId"
              element={
                <ProtectedRoute>
                  <CollegeAdminJobForm />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard/college-admin/jobs/view/:jobId"
              element={
                <ProtectedRoute>
                  <JobDetail />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard/college-admin/companies"
              element={
                <ProtectedRoute>
                  <CollegeAdminCompanyManagement />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard/college-admin/companies/list"
              element={
                <ProtectedRoute>
                  <CollegeAdminCompanyList />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard/college-admin/companies/create"
              element={
                <ProtectedRoute>
                  <CollegeAdminCompanyForm />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard/college-admin/companies/edit/:companyId"
              element={
                <ProtectedRoute>
                  <CollegeAdminCompanyForm />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard/college-admin/companies/:companyId"
              element={
                <ProtectedRoute>
                  <CollegeAdminCompanyDetail />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard/college-admin/applications"
              element={
                <ProtectedRoute>
                  <CollegeAdminApplicationManagement />
                </ProtectedRoute>
              }
            />

            {/* ==================== SUPER ADMIN ROUTES ==================== */}
            <Route
              path="/dashboard/super-admin"
              element={
                <ProtectedRoute>
                  <SuperAdminDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard/super-admin/companies"
              element={
                <ProtectedRoute>
                  <SuperAdminCompanyManagement />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard/super-admin/companies/create"
              element={
                <ProtectedRoute>
                  <SuperAdminCompanyForm />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard/super-admin/companies/edit/:companyId"
              element={
                <ProtectedRoute>
                  <SuperAdminCompanyForm />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard/super-admin/companies/:companyId"
              element={
                <ProtectedRoute>
                  <SuperAdminCompanyDetail />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard/super-admin/admins"
              element={
                <ProtectedRoute>
                  <SuperAdminAdminManagement />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard/super-admin/admins/create"
              element={
                <ProtectedRoute>
                  <SuperAdminAdminForm />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard/super-admin/admins/edit/:adminId"
              element={
                <ProtectedRoute>
                  <SuperAdminAdminForm />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard/super-admin/admins/:adminId"
              element={
                <ProtectedRoute>
                  <SuperAdminAdminDetail />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard/super-admin/applications"
              element={
                <ProtectedRoute>
                  <SuperAdminApplicationManagement />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard/super-admin/applications/:applicationId"
              element={
                <ProtectedRoute>
                  <SuperAdminApplicationDetail />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard/super-admin/analytics"
              element={
                <ProtectedRoute>
                  <SuperAdminAnalytics />
                </ProtectedRoute>
              }
            />

            {/* ==================== PROFILE ROUTES (All Roles) ==================== */}
            <Route
              path="/profile/edit"
              element={
                <ProtectedRoute>
                  <ProfileEdit />
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile/my-info"
              element={
                <ProtectedRoute>
                  <MyProfile />
                </ProtectedRoute>
              }
            />

            {/* ==================== 404 - PAGE NOT FOUND ==================== */}
            <Route 
              path="*" 
              element={
                <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 flex items-center justify-center">
                  <div className="text-center bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-12 max-w-md border border-white/50">
                    <div className="text-8xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-4">
                      404
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      Page Not Found
                    </h2>
                    <p className="text-gray-600 mb-8">
                      The page you're looking for doesn't exist or has been moved.
                    </p>
                    <button
                      onClick={() => window.location.href = '/dashboard'}
                      className="inline-block px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg hover:shadow-xl font-medium"
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