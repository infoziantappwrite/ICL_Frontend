import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProfileProvider } from './context/Profilecontext';
import ProtectedRoute from './components/ProtectedRoutes';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ProfileDashboard from './pages/ProfileDashboard';
import ProfileEdit from './pages/ProfileEdit';
import MyProfile from './pages/MyProfile';
import VerifyOtp from './pages/VerifyOtp';

function App() {
  return (
    <AuthProvider>
      <ProfileProvider>
        <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/verify-otp" element={<VerifyOtp />} />

            {/* Protected routes - Dashboard */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <ProfileDashboard />
                </ProtectedRoute>
              }
            />
            
            <Route path="/profile/edit" element={<ProfileEdit />} />
            <Route path="/profile/my-info" element={<MyProfile />} />

            
            {/* Employer Dashboard - Coming Soon */}
            <Route
              path="/dashboard/employer"
              element={
                <ProtectedRoute>
                  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="text-center">
                      <h1 className="text-4xl font-bold text-gray-900 mb-4">Employer Dashboard</h1>
                      <p className="text-gray-600">Coming Soon...</p>
                    </div>
                  </div>
                </ProtectedRoute>
              }
            />

            {/* Admin Dashboard - Coming Soon */}
            <Route
              path="/dashboard/admin"
              element={
                <ProtectedRoute>
                  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="text-center">
                      <h1 className="text-4xl font-bold text-gray-900 mb-4">Admin Dashboard</h1>
                      <p className="text-gray-600">Coming Soon...</p>
                    </div>
                  </div>
                </ProtectedRoute>
              }
            />

            {/* 404 - Page Not Found */}
            <Route 
              path="*" 
              element={
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                  <div className="text-center">
                    <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
                    <p className="text-xl text-gray-600 mb-8">Page Not Found</p>
                    <a 
                      href="/" 
                      className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                    >
                      Go Home
                    </a>
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