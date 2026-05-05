// src/components/layout/TrainerDashboardLayout.jsx
// Matches SuperAdminDashboardLayout & CollegeAdminLayout exactly — same tokens, same patterns.

import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useFontSize } from '../../context/FontSizeContext';
import {
  LayoutDashboard, Bell, Settings, LogOut, Menu, X,
  BookOpen, Users, ClipboardList, BarChart2, ChevronLeft,
  ChevronRight, Search, ChevronDown, ALargeSmall,
  GraduationCap, FileText, MessageSquare, UserCircle,
} from 'lucide-react';
import logo from '../../assets/logo.png';

/* ─── Sidebar nav groups ────────────────────────────── */
const MENU_GROUPS = [
  {
    label: 'Overview',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard',  path: '/dashboard/trainer' },
      { icon: BarChart2,       label: 'Analytics',  path: '/dashboard/trainer/analytics' },
    ],
  },
  {
    label: 'Teaching',
    items: [
      { icon: BookOpen,      label: 'My Courses',    path: '/dashboard/trainer/courses' },
      { icon: Users,         label: 'My Students',   path: '/dashboard/trainer/students' },
      { icon: ClipboardList, label: 'Assessments',   path: '/dashboard/trainer/assessments' },
      { icon: FileText,      label: 'Assignments',   path: '/dashboard/trainer/assignments' },
    ],
  },
  {
    label: 'Communication',
    items: [
      { icon: MessageSquare, label: 'Messages',      path: '/dashboard/trainer/messages' },
      { icon: Bell,          label: 'Notifications', path: '/dashboard/trainer/notifications' },
    ],
  },
  {
    label: 'Account',
    items: [
      { icon: UserCircle, label: 'My Profile', path: '/dashboard/trainer/profile' },
      { icon: Settings,   label: 'Settings',   path: '/dashboard/trainer/settings' },
    ],
  },
];

/* ─── Mobile bottom nav (5 most used) ─────────────── */
const BOTTOM_NAV = [
  { icon: LayoutDashboard, label: 'Home',        path: '/dashboard/trainer' },
  { icon: BookOpen,        label: 'Courses',     path: '/dashboard/trainer/courses' },
  { icon: Users,           label: 'Students',    path: '/dashboard/trainer/students' },
  { icon: ClipboardList,   label: 'Assessments', path: '/dashboard/trainer/assessments' },
  { icon: Settings,        label: 'Settings',    path: '/dashboard/trainer/settings' },
];

/* ─── Breadcrumb map ───────────────────────────────── */
const BREADCRUMB_MAP = {
  trainer:      'Dashboard',
  analytics:    'Analytics',
  courses:      'My Courses',
  students:     'My Students',
  assessments:  'Assessments',
  assignments:  'Assignments',
  messages:     'Messages',
  notifications:'Notifications',
  profile:      'My Profile',
  settings:     'Settings',
};

