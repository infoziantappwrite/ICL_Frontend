// src/App.jsx - Complete routing — all assessment routes added
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProfileProvider } from './context/Profilecontext';
import ProtectedRoute from './components/ProtectedRoutes';
import RoleBasedRedirect from './components/RoleBasedRedirect';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useEffect } from 'react';

// ==================== LANDING ====================
import LandingPage from './pages/Landing/LandingPage';

// ==================== CANDIDATE PAGES ====================
import CandidateDashboard from './pages/Candidate/Dashboard';
import CandidateCourses from './pages/Candidate/CandidateCourses';
import CandidateMyCourses from './pages/Candidate/CandidateMyCourses';
import CandidateAssessments from './pages/Candidate/CandidateAssessments';

// ==================== AUTH PAGES ====================
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyOtp from './pages/VerifyOtp';
import ChangePassword from './pages/ChangePassword';
import ProfileCompletion from './pages/ProfileCompletion';

// ==================== PROFILE PAGES ====================
import ProfileDashboard from './pages/ProfileDashboard';
import ProfileEdit from './pages/ProfileEdit';
import MyProfile from './pages/MyProfile';

// ==================== STUDENT PAGES ====================
import JobList from './pages/JobList';
import JobDetail from './pages/Jobs/JobDetail';
import StudentNotifications from './pages/Notifications';
import StudentSettings from './pages/Settings';

// ==================== STUDENT COURSE PAGES ====================
import CourseList from './pages/Courses/CourseList';
import CourseDetail from './pages/Courses/CourseDetail';
import MyCourses from './pages/Courses/MyCourses';
import CourseLearn from './pages/Courses/CourseLearn';

// ==================== COLLEGE ADMIN COURSE PAGES ====================
import AdminCourseManagement from './pages/CollegeAdmin/Courses/AdminCourseManagement';
import CourseAnalytics from './pages/CollegeAdmin/Courses/CourseAnalytics';
import CourseEnrollments from './pages/CollegeAdmin/Courses/CourseEnrollments';
import AssignCourseBatch from './pages/CollegeAdmin/Courses/AssignCourseBatch';

// ==================== STUDENT ASSESSMENT PAGES ====================
import StudentAssessmentList from './pages/Student/Assessments/AssessmentList';
import StudentTakeAssessment from './pages/Student/Assessments/TakeAssessment';
import StudentAssessmentHistory from './pages/Student/Assessments/AssessmentHistory';
import StudentAttemptResult from './pages/Student/Assessments/AttemptResult';

// ==================== COLLEGE ADMIN PAGES ====================
import CollegeAdminDashboard from './pages/CollegeAdmin/Dashboard';
import CollegeAdminJobManagement from './pages/CollegeAdmin/JobManagement';
import CollegeAdminJobForm from './pages/CollegeAdmin/JobForm';
import CollegeAdminMatchedStudents from './pages/CollegeAdmin/MatchedStudents';
import CollegeAdminCompanyManagement from './pages/CollegeAdmin/CompanyManagement';
import CollegeAdminCompanyList from './pages/CollegeAdmin/CompanyList';
import CollegeAdminCompanyForm from './pages/CollegeAdmin/CompanyForm';
import CollegeAdminCompanyDetail from './pages/CollegeAdmin/CompanyDetail';
import CollegeAdminApplicationManagement from './pages/CollegeAdmin/ApplicationManagement';
import CollegeAdminAnalytics from './pages/CollegeAdmin/Analytics';
import CollegeAdminNotifications from './pages/CollegeAdmin/Notification';
import CollegeAdminSettings from './pages/CollegeAdmin/Settings';
import GroupManagement from './pages/CollegeAdmin/GroupManagement';
import StudentManagement from './pages/CollegeAdmin/StudentManagement';
import StudentReport from './pages/CollegeAdmin/StudentReport';

// ==================== COLLEGE ADMIN ASSESSMENT PAGES ====================
import AssessmentManagement from './pages/CollegeAdmin/Assessments/AssessmentManagement';
import AssessmentForm from './pages/CollegeAdmin/Assessments/AssessmentForm';
import SectionManager from './pages/CollegeAdmin/Assessments/SectionManager';
import QuestionManager from './pages/CollegeAdmin/Assessments/QuestionManager';
import ReviewPublish from './pages/CollegeAdmin/Assessments/ReviewPublish';
import AssessmentAttempts from './pages/CollegeAdmin/Assessments/AssessmentAttempts';
import AIAssessmentGenerator from './pages/CollegeAdmin/Assessments/AIAssessmentGenerator';

