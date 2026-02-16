// components/layout/DashboardLayout.jsx - COMPLETE FIXED VERSION
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  User,
  Settings,
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  Bell,
  ChevronLeft,
  Edit,
  FileText,
  Briefcase,
  Target,
  Building2,
  Users,
  Activity,
  BarChart3,
} from 'lucide-react';

const DashboardLayout = ({ children, title = "Dashboard", showSidebar = true }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getUserName = () => {
    if (user?.fullName) return user.fullName;
    if (user?.name) return user.name;
    return 'User';
  };

  const getUserInitials = () => {
    const fullName = getUserName();
    const names = fullName.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
  };

  const getUserRole = () => {
    if (user?.role) {
      const roleLabels = {
        student: 'Student',
        college_admin: 'College Admin',
        super_admin: 'Super Admin',
      };
      return roleLabels[user.role] || user.role.charAt(0).toUpperCase() + user.role.slice(1);
    }
    return 'Candidate';
  };

  const getSidebarMenuItems = () => {
    const role = user?.role;

    if (role === 'super_admin') {
      return [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard/super-admin' },
        { icon: Building2, label: 'Colleges', path: '/dashboard/super-admin/colleges' },
        { icon: Building2, label: 'Companies', path: '/dashboard/super-admin/companies' },
        { icon: Users, label: 'Admins', path: '/dashboard/super-admin/admins' },
        { icon: FileText, label: 'Applications', path: '/dashboard/super-admin/applications' },
        { icon: BarChart3, label: 'Analytics', path: '/dashboard/super-admin/analytics' },
        { icon: Settings, label: 'Settings', path: '/dashboard/super-admin/settings' },
      ];
    }

    if (role === 'college_admin') {
      return [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard/college-admin' },
        { icon: Users, label: 'Students', path: '/dashboard/college-admin/students' },
        { icon: Building2, label: 'Companies', path: '/dashboard/college-admin/companies' },
        { icon: FileText, label: 'Jobs', path: '/dashboard/college-admin/jobs' },
        { icon: Briefcase, label: 'Applications', path: '/dashboard/college-admin/applications' },
        { icon: Activity, label: 'Analytics', path: '/dashboard/college-admin/analytics' },
        { icon: Settings, label: 'Settings', path: '/dashboard/college-admin/settings' },
      ];
    }

    // Default: student
    return [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard/student' },
      { icon: Briefcase, label: 'Job Opportunities', path: '/dashboard/student/jobs' },
      { icon: User, label: 'My Profile', path: '/profile/my-info' },
      { icon: Edit, label: 'Edit Profile', path: '/profile/edit' },
      { icon: FileText, label: 'Documents', path: '/profile/documents' },
      { icon: Target, label: 'My Applications', path: '/applications' },
      { icon: Bell, label: 'Notifications', path: '/notifications' },
      { icon: Settings, label: 'Settings', path: '/profile/settings' },
    ];
  };

  const sidebarMenuItems = getSidebarMenuItems();

  const getDashboardPath = () => {
    const roleRoutes = {
      student: '/dashboard/student',
      college_admin: '/dashboard/college-admin',
      super_admin: '/dashboard/super-admin',
    };
    return roleRoutes[user?.role] || '/dashboard';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50">
      {/* Enhanced Background Pattern - Matching Login Page */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-20 w-96 h-96 bg-gradient-to-br from-cyan-200 to-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 -right-20 w-96 h-96 bg-gradient-to-br from-blue-300 to-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-20 left-1/2 w-96 h-96 bg-gradient-to-br from-cyan-300 to-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Header */}
      <header className="relative bg-white/90 backdrop-blur-xl border-b border-white/50 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            {/* Logo & Sidebar Toggle */}
            <div className="flex items-center space-x-3">
              {showSidebar && (
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="hidden lg:block p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                >
                  {sidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              )}
              <button
                onClick={() => navigate(getDashboardPath())}
                className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/40">
                  <span className="text-white font-bold text-xl">I</span>
                </div>
                <div className="text-left">
                  <h1 className="text-xl font-bold bg-gradient-to-r from-blue-700 to-cyan-600 bg-clip-text text-transparent">
                    ICL
                  </h1>
                  <p className="text-xs text-gray-600">{title}</p>
                </div>
              </button>
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-4">
              {/* Notification Bell */}
              <button
                onClick={() => navigate('/notifications')}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 relative"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* User Avatar with Popup Menu */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                >
                  <span className="text-white font-bold text-sm">{getUserInitials()}</span>
                </button>

                {/* User Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-fadeIn">
                    {/* User Info Header */}
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-full flex items-center justify-center shadow-lg">
                          <span className="text-white font-bold text-lg">{getUserInitials()}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{getUserName()}</p>
                          <p className="text-sm text-gray-600 truncate">{getUserRole()}</p>
                          <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                      <UserMenuItem
                        icon={LayoutDashboard}
                        label="Dashboard"
                        onClick={() => {
                          navigate(getDashboardPath());
                          setShowUserMenu(false);
                        }}
                      />
                      {user?.role === 'student' && (
                        <UserMenuItem
                          icon={User}
                          label="My Profile"
                          onClick={() => {
                            navigate('/profile/my-info');
                            setShowUserMenu(false);
                          }}
                        />
                      )}
                      <UserMenuItem
                        icon={Bell}
                        label="Notifications"
                        onClick={() => {
                          navigate('/notifications');
                          setShowUserMenu(false);
                        }}
                      />
                      <UserMenuItem
                        icon={Settings}
                        label="Settings"
                        onClick={() => {
                          navigate('/profile/settings');
                          setShowUserMenu(false);
                        }}
                      />
                      <div className="my-2 border-t border-gray-100"></div>
                      <UserMenuItem
                        icon={LogOut}
                        label="Logout"
                        onClick={handleLogout}
                        variant="danger"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 text-gray-600 hover:bg-blue-50 rounded-lg"
            >
              {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {showMobileMenu && (
            <div className="md:hidden mt-4 pb-4 space-y-2 border-t border-gray-100 pt-4">
              <div className="px-4 py-3 bg-blue-50 rounded-xl flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-full flex items-center justify-center shadow-lg">
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
                  onClick={() => {
                    navigate(item.path);
                    setShowMobileMenu(false);
                  }}
                  className={`w-full px-4 py-2.5 text-left rounded-xl flex items-center gap-3 transition-all duration-200 ${
                    location.pathname === item.path
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md'
                      : 'text-gray-700 hover:bg-blue-50'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              ))}
              <div className="border-t border-gray-100 pt-2 mt-2">
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2.5 text-left text-red-600 hover:bg-red-50 rounded-xl flex items-center gap-3 transition-all duration-200"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm font-medium">Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="flex max-w-7xl mx-auto relative">
        {/* Sidebar */}
        {showSidebar && (
          <aside
            className={`hidden lg:block bg-white/90 backdrop-blur-xl border-r border-white/50 shadow-sm transition-all duration-300 min-h-[calc(100vh-73px)] sticky top-[73px] self-start ${
              sidebarOpen ? 'w-64' : 'w-20'
            }`}
          >
            <nav className="p-4 space-y-1">
              {sidebarMenuItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  title={!sidebarOpen ? item.label : ''}
                  className={`w-full px-4 py-3 rounded-xl flex items-center gap-3 transition-all duration-200 ${
                    location.pathname === item.path
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/30'
                      : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                  }`}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {sidebarOpen && (
                    <span className="font-medium text-sm truncate">{item.label}</span>
                  )}
                </button>
              ))}
            </nav>

            {/* Sidebar Footer - Logout */}
            {sidebarOpen && (
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100">
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-3 rounded-xl flex items-center gap-3 text-red-600 hover:bg-red-50 transition-all duration-200"
                >
                  <LogOut className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium text-sm">Logout</span>
                </button>
              </div>
            )}
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8 relative min-w-0">
          {children}
        </main>
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

// User Menu Item Component
const UserMenuItem = ({ icon: Icon, label, onClick, variant = 'default' }) => {
  const baseClass = "w-full px-4 py-2.5 text-left flex items-center gap-3 transition-all duration-200";
  const variantClass =
    variant === 'danger'
      ? 'text-red-600 hover:bg-red-50'
      : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700';

  return (
    <button onClick={onClick} className={`${baseClass} ${variantClass}`}>
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
};

export default DashboardLayout;