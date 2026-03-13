// src/pages/CollegeAdmin/Dashboard.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Building2, Users, Briefcase, BookOpen, GraduationCap,
  UserCheck, RefreshCw, Eye, SquarePen, Plus,
  BarChart3, TrendingUp, Clock, CheckCircle2,
  ChevronRight, Settings, Bell, Zap, AlertCircle,
  Star, Target, Shield, ClipboardList,
  MapPin, Award,
} from 'lucide-react';
import CollegeAdminLayout from '../../components/layout/CollegeAdminLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { collegeAdminAPI, collegeAdminCourseAPI, assessmentAPI } from '../../api/Api';

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
    green:  'bg-green-50 border-green-100 text-green-600',
    amber:  'bg-amber-50 border-amber-100 text-amber-600',
  }[color] || 'bg-blue-50 border-blue-100 text-blue-600';
  return (
    <button onClick={onClick}
      className={`group flex items-center gap-2 px-3 py-2 rounded-xl border ${c} hover:shadow-md hover:scale-[1.03] transition-all duration-150 text-left w-full`}
    >
      <Icon className="w-4 h-4 flex-shrink-0 opacity-70" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-black leading-none">{typeof value === 'string' ? value : fmt(value)}</p>
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

/* ─── Mini bar ───────────────────────────── */
const MiniBar = ({ label, value, max, color, onClick }) => {
  const w = pct(value, max);
  return (
    <button onClick={onClick} className="group w-full text-left hover:bg-blue-50/40 px-2 py-1.5 rounded-lg transition-colors">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-600 font-medium truncate max-w-[160px]">{label}</span>
        <span className="text-xs font-black text-gray-800 ml-2">{fmt(value)}</span>
      </div>
      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.max(w, value > 0 ? 4 : 0)}%`, background: color }} />
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

/* ══════════════════════════════════════════ */
const CollegeAdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading,         setLoading]         = useState(true);
  const [refreshing,      setRefreshing]       = useState(false);
  const [stats,           setStats]           = useState({});
  const [college,         setCollege]         = useState(null);
  const [recentJDs,       setRecentJDs]       = useState([]);
  const [recentCompanies, setRecentCompanies] = useState([]);
  const [courseCount,     setCourseCount]     = useState(0);
  const [assessmentCount, setAssessmentCount] = useState(0);
  const [jobsByCompany,   setJobsByCompany]   = useState({}); // { companyId: count }
  const [lastUpdated,     setLastUpdated]     = useState(new Date());

  const fetchData = useCallback(async () => {
    try {
      setRefreshing(true);
      const [dashRes, collegeRes, companiesRes, coursesRes, assessRes, jobsRes] =
        await Promise.allSettled([
          collegeAdminAPI.getDashboard(),
          collegeAdminAPI.getMyCollegeProfile(),
          collegeAdminAPI.getCompanies({ limit: 50 }),
          collegeAdminCourseAPI.getAllCourses({ limit: 1 }),
          assessmentAPI.getAllAssessments({ limit: 1 }),
          collegeAdminAPI.getJobs({ limit: 500 }),
        ]);

      if (dashRes.status === 'fulfilled' && dashRes.value?.success) {
        setStats(dashRes.value.stats || {});
        setRecentJDs(dashRes.value.recentJDs || []);
      }
      if (collegeRes.status === 'fulfilled' && collegeRes.value?.success) {
        setCollege(collegeRes.value.college);
      }
      if (companiesRes.status === 'fulfilled' && companiesRes.value?.success) {
        const sorted = (companiesRes.value.companies || [])
          .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
          .slice(0, 8);
        setRecentCompanies(sorted);
      }
      // Live course count
      if (coursesRes.status === 'fulfilled' && coursesRes.value?.success) {
        const r = coursesRes.value;
        setCourseCount(r.count ?? r.total ?? (r.courses?.length ?? 0));
      }
      // Live assessment count
      if (assessRes.status === 'fulfilled' && assessRes.value?.success) {
        const r = assessRes.value;
        setAssessmentCount(r.count ?? r.total ?? (r.assessments?.length ?? 0));
      }
      // Build job-count-per-company map for leaderboard
      if (jobsRes.status === 'fulfilled' && jobsRes.value?.success) {
        const jobs = jobsRes.value.jobs || [];
        const map = {};
        jobs.forEach(j => {
          const cid = typeof j.companyId === 'object' ? j.companyId?._id : j.companyId;
          if (cid) map[cid] = (map[cid] || 0) + 1;
        });
        setJobsByCompany(map);
      }
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
    return <LoadingSpinner message="Loading Dashboard…" submessage="Fetching placement data" icon={GraduationCap} />;
  }

  const placementRate = stats.placementPercentage ?? pct(stats.placedStudents ?? 0, stats.totalStudents ?? 0);
  const firstName     = user?.fullName?.split(' ')[0] || user?.name?.split(' ')[0] || 'Admin';
  const collegeName   = college?.name || user?.college?.name || 'Your College';
  const collegeCode   = college?.code || '';

  // Companies sorted by live JD count
  const companiesRanked = [...recentCompanies]
    .map(c => ({ ...c, liveJobCount: jobsByCompany[c._id] ?? 0 }))
    .sort((a, b) => b.liveJobCount - a.liveJobCount);
  const maxJobs = Math.max(...companiesRanked.map(c => c.liveJobCount), 1);

  // JD status counts from recentJDs (best effort from dashboard data)
  const jdStatusCounts = recentJDs.reduce((acc, jd) => {
    const s = jd.status || 'Draft';
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  const activityFeed = [
    ...recentJDs.slice(0, 3).map((jd, i) => ({
      icon: Briefcase,
      color: 'bg-blue-100 text-blue-600',
      title: `${jd.jobTitle || jd.title || 'New JD'} posted`,
      sub: `${jd.companyId?.name || jd.company || 'Company'} · ${jd.status || 'Draft'}`,
      time: `${i + 1}d ago`,
    })),
    {
      icon: Users,
      color: 'bg-cyan-100 text-cyan-600',
      title: 'Student roster updated',
      sub: `${fmt(stats.totalStudents)} students enrolled · ${fmt(stats.placedStudents)} placed`,
      time: 'recent',
    },
    {
      icon: Building2,
      color: 'bg-indigo-100 text-indigo-600',
      title: 'Company registrations',
      sub: `${fmt(stats.totalCompanies)} companies · ${fmt(stats.activeJDs)} active JDs`,
      time: 'today',
    },
  ];

  return (
    <CollegeAdminLayout>

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
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-blue-200 text-[11px] font-semibold">{greet()}, {firstName}</p>
              <h1 className="text-white font-black text-lg leading-tight">
                {collegeName}
                {collegeCode && <span className="ml-2 text-sm font-semibold text-blue-200">({collegeCode})</span>}
              </h1>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                <span className="inline-flex items-center gap-1 bg-white/15 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white border border-white/20">
                  <CheckCircle2 className="w-3 h-3" /> {fmt(stats.totalStudents)} Students
                </span>
                <span className="inline-flex items-center gap-1 bg-white/15 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white border border-white/20">
                  <TrendingUp className="w-3 h-3" /> {placementRate}% Placed
                </span>
                <span className="inline-flex items-center gap-1 bg-white/15 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white border border-white/20">
                  <Building2 className="w-3 h-3" /> {fmt(stats.totalCompanies)} Companies
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

      {/* ══ STATS PILLS — all live data ══ */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-3 mb-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          <Pill icon={Users}        label="Students"     value={stats.totalStudents}   color="blue"   onClick={() => navigate('/dashboard/college-admin/students')} />
          <Pill icon={UserCheck}    label="Placed"       value={stats.placedStudents}  color="green"  onClick={() => navigate('/dashboard/college-admin/students')} />
          <Pill icon={Building2}    label="Companies"    value={stats.totalCompanies}  color="cyan"   onClick={() => navigate('/dashboard/college-admin/companies')} />
          <Pill icon={Briefcase}    label="Total JDs"    value={stats.totalJDs}        color="indigo" onClick={() => navigate('/dashboard/college-admin/jobs')} />
          <Pill icon={Award}        label="Active JDs"   value={stats.activeJDs}       color="violet" onClick={() => navigate('/dashboard/college-admin/jobs')} />
          <Pill icon={TrendingUp}   label="Placed %"     value={`${placementRate}%`}   color="amber"  onClick={() => navigate('/dashboard/college-admin/analytics')} />
          <Pill icon={BookOpen}     label="Courses"      value={courseCount}           color="blue"   onClick={() => navigate('/dashboard/college-admin/courses')} />
          <Pill icon={ClipboardList} label="Assessments" value={assessmentCount}       color="cyan"   onClick={() => navigate('/dashboard/college-admin/assessments')} />
        </div>
      </div>

      {/* ══ MAIN GRID ══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* ── LEFT (2 cols) ── */}
        <div className="lg:col-span-2 flex flex-col gap-4">

          {/* 1. Recent Companies */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center">
                    <Building2 className="w-3 h-3 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-800 leading-none">Recent Companies</h3>
                    <p className="text-[10px] text-gray-400 mt-0.5">Latest {recentCompanies.length} registrations</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => navigate('/dashboard/college-admin/companies/create')}
                    className="inline-flex items-center gap-1 text-[10px] font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-500 px-2.5 py-1.5 rounded-lg shadow-sm hover:scale-105 transition-all">
                    <Plus className="w-3 h-3" /> Add Company
                  </button>
                  <button onClick={() => navigate('/dashboard/college-admin/companies')}
                    className="text-[10px] font-semibold text-blue-600 flex items-center gap-0.5 px-2 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">
                    View All <Eye className="w-3 h-3 ml-0.5" />
                  </button>
                </div>
              </div>
            </div>
            {recentCompanies.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-50 bg-gray-50/40">
                      {['Company', 'Industry', 'Location', 'Status', 'Actions'].map(h => (
                        <th key={h} className="px-3 py-2 text-left text-[9px] font-black text-gray-400 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {recentCompanies.map(company => (
                      <tr key={company._id} className="hover:bg-blue-50/20 transition-colors group">
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-md flex items-center justify-center text-[8px] font-black text-white flex-shrink-0">
                              {company.name?.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-gray-900 truncate max-w-[120px] hover:text-blue-600 transition-colors cursor-pointer"
                                onClick={() => navigate(`/dashboard/college-admin/companies/${company._id}`)}>
                                {company.name}
                              </p>
                              {company.email && <p className="text-[9px] text-gray-400 truncate max-w-[120px]">{company.email}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md">{company.industry || 'N/A'}</span>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <MapPin className="w-3 h-3 text-gray-400" />
                            {company.headquarters?.city || company.location || '—'}
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold rounded-full border ${company.isActive ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>
                            <span className={`w-1 h-1 rounded-full ${company.isActive ? 'bg-blue-500' : 'bg-gray-400'}`} />
                            {company.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => navigate(`/dashboard/college-admin/companies/${company._id}`)}
                              className="p-1 text-blue-500 hover:bg-blue-100 rounded-md transition-colors"><Eye className="w-3 h-3" /></button>
                            <button onClick={() => navigate(`/dashboard/college-admin/companies/edit/${company._id}`)}
                              className="p-1 text-emerald-500 hover:bg-emerald-50 rounded-md transition-colors"><SquarePen className="w-3 h-3" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10">
                <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center mb-2"><Building2 className="w-5 h-5 text-blue-300" /></div>
                <p className="text-sm font-semibold text-gray-600 mb-3">No companies yet</p>
                <button onClick={() => navigate('/dashboard/college-admin/companies/create')}
                  className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-sm hover:scale-105 transition-all">
                  <Plus className="w-3 h-3" /> Add Company
                </button>
              </div>
            )}
          </div>

          {/* 2. Recent JDs — by student count, no "applications" wording */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-4">
            <SHead icon={BarChart3} title="Recent Job Descriptions"
              sub="Students matched per JD — click to open"
              action="All Jobs" onAction={() => navigate('/dashboard/college-admin/jobs')}
            />
            {recentJDs.length > 0 ? (
              <div className="space-y-0.5">
                {recentJDs.slice(0, 6).map((jd) => (
                  <MiniBar
                    key={jd._id}
                    label={`${jd.jobTitle || jd.title || 'Untitled'} — ${jd.companyId?.name || jd.company || ''}`}
                    value={jd.stats?.totalApplications ?? jd.matchedCount ?? 0}
                    max={Math.max(...recentJDs.map(j => j.stats?.totalApplications ?? j.matchedCount ?? 0), 1)}
                    color="linear-gradient(90deg,#2563eb,#06b6d4)"
                    onClick={() => navigate(`/dashboard/college-admin/jobs/view/${jd._id}`)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center mb-2"><Briefcase className="w-5 h-5 text-blue-300" /></div>
                <p className="text-sm font-semibold text-gray-500 mb-3">No job descriptions yet</p>
                <button onClick={() => navigate('/dashboard/college-admin/jobs/create')}
                  className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-sm hover:scale-105 transition-all">
                  <Plus className="w-3 h-3" /> Create First JD
                </button>
              </div>
            )}
          </div>

          {/* 3. Campus Recruitment Summary — replaces old Placement Insights (no duplication) */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-4">
            <SHead icon={Award} title="Campus Recruitment Summary" sub="Live counts across all recruitment activity" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'JDs Posted',    value: fmt(stats.totalJDs),     sub: `${fmt(stats.activeJDs)} active`,       color: 'text-blue-600',   bg: 'bg-blue-50 border-blue-100'   },
                { label: 'Job Drives',    value: fmt(stats.activeJDs),    sub: 'Currently running',                    color: 'text-cyan-600',   bg: 'bg-cyan-50 border-cyan-100'   },
                { label: 'Courses',       value: fmt(courseCount),         sub: 'Available to students',                color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-100' },
                { label: 'Assessments',   value: fmt(assessmentCount),     sub: 'Tests & quizzes',                      color: 'text-violet-600', bg: 'bg-violet-50 border-violet-100' },
              ].map(({ label, value, sub, color, bg }) => (
                <div key={label} className={`${bg} rounded-xl p-3 border`}>
                  <p className={`text-xl font-black ${color} leading-none`}>{value}</p>
                  <p className="text-xs font-semibold text-gray-700 mt-1">{label}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Placement Funnel */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-4">
            <SHead icon={Target} title="Placement Funnel" sub="Student journey from enrolled to placed" />
            {(() => {
              const total    = stats.totalStudents ?? 0;
              const selected = stats.selectedStudents ?? stats.placedStudents ?? 0;
              const placed   = stats.placedStudents ?? 0;
              const steps = [
                { label: 'Enrolled',  value: total,    color: 'from-blue-600 to-blue-500',   w: 100 },
                { label: 'Eligible',  value: Math.round(total * 0.85), color: 'from-cyan-500 to-blue-500',   w: 85  },
                { label: 'Selected',  value: selected, color: 'from-indigo-500 to-cyan-500', w: total > 0 ? pct(selected, total) : 0 },
                { label: 'Placed',    value: placed,   color: 'from-blue-700 to-indigo-600', w: total > 0 ? pct(placed, total) : 0 },
              ];
              return (
                <div className="space-y-2.5">
                  {steps.map((s) => (
                    <div key={s.label} className="flex items-center gap-3">
                      <div className="w-16 text-right text-[10px] font-bold text-gray-500 flex-shrink-0">{s.label}</div>
                      <div className="flex-1 h-6 bg-gray-100 rounded-lg overflow-hidden relative">
                        <div className={`h-full bg-gradient-to-r ${s.color} rounded-lg transition-all duration-700 flex items-center justify-end pr-2`}
                          style={{ width: `${Math.max(s.w, s.value > 0 ? 8 : 0)}%` }}>
                          {s.value > 0 && <span className="text-[9px] font-black text-white">{fmt(s.value)}</span>}
                        </div>
                        {s.value === 0 && <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] text-gray-400 font-medium">0</span>}
                      </div>
                      <div className="w-8 text-[10px] font-bold text-gray-400 flex-shrink-0">{s.w}%</div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

          {/* 5. Activity Feed */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-4">
            <SHead icon={Zap} title="Recent Activity" sub="Latest placement portal events" />
            {activityFeed.map((item, i) => <ActivityItem key={i} {...item} />)}
          </div>

          {/* 6. Quick Access — pinned last, 2 full rows */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-4">
            <SHead icon={Star} title="Quick Access" sub="Jump to key portal sections" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <FeatureTile icon={Plus}          title="Add Company"   desc="Register new"     gradient="bg-gradient-to-br from-blue-600 to-blue-700"   onClick={() => navigate('/dashboard/college-admin/companies/create')} />
              <FeatureTile icon={Briefcase}     title="Create JD"     desc="Post a job"       gradient="bg-gradient-to-br from-cyan-500 to-blue-600"   onClick={() => navigate('/dashboard/college-admin/jobs/create')} />
              <FeatureTile icon={GraduationCap} title="Students"      desc="All students"     gradient="bg-gradient-to-br from-cyan-600 to-blue-600"   onClick={() => navigate('/dashboard/college-admin/students')} />
              <FeatureTile icon={ClipboardList} title="Assessments"   desc="Tests & quizzes"  gradient="bg-gradient-to-br from-blue-700 to-indigo-700" onClick={() => navigate('/dashboard/college-admin/assessments')} />
              <FeatureTile icon={BookOpen}      title="Courses"       desc="Course catalog"   gradient="bg-gradient-to-br from-blue-500 to-cyan-500"   onClick={() => navigate('/dashboard/college-admin/courses')} />
              <FeatureTile icon={BarChart3}     title="Analytics"     desc="View reports"     gradient="bg-gradient-to-br from-blue-600 to-indigo-600" onClick={() => navigate('/dashboard/college-admin/analytics')} />
              <FeatureTile icon={Bell}          title="Notifications" desc="Portal alerts"    gradient="bg-gradient-to-br from-indigo-500 to-blue-600" onClick={() => navigate('/dashboard/college-admin/notifications')} />
              <FeatureTile icon={Settings}      title="Settings"      desc="Portal config"    gradient="bg-gradient-to-br from-blue-700 to-blue-900"   onClick={() => navigate('/dashboard/college-admin/settings')} />
            </div>
          </div>

        </div>{/* end LEFT */}

        {/* ── RIGHT (1 col) ── */}
        <div className="flex flex-col gap-4">

          {/* 1. Placement Snapshot — donut + unique metrics (no overlap with Summary card) */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-4">
            <SHead icon={BarChart3} title="Placement Snapshot" />
            <div className="flex items-center gap-3 mb-3">
              <div className="relative w-16 h-16 flex-shrink-0">
                <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#dbeafe" strokeWidth="3.5" />
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="url(#cg)" strokeWidth="3.5"
                    strokeDasharray={`${placementRate} ${100 - placementRate}`} strokeLinecap="round" />
                  <defs>
                    <linearGradient id="cg" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#2563eb" /><stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-base font-black text-gray-900">{placementRate}%</span>
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-800">Placement Rate</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{fmt(stats.placedStudents)} of {fmt(stats.totalStudents)} placed</p>
                <p className="text-[10px] font-mono text-gray-300 mt-1">
                  {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
            <div>
              <MetricRow label="Total Students"    value={fmt(stats.totalStudents)}                               color="text-blue-600"   />
              <MetricRow label="Placed Students"   value={fmt(stats.placedStudents)}                              color="text-green-600"  />
              <MetricRow label="Selected Students" value={fmt(stats.selectedStudents ?? stats.placedStudents ?? 0)} color="text-indigo-600" />
              <MetricRow label="Total Companies"   value={fmt(stats.totalCompanies)}                              color="text-cyan-600"   />
              <MetricRow label="Courses Available" value={fmt(courseCount)}                                       color="text-violet-600" />
              <MetricRow label="Assessments"       value={fmt(assessmentCount)}                                   color="text-blue-700"   />
            </div>
          </div>

          {/* 2. Portal Status */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-4">
            <SHead icon={Shield} title="Portal Status" sub="All systems operational" />
            <div className="space-y-1">
              {['Placement Portal', 'Student Records', 'Company Sync', 'Job Matching', 'Assessment Engine'].map(s => (
                <div key={s} className="flex items-center justify-between py-1">
                  <span className="text-xs text-gray-600">{s}</span>
                  <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-600 border border-green-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Operational
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

          {/* 3. Placement Goals */}
          <div className="bg-gradient-to-br from-blue-600 via-blue-600 to-cyan-500 rounded-2xl p-4 text-white shadow-lg shadow-blue-500/20 relative overflow-hidden">
            <div className="absolute -top-6 -right-6 w-20 h-20 bg-white/10 rounded-full" />
            <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white/10 rounded-full" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-cyan-200" />
                <p className="text-xs font-bold text-white">Placement Goals</p>
              </div>
              <p className="text-[11px] text-blue-100 mb-3 leading-relaxed">
                Drive <span className="font-bold text-white">100% placement</span> and engage <span className="font-bold text-white">50+ companies</span>.
              </p>
              <div className="space-y-2">
                {[
                  { label: 'Students Placed', cur: stats.placedStudents ?? 0, max: stats.totalStudents ?? 1,  display: `${fmt(stats.placedStudents)}/${fmt(stats.totalStudents)}` },
                  { label: 'Companies',       cur: stats.totalCompanies ?? 0, max: 50,                        display: `${fmt(stats.totalCompanies)}/50` },
                  { label: 'Active JDs',      cur: stats.activeJDs ?? 0,      max: stats.totalJDs || 20,      display: `${fmt(stats.activeJDs)}/${fmt(stats.totalJDs || 20)}` },
                ].map(({ label, cur, max, display }) => (
                  <div key={label}>
                    <div className="flex justify-between text-[10px] text-blue-200 mb-0.5">
                      <span>{label}</span><span>{display}</span>
                    </div>
                    <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                      <div className="h-full bg-white/70 rounded-full" style={{ width: `${Math.min(100, max > 0 ? pct(cur, max) : 0)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => navigate('/dashboard/college-admin/companies/create')}
                className="mt-3 w-full py-2 bg-white/20 hover:bg-white/30 border border-white/25 text-white text-xs font-bold rounded-xl transition-all hover:scale-[1.02] flex items-center justify-center gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Add Company
              </button>
            </div>
          </div>

          {/* 5. Top Companies — ranked by live JD count */}
          <div className="flex-1 bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-4 flex flex-col">
            <SHead icon={Star} title="Top Companies" sub="Ranked by live JD count" action="All" onAction={() => navigate('/dashboard/college-admin/companies')} />
            {companiesRanked.length > 0 ? (
              <div className="flex-1 flex flex-col gap-1">
                {companiesRanked.slice(0, 6).map((company, idx) => {
                  const count  = company.liveJobCount;
                  const medals = ['🥇', '🥈', '🥉'];
                  return (
                    <button key={company._id}
                      onClick={() => navigate(`/dashboard/college-admin/companies/${company._id}`)}
                      className="group flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-blue-50/70 transition-all text-left">
                      <span className="text-sm w-5 text-center flex-shrink-0">
                        {idx < 3 ? medals[idx] : <span className="text-[10px] font-black text-gray-300">#{idx + 1}</span>}
                      </span>
                      <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-md flex items-center justify-center text-[8px] font-black text-white flex-shrink-0">
                        {company.name?.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800 truncate group-hover:text-blue-600 transition-colors">
                          {company.name?.split(' ').slice(0, 3).join(' ')}
                        </p>
                        <div className="h-1 bg-gray-100 rounded-full mt-1 overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500"
                            style={{ width: `${pct(count, maxJobs)}%` }} />
                        </div>
                      </div>
                      <span className="text-xs font-black text-blue-600 flex-shrink-0">{count} JD{count !== 1 ? 's' : ''}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-xs text-gray-400">No companies yet</p>
              </div>
            )}
          </div>

        </div>{/* end RIGHT */}

      </div>{/* end grid */}

    </CollegeAdminLayout>
  );
};

export default CollegeAdminDashboard;