import { useState } from 'react';
import { Bell, CheckCircle2, Users, ClipboardList, BookOpen, Star, X } from 'lucide-react';
import TrainerDashboardLayout from '../../../components/layout/Trainerdashboardlayout';

/* ─── Mock notifications (backend notification system not yet built) ─── */
const MOCK_NOTIFICATIONS = [
  { id: 1, icon: Users,         color: '#00A9CE', title: '3 new students enrolled in React Fundamentals', time: '2m ago',  read: false },
  { id: 2, icon: ClipboardList, color: '#E11D48', title: 'Aanya Sharma submitted React Hooks Quiz (96/100)', time: '14m ago', read: false },
  { id: 3, icon: Star,          color: '#D97706', title: 'New 5-star review on Node.js Backend Dev', time: '1h ago',  read: false },
  { id: 4, icon: BookOpen,      color: '#003399', title: 'Course "Python for Data Science" updated by admin', time: '3h ago',  read: true },
  { id: 5, icon: CheckCircle2,  color: '#059669', title: 'Priya Nair completed Python Functions Test', time: '5h ago',  read: true },
  { id: 6, icon: Users,         color: '#00A9CE', title: 'Kiran Patel enrolled in SQL & Databases', time: '1d ago',  read: true },
  { id: 7, icon: ClipboardList, color: '#E11D48', title: 'Node.js Midterm is due in 2 days (12/29 submitted)', time: '1d ago',  read: true },
];

const TrainerNotifications = () => {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => setNotifications(ns => ns.map(n => ({ ...n, read: true })));
  const markRead    = (id) => setNotifications(ns => ns.map(n => n.id === id ? { ...n, read: true } : n));
  const remove      = (id) => setNotifications(ns => ns.filter(n => n.id !== id));

  return (
    <TrainerDashboardLayout>
      <div className="max-w-2xl mx-auto space-y-5 py-2">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-800">Notifications</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black text-[#003399] bg-[#003399]/5 hover:bg-[#003399]/10 transition-all"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Mark all read
            </button>
          )}
        </div>

        {/* List */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {notifications.length === 0 ? (
            <div className="text-center py-20">
              <Bell className="w-12 h-12 mx-auto text-slate-200 mb-4" />
              <p className="text-slate-400 font-bold text-sm">No notifications</p>
            </div>
          ) : (
            notifications.map((n, i) => (
              <div
                key={n.id}
                onClick={() => markRead(n.id)}
                className={`flex items-start gap-3 px-5 py-4 border-b border-slate-50 last:border-0 transition-colors cursor-pointer ${n.read ? 'bg-white hover:bg-slate-50/50' : 'bg-[#003399]/2 hover:bg-[#003399]/5'}`}
              >
                {/* Unread dot */}
                <div className="mt-1 flex-shrink-0">
                  {!n.read && <span className="w-2 h-2 rounded-full bg-[#003399] block" />}
                  {n.read  && <span className="w-2 h-2 rounded-full bg-transparent block" />}
                </div>
                {/* Icon */}
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${n.color}15`, color: n.color }}>
                  <n.icon className="w-4 h-4" />
                </div>
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-snug ${n.read ? 'font-medium text-slate-600' : 'font-bold text-slate-800'}`}>{n.title}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-mono">{n.time}</p>
                </div>
                {/* Remove */}
                <button
                  onClick={e => { e.stopPropagation(); remove(n.id); }}
                  className="p-1 rounded-lg text-slate-300 hover:text-slate-500 hover:bg-slate-100 transition-all flex-shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {notifications.length > 0 && (
          <p className="text-[10px] text-slate-300 text-center">
            Live notification delivery coming soon. Currently showing recent activity.
          </p>
        )}
      </div>
    </TrainerDashboardLayout>
  );
};

export default TrainerNotifications;