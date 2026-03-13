// src/components/layout/SuperAdminDashboardLayout.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  LayoutDashboard, Bell, Settings, LogOut, Menu, X,
  Building2, Users, GraduationCap, BookOpen, CreditCard,
  ChevronLeft, ChevronRight, Crown, Search, Activity, ChevronDown, Landmark
} from 'lucide-react';

const MENU_GROUPS = [
  {
    label: 'Overview',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard/super-admin' },
      { icon: Activity, label: 'Analytics', path: '/dashboard/super-admin/analytics' },
    ],
  },
  {
    label: 'Management',
    items: [
      { icon: Building2, label: 'Colleges', path: '/dashboard/super-admin/colleges' },
      { icon: Landmark, label: 'Companies', path: '/dashboard/super-admin/companies' },
      { icon: Users, label: 'Admins', path: '/dashboard/super-admin/admins' },
      { icon: GraduationCap, label: 'Students', path: '/dashboard/super-admin/students' },
    ],
  },
  {
    label: 'Platform',
    items: [
      { icon: BookOpen, label: 'Courses', path: '/dashboard/super-admin/courses' },
      { icon: CreditCard, label: 'Subscriptions', path: '/dashboard/super-admin/subscriptions' },
      { icon: Bell, label: 'Notifications', path: '/dashboard/super-admin/notifications' },
      { icon: Settings, label: 'Settings', path: '/dashboard/super-admin/settings' },
    ],
  },
];

const SuperAdminDashboardLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const toast = useToast();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showMobile, setShowMobile] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const userMenuRef = useRef(null);

  useEffect(() => {
    const h = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target))
        setShowUserMenu(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  useEffect(() => { setShowMobile(false); }, [location.pathname]);

  const handleLogout = () => {
    toast.success('Signed Out', 'You have been signed out successfully.');
    setTimeout(() => { logout(); navigate('/login'); }, 600);
  };

  const getName = () => user?.fullName || user?.name || 'Super Admin';
  const getInitials = () => {
    const parts = getName().split(' ');
    return parts.length >= 2
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : getName().substring(0, 2).toUpperCase();
  };

  const isActive = (path) => {
    if (path === '/dashboard/super-admin') return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const getBreadcrumb = () => {
    const seg = location.pathname.split('/').filter(Boolean);
    const last = seg[seg.length - 1];
    const map = {
      'super-admin': 'Dashboard', colleges: 'Colleges', companies: 'Companies',
      admins: 'Admins', students: 'Students', courses: 'Courses',
      analytics: 'Analytics', subscriptions: 'Subscriptions',
      notifications: 'Notifications', settings: 'Settings', groups: 'Groups',
    };
    return map[last] || 'Dashboard';
  };

  const allItems = MENU_GROUPS.flatMap(g => g.items);
  const filtered = searchVal.length > 1
    ? allItems.filter(i => i.label.toLowerCase().includes(searchVal.toLowerCase()))
    : [];

  const SW = sidebarOpen ? 220 : 60;

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 overflow-x-hidden">

      {/* background blobs – same as login page */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-20 w-80 h-80 bg-gradient-to-br from-cyan-200 to-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute top-40 -right-20 w-80 h-80 bg-gradient-to-br from-blue-300 to-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-20 left-1/2 w-80 h-80 bg-gradient-to-br from-cyan-300 to-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
      </div>

      {/* ── Mobile overlay ── */}
      {showMobile && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden" onClick={() => setShowMobile(false)} />
      )}

      {/* ════════ SIDEBAR ════════ */}
      <aside
        className="fixed top-0 left-0 h-full z-50 flex flex-col bg-white/90 backdrop-blur-xl border-r border-white/60 shadow-lg transition-all duration-300"
        style={{
          width: `${SW}px`,
          transform: showMobile ? 'translateX(0)' : undefined,
        }}
      >
        {/* hide on mobile unless showMobile */}
        <div className={`flex flex-col h-full ${!showMobile ? 'hidden lg:flex' : 'flex'}`}>

          {/* Logo */}
          <div className="flex items-center gap-2.5 px-3.5 py-3.5 border-b border-gray-100 flex-shrink-0">
            <button
              onClick={() => navigate('/dashboard/super-admin')}
              className="w-8 h-8 bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 rounded-xl flex items-center justify-center shadow-md shadow-blue-500/30 flex-shrink-0 hover:opacity-90 transition-opacity"
            >
              <Crown className="w-4 h-4 text-white" />
            </button>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <h1 className="text-sm font-black bg-gradient-to-r from-blue-700 to-cyan-600 bg-clip-text text-transparent leading-none">
                  ICL
                </h1>
                <p className="text-[10px] text-gray-400 font-medium mt-0.5">Super Admin</p>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden lg:flex p-1 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all ml-auto flex-shrink-0"
            >
              {sidebarOpen ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Search */}
          {sidebarOpen && (
            <div className="px-2.5 py-2 border-b border-gray-100 flex-shrink-0 relative">
              <div className="flex items-center gap-2 px-2.5 py-1.5 bg-gray-50/80 rounded-lg border border-gray-200/80">
                <Search className="w-3 h-3 text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search…"
                  value={searchVal}
                  onChange={e => setSearchVal(e.target.value)}
                  className="bg-transparent text-xs outline-none w-full text-gray-700 placeholder-gray-400"
                />
              </div>
              {filtered.length > 0 && (
                <div className="absolute left-2.5 right-2.5 top-full mt-1 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
                  {filtered.map(item => (
                    <button
                      key={item.path}
                      onClick={() => { navigate(item.path); setSearchVal(''); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                    >
                      <item.icon className="w-3 h-3" />
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto py-2 px-2 sidebar-scroll">
            {MENU_GROUPS.map(group => (
              <div key={group.label} className="mb-1">
                {sidebarOpen && (
                  <p className="px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-gray-400">
                    {group.label}
                  </p>
                )}
                {group.items.map(item => {
                  const active = isActive(item.path);
                  return (
                    <button
                      key={item.path}
                      onClick={() => { navigate(item.path); setShowMobile(false); }}
                      title={!sidebarOpen ? item.label : undefined}
                      className={`w-full flex items-center rounded-xl transition-all duration-150 group relative mb-0.5
                        ${sidebarOpen ? 'gap-2.5 px-2.5 py-2' : 'justify-center p-2.5'}
                        ${active
                          ? 'bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 text-white shadow-md shadow-blue-500/20'
                          : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'
                        }`}
                    >
                      <item.icon className="w-4 h-4 flex-shrink-0" />
                      {sidebarOpen && (
                        <span className="text-sm font-medium truncate">{item.label}</span>
                      )}
                      {!sidebarOpen && (
                        <span className="absolute left-full ml-2 px-2.5 py-1.5 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-lg">
                          {item.label}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* User footer */}
          <div className="p-2.5 border-t border-gray-100 flex-shrink-0">
            {sidebarOpen ? (
              <div className="flex items-center gap-2 p-2 rounded-xl bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-100/70">
                <div className="w-7 h-7 bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 rounded-lg flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 shadow-sm">
                  {getInitials()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800 truncate">{getName()}</p>
                  <p className="text-[10px] text-blue-500 font-medium">Super Admin</p>
                </div>
                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all flex-shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleLogout}
                title="Logout"
                className="w-full flex items-center justify-center p-2.5 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* ════════ MAIN ════════ */}
      <div
        className="flex flex-col min-h-screen relative z-10 transition-all duration-300"
        style={{ paddingLeft: typeof window !== 'undefined' && window.innerWidth >= 1024 ? `${SW}px` : 0 }}
      >
        {/* Topbar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-white/60 shadow-sm">
          <div className="flex items-center gap-3 px-4 sm:px-5 h-[60px]">

            {/* Mobile hamburger */}
            <button
              onClick={() => setShowMobile(!showMobile)}
              className="lg:hidden p-1.5 rounded-lg text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-all"
            >
              {showMobile ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Mobile logo */}
            <div className="lg:hidden flex items-center gap-2">
              <div className="w-7 h-7 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center">
                <Crown className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm font-black bg-gradient-to-r from-blue-700 to-cyan-600 bg-clip-text text-transparent">ICL</span>
            </div>

            {/* Breadcrumb */}
            <div className="hidden lg:flex items-center gap-1.5 text-xs">
              <Crown className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-gray-400">Super Admin</span>
              <ChevronRight className="w-3 h-3 text-gray-300" />
              <span className="font-semibold text-gray-700">{getBreadcrumb()}</span>
            </div>

            <div className="flex-1" />

            {/* Notifications */}
            <button
              onClick={() => navigate('/dashboard/super-admin/notifications')}
              className="relative p-2 rounded-xl text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-all"
            >
              <Bell className="w-4.5 h-4.5 w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
            </button>

            {/* User menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-xl hover:bg-blue-50 transition-all"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-md shadow-blue-500/25">
                  {getInitials()}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-bold text-gray-800 leading-none">{getName().split(' ')[0]}</p>
                  <p className="text-[10px] text-blue-500 font-medium leading-none mt-0.5">Super Admin</p>
                </div>
                <ChevronDown
                  className={`hidden sm:block w-3 h-3 text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`}
                />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-blue-500/10 border border-white/60 overflow-hidden z-50 animate-fadeIn">
                  <div className="p-3 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center text-white text-sm font-bold">
                        {getInitials()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{getName()}</p>
                        <p className="text-[10px] text-blue-100 truncate">{user?.email}</p>
                      </div>
                    </div>
                  </div>
                  <div className="py-1.5">
                    {[
                      { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard/super-admin' },
                      { icon: Bell, label: 'Notifications', path: '/dashboard/super-admin/notifications' },
                      { icon: Settings, label: 'Settings', path: '/dashboard/super-admin/settings' },
                    ].map(m => (
                      <button
                        key={m.path}
                        onClick={() => { navigate(m.path); setShowUserMenu(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                      >
                        <m.icon className="w-3.5 h-3.5 text-gray-400" />
                        {m.label}
                      </button>
                    ))}
                    <div className="mx-3 my-1 border-t border-gray-100" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-5">{children}</main>
      </div>

      <style>{`
        .sidebar-scroll::-webkit-scrollbar { width: 3px; }
        .sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
        .sidebar-scroll::-webkit-scrollbar-thumb { background: rgba(59,130,246,0.2); border-radius: 4px; }
        @keyframes blob {
          0%,100% { transform:translate(0,0) scale(1); }
          33% { transform:translate(30px,-50px) scale(1.1); }
          66% { transform:translate(-20px,20px) scale(0.9); }
        }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
        @keyframes fadeIn {
          from { opacity:0; transform:translateY(-6px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.15s ease-out; }
      `}</style>
    </div>
  );
};

export default SuperAdminDashboardLayout;