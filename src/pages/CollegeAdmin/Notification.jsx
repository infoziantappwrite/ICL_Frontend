// pages/CollegeAdmin/Notification.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, BellOff, Check, CheckCheck, Trash2, Filter, Search,
  Briefcase, FileText, Users, Building2, Calendar, AlertCircle,
  Info, Clock, Settings, Star, StarOff, X,
} from 'lucide-react';
import CollegeAdminLayout from '../../components/layout/CollegeAdminLayout';
import { useAuth } from '../../context/AuthContext';

/* ── Stat Pill ── */
const StatPill = ({ icon: Icon, label, value, color }) => {
  const c = {
    blue:   'bg-blue-50 border-blue-100 text-blue-600',
    cyan:   'bg-cyan-50 border-cyan-100 text-cyan-600',
    amber:  'bg-amber-50 border-amber-100 text-amber-600',
    indigo: 'bg-indigo-50 border-indigo-100 text-indigo-600',
  }[color] || 'bg-blue-50 border-blue-100 text-blue-600';
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${c}`}>
      <Icon className="w-4 h-4 flex-shrink-0 opacity-70" />
      <div>
        <p className="text-xl font-black leading-none">{value}</p>
        <p className="text-[10px] font-semibold opacity-60 mt-0.5">{label}</p>
      </div>
    </div>
  );
};

const Notifications = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [searchTerm,    setSearchTerm]    = useState('');
  const [filterType,    setFilterType]    = useState('all');
  const [filterStatus,  setFilterStatus]  = useState('all');

  useEffect(() => { loadNotifications(); }, []);

  const loadNotifications = () => {
    setNotifications([
      { id:'1', type:'job',         icon:Briefcase, color:'blue',   title:'New Job Opportunity',          message:'Software Engineer position opened at Infoziant Technologies',       timestamp:new Date(Date.now()-2*3600000),   read:false, starred:true,  actionUrl:'/dashboard/college-admin/jobs' },
      { id:'2', type:'application', icon:FileText,  color:'cyan',   title:'Application Status Updated',   message:'Your application for SE position has been shortlisted',             timestamp:new Date(Date.now()-5*3600000),   read:false, starred:false, actionUrl:'/applications' },
      { id:'3', type:'system',      icon:Info,      color:'indigo', title:'System Maintenance',           message:'Scheduled maintenance on Friday, 11 PM – 2 AM',                     timestamp:new Date(Date.now()-86400000),    read:true,  starred:false, actionUrl:null },
      { id:'4', type:'deadline',    icon:Clock,     color:'amber',  title:'Application Deadline Approaching', message:'Only 2 days left to apply for Associate System Trainee at zoho', timestamp:new Date(Date.now()-2*86400000), read:true,  starred:false, actionUrl:'/dashboard/college-admin/jobs' },
      { id:'5', type:'company',     icon:Building2, color:'cyan',   title:'New Company Registered',       message:'TechCorp Solutions has been added to the placement portal',          timestamp:new Date(Date.now()-3*86400000), read:true,  starred:false, actionUrl:'/dashboard/college-admin/companies' },
      { id:'6', type:'interview',   icon:Calendar,  color:'indigo', title:'Interview Scheduled',          message:'Technical interview scheduled for tomorrow at 10:00 AM',            timestamp:new Date(Date.now()-4*86400000), read:true,  starred:true,  actionUrl:'/applications' },
    ]);
  };

  const colorMap = {
    blue:   { bg:'bg-blue-100',   text:'text-blue-600'   },
    cyan:   { bg:'bg-cyan-100',   text:'text-cyan-600'   },
    indigo: { bg:'bg-indigo-100', text:'text-indigo-600' },
    amber:  { bg:'bg-amber-100',  text:'text-amber-600'  },
  };

  const timeAgo = (ts) => {
    const d = Date.now() - ts;
    const m = Math.floor(d/60000), h = Math.floor(d/3600000), dy = Math.floor(d/86400000);
    if (m < 60) return `${m}m ago`;
    if (h < 24) return `${h}h ago`;
    return `${dy}d ago`;
  };

  const markRead   = (id) => setNotifications(n => n.map(x => x.id===id ? {...x, read:true}  : x));
  const markUnread = (id) => setNotifications(n => n.map(x => x.id===id ? {...x, read:false} : x));
  const toggleStar = (id) => setNotifications(n => n.map(x => x.id===id ? {...x, starred:!x.starred} : x));
  const del        = (id) => { if (confirm('Delete this notification?')) setNotifications(n => n.filter(x => x.id!==id)); };
  const markAllRead = ()  => setNotifications(n => n.map(x => ({...x, read:true})));
  const clearAll   = ()   => { if (confirm('Clear all notifications? This cannot be undone.')) setNotifications([]); };

  const handleClick = (n) => {
    if (!n.read) markRead(n.id);
    if (n.actionUrl) navigate(n.actionUrl);
  };

  const filtered = notifications.filter(n => {
    const q = searchTerm.toLowerCase();
    const matchSearch = n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q);
    const matchType   = filterType === 'all' || n.type === filterType;
    const matchStatus = filterStatus === 'all'
      || (filterStatus === 'unread'  && !n.read)
      || (filterStatus === 'read'    && n.read)
      || (filterStatus === 'starred' && n.starred);
    return matchSearch && matchType && matchStatus;
  });

  const unreadCount  = notifications.filter(n => !n.read).length;
  const starredCount = notifications.filter(n => n.starred).length;

  return (
    <CollegeAdminLayout>

      {/* Hero */}
      <div className="relative bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 rounded-2xl px-5 py-4 mb-4 shadow-xl shadow-blue-500/20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-10 -right-10 w-44 h-44 bg-white/10 rounded-full" />
          <div className="absolute -bottom-8 left-1/3 w-28 h-28 bg-white/10 rounded-full" />
          <div className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage:'radial-gradient(circle,white 1px,transparent 1px)', backgroundSize:'18px 18px' }} />
        </div>
        <div className="relative flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-black text-lg leading-tight">Notification Center</h1>
              <p className="text-blue-200 text-[11px] mt-0.5">Stay updated with all placement activities</p>
            </div>
          </div>
          <button onClick={() => navigate('/notifications/settings')}
            className="inline-flex items-center gap-1.5 bg-white text-blue-600 text-xs font-bold px-4 py-2.5 rounded-xl shadow-md hover:bg-blue-50 hover:scale-105 transition-all flex-shrink-0">
            <Settings className="w-4 h-4" /> Preferences
          </button>
        </div>
      </div>

      {/* Stat pills */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-3 mb-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <StatPill icon={Bell}    label="Total"   value={notifications.length} color="blue"   />
          <StatPill icon={BellOff} label="Unread"  value={unreadCount}          color="amber"  />
          <StatPill icon={Star}    label="Starred" value={starredCount}         color="indigo" />
          <StatPill icon={Check}   label="Read"    value={notifications.length - unreadCount} color="cyan" />
        </div>
      </div>

      {/* Search & filter */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-3 mb-4">
        <div className="flex flex-col sm:flex-row gap-2 mb-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search notifications…" value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white" />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <div className="relative flex items-center">
              <Filter className="absolute left-3 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              <select value={filterType} onChange={e => setFilterType(e.target.value)}
                className="pl-8 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white appearance-none">
                <option value="all">All Types</option>
                <option value="job">Jobs</option>
                <option value="application">Applications</option>
                <option value="interview">Interviews</option>
                <option value="company">Companies</option>
                <option value="deadline">Deadlines</option>
                <option value="system">System</option>
              </select>
            </div>
            <div className="relative flex items-center">
              <Filter className="absolute left-3 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                className="pl-8 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white appearance-none">
                <option value="all">All Status</option>
                <option value="unread">Unread</option>
                <option value="read">Read</option>
                <option value="starred">Starred</option>
              </select>
            </div>
          </div>
        </div>
        {notifications.length > 0 && (
          <div className="flex gap-2 pt-2 border-t border-gray-100">
            <button onClick={markAllRead}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors">
              <CheckCheck className="w-3.5 h-3.5" /> Mark All Read
            </button>
            <button onClick={clearAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors">
              <Trash2 className="w-3.5 h-3.5" /> Clear All
            </button>
          </div>
        )}
      </div>

      {/* Notifications list */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm overflow-hidden">
        {filtered.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {filtered.map(n => {
              const clr = colorMap[n.color] || colorMap.blue;
              const Icon = n.icon;
              return (
                <div key={n.id}
                  className={`p-4 hover:bg-blue-50/30 transition-all cursor-pointer group ${!n.read ? 'bg-blue-50/20' : ''}`}
                  onClick={() => handleClick(n)}>
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 ${clr.bg} rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5`}>
                      <Icon className={`w-4 h-4 ${clr.text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className={`text-sm text-gray-900 leading-tight ${!n.read ? 'font-bold' : 'font-semibold'}`}>{n.title}</p>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-[10px] text-gray-400 font-mono">{timeAgo(n.timestamp)}</span>
                          {!n.read && <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mb-2 leading-relaxed">{n.message}</p>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={e => { e.stopPropagation(); toggleStar(n.id); }}
                          className={`p-1.5 rounded-lg transition-colors ${n.starred ? 'text-amber-500 hover:bg-amber-50' : 'text-gray-400 hover:bg-gray-100'}`}>
                          {n.starred ? <Star className="w-3.5 h-3.5" fill="currentColor" /> : <StarOff className="w-3.5 h-3.5" />}
                        </button>
                        {!n.read
                          ? <button onClick={e => { e.stopPropagation(); markRead(n.id); }} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"><Check className="w-3.5 h-3.5" /></button>
                          : <button onClick={e => { e.stopPropagation(); markUnread(n.id); }} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"><BellOff className="w-3.5 h-3.5" /></button>
                        }
                        <button onClick={e => { e.stopPropagation(); del(n.id); }} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-3">
              <Bell className="w-7 h-7 text-blue-200" />
            </div>
            <p className="text-sm font-semibold text-gray-600">No notifications found</p>
            <p className="text-xs text-gray-400 mt-1">
              {searchTerm || filterType !== 'all' || filterStatus !== 'all' ? 'Try adjusting your filters' : "You're all caught up!"}
            </p>
          </div>
        )}
      </div>

    </CollegeAdminLayout>
  );
};

export default Notifications;