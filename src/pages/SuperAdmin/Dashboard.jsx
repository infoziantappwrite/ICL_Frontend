// src/pages/SuperAdmin/Dashboard.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Building2, Users, Briefcase, BookOpen, GraduationCap,
  UserCheck, Crown, Eye, SquarePen, Plus,
  CreditCard, BarChart3, TrendingUp, Clock, CheckCircle2,
  ChevronRight, Settings, Bell, Zap, AlertCircle,
  Star, Target, Globe, Shield,
} from 'lucide-react';
import SuperAdminDashboardLayout from '../../components/layout/SuperAdminDashboardLayout';
import { DashboardSkeleton } from '../../components/common/SkeletonLoader';
import apiCall, { superAdminCourseAPI } from '../../api/Api';

/* ─── helpers ─────────────────────────────── */
const fmt = (n) => {
  if (n === undefined || n === null) return '0';
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
};
const pct = (a, b) => (b > 0 ? Math.min(100, Math.round((a / b) * 100)) : 0);

/* ─── Pill stat ──────────────────────────── */
const Pill = ({ icon: Icon, label, value, color, onClick }) => {
  const themes = {
    navy: 'bg-[#003399]/5  text-[#003399] border-[#003399]/10 val-text-[#003399]',
    teal: 'bg-[#00A9CE]/5  text-[#00A9CE] border-[#00A9CE]/10 val-text-[#00A9CE]',
    green: 'bg-emerald-50    text-emerald-600 border-emerald-100 val-text-emerald-700',
    yellow: 'bg-amber-50      text-amber-600   border-amber-100   val-text-amber-700',
    red: 'bg-rose-50       text-rose-600    border-rose-100    val-text-rose-700',
    indigo: 'bg-indigo-50     text-indigo-600  border-indigo-100  val-text-indigo-700',
    cyan: 'bg-cyan-50       text-cyan-600    border-cyan-100    val-text-cyan-700',
  };
  const theme = themes[color] || themes.navy;
  const valColor = theme.split('val-text-')[1] || '#003399';

  return (
    <button onClick={onClick}
      className={`group bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 text-left w-full flex items-center gap-4`}
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${theme.split(' val-text-')[0]} transition-transform group-hover:scale-110`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className={`text-[28px] font-black leading-none mb-1`} style={{ color: valColor }}>{fmt(value)}</p>
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">{label}</p>
      </div>
    </button>
  );
};

/* ─── Section heading ────────────────────── */
const SHead = ({ icon: Icon, title, sub, action, onAction, color = '#00A9CE' }) => (
  <div className="flex items-center justify-between mb-3">
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 border"
        style={{ backgroundColor: `${color}15`, borderColor: `${color}30`, color }}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div>
        <h3 className="text-sm font-bold text-gray-800 leading-none">{title}</h3>
        {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
    {action && (
      <button onClick={onAction}
        className="text-[10px] font-black text-[#003399] flex items-center gap-0.5 px-2 py-1 rounded-lg hover:bg-slate-50 transition-colors"
      >
        {action} <ChevronRight className="w-3 h-3" />
      </button>
    )}
  </div>
);

/* ─── Mini bar chart ─────────────────────── */
const MiniBar = ({ label, value, max, color = '#00A9CE', onClick }) => {
  const w = pct(value, max);
  return (
    <button onClick={onClick} className="group w-full text-left hover:bg-gray-50 px-2 py-1.5 rounded-xl transition-colors">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-600 font-medium truncate max-w-[130px] group-hover:text-[#003399]">{label}</span>
        <span className="text-xs font-black text-gray-800 ml-2">{fmt(value)}</span>
      </div>
      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${w}%`, backgroundColor: color }} />
      </div>
    </button>
  );
};

/* ─── Metric row ─────────────────────────── */
const MetricRow = ({ label, value, color = '#003399' }) => (
  <div className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
    <span className="text-xs text-gray-500 font-medium">{label}</span>
    <span className="text-xs font-black" style={{ color }}>{value}</span>
  </div>
);

