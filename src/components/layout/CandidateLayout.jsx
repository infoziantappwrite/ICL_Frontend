// src/components/layout/CandidateLayout.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { User, Settings, LogOut, Menu, X, Home, BookOpen, ClipboardList, Target, BookMarked, Bell } from 'lucide-react';
import logo from '../../assets/logo.png';

const NAV_LINKS = [
  { label: 'Home',        path: '/dashboard/candidate'             },
  { label: 'Courses',     path: '/dashboard/candidate/courses'     },
  { label: 'My Learning', path: '/dashboard/candidate/my-courses'  },
  { label: 'Assessments', path: '/dashboard/candidate/assessments' },
];

const DRAWER_LINKS = [
  { icon: Home,          label: 'Home',          path: '/dashboard/candidate'               },
  { icon: BookOpen,      label: 'Courses',       path: '/dashboard/candidate/courses'       },
  { icon: BookMarked,    label: 'My Learning',   path: '/dashboard/candidate/my-courses'    },
  { icon: ClipboardList, label: 'Assessments',   path: '/dashboard/candidate/assessments'   },
  { icon: Bell,          label: 'Notifications', path: '/dashboard/candidate/notifications' },
  { icon: User,          label: 'My Profile',    path: '/dashboard/candidate/profile'                   },
  { icon: Settings,      label: 'Settings',      path: '/dashboard/candidate/settings'      },
];

