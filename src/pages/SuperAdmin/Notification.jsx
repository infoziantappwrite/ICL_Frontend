// src/pages/SuperAdmin/Notification.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, BellOff, Check, CheckCheck, Trash2, Filter, Search,
  Briefcase, FileText, Users, Building2, AlertCircle, Info,
  CheckCircle, Clock, Settings, Star, StarOff, X, Zap,
  ChevronRight, RefreshCw,
} from 'lucide-react';
import SuperAdminDashboardLayout from '../../components/layout/SuperAdminDashboardLayout';
import { useAuth } from '../../context/AuthContext';

const getTimeAgo = (date) => {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff/60000), hrs = Math.floor(diff/3600000), days = Math.floor(diff/86400000);
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24)  return `${hrs}h ago`;
  return `${days}d ago`;
};

const TYPE_CONFIG = {
  job:         { color: 'bg-blue-100 text-blue-600',    label: 'Job',         icon: Briefcase    },
  application: { color: 'bg-cyan-100 text-cyan-600',    label: 'Application', icon: FileText     },
  system:      { color: 'bg-indigo-100 text-indigo-600',label: 'System',      icon: Settings     },
  college:     { color: 'bg-violet-100 text-violet-600',label: 'College',     icon: Building2    },
  user:        { color: 'bg-blue-100 text-blue-600',    label: 'User',        icon: Users        },
  alert:       { color: 'bg-red-100 text-red-500',      label: 'Alert',       icon: AlertCircle  },
  success:     { color: 'bg-green-100 text-green-600',  label: 'Success',     icon: CheckCircle  },
};

const MOCK = [
  { id:'1', type:'college',     title:'New College Registered',             message:'ABC Engineering College has successfully registered on the platform.',  timestamp: new Date(Date.now()-2*3600000),  read:false, starred:true  },
  { id:'2', type:'user',        title:'Admin Account Created',              message:'New college admin created for Karpagam Institute of Technology.',       timestamp: new Date(Date.now()-5*3600000),  read:false, starred:false },
  { id:'3', type:'system',      title:'System Maintenance Scheduled',       message:'Planned maintenance this Friday, 11 PM – 2 AM IST. Minimal downtime expected.', timestamp: new Date(Date.now()-86400000), read:true, starred:false },
  { id:'4', type:'job',         title:'New Job Listing Posted',             message:'Software Engineer position opened at Infoziant Technologies.',          timestamp: new Date(Date.now()-2*86400000), read:true,  starred:false },
  { id:'5', type:'application', title:'Applications Milestone Reached',     message:'Platform has received 500+ job applications this month.',              timestamp: new Date(Date.now()-3*86400000), read:true,  starred:true  },
  { id:'6', type:'alert',       title:'Subscription Expiring Soon',         message:'Madras Christian College subscription expires in 7 days.',             timestamp: new Date(Date.now()-4*86400000), read:false, starred:false },
  { id:'7', type:'success',     title:'Bulk Student Upload Complete',        message:'750 students successfully uploaded to Anna University RC.',            timestamp: new Date(Date.now()-5*86400000), read:true,  starred:false },
  { id:'8', type:'college',     title:'College Activation Request',         message:'Anna University RC has requested subscription upgrade to Pro plan.',   timestamp: new Date(Date.now()-6*86400000), read:false, starred:false },
  { id:'9', type:'system',      title:'Platform Update Deployed',           message:'Version 2.4.1 deployed successfully. New analytics dashboard live.',   timestamp: new Date(Date.now()-7*86400000), read:true,  starred:false },
  { id:'10',type:'job',         title:'High Application Volume Alert',      message:'Frontend Developer role received 120 applications in 24 hours.',       timestamp: new Date(Date.now()-8*86400000), read:true,  starred:false },
];