/* ════════════════════════════════════════════════════
   LAYOUT COMPONENT
════════════════════════════════════════════════════ */
const TrainerDashboardLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const toast = useToast();
  const { fontSize, zoom, label: fontLabel, setSize, SIZE_STEPS } = useFontSize();

  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('trainerSidebarOpen');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [showMobile,   setShowMobile]   = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showFontMenu, setShowFontMenu] = useState(false);
  const [searchVal,    setSearchVal]    = useState('');
  const [isMobile,     setIsMobile]     = useState(
    typeof window !== 'undefined' ? window.innerWidth < 1024 : false
  );

  const userMenuRef = useRef(null);
  const fontMenuRef = useRef(null);

  /* ── Resize listener ── */
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) { setShowMobile(false); document.body.style.overflow = ''; }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  /* ── Body scroll lock on mobile sidebar ── */
  useEffect(() => {
    document.body.style.overflow = (showMobile && isMobile) ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [showMobile, isMobile]);

  /* ── Persist sidebar state ── */
  useEffect(() => {
    localStorage.setItem('trainerSidebarOpen', JSON.stringify(sidebarOpen));
  }, [sidebarOpen]);

  /* ── Close dropdowns on outside click ── */
  useEffect(() => {
    const h = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setShowUserMenu(false);
      if (fontMenuRef.current && !fontMenuRef.current.contains(e.target)) setShowFontMenu(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  /* ── Close mobile sidebar on route change ── */
  useEffect(() => { setShowMobile(false); }, [location.pathname]);

  /* ── Helpers ── */
  const handleLogout = () => {
    toast.success('Signed Out', 'You have been signed out successfully.');
    setTimeout(() => { logout(); navigate('/login'); }, 600);
  };

  const getName = () => user?.fullName || user?.name || 'Trainer';

  const getInitials = () => {
    const parts = getName().split(' ');
    return parts.length >= 2
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : getName().substring(0, 2).toUpperCase();
  };

  const isActive = (path) => {
    if (path === '/dashboard/trainer') return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const getBreadcrumb = () => {
    const seg = location.pathname.split('/').filter(Boolean);
    const last = seg[seg.length - 1];
    return BREADCRUMB_MAP[last] || 'Dashboard';
  };

  const allItems = MENU_GROUPS.flatMap(g => g.items);
  const filtered = searchVal.length > 1
    ? allItems.filter(i => i.label.toLowerCase().includes(searchVal.toLowerCase()))
    : [];

  const SW = isMobile ? 220 : (sidebarOpen ? 220 : 60);

  /* ────────────────────────────────────────────────
     RENDER
  ──────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-slate-50 overflow-x-hidden" style={{ zoom }}>

      {/* Mobile overlay */}
      {showMobile && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setShowMobile(false)}
        />
      )}

      {/* ════════ SIDEBAR ════════ */}
      <aside
        className="fixed top-0 left-0 h-full z-50 flex flex-col transition-all duration-300 border-r border-slate-100"
        style={{
          width: `${SW}px`,
          background: 'white',
          transform: isMobile
            ? showMobile ? 'translateX(0)' : `translateX(-${SW}px)`
            : 'translateX(0)',
        }}
      >
        <div className="flex flex-col h-full">

          {/* ── Logo ── */}
          <div className="px-4 py-3 border-b border-slate-50 flex items-center justify-between">
            <button
              onClick={() => navigate('/dashboard/trainer')}
              className="flex-1 flex items-center justify-center hover:opacity-90 transition-opacity"
            >
              <img
                src={logo}
                alt="ICL Logo"
                className={sidebarOpen ? 'h-12 w-auto object-contain' : 'h-8 w-8 object-contain'}
              />
            </button>
            {sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(false)}
                className="hidden lg:flex p-1.5 rounded-lg transition-all text-slate-400 hover:text-slate-900 hover:bg-slate-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="hidden lg:flex p-1 rounded-lg transition-all text-slate-400 hover:text-slate-900 hover:bg-slate-50 mx-auto mt-2"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* ── Trainer badge (when expanded) ── */}
          {sidebarOpen && (
            <div className="mx-2.5 mt-2.5 mb-1 px-3 py-2 rounded-xl flex items-center gap-2"
              style={{ background: 'linear-gradient(135deg,#00396915,#00A9CE15)', border: '1px solid #00A9CE20' }}>
              <GraduationCap className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#003399' }} />
              <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#003399' }}>
                Trainer Portal
              </span>
            </div>
          )}

          {/* ── Search ── */}
          {sidebarOpen && (
            <div className="px-2.5 py-2 flex-shrink-0 relative border-b border-slate-50">
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-50">
                <Search className="w-3 h-3 flex-shrink-0 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search…"
                  value={searchVal}
                  onChange={e => setSearchVal(e.target.value)}
                  className="bg-transparent text-xs outline-none w-full text-slate-700"
                />
              </div>
              {filtered.length > 0 && (
                <div className="absolute left-2.5 right-2.5 top-full mt-1 bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden z-50">
                  {filtered.map(item => (
                    <button
                      key={item.path}
                      onClick={() => { navigate(item.path); setSearchVal(''); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <item.icon className="w-3 h-3" style={{ color: '#003399' }} />
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Nav ── */}
          <nav className="flex-1 overflow-y-auto py-2 px-2 sidebar-scroll">
            {MENU_GROUPS.map(group => (
              <div key={group.label} className="mb-1">
                {sidebarOpen && (
                  <p className="px-2.5 py-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400">
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
                      className={`w-full flex items-center rounded-xl transition-all duration-150 group relative mb-0.5 ${
                        sidebarOpen ? 'gap-2.5 px-2.5 py-2.5' : 'justify-center p-2.5'
                      }`}
                      style={{
                        background:  active ? '#f1f5f9' : 'transparent',
                        borderLeft:  active ? '3px solid #003399' : '3px solid transparent',
                        color:       active ? '#003399' : '#64748b',
                      }}
                      onMouseEnter={e => {
                        if (!active) {
                          e.currentTarget.style.background = '#f8fafc';
                          e.currentTarget.style.color = '#003399';
                        }
                      }}
                      onMouseLeave={e => {
                        if (!active) {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = '#64748b';
                        }
                      }}
                    >
                      <item.icon className="w-4 h-4 flex-shrink-0" />
                      {sidebarOpen && (
                        <span className="text-[13px] font-semibold truncate">{item.label}</span>
                      )}
                      {/* Collapsed tooltip */}
                      {!sidebarOpen && (
                        <span className="absolute left-full ml-2 px-2.5 py-1.5 bg-slate-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-lg">
                          {item.label}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* ── User footer ── */}
          <div className="p-2.5 flex-shrink-0 border-t border-slate-50">
            {sidebarOpen ? (
              <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black text-white flex-shrink-0 shadow-sm"
                  style={{ background: 'linear-gradient(135deg, #00A9CE, #003399)' }}
                >
                  {getInitials()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate leading-tight">{getName()}</p>
                  <p className="text-[9px] font-bold mt-0.5" style={{ color: '#00A9CE' }}>Trainer</p>
                </div>
                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="p-1.5 rounded-lg transition-all flex-shrink-0 text-slate-400 hover:text-rose-500 hover:bg-rose-50"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleLogout}
                title="Logout"
                className="w-full flex items-center justify-center p-2.5 rounded-xl transition-all text-slate-400 hover:text-rose-500 hover:bg-rose-50"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>

        </div>
      </aside>

      {/* ════════ MAIN CONTENT AREA ════════ */}
      <div
        className="flex flex-col min-h-screen relative z-10 transition-all duration-300"
        style={{ paddingLeft: isMobile ? 0 : `${SW}px` }}
      >

        {/* ── Topbar ── */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 px-4 sm:px-5 h-[60px]">

            {/* Mobile hamburger */}
            <button
              onClick={() => setShowMobile(!showMobile)}
              className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-50 transition-all"
            >
              {showMobile ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Mobile logo */}
            <div className="lg:hidden flex items-center">
              <img src={logo} alt="ICL Logo" className="h-9 w-auto object-contain" />
            </div>

            {/* Breadcrumb (desktop) */}
            <div className="hidden lg:flex items-center gap-1.5 text-xs">
              <GraduationCap className="w-3.5 h-3.5" style={{ color: '#003399' }} />
              <span className="text-slate-400 font-medium">Trainer</span>
              <ChevronRight className="w-3 h-3 text-slate-300" />
              <span className="font-black text-slate-800 uppercase tracking-tight">{getBreadcrumb()}</span>
            </div>

            <div className="flex-1" />

            {/* Font size picker */}
            <div className="relative" ref={fontMenuRef}>
              <button
                onClick={() => setShowFontMenu(!showFontMenu)}
                title="Adjust font size"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-slate-500 hover:text-[#003399] hover:bg-slate-50 transition-all border border-slate-100"
              >
                <ALargeSmall className="w-4 h-4" />
                <span className="hidden sm:block text-xs font-black uppercase tracking-widest">{fontLabel}</span>
              </button>

              {showFontMenu && (
                <div className="absolute right-0 mt-2 w-44 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-fadeIn">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Font Size</p>
                  </div>
                  {SIZE_STEPS.map(size => (
                    <button
                      key={size}
                      onClick={() => { setSize(size); setShowFontMenu(false); }}
                      className={`w-full flex items-center justify-between px-4 py-2.5 transition-colors text-left ${
                        fontSize === size
                          ? 'bg-[#003399]/5 text-[#003399] font-black'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className={`font-bold ${size === 'small' ? 'text-xs' : size === 'medium' ? 'text-sm' : 'text-base'}`}>
                        {size.charAt(0).toUpperCase() + size.slice(1)}
                      </span>
                      {fontSize === size && <span className="w-1.5 h-1.5 rounded-full bg-[#003399]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notifications bell */}
            <button
              onClick={() => navigate('/dashboard/trainer/notifications')}
              className="relative p-2 rounded-xl text-slate-500 hover:text-[#003399] hover:bg-slate-50 transition-all"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full" />
            </button>

            {/* User menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-xl hover:bg-slate-50 transition-all"
              >
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-black shadow-md"
                  style={{ background: 'linear-gradient(135deg, #003399, #00A9CE)' }}
                >
                  {getInitials()}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-black text-slate-800 leading-none">{getName().split(' ')[0]}</p>
                  <p className="text-[10px] font-bold leading-none mt-0.5" style={{ color: '#00A9CE' }}>Trainer</p>
                </div>
                <ChevronDown className={`hidden sm:block w-3 h-3 text-slate-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-fadeIn">
                  {/* Gradient header */}
                  <div className="p-3" style={{ background: 'linear-gradient(135deg, #003399, #00A9CE)' }}>
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center text-white text-sm font-black">
                        {getInitials()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white truncate">{getName()}</p>
                        <p className="text-[10px] text-blue-100 truncate">{user?.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="py-1.5">
                    {[
                      { icon: LayoutDashboard, label: 'Dashboard',  path: '/dashboard/trainer' },
                      { icon: UserCircle,      label: 'My Profile', path: '/dashboard/trainer/profile' },
                      { icon: Bell,            label: 'Notifications', path: '/dashboard/trainer/notifications' },
                      { icon: Settings,        label: 'Settings',   path: '/dashboard/trainer/settings' },
                    ].map(m => (
                      <button
                        key={m.path}
                        onClick={() => { navigate(m.path); setShowUserMenu(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <m.icon className="w-3.5 h-3.5 text-slate-400" />
                        {m.label}
                      </button>
                    ))}
                    <div className="mx-3 my-1 border-t border-slate-100" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors"
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

        {/* ── Page content ── */}
        <main className="flex-1 px-4 sm:px-5 pt-1 sm:pt-2 pb-24 lg:pb-5">
          {children}
        </main>

      </div>

      {/* ════════ MOBILE BOTTOM NAV ════════ */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-[0_-4px_24px_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-around px-2 py-1.5">
          {BOTTOM_NAV.map(item => {
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all min-w-[52px] ${
                  active ? 'text-[#003399]' : 'text-slate-400 hover:text-[#003399]'
                }`}
              >
                <item.icon className={`w-5 h-5 ${active ? 'stroke-[2.5]' : ''}`} />
                <span className={`text-[9px] font-bold leading-none ${active ? 'text-[#003399]' : ''}`}>
                  {item.label}
                </span>
                {active && <span className="w-1 h-1 rounded-full bg-[#003399] mt-0.5" />}
              </button>
            );
          })}
        </div>
      </nav>

      {/* ════════ STYLES ════════ */}
      <style>{`
        .sidebar-scroll::-webkit-scrollbar { width: 3px; }
        .sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
        .sidebar-scroll::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.05); border-radius: 4px; }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.15s ease-out; }

        input::placeholder { color: #94a3b8; }

        label, button, a, select,
        [role="button"],
        input[type="button"],
        input[type="submit"],
        input[type="checkbox"],
        input[type="radio"],
        .cursor-pointer {
          cursor: pointer !important;
        }
      `}</style>

    </div>
  );
};

export default TrainerDashboardLayout;