// src/components/layout/StudentLayout.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
    User, Settings, LogOut, Menu, X, Bell,
    Home, Briefcase, BookOpen, ClipboardList,
} from 'lucide-react';

const navLinks = [
    { label: 'Home', path: '/dashboard/student' },
    { label: 'Jobs', path: '/dashboard/student/jobs' },
    { label: 'Courses', path: '/dashboard/student/courses' },
    { label: 'Assessments', path: '/dashboard/student/assessments' },
];

// Mobile drawer — 8 simple buttons
const mobileDrawerLinks = [
    { icon: Home,          label: 'Home',         path: '/dashboard/student' },
    { icon: Briefcase,     label: 'Jobs',         path: '/dashboard/student/jobs' },
    { icon: BookOpen,      label: 'Courses',      path: '/dashboard/student/courses' },
    { icon: ClipboardList, label: 'Assessments',  path: '/dashboard/student/assessments' },
    { icon: User,          label: 'My Profile',   path: '/profile/my-info' },
    { icon: Settings,      label: 'Settings',     path: '/dashboard/student/settings' },
];

const StudentLayout = ({ children }) => {
    const navigate   = useNavigate();
    const location   = useLocation();
    const { user, logout } = useAuth();
    const toast      = useToast();

    const [showDrawer,   setShowDrawer]   = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const userMenuRef = useRef(null);

    // Desktop nav indicator
    const buttonRefs = useRef([]);
    const [indicator, setIndicator] = useState({ left: 0, width: 0 });

    const isActive = (path) => {
        if (path === '/dashboard/student') return location.pathname === path;
        return location.pathname.startsWith(path);
    };

    const snapTo = (index) => {
        const btn = buttonRefs.current[index];
        if (!btn) return;
        setIndicator({ left: btn.offsetLeft, width: btn.offsetWidth });
    };

    useEffect(() => {
        const activeIndex = navLinks.findIndex((l) => isActive(l.path));
        if (activeIndex === -1) { setIndicator({ left: 0, width: 0 }); return; }
        snapTo(activeIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname]);

    useEffect(() => {
        const onResize = () => {
            const idx = navLinks.findIndex((l) => isActive(l.path));
            if (idx === -1) return;
            snapTo(idx);
        };
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname]);

    // Close drawer on route change
    useEffect(() => { setShowDrawer(false); }, [location.pathname]);

    // Outside click for user menu
    useEffect(() => {
        const handler = (e) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target))
                setShowUserMenu(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleLogout = () => {
        toast.success('Signed Out', 'You have been signed out successfully.');
        setTimeout(() => { logout(); navigate('/login'); }, 600);
    };

    const getUserName     = () => user?.fullName || user?.name || 'User';
    const getUserInitials = () => {
        const names = getUserName().split(' ');
        if (names.length >= 2) return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
        return getUserName().substring(0, 2).toUpperCase();
    };

    return (
        <div className="min-h-screen bg-[#f8f9fa] overflow-x-hidden">

            {/* ═══════════════════════════════════════
                FIXED HEADER
                Mobile:  [Logo + "ICL"] ─────── [Bell] [Burger]
                Desktop: [Logo] [Nav links] ─── [Bell] [Avatar]
            ═══════════════════════════════════════ */}
            <header className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
                <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 h-[56px] md:h-[65px] flex items-center justify-between gap-3">

                    {/* ── Brand / Logo ── */}
                    <button
                        onClick={() => navigate('/dashboard/student')}
                        className="flex items-center gap-2.5 hover:opacity-80 transition-opacity flex-shrink-0"
                    >
                        <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-base md:text-xl leading-none">I</span>
                        </div>
                        <div className="text-left">
                            <h1 className="text-[16px] md:text-[18px] font-bold text-gray-900 leading-tight">ICL</h1>
                            <p className="text-[10px] md:text-[12px] text-gray-500 leading-tight hidden sm:block">Student Dashboard</p>
                        </div>
                    </button>

                    {/* ── Desktop Nav (center-right) ── */}
                    <nav className="hidden md:flex flex-1 justify-end">
                        <div className="relative flex items-center gap-1 pb-[3px]" style={{ overflow: 'visible' }}>
                            {navLinks.map((link, index) => (
                                <button
                                    key={link.path}
                                    ref={(el) => { buttonRefs.current[index] = el; }}
                                    onClick={() => navigate(link.path)}
                                    className={`relative flex items-center px-4 py-2 text-[14px] font-medium rounded-lg transition-colors duration-200 cursor-pointer
                                        ${isActive(link.path) ? 'text-gray-900' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
                                >
                                    {link.label}
                                </button>
                            ))}
                            <span
                                aria-hidden="true"
                                style={{
                                    position: 'absolute', bottom: 0,
                                    left: indicator.left, width: indicator.width,
                                    height: '3px',
                                    opacity: indicator.width === 0 ? 0 : 1,
                                    borderRadius: '9999px 9999px 0 0',
                                    background: '#2563eb',
                                    transition: 'left 0.25s, width 0.25s',
                                }}
                            />
                        </div>
                    </nav>

                    {/* ── Right Actions ── */}
                    <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">

                        {/* Notification bell — always visible */}
                        <button
                            onClick={() => navigate('/dashboard/student/notifications')}
                            className="relative p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        >
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                        </button>

                        {/* Desktop: Avatar dropdown */}
                        <div className="hidden md:block relative" ref={userMenuRef}>
                            <button
                                onClick={() => setShowUserMenu(!showUserMenu)}
                                className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center hover:ring-2 hover:ring-blue-100 ring-offset-1 transition-all"
                            >
                                <span className="text-white font-bold text-[13px]">{getUserInitials()}</span>
                            </button>
                            {showUserMenu && (
                                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-fadeIn">
                                    <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                                                <span className="text-white font-bold text-lg">{getUserInitials()}</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-gray-900 truncate">{getUserName()}</p>
                                                <p className="text-sm text-gray-500 truncate">Student</p>
                                                <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="py-2">
                                        <UserMenuItem icon={User}     label="My Profile"     onClick={() => { navigate('/profile/my-info'); setShowUserMenu(false); }} />
                                        <UserMenuItem icon={Bell}     label="Notifications"  onClick={() => { navigate('/dashboard/student/notifications'); setShowUserMenu(false); }} />
                                        <UserMenuItem icon={Settings} label="Settings"       onClick={() => { navigate('/dashboard/student/settings'); setShowUserMenu(false); }} />
                                        <div className="my-2 border-t border-gray-100" />
                                        <UserMenuItem icon={LogOut}   label="Logout"         onClick={handleLogout} variant="danger" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Mobile: Burger button — RIGHT side */}
                        <button
                            onClick={() => setShowDrawer(true)}
                            className="md:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
                            aria-label="Open menu"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Header spacer */}
            <div className="h-[56px] md:h-[65px]" aria-hidden="true" />

            {/* ═══════════════════════════════════════
                MOBILE DRAWER — slides in from RIGHT
                Matches Naukri screenshot style
            ═══════════════════════════════════════ */}
            {/* Backdrop */}
            {showDrawer && (
                <div
                    className="fixed inset-0 bg-black/40 z-[60] md:hidden"
                    onClick={() => setShowDrawer(false)}
                />
            )}

            {/* Drawer panel */}
            <div className={`
                fixed top-0 right-0 bottom-0 w-[80vw] max-w-[320px] bg-white z-[70] md:hidden
                flex flex-col overflow-y-auto hide-scrollbar
                transition-transform duration-300 ease-in-out
                ${showDrawer ? 'translate-x-0' : 'translate-x-full'}
            `}>
                {/* Drawer header — user info */}
                <div className="p-4 pt-6 pb-4 border-b border-gray-100">
                    {/* Close button top-right */}
                    <button
                        onClick={() => setShowDrawer(false)}
                        className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>

                    {/* Avatar + name */}
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-14 h-14 rounded-full bg-gray-200 border-2 border-gray-300 flex items-center justify-center flex-shrink-0">
                            <span className="text-xl font-bold text-gray-600">{getUserInitials()}</span>
                        </div>
                        <div className="min-w-0">
                            <p className="font-bold text-gray-900 text-[15px] truncate">{getUserName()}</p>
                            <p className="text-[12px] text-gray-500 truncate">{user?.email}</p>
                        </div>
                    </div>

                    {/* View & update profile */}
                    <button
                        onClick={() => navigate('/profile/my-info')}
                        className="text-blue-600 text-[13px] font-semibold hover:underline"
                    >
                        View &amp; update profile
                    </button>
                </div>

                {/* Nav links — 8 buttons */}
                <nav className="flex-1 px-2 py-3 space-y-0.5">
                    {mobileDrawerLinks.map((item) => (
                        <button
                            key={item.label}
                            onClick={() => navigate(item.path)}
                            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors
                                ${isActive(item.path) ? 'bg-blue-50 text-blue-700' : 'text-gray-800 hover:bg-gray-50'}`}
                        >
                            <item.icon className={`w-5 h-5 ${isActive(item.path) ? 'text-blue-600' : 'text-gray-500'}`} />
                            <span className="text-[14px] font-medium">{item.label}</span>
                        </button>
                    ))}
                </nav>

                {/* Bottom: Logout */}
                <div className="border-t border-gray-100 p-3">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        <span className="text-[14px] font-medium">Logout</span>
                    </button>
                </div>
            </div>

            {/* Main content */}
            <main className="relative h-[calc(100vh-56px)] md:h-[calc(100vh-65px)] overflow-hidden">
                <div className="h-full overflow-y-auto">
                    {children}
                </div>
            </main>

            <style>{`
                @keyframes fadeIn {
                    from { opacity:0; transform: translateY(-10px); }
                    to   { opacity:1; transform: translateY(0); }
                }
                .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
            `}</style>
        </div>
    );
};

const UserMenuItem = ({ icon: Icon, label, onClick, variant = 'default' }) => (
    <button
        onClick={onClick}
        className={`w-full px-4 py-2.5 text-left flex items-center gap-3 transition-all duration-200 ${variant === 'danger'
            ? 'text-red-600 hover:bg-red-50'
            : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
        }`}
    >
        <Icon className="w-4 h-4 flex-shrink-0" />
        <span className="text-sm font-medium">{label}</span>
    </button>
);

export default StudentLayout;