const Notifications = () => {
  const navigate = useNavigate();
  const { user }  = useAuth();
  const [notifications, setNotifications] = useState(MOCK);
  const [searchTerm,    setSearchTerm]    = useState('');
  const [filterType,    setFilterType]    = useState('all');
  const [filterStatus,  setFilterStatus]  = useState('all');

  const unreadCount  = notifications.filter(n => !n.read).length;
  const starredCount = notifications.filter(n => n.starred).length;

  const handleMarkRead   = (id) => setNotifications(prev => prev.map(n => n.id===id ? {...n, read:true}  : n));
  const handleMarkUnread = (id) => setNotifications(prev => prev.map(n => n.id===id ? {...n, read:false} : n));
  const handleToggleStar = (id) => setNotifications(prev => prev.map(n => n.id===id ? {...n, starred:!n.starred} : n));
  const handleDelete     = (id) => setNotifications(prev => prev.filter(n => n.id!==id));
  const handleMarkAllRead = () => setNotifications(prev => prev.map(n => ({...n, read:true})));

  const filtered = notifications.filter(n => {
    const q = searchTerm.toLowerCase();
    const matchSearch = n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q);
    const matchType   = filterType   === 'all' || n.type === filterType;
    const matchStatus = filterStatus === 'all' || (filterStatus==='unread' && !n.read) || (filterStatus==='starred' && n.starred) || (filterStatus==='read' && n.read);
    return matchSearch && matchType && matchStatus;
  });

  return (
    <SuperAdminDashboardLayout>

      {/* Hero */}
      <div className="relative bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 rounded-2xl px-5 py-4 mb-4 shadow-xl shadow-blue-500/20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-10 -right-10 w-44 h-44 bg-white/10 rounded-full"/>
          <div className="absolute -bottom-8 left-1/3 w-28 h-28 bg-white/10 rounded-full"/>
          <div className="absolute inset-0 opacity-[0.04]" style={{backgroundImage:'radial-gradient(circle,white 1px,transparent 1px)',backgroundSize:'18px 18px'}}/>
        </div>
        <div className="relative flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0 relative">
              <Bell className="w-5 h-5 text-white"/>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] font-black text-white flex items-center justify-center">{unreadCount}</span>
              )}
            </div>
            <div>
              <h1 className="text-white font-black text-lg leading-tight">Notifications</h1>
              <p className="text-blue-200 text-[11px] mt-0.5">{unreadCount} unread · {starredCount} starred · {notifications.length} total</p>
            </div>
          </div>
          {unreadCount > 0 && (
            <button onClick={handleMarkAllRead}
              className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-3 py-2 rounded-xl border border-white/20 transition-all flex-shrink-0">
              <CheckCheck className="w-3.5 h-3.5"/> Mark all read
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">

        {/* Left sidebar — filters */}
        <div className="lg:col-span-1 flex flex-col gap-4">

          {/* Quick filter pills */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-4">
            <p className="text-xs font-bold text-gray-700 mb-3">Filter by Status</p>
            <div className="space-y-1">
              {[
                { key:'all',     label:'All',       count:notifications.length },
                { key:'unread',  label:'Unread',    count:unreadCount },
                { key:'starred', label:'Starred',   count:starredCount },
                { key:'read',    label:'Read',      count:notifications.length - unreadCount },
              ].map(f => (
                <button key={f.key} onClick={() => setFilterStatus(f.key)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    filterStatus===f.key ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-sm' : 'text-gray-600 hover:bg-blue-50'}`}>
                  <span>{f.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${filterStatus===f.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>{f.count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Filter by type */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-4">
            <p className="text-xs font-bold text-gray-700 mb-3">Filter by Type</p>
            <div className="space-y-1">
              {[['all','All Types'],['college','College'],['user','User'],['job','Job'],['application','Application'],['system','System'],['alert','Alert'],['success','Success']].map(([key,label]) => {
                const cfg = TYPE_CONFIG[key];
                const IconComp = cfg?.icon;
                return (
                  <button key={key} onClick={() => setFilterType(key)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${filterType===key ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-sm' : 'text-gray-600 hover:bg-blue-50'}`}>
                    {IconComp ? <IconComp className="w-3 h-3"/> : <Zap className="w-3 h-3"/>}
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right — notification list */}
        <div className="lg:col-span-3 flex flex-col gap-3">

          {/* Search */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
              <input type="text" placeholder="Search notifications…" value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"/>
              {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="w-3.5 h-3.5"/></button>}
            </div>
          </div>

          {/* Notifications */}
          {filtered.length > 0 ? (
            <div className="space-y-2">
              {filtered.map(n => {
                const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.system;
                const Icon = cfg.icon;
                return (
                  <div key={n.id}
                    className={`bg-white/80 backdrop-blur-xl rounded-2xl border shadow-sm p-4 transition-all hover:shadow-md ${!n.read ? 'border-blue-200 bg-blue-50/30' : 'border-white/60'}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${cfg.color}`}>
                        <Icon className="w-4 h-4"/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <h3 className={`text-sm truncate ${!n.read ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>{n.title}</h3>
                            {!n.read && <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"/>}
                          </div>
                          <span className="text-[10px] text-gray-400 flex-shrink-0 font-mono">{getTimeAgo(n.timestamp)}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.message}</p>
                        <div className="flex items-center gap-1.5 mt-2">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
                          <button onClick={() => handleToggleStar(n.id)}
                            className={`p-1 rounded-lg transition-colors ${n.starred ? 'text-yellow-500 hover:bg-yellow-50' : 'text-gray-300 hover:bg-gray-100'}`}>
                            <Star className="w-3 h-3" fill={n.starred?'currentColor':'none'}/>
                          </button>
                          {!n.read
                            ? <button onClick={() => handleMarkRead(n.id)} className="p-1 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="Mark as read"><Check className="w-3 h-3"/></button>
                            : <button onClick={() => handleMarkUnread(n.id)} className="p-1 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors" title="Mark as unread"><BellOff className="w-3 h-3"/></button>}
                          <button onClick={() => handleDelete(n.id)} className="p-1 text-red-400 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><Trash2 className="w-3 h-3"/></button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm flex flex-col items-center justify-center py-20">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-3"><Bell className="w-7 h-7 text-blue-200"/></div>
              <p className="text-sm font-semibold text-gray-600">No notifications found</p>
              <p className="text-xs text-gray-400 mt-1">{searchTerm || filterType!=='all' || filterStatus!=='all' ? 'Try adjusting your filters' : "You're all caught up!"}</p>
            </div>
          )}
        </div>
      </div>
    </SuperAdminDashboardLayout>
  );
};

export default Notifications;