/* ─── Activity item ──────────────────────── */
const ActivityItem = ({ icon: Icon, title, sub, time, color = '#003399' }) => (
  <div className="flex items-start gap-2.5 py-2 border-b border-gray-50 last:border-0">
    <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 bg-gray-50 text-[#003399] border border-gray-200">
      <Icon className="w-3 h-3" style={{ color }} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-semibold text-gray-800 leading-none">{title}</p>
      <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>
    </div>
    <span className="text-[9px] text-gray-300 flex-shrink-0 mt-0.5 font-mono">{time}</span>
  </div>
);

/* ─── Feature tile ───────────────────────── */
const FeatureTile = ({ icon: Icon, title, desc, onClick, color = '#003399' }) => (
  <button onClick={onClick}
    className="group relative overflow-hidden rounded-xl p-3 text-left transition-all duration-200 hover:scale-[1.04] hover:shadow-lg w-full bg-white border border-gray-100 hover:border-[#003399]/20"
  >
    <Icon className="w-4 h-4 mb-2 group-hover:scale-110 transition-transform" style={{ color }} />
    <p className="text-xs font-bold text-gray-800 leading-none">{title}</p>
    <p className="text-[9px] text-gray-400 mt-0.5">{desc}</p>
  </button>
);

/* ─── Insight tile ───────────────────────── */
const InsightTile = ({ label, value, sub, color = '#003399' }) => (
  <div className="bg-gray-50/50 rounded-xl p-3 border border-gray-100 hover:bg-white hover:shadow-sm transition-all group">
    <p className="text-xl font-black leading-none" style={{ color }}>{value}</p>
    <p className="text-xs font-semibold text-gray-700 mt-1">{label}</p>
    {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
  </div>
);

/* ══════════════════════════════════════════ */
/*              MAIN COMPONENT               */
/* ══════════════════════════════════════════ */
const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({});
  const [recentColleges, setRecentColleges] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(new Date());

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
        if (coursesRes?.success) {
          const courseList = coursesRes.data || [];
          dashStats.totalCourses = courseList.length;
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

  useEffect(() => {
    const timer = setInterval(() => {
      setLastUpdated(new Date());
    }, 1000); // updates every second

    return () => clearInterval(timer);
  }, []);

  if (loading && !Object.keys(stats).length) {
    return <DashboardSkeleton layout={SuperAdminDashboardLayout} />;
  }

  const activeRate = pct(stats.activeColleges ?? 0, stats.totalColleges ?? 0);
  const firstName = user?.fullName?.split(' ')[0] || user?.name?.split(' ')[0] || 'Admin';
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
      color: '#003399',
      title: `${c.name?.split(' ').slice(0, 3).join(' ')} registered`,
      sub: `Code: ${c.code} · ${c.liveCounts?.studentsCount ?? 0} students`,
      time: `${i + 1}d ago`,
    })),
    { icon: Users, color: '#00A9CE', title: 'Admin accounts updated', sub: `${stats.totalAdmins ?? 0} admins across all colleges`, time: 'recent' },
    { icon: GraduationCap, color: '#10b981', title: 'Student registrations updated', sub: `${fmt(stats.totalStudents)} total students on platform`, time: 'today' },
  ];

  return (
    <SuperAdminDashboardLayout>
      <div className="px-6 py-4 md:px-8 md:py-6 space-y-5 font-sans">

        {/* ══ HEADER ══ */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              <span className="w-2 h-8 bg-gradient-to-b from-[#003399] to-[#00A9CE] rounded-full" />
              SuperAdmin Dashboard
            </h1>
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-2 font-medium">
              <span>Welcome back, {firstName}. Platform overview looks solid.</span>
              <span className="text-[#00A9CE] font-mono text-[10px] hidden sm:inline-flex items-center font-bold">
                <Clock className="w-3 h-3 mr-1" />
                {lastUpdated.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                })}
              </span>
            </p>
          </div>
        </div>

        {/* ══ KPI PILLS ══ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <Pill icon={Building2} label="Colleges" value={stats.totalColleges} color="navy" onClick={() => navigate('/dashboard/super-admin/colleges')} />
          <Pill icon={Users} label="Admins" value={stats.totalAdmins} color="teal" onClick={() => navigate('/dashboard/super-admin/admins')} />
          <Pill icon={GraduationCap} label="Students" value={stats.totalStudents} color="green" onClick={() => navigate('/dashboard/super-admin/students')} />
          <Pill icon={Briefcase} label="Companies" value={stats.totalCompanies} color="indigo" onClick={() => navigate('/dashboard/super-admin/companies')} />
          <Pill icon={BookOpen} label="Courses" value={stats.totalCourses} color="yellow" onClick={() => navigate('/dashboard/super-admin/courses')} />
          <Pill icon={UserCheck} label="Enrollments" value={stats.totalEnrollments} color="cyan" onClick={() => navigate('/dashboard/super-admin/courses')} />
          <Pill icon={BarChart3} label="Active Jobs" value={stats.activeJobs} color="green" onClick={() => navigate('/dashboard/super-admin/analytics')} />
          <Pill icon={CreditCard} label="Revenue" value={stats.activeSubscriptions ?? stats.totalColleges ?? 0} color="red" onClick={() => navigate('/dashboard/super-admin/subscriptions')} />
        </div>

        {/* ══ MAIN GRID ══ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

          {/* ── LEFT COLUMN (Main Content) ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Recent Colleges Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                <SHead icon={Building2} title="Recent Registrations" sub="Latest institutional additions" color="#003399" />
                <button onClick={() => navigate('/dashboard/super-admin/colleges')} className="text-[11px] font-black text-[#003399] hover:underline uppercase tracking-tight">Full List</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50/50">
                      {['College', 'Code', 'Students', 'Status'].map(h => (
                        <th key={h} className="px-5 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {recentColleges.slice(0, 5).map(college => (
                      <tr key={college._id} className="hover:bg-gray-50/30 transition-colors">
                        <td className="px-5 py-3 text-sm font-semibold text-gray-800">{college.name}</td>
                        <td className="px-5 py-3 text-xs text-gray-500 font-mono italic">{college.code}</td>
                        <td className="px-5 py-3 text-xs text-[#003399] font-black">{college.liveCounts?.studentsCount ?? 0}</td>
                        <td className="px-5 py-3">
                          <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md border ${college.isActive ? 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20' : 'bg-rose-50 text-rose-500 border-rose-100'}`}>
                            {college.isActive ? 'Active' : 'Offline'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Student Distribution */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <SHead icon={BarChart3} title="Student Census" sub="Distribution across major campuses" color="#10b981" />
              <div className="space-y-4 mt-4">
                {recentColleges.slice(0, 5).map((college, idx) => (
                  <MiniBar
                    key={college._id}
                    label={college.name}
                    value={college.liveCounts?.studentsCount ?? 0}
                    max={maxStudents}
                    color={idx % 2 === 0 ? '#10b981' : '#00A9CE'}
                    onClick={() => navigate(`/dashboard/super-admin/colleges/${college._id}/students`)}
                  />
                ))}
              </div>
            </div>

            {/* Platform Insights */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <SHead icon={TrendingUp} title="Performance Metrics" sub="Growth and engagement insights" color="#f59e0b" />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                <InsightTile label="Avg. Students" value={fmt(avgStudents)} sub="Institution" color="#003399" />
                <InsightTile label="Avg. Companies" value={fmt(avgCompanies)} sub="Placement" color="#00A9CE" />
                <InsightTile label="Enrollment" value={`${pct(stats.totalEnrollments ?? 0, Math.max(stats.totalStudents ?? 1, 1))}%`} sub="Students" color="#10b981" />
                <InsightTile label="Opportunities" value={fmt(stats.activeJobs)} sub="Live Jobs" color="#f59e0b" />
              </div>
            </div>

            {/* Activity & Quick Access */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <SHead icon={Zap} title="Activity Timeline" sub="Recent operational events" color="#ef4444" />
              <div className="mt-4 space-y-1">
                {activityFeed.slice(0, 4).map((item, i) => <ActivityItem key={i} {...item} />)}
              </div>
            </div>

          </div>

          {/* ── RIGHT COLUMN (Sidebar) ── */}
          <div className="space-y-6">

            {/* Platform Snapshot */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <SHead icon={BarChart3} title="Quick Snapshot" color="#003399" />
              <div className="flex items-center gap-4 py-4">
                <div className="relative w-16 h-16 flex-shrink-0">
                  <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f1f5f9" strokeWidth="3.5" />
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#003399" strokeWidth="3.5"
                      strokeDasharray={`${activeRate} ${100 - activeRate}`} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-[13px] font-black text-[#003399] tracking-tighter">{activeRate}%</div>
                </div>
                <div>
                  <p className="text-[11px] font-black text-gray-800 uppercase tracking-widest">ACTIVATION</p>
                  <p className="text-[10px] text-gray-400 mt-1 font-bold">{stats.activeColleges ?? 0} / {stats.totalColleges ?? 0} Live</p>
                </div>
              </div>
              <div className="space-y-1 mt-2">
                <MetricRow label="Total Students" value={fmt(stats.totalStudents)} color="#10b981" />
                <MetricRow label="Enrollments" value={fmt(stats.totalEnrollments)} color="#00A9CE" />
                <MetricRow label="Active Jobs" value={fmt(stats.activeJobs)} color="#f59e0b" />
              </div>
            </div>

            {/* System Status */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <SHead icon={Shield} title="Platform Health" sub="Real-time status check" color="#10b981" />
              <div className="space-y-3 mt-4">
                {['Server Cluster', 'Database v2', 'CDN Assets'].map((s, idx) => (
                  <div key={s} className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 font-medium">{s}</span>
                    <span className="flex items-center gap-1.5 text-[9px] font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                      <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" /> Running
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Platform Goals */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 relative overflow-hidden shadow-sm">
              <div className="absolute top-0 right-0 p-4 opacity-5"><Target className="w-20 h-20 text-indigo-900" /></div>
              <p className="text-[11px] font-black text-indigo-600 mb-4 flex items-center gap-2 uppercase tracking-widest"><Target className="w-4 h-4" /> Roadmap Progress</p>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-[10px] font-black text-gray-400 mb-1"><span>COLLEGES</span><span>{stats.totalColleges ?? 0}/100</span></div>
                  <div className="h-1 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-indigo-500" style={{ width: `${Math.min(100, (stats.totalColleges / 100) * 100)}%` }} /></div>
                </div>
                <div>
                  <div className="flex justify-between text-[10px] font-black text-gray-400 mb-1"><span>STUDENTS</span><span>{fmt(stats.totalStudents)}/10k</span></div>
                  <div className="h-1 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500" style={{ width: `${Math.min(100, (stats.totalStudents / 10000) * 100)}%` }} /></div>
                </div>
                <div>
                  <div className="flex justify-between text-[10px] font-black text-gray-400 mb-1"><span>COURSES</span><span>{fmt(stats.totalCourses)}/500</span></div>
                  <div className="h-1 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-amber-500" style={{ width: `${Math.min(100, (stats.totalCourses / 500) * 100)}%` }} /></div>
                </div>
              </div>
            </div>

            {/* Top Colleges Leaderboard */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <SHead icon={Star} title="Campus Leaders" sub="Institutional ranking" color="#f59e0b" />
              <div className="mt-4 space-y-3">
                {[...recentColleges].sort((a, b) => (b.liveCounts?.studentsCount ?? 0) - (a.liveCounts?.studentsCount ?? 0)).slice(0, 5).map((c, i) => {
                  const colors = ['#f59e0b', '#64748b', '#92400e', '#003399', '#00A9CE'];
                  return (
                    <div key={c._id} className="flex items-center gap-3">
                      <span className="text-xs font-black text-gray-300 w-4">#{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-800 truncate">{c.name}</p>
                        <p className="text-[10px] text-gray-400 font-medium">{fmt(c.liveCounts?.studentsCount)} Registered</p>
                      </div>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black border border-gray-100 flex-shrink-0"
                        style={{ backgroundColor: `${colors[i]}10`, color: colors[i] }}>
                        {c.name?.substring(0, 1)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

        </div>
      </div>
    </SuperAdminDashboardLayout>
  );
};

export default SuperAdminDashboard;