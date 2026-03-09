// src/components/layout/DashboardLayout.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  User, Settings, LogOut, Menu, X, LayoutDashboard, Bell,
  ChevronLeft, ChevronRight, Edit, FileText, Briefcase, Target,
  Building2, Users, Activity, BarChart3, Crown, GraduationCap,
  CreditCard, BookOpen, ClipboardList,
} from 'lucide-react';

const DashboardLayout = ({ children, title = 'Dashboard', showSidebar = true }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { collegeName } = useAuth();
  const toast = useToast();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    toast.success('Signed Out', 'You have been signed out successfully.');
    setTimeout(() => { logout(); navigate('/login'); }, 600);
  };

  const getUserName = () => user?.fullName || user?.name || 'User';

  const getUserInitials = () => {
    const names = getUserName().split(' ');
    if (names.length >= 2) return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    return getUserName().substring(0, 2).toUpperCase();
  };

  const getUserRole = () => {
    const role = user?.role?.toLowerCase().replace(/[-\s]/g, '_');
    const labels = { student: 'Student', college_admin: 'College Admin', super_admin: 'Super Admin' };
    return labels[role] || 'Student';
  };

  // For college_admin: show their college name; otherwise show 'ICL'
  const getHeaderBrandName = () => {
    if (user?.role === 'college_admin') {
      const name = user?.college?.name || collegeName;
      if (name) {
        // Shorten long names: show first word or abbreviation
        const words = name.split(' ');
        if (words.length === 1) return name.substring(0, 8);
        return words.map(w => w[0]).join('').substring(0, 4).toUpperCase();
      }
    }
    return 'ICL';
  };

  const getHeaderSubtitle = () => {
    if (user?.role === 'college_admin') {
      const name = user?.college?.name || collegeName;
      if (name) return name.length > 28 ? name.substring(0, 28) + '…' : name;
    }
    return `${getUserRole()} Dashboard`;
  };

  const getDashboardPath = () => {
    const role = user?.role?.toLowerCase().replace(/[-\s]/g, '_');
    const routes = { student: '/dashboard/student', college_admin: '/dashboard/college-admin', super_admin: '/dashboard/super-admin' };
    return routes[role] || '/dashboard';
  };

  const getSidebarMenuItems = () => {
    const role = user?.role;

    if (role === 'super_admin') {
      return [
        { icon: LayoutDashboard, label: 'Dashboard',     path: '/dashboard/super-admin' },
        { icon: Building2,       label: 'Colleges',      path: '/dashboard/super-admin/colleges' },
        { icon: Building2,       label: 'Companies',     path: '/dashboard/super-admin/companies' },
        { icon: Users,           label: 'Admins',        path: '/dashboard/super-admin/admins' },
        { icon: GraduationCap,   label: 'Students',      path: '/dashboard/super-admin/students' },
        { icon: FileText,        label: 'Applications',  path: '/dashboard/super-admin/applications' },
        { icon: BookOpen,        label: 'Courses',       path: '/dashboard/super-admin/courses' },
        { icon: BarChart3,       label: 'Analytics',     path: '/dashboard/super-admin/analytics' },
        { icon: CreditCard,      label: 'Subscriptions', path: '/dashboard/super-admin/subscriptions' },
        { icon: Bell,            label: 'Notifications', path: '/dashboard/super-admin/notifications' },
        { icon: Settings,        label: 'Settings',      path: '/dashboard/super-admin/settings' },
      ];
    }

    if (role === 'college_admin') {
      return [
        { icon: LayoutDashboard, label: 'Dashboard',    path: '/dashboard/college-admin' },
        { icon: GraduationCap,   label: 'Students',     path: '/dashboard/college-admin/students' },
        { icon: Building2,       label: 'Companies',    path: '/dashboard/college-admin/companies' },
        { icon: Briefcase,       label: 'Jobs',         path: '/dashboard/college-admin/jobs' },
        { icon: FileText,        label: 'Applications', path: '/dashboard/college-admin/applications' },
        { icon: BookOpen,        label: 'Courses',      path: '/dashboard/college-admin/courses' },
        { icon: ClipboardList,   label: 'Assessments',  path: '/dashboard/college-admin/assessments' },
        { icon: BarChart3,       label: 'Analytics',    path: '/dashboard/college-admin/analytics' },
        { icon: Bell,            label: 'Notifications',path: '/dashboard/college-admin/notifications' },
        { icon: Settings,        label: 'Settings',     path: '/dashboard/college-admin/settings' },
      ];
    }

    // Student
    return [
      { icon: LayoutDashboard, label: 'Dashboard',         path: '/dashboard/student' },
      { icon: Briefcase,       label: 'Job Opportunities', path: '/dashboard/student/jobs' },
      { icon: BookOpen,        label: 'Courses',           path: '/dashboard/student/courses' },
      { icon: ClipboardList,   label: 'Assessments',       path: '/dashboard/student/assessments' },
      { icon: User,            label: 'My Profile',        path: '/profile/my-info' },
      { icon: Edit,            label: 'Edit Profile',      path: '/profile/edit' },
      { icon: Bell,            label: 'Notifications',     path: '/dashboard/student/notifications' },
      { icon: Settings,        label: 'Settings',          path: '/dashboard/student/settings' },
    ];
  };

  const sidebarMenuItems = getSidebarMenuItems();

  const isActive = (path) => {
    if (path === '/dashboard/super-admin' || path === '/dashboard/college-admin' || path === '/dashboard/student') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const roleGradient = {
    super_admin: 'from-blue-700 via-blue-600 to-blue-700',
    college_admin: 'from-blue-600 via-blue-500 to-cyan-400',
    student: 'from-blue-500 via-cyan-500 to-cyan-600',
  };
  const gradient = roleGradient[user?.role] || roleGradient.college_admin;

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 overflow-x-hidden">
      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-20 w-96 h-96 bg-gradient-to-br from-cyan-200 to-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute top-40 -right-20 w-96 h-96 bg-gradient-to-br from-blue-300 to-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-20 left-1/2 w-96 h-96 bg-gradient-to-br from-cyan-300 to-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
      </div>

      {/* ✅ FIXED HEADER — stays visible at all scroll depths */}
      <header className="bg-white/90 backdrop-blur-xl border-b border-white/50 shadow-lg fixed top-0 left-0 right-0 z-50">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            {/* Logo & sidebar toggle */}
            <div className="flex items-center space-x-3">
              {showSidebar && (
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="hidden lg:block p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                >
                  {sidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </button>
              )}
              <button onClick={() => navigate(getDashboardPath())} className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
                <div className={`w-10 h-10 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center shadow-lg`}>
                  <span className="text-white font-bold text-xl">{getHeaderBrandName().charAt(0)}</span>
                </div>
                <div className="text-left">
                  <h1 className="text-xl font-bold bg-gradient-to-r from-blue-700 to-cyan-600 bg-clip-text text-transparent truncate max-w-[180px]">
                    {getHeaderBrandName()}
                  </h1>
                  <p className="text-xs text-gray-600 truncate max-w-[180px]">{getHeaderSubtitle()}</p>
                </div>
              </button>
            </div>

            {/* Desktop actions */}
            <div className="hidden md:flex items-center gap-4">
              <button
                onClick={() => navigate(
                  user?.role === 'super_admin'   ? '/dashboard/super-admin/notifications' :
                  user?.role === 'college_admin' ? '/dashboard/college-admin/notifications' :
                  '/dashboard/student/notifications'
                )}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all relative"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>

              {/* User avatar dropdown */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className={`w-10 h-10 bg-gradient-to-br ${gradient} rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-105`}
                >
                  <span className="text-white font-bold text-sm">{getUserInitials()}</span>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-fadeIn">
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 bg-gradient-to-br ${gradient} rounded-full flex items-center justify-center shadow-lg`}>
                          <span className="text-white font-bold text-lg">{getUserInitials()}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{getUserName()}</p>
                          <p className="text-sm text-gray-600 truncate">{getUserRole()}</p>
                          {user?.role === 'college_admin' && (user?.college?.name || collegeName) && (
                            <p className="text-xs text-blue-600 font-medium truncate">
                              {user?.college?.name || collegeName}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                        </div>
                      </div>
                    </div>
                    <div className="py-2">
                      <UserMenuItem icon={LayoutDashboard} label="Dashboard" onClick={() => { navigate(getDashboardPath()); setShowUserMenu(false); }} />
                      {user?.role === 'student' && (
                        <UserMenuItem icon={User} label="My Profile" onClick={() => { navigate('/profile/my-info'); setShowUserMenu(false); }} />
                      )}
                      <UserMenuItem icon={Bell} label="Notifications" onClick={() => {
                        navigate(
                          user?.role === 'super_admin'   ? '/dashboard/super-admin/notifications' :
                          user?.role === 'college_admin' ? '/dashboard/college-admin/notifications' :
                          '/dashboard/student/notifications'
                        );
                        setShowUserMenu(false);
                      }} />
                      <UserMenuItem icon={Settings} label="Settings" onClick={() => {
                        navigate(
                          user?.role === 'super_admin'   ? '/dashboard/super-admin/settings' :
                          user?.role === 'college_admin' ? '/dashboard/college-admin/settings' :
                          '/dashboard/student/settings'
                        );
                        setShowUserMenu(false);
                      }} />
                      <div className="my-2 border-t border-gray-100" />
                      <UserMenuItem icon={LogOut} label="Logout" onClick={handleLogout} variant="danger" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile hamburger */}
            <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="md:hidden p-2 text-gray-600 hover:bg-blue-50 rounded-lg">
              {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile menu */}
          {showMobileMenu && (
            <div className="md:hidden mt-4 pb-4 space-y-2 border-t border-gray-100 pt-4">
              <div className="px-4 py-3 bg-blue-50 rounded-xl flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 bg-gradient-to-br ${gradient} rounded-full flex items-center justify-center shadow-lg`}>
                  <span className="text-white font-bold text-sm">{getUserInitials()}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{getUserName()}</p>
                  <p className="text-xs text-gray-500">{getUserRole()} · {user?.email}</p>
                </div>
              </div>
              {sidebarMenuItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => { navigate(item.path); setShowMobileMenu(false); }}
                  className={`w-full px-4 py-2.5 text-left rounded-xl flex items-center gap-3 transition-all ${
                    isActive(item.path)
                      ? `bg-gradient-to-r ${gradient} text-white shadow-md`
                      : 'text-gray-700 hover:bg-blue-50'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              ))}
              <div className="border-t border-gray-100 pt-2 mt-2">
                <button onClick={handleLogout} className="w-full px-4 py-2.5 text-left text-red-600 hover:bg-red-50 rounded-xl flex items-center gap-3 transition-all">
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm font-medium">Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ✅ HEADER SPACER — pushes all content below the fixed header */}
      <div className="h-[73px]" aria-hidden="true" />

      <div className="flex">
        {/* Sidebar — fixed, aligned perfectly below the fixed header */}
        {showSidebar && (
          <aside className={`hidden lg:flex flex-col bg-white/90 backdrop-blur-xl border-r border-white/50 shadow-sm transition-all duration-300 fixed top-[73px] left-0 h-[calc(100vh-73px)] z-40 ${sidebarOpen ? 'w-64' : 'w-20'}`}>
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {sidebarMenuItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  title={!sidebarOpen ? item.label : ''}
                  className={`w-full px-4 py-3 rounded-xl flex items-center gap-3 transition-all duration-200 ${
                    isActive(item.path)
                      ? `bg-gradient-to-r ${gradient} text-white shadow-lg`
                      : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                  }`}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {sidebarOpen && <span className="font-medium text-sm truncate">{item.label}</span>}
                </button>
              ))}
            </nav>

            {/* College name tag for college_admin */}
            {user?.role === 'college_admin' && sidebarOpen && (user?.college?.name || collegeName) && (
              <div className="mx-4 mb-3 px-3 py-2 bg-blue-50 rounded-xl border border-blue-100">
                <p className="text-xs text-blue-500 font-medium truncate">
                  {user?.college?.name || collegeName}
                </p>
              </div>
            )}

            {/* Logout at bottom of sidebar */}
            <div className="p-4 border-t border-gray-100">
              <button
                onClick={handleLogout}
                className="w-full px-4 py-3 rounded-xl flex items-center gap-3 text-red-600 hover:bg-red-50 transition-all"
              >
                <LogOut className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="font-medium text-sm">Logout</span>}
              </button>
            </div>
          </aside>
        )}

        {/* Spacer that offsets main content to the right of the fixed sidebar */}
        {showSidebar && (
          <div className={`hidden lg:block flex-shrink-0 transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'}`} aria-hidden="true" />
        )}

        {/* Main content */}
        <main className="flex-1 p-4 lg:p-6 relative min-w-0 min-h-[calc(100vh-73px)]">
          <div className="max-w-full">
            {children}
          </div>
        </main>
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
      `}</style>
    </div>
  );
};

const UserMenuItem = ({ icon: Icon, label, onClick, variant = 'default' }) => (
  <button
    onClick={onClick}
    className={`w-full px-4 py-2.5 text-left flex items-center gap-3 transition-all duration-200 ${
      variant === 'danger' ? 'text-red-600 hover:bg-red-50' : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
    }`}
  >
    <Icon className="w-4 h-4 flex-shrink-0" />
    <span className="text-sm font-medium">{label}</span>
  </button>
);

export default DashboardLayout;