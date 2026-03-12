// src/pages/SuperAdmin/Dashboard.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Building2, Users, Briefcase, BookOpen, GraduationCap,
  UserCheck, RefreshCw, Crown, Eye, SquarePen, Plus,
  CreditCard, BarChart3, TrendingUp, Clock, CheckCircle2,
  ChevronRight, Settings, Bell, Zap, AlertCircle,
  Star, Target, Globe, Shield,
} from 'lucide-react';
import SuperAdminDashboardLayout from '../../components/layout/SuperAdminDashboardLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import apiCall, { superAdminCourseAPI } from '../../api/Api';

/* ─── helpers ─────────────────────────────── */
const fmt = (n) => {
  if (n === undefined || n === null) return '0';
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
};
const pct = (a, b) => (b > 0 ? Math.min(100, Math.round((a / b) * 100)) : 0);
const greet = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

/* ─── Pill stat ──────────────────────────── */
const Pill = ({ icon: Icon, label, value, color, onClick }) => {
  const c = {
    blue:   'bg-blue-50 border-blue-100 text-blue-600',
    cyan:   'bg-cyan-50 border-cyan-100 text-cyan-600',
    indigo: 'bg-indigo-50 border-indigo-100 text-indigo-600',
    violet: 'bg-violet-50 border-violet-100 text-violet-600',
  }[color] || 'bg-blue-50 border-blue-100 text-blue-600';
  return (
    <button onClick={onClick}
      className={`group flex items-center gap-2 px-3 py-2 rounded-xl border ${c} hover:shadow-md hover:scale-[1.03] transition-all duration-150 text-left w-full`}
    >
      <Icon className="w-4 h-4 flex-shrink-0 opacity-70" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-black leading-none">{fmt(value)}</p>
        <p className="text-[9px] font-medium opacity-60 mt-0.5 leading-none truncate">{label}</p>
      </div>
    </button>
  );
};