const CandidateLayout = ({ children }) => {
  const navigate        = useNavigate();
  const location        = useLocation();
  const { user, logout } = useAuth();
  const toast           = useToast();
  const [showDrawer,   setShowDrawer]   = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);

  const isActive = (path) => {
    if (path === '/dashboard/candidate') return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  useEffect(() => { setShowDrawer(false); }, [location.pathname]);
  useEffect(() => {
    const h = (e) => { if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setShowUserMenu(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleLogout = () => { toast.success('Signed Out', 'You have been signed out successfully.'); setTimeout(() => { logout(); navigate('/login'); }, 600); };
  const getName     = () => user?.fullName || user?.name || 'Candidate';
  const getInitials = () => { const p = getName().split(' '); return p.length >= 2 ? `${p[0][0]}${p[p.length-1][0]}`.toUpperCase() : getName().substring(0,2).toUpperCase(); };

  return (
    <div className="min-h-screen bg-[#f8f9fa] overflow-x-hidden">
      <header className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
        <div className="max-w-310 mx-auto pl-2 sm:pl-4 lg:pl-0 pr-4 sm:pr-6 lg:pr-8 h-14 md:h-[65px] flex items-center justify-between gap-3">
          <button onClick={() => navigate('/dashboard/candidate')} className="flex items-center hover:opacity-80 transition-opacity shrink-0">
            <img src={logo} alt="ICL Logo" className="h-10 md:h-14 w-auto object-contain" />
          </button>
          <nav className="hidden md:flex flex-1 justify-end">
            <div className="flex items-center gap-1">
              {NAV_LINKS.map(link => (
                <button key={link.path} onClick={() => navigate(link.path)}
                  className={`relative flex items-center px-4 py-2 text-3.5 font-medium rounded-lg transition-colors duration-200 after:absolute after:bottom-0 after:left-4 after:h-[3px] after:rounded-full after:bg-blue-600 after:transition-all after:duration-300 ${isActive(link.path) ? 'text-gray-900 after:w-[calc(100%-2rem)]' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50 after:w-0 hover:after:w-[calc(100%-2rem)]'}`}>
                  {link.label}
                </button>
              ))}
            </div>
          </nav>
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
           <span
  className="hidden sm:flex items-center gap-1 text-white text-2.5 font-bold px-2.5 py-1 rounded-full shadow-sm"
  style={{
    background: 'linear-gradient(135deg, #163c97 0%, #1fa3d8 100%)',
    border: '1px solid rgba(255,255,255,0.15)'
  }}
>
  <Target className="w-3 h-3" />
  Candidate
</span>
            <button
              onClick={() => navigate('/dashboard/candidate/notifications')}
              className="hidden md:flex relative w-9 h-9 items-center justify-center text-gray-500 hover:bg-gray-100 rounded-full transition-all"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
            </button>
            <div className="hidden md:block relative" ref={userMenuRef}>
              <button onClick={() => setShowUserMenu(!showUserMenu)} className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center hover:ring-2 hover:ring-blue-100 ring-offset-1 transition-all">
                <span className="text-white font-bold text-[13px]">{getInitials()}</span>
              </button>
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                  <div
  className="p-4 border-b border-white/10 text-white"
  style={{
    background: 'linear-gradient(135deg, #163c97 0%, #1fa3d8 100%)'
  }}
>
  <div className="flex items-center gap-3">

    <div
      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md"
      style={{
        background: 'rgba(255,255,255,0.18)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.2)'
      }}
    >
      {getInitials()}
    </div>

    <div className="flex-1 min-w-0">

      <p
        className="font-bold truncate text-[15px]"
        style={{
          letterSpacing: '0.2px'
        }}
      >
        {getName()}
      </p>

      <p className="text-[12px] font-semibold text-white/80 tracking-wide uppercase">
        Candidate
      </p>

      <p className="text-[11px] text-white/70 truncate">
        {user?.email}
      </p>

    </div>

  </div>
</div>
                  <div className="py-2">
                    {[{icon:User,label:'My Profile',path:'/dashboard/candidate/profile'},{icon:Bell,label:'Notifications',path:'/dashboard/candidate/notifications'},{icon:Settings,label:'Settings',path:'/dashboard/candidate/settings'}].map(item => (
                      <button key={item.label} onClick={() => { setShowUserMenu(false); navigate(item.path); }} className="w-full px-4 py-2.5 text-left flex items-center gap-3 text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-all">
                        <item.icon className="w-4 h-4 shrink-0" /><span className="text-sm font-medium">{item.label}</span>
                      </button>
                    ))}
                    <div className="my-2 border-t border-gray-100" />
                    <button onClick={handleLogout} className="w-full px-4 py-2.5 text-left flex items-center gap-3 text-red-600 hover:bg-red-50 transition-all">
                      <LogOut className="w-4 h-4 shrink-0" /><span className="text-sm font-medium">Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
            <button onClick={() => setShowDrawer(true)} className="md:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-all"><Menu className="w-6 h-6" /></button>
          </div>
        </div>
      </header>

      <div className="h-14 md:h-[65px]" aria-hidden="true" />

      {showDrawer && <div className="fixed inset-0 bg-black/40 z-[60] md:hidden" onClick={() => setShowDrawer(false)} />}
      <div className={`fixed top-0 right-0 bottom-0 w-[80vw] max-w-80 bg-white z-[70] md:hidden flex flex-col overflow-y-auto transition-transform duration-300 ease-in-out ${showDrawer ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-4 pt-6 pb-4 border-b border-gray-100 relative">
          <button onClick={() => setShowDrawer(false)} className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100"><X className="w-5 h-5 text-gray-500" /></button>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-14 h-14 rounded-full bg-blue-100 border-2 border-blue-200 flex items-center justify-center shrink-0"><span className="text-xl font-bold text-blue-700">{getInitials()}</span></div>
            <div className="min-w-0">
              <p className="font-bold text-gray-900 text-[15px] truncate">{getName()}</p>
              <p className="text-3 text-blue-600 font-medium"> Candidate</p>
              <p className="text-[11px] text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-2 py-3 space-y-0.5">
          {DRAWER_LINKS.map(link => { const active = isActive(link.path); return (
            <button key={link.label} onClick={() => navigate(link.path)} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors ${active ? 'bg-blue-50 text-blue-700' : 'text-gray-800 hover:bg-gray-50'}`}>
              <link.icon className={`w-5 h-5 ${active ? 'text-blue-600' : 'text-gray-500'}`} /><span className="text-3.5 font-medium">{link.label}</span>
            </button>
          );})}
        </nav>
        <div className="border-t border-gray-100 p-3">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-colors"><LogOut className="w-4 h-4" /><span className="text-3.5 font-medium">Logout</span></button>
        </div>
      </div>

      <main className="relative h-[calc(100vh-56px)] md:h-[calc(100vh-65px)] overflow-hidden">
        <div className="h-full overflow-y-auto">
          {children}
          <footer className="mt-6 bg-[#0f172a]">
            <div className="max-w-310 mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-linear-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center"><span className="text-white font-black text-sm">I</span></div>
                  <span className="font-black text-white text-[15px]">ICL</span>
                  <span className="text-slate-400 text-3">Innovation &amp; Career Launch</span>
                </div>
                <p className="text-3 text-slate-500">© {new Date().getFullYear()} ICL Academy. All rights reserved.</p>
              </div>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
};

export default CandidateLayout;