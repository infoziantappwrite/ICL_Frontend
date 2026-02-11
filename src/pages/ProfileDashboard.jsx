// src/pages/ProfileDashboard.jsx - COMPLETE FIXED VERSION
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../context/Profilecontext';
import { useAuth } from '../context/AuthContext';
import {
  User,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Code,
  FileText,
  Settings,
  LogOut,
  ChevronRight,
  Plus,
  Edit,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Target,
  Calendar,
  Award,
  BookOpen,
  Clock,
  Mail,
  Building,
  Zap,
  ChevronLeft,
  Menu,
  X,
  LayoutDashboard,
  Bell,
  Shield
} from 'lucide-react';
 
const ProfileDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { profile, profileCompleteness, isLoading, fetchProfile } = useProfile();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);
 
  // FIXED: Always refetch profile on component mount
  useEffect(() => {
    fetchProfile(); // Remove the if (!profile) condition - always fetch fresh data
  }, []); // Runs every time component mounts

  // Optional: Also refetch when window regains focus (user returns to tab)
  useEffect(() => {
    const handleFocus = () => {
      fetchProfile();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchProfile]);
 
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
 
  const getCompletenessColor = () => {
    if (profileCompleteness >= 80) return 'from-green-500 to-emerald-600';
    if (profileCompleteness >= 50) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-pink-600';
  };
 
  const getCompletenessStatus = () => {
    if (profileCompleteness >= 80) return { text: 'Excellent', icon: '🎉' };
    if (profileCompleteness >= 50) return { text: 'Good Progress', icon: '👍' };
    return { text: 'Needs Attention', icon: '⚠️' };
  };
 
  // Helper function to get user's display name
  const getUserName = () => {
    if (profile?.fullName) return profile.fullName;
    if (user?.fullName) return user.fullName;
    if (user?.name) return user.name;
    return 'User';
  };
 
  // Helper function to get first name
  const getFirstName = () => {
    const fullName = getUserName();
    return fullName.split(' ')[0];
  };
 
  // Helper function to get initials for avatar
  const getUserInitials = () => {
    const fullName = getUserName();
    const names = fullName.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
  };
 
  // Helper function to get user role
  const getUserRole = () => {
    if (user?.role) {
      return user.role.charAt(0).toUpperCase() + user.role.slice(1);
    }
    return 'Candidate';
  };
 
  if (isLoading && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <User className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <p className="mt-6 text-gray-700 font-medium">Loading your profile...</p>
          <p className="mt-2 text-sm text-gray-500">Please wait a moment</p>
        </div>
      </div>
    );
  }
 
  const status = getCompletenessStatus();
 
  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50">
      {/* Enhanced Background Pattern */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-20 w-96 h-96 bg-gradient-to-br from-cyan-200 to-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 -right-20 w-96 h-96 bg-gradient-to-br from-blue-300 to-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-20 left-1/2 w-96 h-96 bg-gradient-to-br from-cyan-300 to-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>
 
      {/* Header */}
      <header className="relative bg-white/80 backdrop-blur-xl border-b border-white/50 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            {/* Logo & Sidebar Toggle */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="hidden lg:block p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
              >
                {sidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/40">
                <span className="text-white font-bold text-xl">I</span>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-700 to-cyan-600 bg-clip-text text-transparent">
                  ICL
                </h1>
                <p className="text-xs text-gray-600">Candidate Portal</p>
              </div>
            </div>
 
            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-4">
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
                          <p className="text-sm font-semibold text-gray-900 truncate">{getUserName()}</p>
                          <p className="text-xs text-gray-600 truncate">{profile?.email || user?.email}</p>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-gray-600 flex items-center gap-2">
                        <Shield className="w-3 h-3" />
                        <span>{getUserRole()}</span>
                      </div>
                    </div>
 
                    {/* Menu Items */}
                    <div className="py-2">
                      <UserMenuItem
                        icon={LayoutDashboard}
                        label="Dashboard"
                        onClick={() => {
                          navigate('/profile');
                          setShowUserMenu(false);
                        }}
                      />
                      <UserMenuItem
                        icon={User}
                        label="My Profile"
                        onClick={() => {
                          navigate('/profile/my-info');
                          setShowUserMenu(false);
                        }}
                      />
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
                     
                      {/* Divider */}
                      <div className="my-2 border-t border-gray-100"></div>
                     
                      {/* Logout */}
                      <UserMenuItem
                        icon={LogOut}
                        label="Logout"
                        onClick={handleLogout}
                        variant="danger"
                        showArrow
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
            <div className="md:hidden mt-4 pb-4 space-y-2">
              <div className="px-4 py-3 bg-blue-50 rounded-lg flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-sm">{getUserInitials()}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{getUserName()}</p>
                  <p className="text-xs text-gray-600">{profile?.email || user?.email}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  navigate('/profile');
                  setShowMobileMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-gray-700 hover:bg-blue-50 rounded-lg flex items-center gap-2"
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </button>
              <button
                onClick={() => {
                  navigate('/profile/my-info');
                  setShowMobileMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-gray-700 hover:bg-blue-50 rounded-lg flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                My Profile
              </button>
              <button
                onClick={() => {
                  navigate('/profile/edit');
                  setShowMobileMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-gray-700 hover:bg-blue-50 rounded-lg flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit Profile
              </button>
              <button
                onClick={() => {
                  navigate('/notifications');
                  setShowMobileMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-gray-700 hover:bg-blue-50 rounded-lg flex items-center gap-2"
              >
                <Bell className="w-4 h-4" />
                Notifications
              </button>
              <button
                onClick={() => {
                  navigate('/profile/settings');
                  setShowMobileMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-gray-700 hover:bg-blue-50 rounded-lg flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Settings
              </button>
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </header>
 
      <div className="flex">
        {/* Sidebar - Desktop Only */}
        <aside
          className={`hidden lg:block fixed left-0 top-[73px] h-[calc(100vh-73px)] bg-white/80 backdrop-blur-xl border-r border-white/50 shadow-xl transition-all duration-300 ${
            sidebarOpen ? 'w-64' : 'w-0 -translate-x-full'
          } overflow-hidden`}
        >
          <div className="p-6">
            {/* User Profile Card */}
            <div className="mb-6 p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold">{getUserInitials()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{getUserName()}</p>
                  <p className="text-xs text-gray-600 truncate">{profile?.email || user?.email}</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Profile Strength</span>
                <span className={`font-bold bg-gradient-to-r ${getCompletenessColor()} bg-clip-text text-transparent`}>
                  {profileCompleteness}%
                </span>
              </div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 bg-gradient-to-r ${getCompletenessColor()} rounded-full transition-all duration-500`}
                  style={{ width: `${profileCompleteness}%` }}
                ></div>
              </div>
            </div>
 
            {/* Navigation Menu */}
            <nav className="space-y-1">
              <NavItem icon={LayoutDashboard} label="Dashboard" active onClick={() => navigate('/profile')} />
              <NavItem icon={Edit} label="Edit Profile" onClick={() => navigate('/profile/edit')} />
              <NavItem icon={BookOpen} label="Courses" onClick={() => navigate('/courses')} />
              <NavItem icon={Award} label="Assessments" onClick={() => navigate('/assessments')} />
              <NavItem icon={FileText} label="Documents" onClick={() => navigate('/profile/documents')} />
            </nav>
 
            {/* Quick Actions */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Quick Actions</p>
              <button
                onClick={() => navigate('/profile/edit')}
                className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 text-sm font-medium flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Complete Profile
              </button>
            </div>
          </div>
        </aside>
 
        {/* Main Content */}
        <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-0'}`}>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Welcome Banner */}
            <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 rounded-2xl p-6 md:p-8 mb-8 text-white shadow-2xl shadow-blue-500/30 relative overflow-hidden">
              <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
              <div className="relative z-10">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-white font-bold text-2xl">{getUserInitials()}</span>
                    </div>
                    <div>
                      <h2 className="text-2xl md:text-3xl font-bold mb-1">
                        Welcome back, {getFirstName()}! 👋
                      </h2>
                      <p className="text-blue-100 text-sm md:text-base">
                        {profile?.currentRole || profile?.candidateType || 'Complete your profile to unlock more opportunities'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 md:mt-0">
                    <button
                      onClick={() => navigate('/profile/edit')}
                      className="px-6 py-3 bg-white text-blue-600 rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200 flex items-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      Edit Profile
                    </button>
                  </div>
                </div>
              </div>
            </div>
 
            {/* Profile Completeness Card */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 md:p-8 shadow-xl shadow-blue-500/10 border border-white/50 mb-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                <div className="flex items-center gap-4 mb-4 md:mb-0">
                  <div className={`w-16 h-16 bg-gradient-to-br ${getCompletenessColor()} rounded-2xl flex items-center justify-center shadow-lg`}>
                    <span className="text-3xl">{status.icon}</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Profile Strength</h3>
                    <p className="text-sm text-gray-600">{status.text}</p>
                  </div>
                </div>
                <div className="text-center md:text-right">
                  <div className={`text-5xl font-bold bg-gradient-to-r ${getCompletenessColor()} bg-clip-text text-transparent`}>
                    {profileCompleteness}%
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Complete</p>
                </div>
              </div>
 
              {/* Progress Bar */}
              <div className="relative w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div
                  className={`h-4 bg-gradient-to-r ${getCompletenessColor()} rounded-full transition-all duration-1000 ease-out relative overflow-hidden`}
                  style={{ width: `${profileCompleteness}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-shimmer"></div>
                </div>
              </div>
 
              {profileCompleteness < 100 && (
                <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Boost your profile visibility</p>
                      <p className="text-xs text-gray-600 mt-1">
                        Complete your profile to increase your chances of being discovered by top employers and access all courses
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
 
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard
                title="Skills"
                count={profile?.primarySkills?.length || 0}
                icon={Code}
                color="from-blue-500 to-cyan-600"
                onClick={() => navigate('/profile/edit')}
              />
              <StatCard
                title="Languages"
                count={profile?.programmingLanguages?.length || 0}
                icon={Zap}
                color="from-purple-500 to-indigo-600"
                onClick={() => navigate('/profile/edit')}
              />
              <StatCard
                title="Experience"
                count={profile?.yearsOfExperience || 0}
                icon={Briefcase}
                color="from-green-500 to-emerald-600"
                suffix=" yrs"
                onClick={() => navigate('/profile/edit')}
              />
              <StatCard
                title="Courses"
                count={profile?.interestedCourses?.length || 0}
                icon={BookOpen}
                color="from-orange-500 to-red-600"
                onClick={() => navigate('/courses')}
              />
            </div>
 
            {/* Profile Sections Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Personal Information */}
              <ProfileCard
                title="Personal Information"
                icon={User}
                completed={!!(profile?.fullName && profile?.gender && profile?.dateOfBirth)}
                onClick={() => navigate('/profile/edit')}
              >
                {profile?.fullName ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold">{getUserInitials()}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{profile.fullName}</p>
                        {profile.dateOfBirth && (
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(profile.dateOfBirth).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    {profile.gender && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User className="w-4 h-4" />
                        <span className="capitalize">{profile.gender}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <EmptyState icon={User} text="Add your personal information" />
                )}
              </ProfileCard>
 
              {/* Contact Information */}
              <ProfileCard
                title="Contact Information"
                icon={Phone}
                completed={!!profile?.mobileNumber}
                onClick={() => navigate('/profile/edit')}
              >
                {profile?.mobileNumber ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-gray-900">{profile.mobileNumber}</span>
                    </div>
                    {profile?.email && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4" />
                        <span className="truncate">{profile.email}</span>
                      </div>
                    )}
                    {profile?.address?.city && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>
                          {profile.address.city}, {profile.address.state}, {profile.address.country}
                        </span>
                      </div>
                    )}
                    {profile.whatsappNumber && (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <Phone className="w-4 h-4" />
                        <span>WhatsApp: {profile.whatsappNumber}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <EmptyState icon={Phone} text="Add your contact information" />
                )}
              </ProfileCard>
 
              {/* Educational Details */}
              <ProfileCard
                title="Educational Details"
                icon={GraduationCap}
                completed={!!(profile?.highestQualification && profile?.collegeName)}
                onClick={() => navigate('/profile/edit')}
              >
                {profile?.highestQualification ? (
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                      <GraduationCap className="w-5 h-5 text-purple-600 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 capitalize">{profile.highestQualification}</p>
                        {profile.specialization && (
                          <p className="text-sm text-gray-600 truncate">{profile.specialization}</p>
                        )}
                        {profile.collegeName && (
                          <p className="text-xs text-gray-500 mt-1 truncate">{profile.collegeName}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2">
                          {profile.graduationYear && (
                            <span className="text-xs text-purple-600 font-medium">
                              Year: {profile.graduationYear}
                            </span>
                          )}
                          {profile.cgpaOrPercentage && (
                            <span className="text-xs text-purple-600 font-medium">
                              {profile.cgpaOrPercentage}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <EmptyState icon={GraduationCap} text="Add your education details" />
                )}
              </ProfileCard>
 
              {/* Professional Details */}
              <ProfileCard
                title="Professional Details"
                icon={Briefcase}
                completed={!!(profile?.candidateType && profile?.currentStatus)}
                onClick={() => navigate('/profile/edit')}
              >
                {profile?.candidateType ? (
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Briefcase className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            profile.candidateType === 'FRESHER'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {profile.candidateType}
                          </span>
                          {profile.currentStatus && (
                            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium capitalize">
                              {profile.currentStatus.replace('-', ' ')}
                            </span>
                          )}
                        </div>
                        {profile.currentRole && (
                          <p className="text-sm font-medium text-gray-900">{profile.currentRole}</p>
                        )}
                        {profile.previousOrganization && (
                          <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                            <Building className="w-3 h-3" />
                            {profile.previousOrganization}
                          </p>
                        )}
                        {profile.yearsOfExperience > 0 && (
                          <p className="text-xs text-blue-600 mt-2 font-medium">
                            {profile.yearsOfExperience} years of experience
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <EmptyState icon={Briefcase} text="Add your professional details" />
                )}
              </ProfileCard>
 
              {/* Skills - Primary */}
              <ProfileCard
                title="Primary Skills"
                icon={Code}
                completed={profile?.primarySkills?.length > 0}
                onClick={() => navigate('/profile/edit')}
              >
                {profile?.primarySkills?.length > 0 ? (
                  <div>
                    <div className="flex flex-wrap gap-2">
                      {profile.primarySkills.slice(0, 6).map((skill, index) => (
                        <span
                          key={index}
                          className="px-3 py-1.5 bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-200"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                    {profile.primarySkills.length > 6 && (
                      <p className="mt-3 text-sm text-gray-500">
                        +{profile.primarySkills.length - 6} more skills
                      </p>
                    )}
                  </div>
                ) : (
                  <EmptyState icon={Code} text="Add your primary skills" />
                )}
              </ProfileCard>
 
              {/* Programming Languages */}
              <ProfileCard
                title="Programming Languages"
                icon={Zap}
                completed={profile?.programmingLanguages?.length > 0}
                onClick={() => navigate('/profile/edit')}
              >
                {profile?.programmingLanguages?.length > 0 ? (
                  <div>
                    <div className="flex flex-wrap gap-2">
                      {profile.programmingLanguages.slice(0, 6).map((lang, index) => (
                        <span
                          key={index}
                          className="px-3 py-1.5 bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-700 rounded-lg text-sm font-medium border border-purple-200"
                        >
                          {lang}
                        </span>
                      ))}
                    </div>
                    {profile.programmingLanguages.length > 6 && (
                      <p className="mt-3 text-sm text-gray-500">
                        +{profile.programmingLanguages.length - 6} more languages
                      </p>
                    )}
                  </div>
                ) : (
                  <EmptyState icon={Zap} text="Add programming languages you know" />
                )}
              </ProfileCard>
 
              {/* Course Preferences */}
              <ProfileCard
                title="Course Preferences"
                icon={BookOpen}
                completed={!!(profile?.preferredLearningMode && profile?.availability)}
                onClick={() => navigate('/profile/edit')}
              >
                {profile?.preferredLearningMode ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-cyan-600" />
                      <span className="text-sm font-medium text-gray-900 capitalize">
                        {profile.preferredLearningMode?.replace('_', ' ')}
                      </span>
                    </div>
                    {profile.availability && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-cyan-600" />
                        <span className="text-sm text-gray-600 capitalize">
                          {profile.availability?.replace('_', ' ')}
                        </span>
                      </div>
                    )}
                    {profile.dailyStudyHours && (
                      <p className="text-xs text-gray-500">
                        {profile.dailyStudyHours} hours/day
                      </p>
                    )}
                  </div>
                ) : (
                  <EmptyState icon={BookOpen} text="Set your course preferences" />
                )}
              </ProfileCard>
 
              {/* Career Goals */}
              <ProfileCard
                title="Career Goals"
                icon={Target}
                completed={!!profile?.preferredJobRole}
                onClick={() => navigate('/profile/edit')}
              >
                {profile?.preferredJobRole ? (
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Target className="w-5 h-5 text-pink-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{profile.preferredJobRole}</p>
                        {profile.careerObjective && (
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {profile.careerObjective}
                          </p>
                        )}
                        {profile.targetCompanies && profile.targetCompanies.length > 0 && (
                          <p className="text-xs text-pink-600 mt-2">
                            Target: {Array.isArray(profile.targetCompanies) 
                              ? profile.targetCompanies.join(', ') 
                              : profile.targetCompanies}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <EmptyState icon={Target} text="Define your career goals" />
                )}
              </ProfileCard>
            </div>
 
            {/* Resume & Documents Section */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 md:p-8 shadow-xl shadow-blue-500/10 border border-white/50 mb-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-4 mb-4 md:mb-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FileText className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">Resume & Documents</h3>
                    {profile?.resumeUrl || profile?.documents?.resume?.url ? (
                      <div className="space-y-1">
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          Resume uploaded
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-orange-500" />
                        No resume uploaded yet
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-3">
                  {(profile?.resumeUrl || profile?.documents?.resume?.url) && (
                    <a
                      href={profile.resumeUrl || profile.documents?.resume?.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      <span className="hidden sm:inline">View</span>
                    </a>
                  )}
 
                  <button
                    onClick={() => navigate('/profile/edit')}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    {(profile?.resumeUrl || profile?.documents?.resume?.url) ? "Update" : "Upload"} Resume
                  </button>
                </div>
              </div>
            </div>
          </div>
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
        .bg-grid-pattern {
          background-image:
            linear-gradient(to right, rgb(255 255 255 / 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgb(255 255 255 / 0.1) 1px, transparent 1px);
          background-size: 20px 20px;
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          animation: shimmer 2s infinite;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};
 
// User Menu Item Component
const UserMenuItem = ({ icon: Icon, label, onClick, variant = 'default', showArrow = false }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
      variant === 'danger'
        ? 'text-red-600 hover:bg-red-50'
        : 'text-gray-700 hover:bg-gray-50'
    }`}
  >
    <div className="flex items-center gap-3">
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </div>
    {showArrow && <ChevronRight className="w-4 h-4" />}
  </button>
);
 
// Reusable Components
const NavItem = ({ icon: Icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
      active
        ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md'
        : 'text-gray-700 hover:bg-blue-50'
    }`}
  >
    <Icon className="w-5 h-5" />
    <span className="text-sm font-medium">{label}</span>
  </button>
);
 
const StatCard = ({ title, count, icon: Icon, color, onClick, suffix = '' }) => (
  <div
    onClick={onClick}
    className="bg-white/80 backdrop-blur-xl rounded-xl p-4 md:p-6 shadow-lg shadow-blue-500/10 border border-white/50 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer group"
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-600 mb-1">{title}</p>
        <p className="text-3xl font-bold text-gray-900">{count}{suffix}</p>
      </div>
      <div className={`w-12 h-12 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
    <div className="mt-3 flex items-center text-blue-600 text-sm font-medium group-hover:gap-2 transition-all">
      <span>View details</span>
      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
    </div>
  </div>
);
 
const ProfileCard = ({ title, icon: Icon, children, onClick, completed }) => (
  <div
    className="bg-white/80 backdrop-blur-xl rounded-xl p-6 shadow-lg shadow-blue-500/10 border border-white/50 hover:shadow-xl transition-all duration-300 cursor-pointer group"
    onClick={onClick}
  >
    <div className="flex justify-between items-start mb-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-lg flex items-center justify-center">
          <Icon className="w-5 h-5 text-blue-600" />
        </div>
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
      </div>
      {completed ? (
        <div className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-xs font-medium text-green-600">Completed</span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-orange-500" />
          <span className="text-xs font-medium text-orange-600">Incomplete</span>
        </div>
      )}
    </div>
    <div className="min-h-[80px]">{children}</div>
    <div className="mt-4 pt-4 border-t border-gray-100">
      <button className="text-sm text-blue-600 font-medium flex items-center gap-1 hover:gap-2 transition-all">
        Edit
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  </div>
);
 
const EmptyState = ({ icon: Icon, text }) => (
  <div className="flex flex-col items-center justify-center py-6 text-center">
    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
      <Icon className="w-6 h-6 text-gray-400" />
    </div>
    <p className="text-sm text-gray-500">{text}</p>
    <button className="mt-3 text-sm text-blue-600 font-medium flex items-center gap-1 hover:gap-2 transition-all">
      Add now
      <Plus className="w-4 h-4" />
    </button>
  </div>
);
 
export default ProfileDashboard;