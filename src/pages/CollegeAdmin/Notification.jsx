// src/pages/CollegeAdmin/Notification.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, BellOff, Check, CheckCheck, Trash2, Filter, Search,
  Briefcase, FileText, Users, Building2, Calendar, AlertCircle,
  Info, Clock, Settings, Star, StarOff, X,
} from 'lucide-react';
import CollegeAdminLayout from '../../components/layout/CollegeAdminLayout';
import { useAuth } from '../../context/AuthContext';

const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-lg shadow-sm border border-slate-100 ${className}`}>
    {children}
  </div>
);

const StatPill = ({ icon: Icon, label, value, color }) => {
  const c = {
    blue:   'bg-[#003399]/5 text-[#003399] border-transparent',
    cyan:   'bg-cyan-50 text-cyan-700 border-transparent',
    amber:  'bg-amber-50 text-amber-700 border-transparent',
    indigo: 'bg-indigo-50 text-indigo-700 border-transparent',
  }[color] || 'bg-gray-50 text-gray-700 border-transparent';
  return (
    <Card className="p-4 flex items-center justify-between">
      <div>
        <p className="text-[12px] font-bold text-gray-500 mb-0.5">{label}</p>
        <p className={`text-[24px] font-black leading-none ${c.split(' ')[1]}`}>{value}</p>
      </div>
      <div className={`w-10 h-10 ${c.split(' ')[0]} rounded-xl flex items-center justify-center`}>
        <Icon className={`w-5 h-5 ${c.split(' ')[1]}`} />
      </div>
    </Card>
  );
};

const Notifications = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

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
    blue:   { bg:'bg-[#003399]/5',   text:'text-[#003399]'   },
    cyan:   { bg:'bg-cyan-50',   text:'text-cyan-600'   },
    indigo: { bg:'bg-indigo-50', text:'text-indigo-600' },
    amber:  { bg:'bg-amber-50',  text:'text-amber-600'  },
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
      <div className="px-6 py-4 md:px-8 md:py-6 space-y-5 font-sans">
        <div className="max-w-[1240px] mx-auto space-y-3 sm:space-y-4">

          {/* ═════════ HEADER ═════════ */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span className="w-2 h-8 bg-gradient-to-b from-[#003399] to-[#00A9CE] rounded-full inline-block flex-shrink-0" />
                Notification <span className="text-[#003399]">Center</span>
              </h1>
              <p className="text-sm text-slate-400 mt-1 font-medium">
                Stay updated with recent placement activities and alerts.
              </p>
            </div>
            <button onClick={() => navigate('/notifications/settings')}
              className="inline-flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 text-[13px] font-bold px-4 py-2.5 rounded-lg shadow-sm hover:bg-slate-50/30 transition-colors flex-shrink-0">
              <Settings className="w-4 h-4" /> Preferences
            </button>
          </div>

          {/* ═════════ STATS ═════════ */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-4">
            <StatPill icon={Bell}    label="Total"   value={notifications.length} color="blue"   />
            <StatPill icon={BellOff} label="Unread"  value={unreadCount}          color="amber"  />
            <StatPill icon={Star}    label="Starred" value={starredCount}         color="indigo" />
            <StatPill icon={Check}   label="Read"    value={notifications.length - unreadCount} color="cyan" />
          </div>

          {/* ═════════ MAIN PANEL ═════════ */}
          <Card className="flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-white">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="text" placeholder="Search notifications…" value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#003399]/30 transition-shadow bg-white" />
                  {searchTerm && (
                    <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 bg-gray-100 p-1.5 rounded-full text-slate-400 hover:text-gray-600">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <select value={filterType} onChange={e => setFilterType(e.target.value)}
                    className="px-4 py-2.5 text-[13px] font-bold text-gray-700 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#003399]/30 shadow-sm cursor-pointer bg-white w-full md:w-auto">
                    <option value="all">All Types</option>
                    <option value="job">Jobs</option>
                    <option value="application">Applications</option>
                    <option value="interview">Interviews</option>
                    <option value="company">Companies</option>
                    <option value="deadline">Deadlines</option>
                    <option value="system">System</option>
                  </select>
                  <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                    className="px-4 py-2.5 text-[13px] font-bold text-gray-700 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#003399]/30 shadow-sm cursor-pointer bg-white w-full md:w-auto">
                    <option value="all">All Status</option>
                    <option value="unread">Unread</option>
                    <option value="read">Read</option>
                    <option value="starred">Starred</option>
                  </select>
                </div>
              </div>

              {notifications.length > 0 && (
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100">
                  <button onClick={markAllRead}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-bold text-[#003399] hover:text-[#003399] hover:underline transition-colors">
                    <CheckCheck className="w-3.5 h-3.5" /> Mark All Read
                  </button>
                  <button onClick={clearAll}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-bold text-red-500 hover:text-red-700 hover:underline transition-colors">
                    <Trash2 className="w-3.5 h-3.5" /> Clear All
                  </button>
                </div>
              )}
            </div>

            <div className="bg-white min-h-[300px]">
              {filtered.length > 0 ? (
                <div className="divide-y divide-slate-50">
                  {filtered.map(n => {
                    const clr = colorMap[n.color] || colorMap.blue;
                    const Icon = n.icon;
                    return (
                      <div key={n.id}
                        className={`p-4 hover:bg-slate-50/70 transition-colors cursor-pointer group ${!n.read ? 'bg-[#003399]/5' : 'bg-white'}`}
                        onClick={() => handleClick(n)}>
                        <div className="flex items-start gap-4">
                          <div className={`w-10 h-10 ${clr.bg} rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5`}>
                            <Icon className={`w-5 h-5 ${clr.text}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 mb-1.5">
                              <p className={`text-[14px] text-gray-900 truncate pr-4 ${!n.read ? 'font-black' : 'font-semibold'}`}>
                                {n.title}
                              </p>
                              <div className="flex items-center gap-2 flex-shrink-0 self-start sm:self-auto">
                                <span className="text-[11px] text-slate-400 font-medium">{timeAgo(n.timestamp)}</span>
                                {!n.read && <span className="w-2 h-2 bg-[#003399] rounded-full flex-shrink-0" />}
                              </div>
                            </div>
                            <p className="text-[13px] text-gray-600 mb-2 leading-snug">{n.message}</p>
                            
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={e => { e.stopPropagation(); toggleStar(n.id); }}
                                className={`p-1.5 rounded transition-colors ${n.starred ? 'text-amber-500 bg-amber-50' : 'text-slate-400 hover:text-amber-500 hover:bg-gray-100'}`} title="Star Notification">
                                {n.starred ? <Star className="w-4 h-4" fill="currentColor" /> : <Star className="w-4 h-4" />}
                              </button>
                              {!n.read
                                ? <button onClick={e => { e.stopPropagation(); markRead(n.id); }} className="p-1.5 text-slate-400 hover:text-[#003399] hover:bg-slate-50 rounded transition-colors" title="Mark as Read"><Check className="w-4 h-4" /></button>
                                : <button onClick={e => { e.stopPropagation(); markUnread(n.id); }} className="p-1.5 text-slate-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors" title="Mark as Unread"><BellOff className="w-4 h-4" /></button>
                              }
                              <button onClick={e => { e.stopPropagation(); del(n.id); }} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Delete">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
                    <Bell className="w-6 h-6 text-gray-300" />
                  </div>
                  <p className="text-[15px] font-bold text-gray-900">No notifications found</p>
                  <p className="text-[13px] text-gray-500 mt-1 max-w-[250px]">
                    {searchTerm || filterType !== 'all' || filterStatus !== 'all' ? 'Try adjusting your search filters.' : "You're all caught up! Nothing new here."}
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </CollegeAdminLayout>
  );
};

export default Notifications;