// ==================== SUPER ADMIN COURSE PAGES ====================
import SuperAdminCourseManagement from './pages/SuperAdmin/Courses/SuperAdminCourseManagement';
import SuperAdminCourseForm from './pages/SuperAdmin/Courses/SuperAdminCourseForm';
import SuperAdminCourseAnalytics from './pages/SuperAdmin/Courses/SuperAdminCourseAnalytics';
import SuperAdminCourseEnrollments from './pages/SuperAdmin/Courses/SuperAdminCourseEnrollments';
import SuperAdminAssignCourseBatch from './pages/SuperAdmin/Courses/SuperAdminAssignCourseBatch';

// ==================== SUPER ADMIN PAGES ====================
import SuperAdminDashboard from './pages/SuperAdmin/Dashboard';
import SuperAdminCollegeManagement from './pages/SuperAdmin/CollegeManagement';
import SuperAdminCollegeForm from './pages/SuperAdmin/CollegeForm';
import SuperAdminCollegeDetail from './pages/SuperAdmin/CollegeDetail';
import SuperAdminCollegeStudents from './pages/SuperAdmin/CollegeStudents';
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
import SuperAdminStudentManagement from './pages/SuperAdmin/StudentManagement';

// ==================== Trainer PAGES ====================

import TrainerManagement from './pages/SuperAdmin/TrainerManagement';
import TrainerForm from './pages/SuperAdmin/TrainerForm';
import SuperAdminGroupManagement from './pages/SuperAdmin/GroupManagement';
import TrainerDashboard from './pages/Trainer/pages/Trainerdashboard';
import TrainerCourses from './pages/Trainer/pages/TrainerCourses';
import TrainerCourseDetail from './pages/Trainer/pages/TrainerCourseDetail';
import TrainerStudents from './pages/Trainer/pages/TrainerStudents';
import TrainerAssessments from './pages/Trainer/pages/TrainerAssessments';
import TrainerAssessmentCreate from './pages/Trainer/pages/TrainerAssessmentCreate';
import TrainerAssessmentDetail from './pages/Trainer/pages/TrainerAssessmentDetail';
import TrainerSectionManager from './pages/Trainer/pages/TrainerSectionManager';
import TrainerQuestionManager from './pages/Trainer/pages/TrainerQuestionManager';
import TrainerReviewPublish from './pages/Trainer/pages/TrainerReviewPublish';
import TrainerProfile from './pages/Trainer/pages/TrainerProfile';
import TrainerAnalytics from './pages/Trainer/pages/TrainerAnalytics';
import TrainerSettings from './pages/Trainer/pages/TrainerSettings';
import TrainerNotifications from './pages/Trainer/pages/TrainerNotifications';
import TrainerMessages from './pages/Trainer/pages/TrainerMessages';
import TrainerResultsPage from './pages/Trainer/pages/TrainerResultsPage';

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

const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
};

// ── SuperAdminOnlyRoute ───────────────────────────────────────────────────────
// Blocks access to a route if the logged-in user is NOT super_admin.
// Redirects college_admin (or any other role) to /unauthorized.
const SuperAdminOnlyRoute = ({ children }) => {
  const { user } = useAuth();
  if (user?.role !== 'super_admin') {
    return <Navigate to="/unauthorized" replace />;
  }
  return children;
};

