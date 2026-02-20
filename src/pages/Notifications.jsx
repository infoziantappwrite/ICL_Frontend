// src/pages/Student/Notifications.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import {
  Bell, BellOff, Briefcase, BookOpen, CheckCircle,
  Award, AlertCircle, Clock, Trash2, CheckCheck,
  Search, Filter, X, ChevronRight, Info
} from 'lucide-react';

const MOCK_NOTIFICATIONS = [
  {
    id: '1', type: 'job', read: false, starred: true,
    title: 'New Job Match: Frontend Developer',
    message: 'TCS is hiring Frontend Developers. Your profile is a 92% match!',
    time: '2 min ago', icon: Briefcase, color: 'from-blue-500 to-cyan-500',
  },
  {
    id: '2', type: 'job', read: false, starred: false,
    title: 'Application Shortlisted',
    message: 'Infosys has shortlisted your application for Full Stack Developer.',
    time: '45 min ago', icon: CheckCircle, color: 'from-blue-600 to-indigo-500',
  },
  {
    id: '3', type: 'course', read: false, starred: false,
    title: 'Course Enrollment Reminder',
    message: 'You enrolled in Full Stack Web Development. Module 1 is now live!',
    time: '2 hrs ago', icon: BookOpen, color: 'from-cyan-500 to-blue-600',
  },
  {
    id: '4', type: 'assessment', read: true, starred: false,
    title: 'Assessment Badge Unlocked',
    message: 'Congratulations! You\'ve earned the JavaScript Silver Badge.',
    time: '1 day ago', icon: Award, color: 'from-blue-500 to-cyan-400',
  },
  {
    id: '5', type: 'profile', read: true, starred: false,
    title: 'Profile Strength Improved',
    message: 'Your profile strength is now 42%. Add career goals to reach 60%.',
    time: '2 days ago', icon: AlertCircle, color: 'from-indigo-500 to-blue-500',
  },
  {
    id: '6', type: 'job', read: true, starred: false,
    title: 'New Campus Drive: Wipro',
    message: 'Wipro is conducting a campus drive at your college on March 15.',
    time: '3 days ago', icon: Briefcase, color: 'from-blue-600 to-cyan-500',
  },
  {
    id: '7', type: 'system', read: true, starred: false,
    title: 'Profile Completion Reminder',
    message: 'Complete your education details to unlock 5 more job recommendations.',
    time: '5 days ago', icon: Info, color: 'from-cyan-600 to-blue-600',
  },
];

const FILTER_TABS = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'job', label: 'Jobs' },
  { key: 'course', label: 'Courses' },
  { key: 'assessment', label: 'Assessments' },
];

const StudentNotifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [activeFilter, setActiveFilter] = useState('all');
  const [search, setSearch] = useState('');

  const unreadCount = notifications.filter(n => !n.read).length;

  const filtered = notifications.filter(n => {
    const matchesFilter =
      activeFilter === 'all' ? true :
      activeFilter === 'unread' ? !n.read :
      n.type === activeFilter;
    const matchesSearch = !search || n.title.toLowerCase().includes(search.toLowerCase()) || n.message.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));

  const markRead = (id) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

  const deleteNotif = (id) => setNotifications(prev => prev.filter(n => n.id !== id));

  const toggleStar = (id) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, starred: !n.starred } : n));

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto pb-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg relative">
              <Bell className="w-5 h-5 text-white" />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-blue-600 border-2 border-white text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
              <p className="text-xs text-gray-500">{unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}</p>
            </div>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all"
            >
              <CheckCheck className="w-4 h-4" /> Mark all read
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search notifications..."
            className="w-full pl-10 pr-4 py-2.5 bg-white/80 backdrop-blur-xl border border-white/60 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm transition-all"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {FILTER_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={"flex-shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all " + (
                activeFilter === tab.key
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-500/25'
                  : 'bg-white/80 text-gray-600 border border-white/60 hover:bg-blue-50 hover:text-blue-600'
              )}
            >
              {tab.label}
              {tab.key === 'unread' && unreadCount > 0 && (
                <span className="ml-1.5 bg-white/30 text-white px-1.5 py-0.5 rounded-full text-xs">{unreadCount}</span>
              )}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        {filtered.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-12 text-center border border-white/60 shadow-md">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <BellOff className="w-8 h-8 text-blue-300" />
            </div>
            <h3 className="font-semibold text-gray-700 mb-1">No notifications found</h3>
            <p className="text-sm text-gray-500">Try changing the filter or search term.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(notif => (
              <div
                key={notif.id}
                className={"bg-white/80 backdrop-blur-xl rounded-2xl p-4 border shadow-sm transition-all hover:shadow-md group " + (notif.read ? 'border-white/60 opacity-80 hover:opacity-100' : 'border-blue-200 ring-1 ring-blue-100')}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className={"w-10 h-10 bg-gradient-to-br " + notif.color + " rounded-xl flex items-center justify-center shadow-sm flex-shrink-0"}>
                    <notif.icon className="w-4.5 h-4.5 text-white w-[18px] h-[18px]" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {!notif.read && <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />}
                        <p className={"text-sm font-semibold leading-snug " + (notif.read ? 'text-gray-700' : 'text-gray-900')}>
                          {notif.title}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => toggleStar(notif.id)}
                          className={"p-1 rounded-lg transition-all opacity-0 group-hover:opacity-100 " + (notif.starred ? '!opacity-100 text-blue-500' : 'text-gray-400 hover:text-blue-500')}
                        >
                          <Award className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteNotif(notif.id)}
                          className="p-1 rounded-lg text-gray-400 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{notif.message}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock className="w-3 h-3" /> {notif.time}
                      </span>
                      {!notif.read && (
                        <button
                          onClick={() => markRead(notif.id)}
                          className="text-xs text-blue-600 font-medium hover:text-blue-700 flex items-center gap-1 transition-all"
                        >
                          <CheckCircle className="w-3 h-3" /> Mark read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentNotifications;