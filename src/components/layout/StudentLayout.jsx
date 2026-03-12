// src/components/layout/StudentLayout.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
    User, Settings, LogOut, Menu, X, LayoutDashboard, Bell,
    Edit, Briefcase, BookOpen, ClipboardList,
} from 'lucide-react';

const navLinks = [
    { label: 'Home', path: '/dashboard/student' },
    { label: 'Jobs', path: '/dashboard/student/jobs' },
    { label: 'Courses', path: '/dashboard/student/courses' },
    { label: 'Assessments', path: '/dashboard/student/assessments' },
];

const allLinks = [
    ...navLinks,
    { icon: User, label: 'My Profile', path: '/profile/my-info' },
    { icon: Edit, label: 'Edit Profile', path: '/profile/edit' },
    { icon: Bell, label: 'Notifications', path: '/dashboard/student/notifications' },
    { icon: Settings, label: 'Settings', path: '/dashboard/student/settings' },
];

const StudentLayout = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();
    const toast = useToast();

    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const userMenuRef = useRef(null);

    // One ref per nav button for DOM measurement
    const buttonRefs = useRef([]);

    // The underline's left offset and width (in px, relative to the nav wrapper)
    const [indicator, setIndicator] = useState({ left: 0, width: 0 });

    // ─── helpers ─────────────────────────────────────────────────────────────

    const isActive = (path) => {
        if (path === '/dashboard/student') return location.pathname === path;
        return location.pathname.startsWith(path);
    };

    /** Measure button[index] and move the indicator there. */
    const snapTo = (index) => {
        const btn = buttonRefs.current[index];
        if (!btn) return;
        setIndicator({ left: btn.offsetLeft, width: btn.offsetWidth });
    };

    // ─── PAGE LOAD / ROUTE CHANGE — snap ─────────────────────────────────────
    useEffect(() => {
        const activeIndex = navLinks.findIndex((l) => isActive(l.path));
        if (activeIndex === -1) {
            setIndicator({ left: 0, width: 0 });
            return;
        }
        snapTo(activeIndex);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname]);

    // ─── RESIZE — re-snap ────────────────────────────────────────────────────
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

    // ─── CLICK handler ───────────────────────────────────────────────────────
    const handleNavClick = (index, path) => {
        if (isActive(path)) return;
        navigate(path);
    };

    // ─── auth helpers ─────────────────────────────────────────────────────────
    const handleLogout = () => {
        toast.success('Signed Out', 'You have been signed out successfully.');
        setTimeout(() => { logout(); navigate('/login'); }, 600);
    };

    const getUserName = () => user?.fullName || user?.name || 'User';
    const getUserInitials = () => {
        const names = getUserName().split(' ');
        if (names.length >= 2)
            return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
        return getUserName().substring(0, 2).toUpperCase();
    };

    // ─── outside-click for user menu ──────────────────────────────────────────
    useEffect(() => {
        const handler = (e) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target))
                setShowUserMenu(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const gradient = 'from-blue-500 via-cyan-500 to-cyan-600';

    // ─── render ───────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-[#f8f9fa] overflow-x-hidden">

            {/* ── Fixed Header ── */}
            <header className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50 transition-shadow duration-300">
                <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-3 w-full">
                    <div className="flex justify-between items-center gap-6">

                        {/* Brand */}
                        <button
                            onClick={() => navigate('/dashboard/student')}
                            className="flex items-center space-x-3 hover:opacity-80 transition-opacity flex-shrink-0"
                        >
                            <div className={`w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center`}>
                                <span className="text-white font-bold text-xl leading-none">I</span>
                            </div>
                            <div className="text-left hidden sm:block">
                                <h1 className="text-[18px] font-bold text-gray-900 leading-tight">
                                    ICL
                                </h1>
                                <p className="text-[12px] text-gray-500 leading-tight mt-0.5">Student Dashboard</p>
                            </div>
                        </button>

                        {/* ── Desktop Nav ── */}
                        <nav className="hidden md:flex flex-1 justify-end">
                            <div
                                className="relative flex items-center gap-1 pb-[3px]"
                                style={{ overflow: 'visible' }}
                            >
                                {navLinks.map((link, index) => (
                                    <button
                                        key={link.path}
                                        ref={(el) => { buttonRefs.current[index] = el; }}
                                        onClick={() => handleNavClick(index, link.path)}
                                        className={`
                                            relative flex items-center px-4 py-2
                                            text-[14px] font-medium rounded-lg
                                            transition-colors duration-200 cursor-pointer
                                            ${isActive(link.path)
                                                ? 'text-gray-900'
                                                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                                            }
                                        `}
                                    >
                                        {link.label}
                                    </button>
                                ))}

                                {/*
                                  THE SNAP UNDERLINE
                                  ─────────────────────────────────────────────
                                  • position: absolute, bottom: 0
                                  • left / width come from DOM measurement (snapTo)
                                */}
                                <span
                                    aria-hidden="true"
                                    style={{
                                        position: 'absolute',
                                        bottom: 0,
                                        left: indicator.left,
                                        width: indicator.width,
                                        height: '3px',
                                        opacity: indicator.width === 0 ? 0 : 1, // hide initially to prevent 0px dot flash
                                        borderRadius: '9999px 9999px 0 0',
                                        background: '#2563eb', // Standard blue to match ProfileDashboard active indicator
                                    }}
                                />
                            </div>
                        </nav>

                        {/* Right actions */}
                        <div className="hidden md:flex items-center gap-3 flex-shrink-0">

                            {/* Notification bell */}
                            <button
                                onClick={() => navigate('/dashboard/student/notifications')}
                                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all relative"
                            >
                                <Bell className="w-5 h-5" />
                                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                            </button>

                            {/* Avatar dropdown */}
                            <div className="relative" ref={userMenuRef}>
                                <button
                                    onClick={() => setShowUserMenu(!showUserMenu)}
                                    className={`w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center transition-all hover:ring-2 hover:ring-blue-100 ring-offset-1`}
                                >
                                    <span className="text-white font-bold text-[13px]">{getUserInitials()}</span>
                                </button>

                                {showUserMenu && (
                                    <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-fadeIn">
                                        <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-gray-100">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center`}>
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
                                            <UserMenuItem icon={User} label="My Profile" onClick={() => { navigate('/profile/my-info'); setShowUserMenu(false); }} />
                                            <UserMenuItem icon={Bell} label="Notifications" onClick={() => { navigate('/dashboard/student/notifications'); setShowUserMenu(false); }} />
                                            <UserMenuItem icon={Settings} label="Settings" onClick={() => { navigate('/dashboard/student/settings'); setShowUserMenu(false); }} />
                                            <div className="my-2 border-t border-gray-100" />
                                            <UserMenuItem icon={LogOut} label="Logout" onClick={handleLogout} variant="danger" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Mobile hamburger */}
                        <button
                            onClick={() => setShowMobileMenu(!showMobileMenu)}
                            className="md:hidden p-2 text-gray-600 hover:bg-blue-50 rounded-lg"
                        >
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
                                    <p className="text-xs text-gray-500">Student · {user?.email}</p>
                                </div>
                            </div>

                            {allLinks.map((item) => (
                                <button
                                    key={item.path}
                                    onClick={() => { navigate(item.path); setShowMobileMenu(false); }}
                                    className={`w-full px-4 py-2.5 text-left rounded-xl flex items-center gap-3 transition-all ${isActive(item.path)
                                        ? `bg-gradient-to-r ${gradient} text-white shadow-md`
                                        : 'text-gray-700 hover:bg-blue-50'
                                        }`}
                                >
                                    {item.icon && <item.icon className="w-4 h-4" />}
                                    <span className="text-sm font-medium">{item.label}</span>
                                </button>
                            ))}

                            <div className="border-t border-gray-100 pt-2 mt-2">
                                <button
                                    onClick={handleLogout}
                                    className="w-full px-4 py-2.5 text-left text-red-600 hover:bg-red-50 rounded-xl flex items-center gap-3 transition-all"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span className="text-sm font-medium">Logout</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </header>

            {/* Header spacer */}
            <div className="h-[65px]" aria-hidden="true" />

            {/* Main content */}
            <main className="relative h-[calc(100vh-65px)] overflow-hidden">
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