// ==================== APP ====================
function App() {
  return (
    <AuthProvider>
      <ProfileProvider>
        <Router>
          <Routes>

            {/* ===== PUBLIC ===== */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
            <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
            <Route path="/reset-password/:token" element={<PublicRoute><ResetPassword /></PublicRoute>} />
            <Route path="/verify-otp" element={<PublicRoute><VerifyOtp /></PublicRoute>} />

            {/* ===== FIRST LOGIN FLOW ===== */}
            <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
            <Route path="/profile-completion" element={<ProtectedRoute><ProfileCompletion /></ProtectedRoute>} />

            {/* ===== ROLE-BASED REDIRECT ===== */}
            <Route path="/dashboard" element={<ProtectedRoute><RoleBasedRedirect /></ProtectedRoute>} />

            {/* ===== CANDIDATE ===== */}
            <Route path="/dashboard/candidate" element={<ProtectedRoute><CandidateDashboard /></ProtectedRoute>} />
            <Route path="/dashboard/candidate/courses" element={<ProtectedRoute><CandidateCourses /></ProtectedRoute>} />
            <Route path="/dashboard/candidate/courses/:courseId" element={<ProtectedRoute><CourseDetail /></ProtectedRoute>} />
            <Route path="/dashboard/candidate/courses/:courseId/learn" element={<ProtectedRoute><CourseLearn /></ProtectedRoute>} />
            <Route path="/dashboard/candidate/my-courses" element={<ProtectedRoute><CandidateMyCourses /></ProtectedRoute>} />
            
            
            <Route path="/dashboard/candidate/assessments" element={<ProtectedRoute><CandidateAssessments /></ProtectedRoute>} />
            <Route path="/dashboard/candidate/assessments/:assessmentId/take" element={<ProtectedRoute><StudentTakeAssessment /></ProtectedRoute>} />
            <Route path="/dashboard/candidate/assessments/history" element={<ProtectedRoute><StudentAssessmentHistory /></ProtectedRoute>} />
            <Route path="/dashboard/candidate/assessments/attempts/:attemptId" element={<ProtectedRoute><StudentAttemptResult /></ProtectedRoute>} />
            <Route path="/dashboard/candidate/settings" element={<ProtectedRoute><StudentSettings /></ProtectedRoute>} />

            {/* ===== STUDENT ===== */}
            <Route path="/profile" element={<ProtectedRoute><ProfileDashboard /></ProtectedRoute>} />
            <Route path="/dashboard/student" element={<ProtectedRoute><ProfileDashboard /></ProtectedRoute>} />
            <Route path="/dashboard/student/jobs" element={<ProtectedRoute><JobList /></ProtectedRoute>} />
            <Route path="/dashboard/student/jobs/:jobId" element={<ProtectedRoute><JobDetail /></ProtectedRoute>} />
            <Route path="/dashboard/student/notifications" element={<ProtectedRoute><StudentNotifications /></ProtectedRoute>} />
            <Route path="/dashboard/student/settings" element={<ProtectedRoute><StudentSettings /></ProtectedRoute>} />

            {/* ===== STUDENT COURSES ===== */}
            <Route path="/dashboard/student/courses" element={<ProtectedRoute><CourseList /></ProtectedRoute>} />
            <Route path="/dashboard/student/courses/:courseId" element={<ProtectedRoute><CourseDetail /></ProtectedRoute>} />
            <Route path="/dashboard/student/courses/:courseId/learn" element={<ProtectedRoute><CourseLearn /></ProtectedRoute>} />
            <Route path="/dashboard/student/my-courses" element={<ProtectedRoute><MyCourses /></ProtectedRoute>} />

            {/* ===== STUDENT ASSESSMENTS ===== */}
            <Route path="/dashboard/student/assessments" element={<ProtectedRoute><StudentAssessmentList /></ProtectedRoute>} />
            <Route path="/dashboard/student/assessments/history" element={<ProtectedRoute><StudentAssessmentHistory /></ProtectedRoute>} />
            <Route path="/dashboard/student/assessments/:assessmentId/take" element={<ProtectedRoute><StudentTakeAssessment /></ProtectedRoute>} />
            <Route path="/dashboard/student/assessments/attempts/:attemptId" element={<ProtectedRoute><StudentAttemptResult /></ProtectedRoute>} />

            {/* ===== COLLEGE ADMIN ===== */}
            <Route path="/dashboard/college-admin" element={<ProtectedRoute><CollegeAdminDashboard /></ProtectedRoute>} />

            {/* Students */}
            <Route path="/dashboard/college-admin/students" element={<ProtectedRoute><StudentManagement /></ProtectedRoute>} />
            <Route path="/dashboard/college-admin/students/:studentId/report" element={<ProtectedRoute><StudentReport /></ProtectedRoute>} />
            <Route path="/dashboard/college-admin/groups" element={<ProtectedRoute><GroupManagement /></ProtectedRoute>} />

            {/* Jobs */}
            <Route path="/dashboard/college-admin/jobs" element={<ProtectedRoute><CollegeAdminJobManagement /></ProtectedRoute>} />
            <Route path="/dashboard/college-admin/jobs/create" element={<ProtectedRoute><CollegeAdminJobForm /></ProtectedRoute>} />
            <Route path="/dashboard/college-admin/jobs/edit/:jobId" element={<ProtectedRoute><CollegeAdminJobForm /></ProtectedRoute>} />
            <Route path="/dashboard/college-admin/jobs/view/:jobId" element={<ProtectedRoute><JobDetail /></ProtectedRoute>} />
            <Route path="/dashboard/college-admin/jobs/:jobId/matched-students" element={<ProtectedRoute><CollegeAdminMatchedStudents /></ProtectedRoute>} />

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

            {/* ===== COLLEGE ADMIN COURSES ===== */}
            <Route path="/dashboard/college-admin/courses" element={<ProtectedRoute><AdminCourseManagement /></ProtectedRoute>} />
            <Route path="/dashboard/college-admin/courses/:courseId/analytics" element={<ProtectedRoute><CourseAnalytics /></ProtectedRoute>} />
            <Route path="/dashboard/college-admin/courses/:courseId/enrollments" element={<ProtectedRoute><CourseEnrollments /></ProtectedRoute>} />
            <Route path="/dashboard/college-admin/courses/assign-batch" element={<ProtectedRoute><AssignCourseBatch /></ProtectedRoute>} />

            {/* ===== COLLEGE ADMIN ASSESSMENTS ===== */}
            <Route path="/dashboard/college-admin/assessments" element={<ProtectedRoute><AssessmentManagement /></ProtectedRoute>} />
            <Route path="/dashboard/college-admin/assessments/create" element={<ProtectedRoute><AssessmentForm /></ProtectedRoute>} />
            <Route path="/dashboard/college-admin/assessments/:assessmentId/edit" element={<ProtectedRoute><AssessmentForm /></ProtectedRoute>} />
            <Route path="/dashboard/college-admin/assessments/:assessmentId/sections" element={<ProtectedRoute><SectionManager /></ProtectedRoute>} />
            <Route path="/dashboard/college-admin/assessments/:assessmentId/questions" element={<ProtectedRoute><QuestionManager /></ProtectedRoute>} />
            <Route path="/dashboard/college-admin/assessments/:assessmentId/review" element={<ProtectedRoute><ReviewPublish /></ProtectedRoute>} />
            <Route path="/dashboard/college-admin/assessments/:assessmentId/attempts" element={<ProtectedRoute><AssessmentAttempts /></ProtectedRoute>} />
            <Route path="/dashboard/college-admin/assessments/generate" element={<ProtectedRoute><AIAssessmentGenerator /></ProtectedRoute>} />

            {/* ===== SUPER ADMIN COURSES ===== */}
            <Route path="/dashboard/super-admin/courses" element={<ProtectedRoute><SuperAdminCourseManagement /></ProtectedRoute>} />
            <Route path="/dashboard/super-admin/courses/create" element={<ProtectedRoute><SuperAdminCourseForm /></ProtectedRoute>} />
            <Route path="/dashboard/super-admin/courses/edit/:courseId" element={<ProtectedRoute><SuperAdminCourseForm /></ProtectedRoute>} />
            <Route path="/dashboard/super-admin/courses/:courseId/analytics" element={<ProtectedRoute><SuperAdminCourseAnalytics /></ProtectedRoute>} />
            <Route path="/dashboard/super-admin/courses/:courseId/enrollments" element={<ProtectedRoute><SuperAdminCourseEnrollments /></ProtectedRoute>} />
            <Route path="/dashboard/super-admin/courses/assign-batch" element={<ProtectedRoute><SuperAdminAssignCourseBatch /></ProtectedRoute>} />

            {/* ===== SUPER ADMIN ===== */}
            <Route path="/dashboard/super-admin" element={<ProtectedRoute><SuperAdminDashboard /></ProtectedRoute>} />
            <Route path="/dashboard/super-admin/students" element={<ProtectedRoute><SuperAdminStudentManagement /></ProtectedRoute>} />

            {/* ===== Trainer asuper admin manages ===== */}
            <Route path="/dashboard/super-admin/trainers" element={<TrainerManagement />} />
            <Route path="/dashboard/super-admin/trainers/create" element={<TrainerForm />} />
            <Route path="/dashboard/super-admin/trainers/edit/:trainerId" element={<TrainerForm />} />
            <Route path="/dashboard/super-admin/groups" element={<ProtectedRoute><SuperAdminGroupManagement /></ProtectedRoute>} />
            
            {/*===== Trainer pages =====*/}            
            <Route path="/dashboard/trainer" element={<ProtectedRoute><TrainerDashboard /></ProtectedRoute>}/>
            <Route path="/dashboard/trainer/courses"           element={<ProtectedRoute><TrainerCourses /></ProtectedRoute>}/>
            <Route path="/dashboard/trainer/courses/:courseId"   element={<ProtectedRoute><TrainerCourseDetail /></ProtectedRoute>}/>
            <Route path="/dashboard/trainer/students"      element={<ProtectedRoute><TrainerStudents /></ProtectedRoute>}/>
            <Route path="/dashboard/trainer/assessments"   element={<ProtectedRoute><TrainerAssessments /></ProtectedRoute>}/>
            <Route path="/dashboard/trainer/assessments/create" element={<ProtectedRoute><TrainerAssessmentCreate /></ProtectedRoute>}/>
            <Route path="/dashboard/trainer/assessments/:assessmentId/manage"    element={<ProtectedRoute><TrainerAssessmentDetail /></ProtectedRoute>}/>
            <Route path="/dashboard/trainer/assessments/:assessmentId/sections"  element={<ProtectedRoute><TrainerSectionManager /></ProtectedRoute>}/>
            <Route path="/dashboard/trainer/assessments/:assessmentId/questions" element={<ProtectedRoute><TrainerQuestionManager /></ProtectedRoute>}/>
            <Route path="/dashboard/trainer/assessments/:assessmentId/review"    element={<ProtectedRoute><TrainerReviewPublish /></ProtectedRoute>}/>
            <Route path="/dashboard/trainer/assessments/:assessmentId/results"   element={<ProtectedRoute><TrainerResultsPage /></ProtectedRoute>}/>
            <Route path="/dashboard/trainer/analytics"     element={<ProtectedRoute><TrainerAnalytics /></ProtectedRoute>}/>
            <Route path="/dashboard/trainer/messages"      element={<ProtectedRoute><TrainerMessages /></ProtectedRoute>}/>
            <Route path="/dashboard/trainer/notifications" element={<ProtectedRoute><TrainerNotifications /></ProtectedRoute>}/>
            <Route path="/dashboard/trainer/profile"       element={<ProtectedRoute><TrainerProfile /></ProtectedRoute>}/>
            <Route path="/dashboard/trainer/settings"      element={<ProtectedRoute><TrainerSettings /></ProtectedRoute>}/>

            {/* Colleges */}
            <Route path="/dashboard/super-admin/colleges" element={<ProtectedRoute><SuperAdminCollegeManagement /></ProtectedRoute>} />
            <Route path="/dashboard/super-admin/colleges/new" element={<ProtectedRoute><SuperAdminCollegeForm /></ProtectedRoute>} />
            <Route path="/dashboard/super-admin/colleges/:collegeId" element={<ProtectedRoute><SuperAdminCollegeDetail /></ProtectedRoute>} />
            <Route path="/dashboard/super-admin/colleges/:collegeId/students" element={<ProtectedRoute><SuperAdminCollegeStudents /></ProtectedRoute>} />
            <Route path="/dashboard/super-admin/colleges/:collegeId/edit" element={<ProtectedRoute><SuperAdminCollegeForm /></ProtectedRoute>} />

            {/* Companies */}
            <Route path="/dashboard/super-admin/companies" element={<ProtectedRoute><SuperAdminCompanyManagement /></ProtectedRoute>} />
            <Route path="/dashboard/super-admin/companies/create" element={<ProtectedRoute><SuperAdminCompanyForm /></ProtectedRoute>} />
            <Route path="/dashboard/super-admin/companies/edit/:companyId" element={<ProtectedRoute><SuperAdminCompanyForm /></ProtectedRoute>} />
            <Route path="/dashboard/super-admin/companies/:companyId" element={<ProtectedRoute><SuperAdminCompanyDetail /></ProtectedRoute>} />
            <Route path="/dashboard/super-admin/jobs/view/:jobId" element={<ProtectedRoute><JobDetail /></ProtectedRoute>} />

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