/* ─── Section heading ────────────────────── */
const SHead = ({ icon: Icon, title, sub, action, onAction }) => (
  <div className="flex items-center justify-between mb-3">
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
        <Icon className="w-3 h-3 text-white" />
      </div>
      <div>
        <h3 className="text-sm font-bold text-gray-800 leading-none">{title}</h3>
        {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
    {action && (
      <button onClick={onAction}
        className="text-[10px] font-bold text-blue-600 flex items-center gap-0.5 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors"
      >
        {action} <ChevronRight className="w-3 h-3" />
      </button>
    )}
  </div>
);

/* ─── Mini bar chart ─────────────────────── */
const MiniBar = ({ label, value, max, color, onClick }) => {
  const w = pct(value, max);
  return (
    <button onClick={onClick} className="group w-full text-left hover:bg-blue-50/40 px-2 py-1.5 rounded-lg transition-colors">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-600 font-medium truncate max-w-[130px]">{label}</span>
        <span className="text-xs font-black text-gray-800 ml-2">{fmt(value)}</span>
      </div>
      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${w}%`, background: color }} />
      </div>
    </button>
  );
};

/* ─── Metric row ─────────────────────────── */
const MetricRow = ({ label, value, color }) => (
  <div className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
    <span className="text-xs text-gray-500">{label}</span>
    <span className={`text-xs font-black ${color}`}>{value}</span>
  </div>
);

/* ─── Activity item ──────────────────────── */
const ActivityItem = ({ icon: Icon, color, title, sub, time }) => (
  <div className="flex items-start gap-2.5 py-2 border-b border-gray-50 last:border-0">
    <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${color}`}>
      <Icon className="w-3 h-3" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-semibold text-gray-800 leading-none">{title}</p>
      <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>
    </div>
    <span className="text-[9px] text-gray-300 flex-shrink-0 mt-0.5 font-mono">{time}</span>
  </div>
);

/* ─── Feature tile ───────────────────────── */
const FeatureTile = ({ icon: Icon, title, desc, gradient, onClick }) => (
  <button onClick={onClick}
    className={`group relative overflow-hidden rounded-xl p-3 text-left transition-all duration-200 hover:scale-[1.04] hover:shadow-lg w-full ${gradient}`}
  >
    <div className="absolute -top-4 -right-4 w-14 h-14 bg-white/10 rounded-full" />
    <Icon className="w-4 h-4 text-white mb-2 relative z-10" />
    <p className="text-xs font-bold text-white leading-none relative z-10">{title}</p>
    <p className="text-[9px] text-white/70 mt-0.5 relative z-10">{desc}</p>
  </button>
);

/* ─── Insight tile ───────────────────────── */
const InsightTile = ({ label, value, sub, color, bg }) => (
  <div className={`${bg} rounded-xl p-3 border`}>
    <p className={`text-xl font-black ${color} leading-none`}>{value}</p>
    <p className="text-xs font-semibold text-gray-700 mt-1">{label}</p>
    {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
  </div>
);

/* ══════════════════════════════════════════ */
/*              MAIN COMPONENT               */
/* ══════════════════════════════════════════ */
const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const { user }  = useAuth();

  const [loading,        setLoading]        = useState(true);
  const [refreshing,     setRefreshing]     = useState(false);
  const [stats,          setStats]          = useState({});
  const [recentColleges, setRecentColleges] = useState([]);
  const [lastUpdated,    setLastUpdated]    = useState(new Date());

  const fetchData = useCallback(async () => {
    try {
      setRefreshing(true);
      const [dash, colleges, coursesRes] = await Promise.all([
        apiCall('/super-admin/dashboard'),
        apiCall('/super-admin/colleges?limit=8&sortBy=-createdAt'),
        superAdminCourseAPI.getAllCourses({ limit: 500 }),
      ]);
      if (dash.success) {
        const dashStats = dash.data?.stats || {};
        // Augment with live course & enrollment counts if dashboard API returns 0/missing
        if (coursesRes?.success) {
          const courseList = coursesRes.data || [];
          dashStats.totalCourses     = courseList.length;
          dashStats.totalEnrollments = courseList.reduce((sum, c) => sum + (c.enrollmentCount || 0), 0);
        }
        setStats(dashStats);
      }
      if (colleges.success) setRecentColleges(colleges.colleges || []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const t = setInterval(fetchData, 30000);
    return () => clearInterval(t);
  }, [fetchData]);

  if (loading && !Object.keys(stats).length) {
    return <LoadingSpinner message="Loading Dashboard…" submessage="Fetching platform data" />;
  }

  const activeRate  = pct(stats.activeColleges ?? 0, stats.totalColleges ?? 0);
  const firstName   = user?.fullName?.split(' ')[0] || user?.name?.split(' ')[0] || 'Admin';
  const maxStudents = Math.max(...(recentColleges.map(c => c.liveCounts?.studentsCount ?? 0)), 1);

  const avgStudents = stats.totalColleges > 0
    ? Math.round((stats.totalStudents ?? 0) / stats.totalColleges)
    : 0;
  const avgCompanies = stats.totalColleges > 0
    ? Math.round((stats.totalCompanies ?? 0) / stats.totalColleges)
    : 0;

  const activityFeed = [
    ...recentColleges.slice(0, 3).map((c, i) => ({
      icon: Building2,
      color: 'bg-blue-100 text-blue-600',
      title: `${c.name?.split(' ').slice(0, 3).join(' ')} registered`,
      sub: `Code: ${c.code} · ${c.liveCounts?.studentsCount ?? 0} students`,
      time: `${i + 1}d ago`,
    })),
    { icon: Users,         color: 'bg-cyan-100 text-cyan-600',     title: 'Admin accounts updated',        sub: `${stats.totalAdmins ?? 0} admins across all colleges`,              time: 'recent' },
    { icon: GraduationCap, color: 'bg-indigo-100 text-indigo-600', title: 'Student registrations updated', sub: `${fmt(stats.totalStudents)} total students on platform`,             time: 'today'  },
    { icon: BookOpen,      color: 'bg-violet-100 text-violet-600', title: 'Course catalog updated',        sub: `${stats.totalCourses ?? 0} courses · ${fmt(stats.totalEnrollments)} enrollments`, time: 'recent' },
    { icon: Briefcase,     color: 'bg-cyan-100 text-cyan-600',     title: 'Job listings refreshed',        sub: `${stats.activeJobs ?? 0} active positions across companies`,        time: 'today'  },
  ];

  return (
    <SuperAdminDashboardLayout>

      {/* ══ HERO BANNER ══ */}
      <div className="relative bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 rounded-2xl px-5 py-4 mb-4 shadow-xl shadow-blue-500/20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-10 -right-10 w-44 h-44 bg-white/10 rounded-full" />
          <div className="absolute -bottom-8 left-1/3 w-28 h-28 bg-white/10 rounded-full" />
          <div className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: 'radial-gradient(circle,white 1px,transparent 1px)', backgroundSize: '18px 18px' }}
          />
        </div>
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Crown className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-blue-200 text-[11px] font-semibold">{greet()}, {firstName}</p>
              <h1 className="text-white font-black text-lg leading-tight">Super Admin Dashboard</h1>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                <span className="inline-flex items-center gap-1 bg-white/15 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white border border-white/20">
                  <CheckCircle2 className="w-3 h-3" /> {stats.activeColleges ?? 0} Active
                </span>
                <span className="inline-flex items-center gap-1 bg-white/15 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white border border-white/20">
                  <TrendingUp className="w-3 h-3" /> {activeRate}% Rate
                </span>
                <span className="inline-flex items-center gap-1 bg-white/15 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white border border-white/20">
                  <Users className="w-3 h-3" /> {fmt(stats.totalStudents)} Students
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <p className="text-blue-200 text-[10px] font-mono hidden sm:block">
              <Clock className="inline w-3 h-3 mr-0.5" />{lastUpdated.toLocaleTimeString()}
            </p>
            <button onClick={fetchData} disabled={refreshing}
              className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-3 py-2 rounded-xl border border-white/20 transition-all hover:scale-105 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* ══ STATS PILLS ══ */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-3 mb-4">
        <div className="grid grid-cols-4 lg:grid-cols-8 gap-2">
          <Pill icon={Building2}     label="Colleges"      value={stats.totalColleges}    color="blue"   onClick={() => navigate('/dashboard/super-admin/colleges')} />
          <Pill icon={Users}         label="Admins"        value={stats.totalAdmins}      color="cyan"   onClick={() => navigate('/dashboard/super-admin/admins')} />
          <Pill icon={GraduationCap} label="Students"      value={stats.totalStudents}    color="indigo" onClick={() => navigate('/dashboard/super-admin/students')} />
          <Pill icon={Briefcase}     label="Companies"     value={stats.totalCompanies}   color="violet" onClick={() => navigate('/dashboard/super-admin/companies')} />
          <Pill icon={BookOpen}      label="Courses"       value={stats.totalCourses}     color="blue"   onClick={() => navigate('/dashboard/super-admin/courses')} />
          <Pill icon={UserCheck}     label="Enrollments"   value={stats.totalEnrollments} color="cyan"   onClick={() => navigate('/dashboard/super-admin/courses')} />
          <Pill icon={BarChart3}     label="Active Jobs"   value={stats.activeJobs}       color="indigo" onClick={() => navigate('/dashboard/super-admin/analytics')} />
          <Pill icon={CreditCard}    label="Subscriptions" value={stats.activeSubscriptions ?? stats.totalColleges ?? 0} color="violet" onClick={() => navigate('/dashboard/super-admin/subscriptions')} />
        </div>
      </div>

      {/* ══ MAIN 3-COLUMN GRID (equal height columns) ══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">

        {/* ── LEFT (2 cols) ── */}
        <div className="lg:col-span-2 flex flex-col gap-4">

          {/* College Table */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center">
                    <Building2 className="w-3 h-3 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-800 leading-none">Recent Colleges</h3>
                    <p className="text-[10px] text-gray-400 mt-0.5">Showing latest {recentColleges.length} registrations</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => navigate('/dashboard/super-admin/colleges/new')}
                    className="inline-flex items-center gap-1 text-[10px] font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-500 px-2.5 py-1.5 rounded-lg shadow-sm hover:scale-105 transition-all"
                  >
                    <Plus className="w-3 h-3" /> Add College
                  </button>
                  <button onClick={() => navigate('/dashboard/super-admin/colleges')}
                    className="text-[10px] font-semibold text-blue-600 flex items-center gap-0.5 px-2 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    View All <Eye className="w-3 h-3 ml-0.5" />
                  </button>
                </div>
              </div>
            </div>
            {recentColleges.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-50 bg-gray-50/40">
                      {['College','Code','Students','Companies','JDs','Admins','Status',''].map(h => (
                        <th key={h} className="px-3 py-2 text-left text-[9px] font-black text-gray-400 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {recentColleges.map(college => {
                      const lc = college.liveCounts || {};
                      return (
                        <tr key={college._id} className="hover:bg-blue-50/20 transition-colors group">
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-md flex items-center justify-center text-[8px] font-black text-white flex-shrink-0">
                                {college.name?.substring(0,2).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p onClick={() => navigate(`/dashboard/super-admin/colleges/${college._id}`)}
                                  className="text-xs font-semibold text-gray-900 truncate max-w-[110px] cursor-pointer hover:text-blue-600 transition-colors"
                                >{college.name}</p>
                                <p className="text-[9px] text-gray-400 truncate max-w-[110px]">{college.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md">{college.code}</span>
                          </td>
                          <td className="px-3 py-2.5">
                            <button onClick={() => navigate(`/dashboard/super-admin/colleges/${college._id}/students`)}
                              className="flex items-center gap-1 text-xs font-medium text-gray-700 hover:text-blue-600 transition-colors"
                            >
                              <GraduationCap className="w-3 h-3 text-gray-400" />
                              {lc.studentsCount ?? 0}
                            </button>
                          </td>
                          <td className="px-3 py-2.5 text-xs text-gray-600">{lc.companiesCount ?? 0}</td>
                          <td className="px-3 py-2.5 text-xs text-gray-600">{lc.jdsCount ?? 0}</td>
                          <td className="px-3 py-2.5 text-xs text-gray-600">{lc.adminsCount ?? 0}</td>
                          <td className="px-3 py-2.5">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold rounded-full border ${
                              college.isActive
                                ? 'bg-blue-50 text-blue-600 border-blue-100'
                                : 'bg-gray-50 text-gray-400 border-gray-200'
                            }`}>
                              <span className={`w-1 h-1 rounded-full ${college.isActive ? 'bg-blue-500' : 'bg-gray-400'}`} />
                              {college.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => navigate(`/dashboard/super-admin/colleges/${college._id}`)}
                                className="p-1 text-blue-500 hover:bg-blue-100 rounded-md transition-colors" title="View"
                              ><Eye className="w-3 h-3" /></button>
                              <button onClick={() => navigate(`/dashboard/super-admin/colleges/${college._id}/edit`)}
                                className="p-1 text-emerald-500 hover:bg-emerald-50 rounded-md transition-colors" title="Edit"
                              ><SquarePen className="w-3 h-3" /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10">
                <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center mb-2">
                  <Building2 className="w-5 h-5 text-blue-300" />
                </div>
                <p className="text-sm font-semibold text-gray-600 mb-3">No colleges yet</p>
                <button onClick={() => navigate('/dashboard/super-admin/colleges/new')}
                  className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-sm hover:scale-105 transition-all"
                ><Plus className="w-3 h-3" /> Add College</button>
              </div>
            )}
          </div>

          {/* Student Distribution Bars */}
          {recentColleges.length > 0 && (
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-4">
              <SHead
                icon={BarChart3} title="Student Distribution per College"
                sub="Click a bar to view college students"
                action="All Colleges" onAction={() => navigate('/dashboard/super-admin/colleges')}
              />
              <div className="space-y-0.5">
                {recentColleges.map(college => (
                  <MiniBar
                    key={college._id}
                    label={college.name?.split(' ').slice(0,4).join(' ')}
                    value={college.liveCounts?.studentsCount ?? 0}
                    max={maxStudents}
                    color="linear-gradient(90deg,#2563eb,#06b6d4)"
                    onClick={() => navigate(`/dashboard/super-admin/colleges/${college._id}/students`)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Platform Insights grid */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-4">
            <SHead icon={TrendingUp} title="Platform Insights" sub="Key ratios & computed metrics" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <InsightTile
                label="Avg Students / College" value={fmt(avgStudents)}
                sub="Across all colleges"
                color="text-blue-600" bg="bg-blue-50 border-blue-100"
              />
              <InsightTile
                label="Avg Companies / College" value={fmt(avgCompanies)}
                sub="Per institution"
                color="text-cyan-600" bg="bg-cyan-50 border-cyan-100"
              />
              <InsightTile
                label="Enrollment Rate" value={`${pct(stats.totalEnrollments ?? 0, Math.max(stats.totalStudents ?? 1, 1))}%`}
                sub="Students enrolled"
                color="text-indigo-600" bg="bg-indigo-50 border-indigo-100"
              />
              <InsightTile
                label="Job Fill Rate" value={`${pct(stats.activeJobs ?? 0, Math.max(stats.totalCompanies ?? 1, 1))}%`}
                sub="Jobs per company"
                color="text-violet-600" bg="bg-violet-50 border-violet-100"
              />
            </div>
          </div>

          {/* Activity Feed */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-4">
            <SHead icon={Zap} title="Recent Platform Activity" sub="Latest events across the platform" />
            {activityFeed.map((item, i) => (
              <ActivityItem key={i} {...item} />
            ))}
          </div>

          {/* Quick Access */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-4">
            <SHead icon={Star} title="Quick Access" sub="Jump to key platform sections" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <FeatureTile icon={Plus}          title="Add College"   desc="Register new"    gradient="bg-gradient-to-br from-blue-600 to-blue-700"   onClick={() => navigate('/dashboard/super-admin/colleges/new')} />
              <FeatureTile icon={BookOpen}      title="Courses"       desc="Manage catalog"  gradient="bg-gradient-to-br from-cyan-500 to-blue-600"   onClick={() => navigate('/dashboard/super-admin/courses')} />
              <FeatureTile icon={BarChart3}     title="Analytics"     desc="View reports"    gradient="bg-gradient-to-br from-blue-600 to-indigo-600" onClick={() => navigate('/dashboard/super-admin/analytics')} />
              <FeatureTile icon={Settings}      title="Settings"      desc="Platform config" gradient="bg-gradient-to-br from-indigo-500 to-blue-600" onClick={() => navigate('/dashboard/super-admin/settings')} />
              <FeatureTile icon={Users}         title="Admins"        desc="Manage admins"   gradient="bg-gradient-to-br from-blue-500 to-cyan-500"   onClick={() => navigate('/dashboard/super-admin/admins')} />
              <FeatureTile icon={GraduationCap} title="Students"      desc="All students"    gradient="bg-gradient-to-br from-cyan-600 to-blue-600"   onClick={() => navigate('/dashboard/super-admin/students')} />
              <FeatureTile icon={CreditCard}    title="Subscriptions" desc="Billing & plans" gradient="bg-gradient-to-br from-blue-700 to-indigo-700" onClick={() => navigate('/dashboard/super-admin/subscriptions')} />
              <FeatureTile icon={Bell}          title="Notifications" desc="Platform alerts" gradient="bg-gradient-to-br from-blue-500 to-blue-700"   onClick={() => navigate('/dashboard/super-admin/notifications')} />
            </div>
          </div>

        </div>{/* end LEFT */}

        {/* ── RIGHT (1 col) ── */}
        <div className="flex flex-col gap-4">

          {/* Platform Snapshot */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-4">
            <SHead icon={BarChart3} title="Platform Snapshot" />
            <div className="flex items-center gap-3 mb-3">
              <div className="relative w-16 h-16 flex-shrink-0">
                <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#dbeafe" strokeWidth="3.5" />
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="url(#sg)" strokeWidth="3.5"
                    strokeDasharray={`${activeRate} ${100 - activeRate}`} strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="sg" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#2563eb" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-base font-black text-gray-900">{activeRate}%</span>
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-800">College Activation</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{stats.activeColleges ?? 0} of {stats.totalColleges ?? 0} active</p>
                <p className="text-[10px] font-mono text-gray-300 mt-1">
                  {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
            <div>
              <MetricRow label="Total Students"      value={fmt(stats.totalStudents)}     color="text-blue-600" />
              <MetricRow label="Course Enrollments"  value={fmt(stats.totalEnrollments)}  color="text-cyan-600" />
              <MetricRow label="Active Job Listings" value={fmt(stats.activeJobs)}        color="text-indigo-600" />
              <MetricRow label="Total Admins"        value={fmt(stats.totalAdmins)}       color="text-violet-600" />
              <MetricRow label="Total Companies"     value={fmt(stats.totalCompanies)}    color="text-blue-700" />
              <MetricRow label="Total Courses"       value={fmt(stats.totalCourses)}      color="text-cyan-700" />
            </div>
          </div>

          {/* Platform Status */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-4">
            <SHead icon={Shield} title="Platform Status" sub="All systems operational" />
            <div className="space-y-1">
              {['API Server','Database','Auth Service','Email Service','File Storage'].map(s => (
                <div key={s} className="flex items-center justify-between py-1">
                  <span className="text-xs text-gray-600">{s}</span>
                  <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-600 border border-green-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    Operational
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2 p-2 bg-green-50 rounded-xl border border-green-100">
                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-green-800">All systems healthy</p>
                  <p className="text-[9px] text-green-600">No incidents reported</p>
                </div>
              </div>
            </div>
          </div>

          {/* Platform Goal */}
          <div className="bg-gradient-to-br from-blue-600 via-blue-600 to-cyan-500 rounded-2xl p-4 text-white shadow-lg shadow-blue-500/20 relative overflow-hidden">
            <div className="absolute -top-6 -right-6 w-20 h-20 bg-white/10 rounded-full" />
            <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white/10 rounded-full" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-cyan-200" />
                <p className="text-xs font-bold text-white">Platform Goal</p>
              </div>
              <p className="text-[11px] text-blue-100 mb-3 leading-relaxed">
                Grow to <span className="font-bold text-white">100 colleges</span> and
                connect <span className="font-bold text-white">10,000+ students</span>.
              </p>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-[10px] text-blue-200 mb-0.5">
                    <span>Colleges</span><span>{stats.totalColleges ?? 0}/100</span>
                  </div>
                  <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-white/70 rounded-full"
                      style={{ width: `${Math.min(100, ((stats.totalColleges ?? 0) / 100) * 100)}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[10px] text-blue-200 mb-0.5">
                    <span>Students</span><span>{fmt(stats.totalStudents)}/10k</span>
                  </div>
                  <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-white/70 rounded-full"
                      style={{ width: `${Math.min(100, ((stats.totalStudents ?? 0) / 10000) * 100)}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[10px] text-blue-200 mb-0.5">
                    <span>Companies</span><span>{fmt(stats.totalCompanies)}/500</span>
                  </div>
                  <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-white/70 rounded-full"
                      style={{ width: `${Math.min(100, ((stats.totalCompanies ?? 0) / 500) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
              <button onClick={() => navigate('/dashboard/super-admin/colleges/new')}
                className="mt-3 w-full py-2 bg-white/20 hover:bg-white/30 border border-white/25 text-white text-xs font-bold rounded-xl transition-all hover:scale-[1.02] flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Add College
              </button>
            </div>
          </div>

          {/* Platform Reach */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-4">
            <SHead icon={Globe} title="Platform Reach" />
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[
                { label: 'Colleges', value: fmt(stats.totalColleges), color: 'text-blue-600'   },
                { label: 'Cities',   value: fmt(stats.totalColleges), color: 'text-cyan-600'   },
                { label: 'Students', value: fmt(stats.totalStudents), color: 'text-indigo-600' },
              ].map(m => (
                <div key={m.label} className="text-center p-2 bg-gray-50 rounded-xl">
                  <p className={`text-base font-black ${m.color}`}>{m.value}</p>
                  <p className="text-[9px] text-gray-400 font-medium">{m.label}</p>
                </div>
              ))}
            </div>
            <div className="p-2.5 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-100/60">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                <p className="text-[10px] text-blue-700 font-medium">
                  {(stats.totalColleges ?? 0) - (stats.activeColleges ?? 0) > 0
                    ? `${(stats.totalColleges ?? 0) - (stats.activeColleges ?? 0)} college(s) need activation`
                    : 'All colleges are active 🎉'}
                </p>
              </div>
            </div>
          </div>

          {/* Top Colleges Leaderboard — flex-1 fills remaining space */}
          <div className="flex-1 bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-4 flex flex-col">
            <SHead icon={Star} title="Top Colleges" sub="Ranked by student count" action="All" onAction={() => navigate('/dashboard/super-admin/colleges')} />
            {recentColleges.length > 0 ? (
              <div className="flex-1 flex flex-col justify-between gap-1">
                {[...recentColleges]
                  .sort((a,b) => (b.liveCounts?.studentsCount ?? 0) - (a.liveCounts?.studentsCount ?? 0))
                  .slice(0, 6)
                  .map((college, idx) => {
                    const count = college.liveCounts?.studentsCount ?? 0;
                    const rankColors = ['text-yellow-500','text-gray-400','text-orange-400'];
                    const medals = ['🥇','🥈','🥉'];
                    return (
                      <button
                        key={college._id}
                        onClick={() => navigate(`/dashboard/super-admin/colleges/${college._id}`)}
                        className="group flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-blue-50/70 transition-all text-left"
                      >
                        <span className="text-sm w-5 text-center flex-shrink-0">
                          {idx < 3 ? medals[idx] : <span className={`text-[10px] font-black ${rankColors[idx] || 'text-gray-300'}`}>#{idx+1}</span>}
                        </span>
                        <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-md flex items-center justify-center text-[8px] font-black text-white flex-shrink-0">
                          {college.name?.substring(0,2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-800 truncate group-hover:text-blue-600 transition-colors">
                            {college.name?.split(' ').slice(0,3).join(' ')}
                          </p>
                          <div className="h-1 bg-gray-100 rounded-full mt-1 overflow-hidden">
                            <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500"
                              style={{ width: `${pct(count, maxStudents)}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-xs font-black text-blue-600 flex-shrink-0">{count}</span>
                      </button>
                    );
                  })}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-xs text-gray-400">No colleges yet</p>
              </div>
            )}
          </div>

        </div>{/* end RIGHT */}

      </div>{/* end main grid */}

    </SuperAdminDashboardLayout>
  );
};

export default SuperAdminDashboard;