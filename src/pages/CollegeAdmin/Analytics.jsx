// pages/CollegeAdmin/Analytics.jsx — redesigned to match SuperAdmin/CollegeAdmin theme
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, Users, Briefcase, FileText, Building2, Award,
  BarChart3, Target, GraduationCap, DollarSign, RefreshCw,
  ChevronRight, Star,
} from 'lucide-react';
import CollegeAdminLayout from '../../components/layout/CollegeAdminLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { collegeAdminAPI, jobAPI, applicationAPI } from '../../api/Api';

/* ─── helpers ─────────────────────────────── */
const fmt = (n) => {
  if (n === undefined || n === null) return '0';
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
};
const pct = (a, b) => (b > 0 ? Math.min(100, Math.round((a / b) * 100)) : 0);

/* ─── Stat Pill ─────────────────────────── */
const Pill = ({ icon: Icon, label, value, color }) => {
  const c = {
    blue:   'bg-blue-50 border-blue-100 text-blue-600',
    cyan:   'bg-cyan-50 border-cyan-100 text-cyan-600',
    indigo: 'bg-indigo-50 border-indigo-100 text-indigo-600',
    violet: 'bg-violet-50 border-violet-100 text-violet-600',
    green:  'bg-green-50 border-green-100 text-green-600',
    amber:  'bg-amber-50 border-amber-100 text-amber-600',
  }[color] || 'bg-blue-50 border-blue-100 text-blue-600';
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${c} w-full`}>
      <Icon className="w-4 h-4 flex-shrink-0 opacity-70" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-black leading-none">{typeof value === 'string' ? value : fmt(value)}</p>
        <p className="text-[9px] font-medium opacity-60 mt-0.5 leading-none truncate">{label}</p>
      </div>
    </div>
  );
};

/* ─── Section heading ─────────────────────── */
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
        className="text-[10px] font-bold text-blue-600 flex items-center gap-0.5 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors">
        {action} <ChevronRight className="w-3 h-3" />
      </button>
    )}
  </div>
);

/* ─── Mini bar ─────────────────────────────── */
const MiniBar = ({ label, value, max, sub, color }) => {
  const w = pct(value, max);
  return (
    <div className="px-2 py-1.5">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-700 font-medium truncate max-w-[160px]">{label}</span>
        <span className="text-xs font-black text-gray-800 ml-2">{sub || fmt(value)}</span>
      </div>
      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.max(w, value > 0 ? 4 : 0)}%`, background: color }} />
      </div>
    </div>
  );
};

/* ─── Insight tile ──────────────────────────── */
const InsightTile = ({ label, value, sub, color, bg }) => (
  <div className={`${bg} rounded-xl p-3 border`}>
    <p className={`text-xl font-black ${color} leading-none`}>{value}</p>
    <p className="text-xs font-semibold text-gray-700 mt-1">{label}</p>
    {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
  </div>
);

/* ─── Status badge ──────────────────────────── */
const StatusBadge = ({ count, label, dotColor, bg, textColor, borderColor }) => (
  <div className={`text-center p-3 ${bg} rounded-xl border ${borderColor}`}>
    <p className={`text-2xl font-black ${textColor} leading-none`}>{count}</p>
    <div className="flex items-center justify-center gap-1 mt-1">
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      <p className="text-[10px] font-semibold text-gray-600">{label}</p>
    </div>
  </div>
);

/* ══════════════════════════════════════════ */
const Analytics = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState('all');

  const [overviewStats, setOverviewStats] = useState({
    totalStudents: 0, totalCompanies: 0, totalJDs: 0, activeJDs: 0,
    totalApplications: 0, selectedStudents: 0, placedStudents: 0, placementPercentage: 0,
  });
  const [jobStats, setJobStats]             = useState({ active: 0, closed: 0, draft: 0, cancelled: 0 });
  const [applicationStats, setApplicationStats] = useState({ pending: 0, shortlisted: 0, selected: 0, rejected: 0 });
  const [branchStats, setBranchStats]       = useState([]);
  const [companyStats, setCompanyStats]     = useState([]);
  const [packageStats, setPackageStats]     = useState({ avgPackage: 0, maxPackage: 0, minPackage: 0 });

  const fetchAllData = async () => {
    try {
      setRefreshing(true);
      const [dashboardData, analyticsData, jobsData, applicationsData] = await Promise.all([
        collegeAdminAPI.getDashboard().catch(() => ({ success: false })),
        collegeAdminAPI.getAnalytics().catch(() => ({ success: false })),
        jobAPI.getAllJobs().catch(() => ({ success: false, jobs: [] })),
        applicationAPI.getAllApplications().catch(() => ({ success: false, applications: [] })),
      ]);

      if (dashboardData.success && dashboardData.stats) setOverviewStats(dashboardData.stats);

      if (jobsData.success && jobsData.jobs) {
        const jobs = jobsData.jobs;
        setJobStats({
          active:    jobs.filter(j => j.status === 'Active').length,
          closed:    jobs.filter(j => j.status === 'Closed').length,
          draft:     jobs.filter(j => j.status === 'Draft').length,
          cancelled: jobs.filter(j => j.status === 'Cancelled').length,
        });
      }

      if (applicationsData.success && applicationsData.applications) {
        const apps = applicationsData.applications;
        setApplicationStats({
          pending:     apps.filter(a => a.status === 'Pending' || a.status === 'Applied').length,
          shortlisted: apps.filter(a => a.status === 'Shortlisted').length,
          selected:    apps.filter(a => a.status === 'Selected').length,
          rejected:    apps.filter(a => a.status === 'Rejected').length,
        });
      }

      if (analyticsData.success) {
        if (analyticsData.branchStats)  setBranchStats(analyticsData.branchStats);
        if (analyticsData.companyStats) setCompanyStats(analyticsData.companyStats);
        if (analyticsData.packageStats) setPackageStats(analyticsData.packageStats);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchAllData(); }, [timeRange]);

  if (loading) {
    return <LoadingSpinner message="Loading Analytics..." submessage="Fetching live placement data" icon={BarChart3} />;
  }

  const placementRate = overviewStats.placementPercentage ?? pct(overviewStats.placedStudents ?? 0, overviewStats.totalStudents ?? 0);
  const maxCompany    = Math.max(...companyStats.map(c => c.studentsHired || 0), 1);
  const totalApps     = applicationStats.pending + applicationStats.shortlisted + applicationStats.selected + applicationStats.rejected;

  return (
    <CollegeAdminLayout>

      {/* ══ HERO BANNER ══ */}
      <div className="relative bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 rounded-2xl px-5 py-4 mb-4 shadow-xl shadow-blue-500/20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-10 -right-10 w-44 h-44 bg-white/10 rounded-full" />
          <div className="absolute -bottom-8 left-1/3 w-28 h-28 bg-white/10 rounded-full" />
          <div className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: 'radial-gradient(circle,white 1px,transparent 1px)', backgroundSize: '18px 18px' }} />
        </div>
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-blue-200 text-[11px] font-semibold">Placement & Recruitment</p>
              <h1 className="text-white font-black text-lg leading-tight">Analytics Dashboard</h1>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                <span className="inline-flex items-center gap-1 bg-white/15 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white border border-white/20">
                  <Users className="w-3 h-3" /> {fmt(overviewStats.totalStudents)} Students
                </span>
                <span className="inline-flex items-center gap-1 bg-white/15 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white border border-white/20">
                  <TrendingUp className="w-3 h-3" /> {placementRate}% Placed
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 bg-white/20 backdrop-blur-sm text-white text-xs border border-white/30 rounded-xl font-semibold focus:outline-none [&>option]:text-gray-900"
            >
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="year">Last Year</option>
              <option value="all">All Time</option>
            </select>
            <button onClick={fetchAllData} disabled={refreshing}
              className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-3 py-2 rounded-xl border border-white/20 transition-all hover:scale-105 disabled:opacity-50">
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* ══ STATS PILLS ══ */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-3 mb-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          <Pill icon={Users}      label="Students"     value={overviewStats.totalStudents}    color="blue"   />
          <Pill icon={Award}      label="Placed"       value={overviewStats.placedStudents}   color="green"  />
          <Pill icon={Building2}  label="Companies"    value={overviewStats.totalCompanies}   color="cyan"   />
          <Pill icon={Briefcase}  label="Total JDs"    value={overviewStats.totalJDs}         color="indigo" />
          <Pill icon={TrendingUp} label="Active JDs"   value={overviewStats.activeJDs}        color="violet" />
          <Pill icon={FileText}   label="Applications" value={overviewStats.totalApplications} color="blue"  />
          <Pill icon={Target}     label="Placed %"     value={`${placementRate}%`}            color="amber"  />
          <Pill icon={DollarSign} label="Avg Package"  value={packageStats.avgPackage > 0 ? `₹${packageStats.avgPackage.toFixed(1)}L` : '—'} color="cyan" />
        </div>
      </div>

      {/* ══ MAIN GRID ══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* ── LEFT (2 cols) ── */}
        <div className="lg:col-span-2 flex flex-col gap-4">

          {/* Placement Overview tiles */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-4">
            <SHead icon={Target} title="Placement Overview" sub="Key performance metrics" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <InsightTile label="Placement Rate"    value={`${placementRate}%`}
                sub="Overall success"    color="text-blue-600"   bg="bg-blue-50 border-blue-100"   />
              <InsightTile label="Students Placed"   value={fmt(overviewStats.placedStudents)}
                sub={`of ${fmt(overviewStats.totalStudents)} total`} color="text-green-600" bg="bg-green-50 border-green-100" />
              <InsightTile label="Avg Package"       value={packageStats.avgPackage > 0 ? `₹${packageStats.avgPackage.toFixed(1)}L` : '—'}
                sub={packageStats.maxPackage > 0 ? `Max ₹${packageStats.maxPackage.toFixed(1)}L` : 'No data'}
                color="text-cyan-600"   bg="bg-cyan-50 border-cyan-100"   />
              <InsightTile label="Selected Students" value={fmt(overviewStats.selectedStudents ?? 0)}
                sub="Offers received"    color="text-indigo-600" bg="bg-indigo-50 border-indigo-100" />
            </div>
          </div>

          {/* Job Statistics */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-4">
            <SHead icon={Briefcase} title="Job Statistics" sub="Status breakdown across all JDs" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <StatusBadge count={jobStats.active}    label="Active"    dotColor="bg-blue-500"  bg="bg-blue-50"  textColor="text-blue-700"  borderColor="border-blue-100"  />
              <StatusBadge count={jobStats.draft}     label="Draft"     dotColor="bg-amber-400" bg="bg-amber-50" textColor="text-amber-700" borderColor="border-amber-100" />
              <StatusBadge count={jobStats.closed}    label="Closed"    dotColor="bg-gray-400"  bg="bg-gray-50"  textColor="text-gray-700"  borderColor="border-gray-200"  />
              <StatusBadge count={jobStats.cancelled} label="Cancelled" dotColor="bg-red-400"   bg="bg-red-50"   textColor="text-red-700"   borderColor="border-red-100"   />
            </div>
            <div className="space-y-1">
              {[
                { label: 'Active',    value: jobStats.active,    color: 'linear-gradient(90deg,#2563eb,#06b6d4)' },
                { label: 'Draft',     value: jobStats.draft,     color: 'linear-gradient(90deg,#f59e0b,#fbbf24)' },
                { label: 'Closed',    value: jobStats.closed,    color: 'linear-gradient(90deg,#6b7280,#9ca3af)' },
                { label: 'Cancelled', value: jobStats.cancelled, color: 'linear-gradient(90deg,#ef4444,#f87171)' },
              ].map(item => (
                <MiniBar key={item.label} label={item.label} value={item.value}
                  max={Math.max(jobStats.active + jobStats.draft + jobStats.closed + jobStats.cancelled, 1)}
                  color={item.color} />
              ))}
            </div>
          </div>

          {/* Application Status */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-4">
            <SHead icon={FileText} title="Application Status" sub="Student application pipeline"
              action="View Applications" onAction={() => navigate('/dashboard/college-admin/applications')} />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <StatusBadge count={applicationStats.pending}     label="Pending"     dotColor="bg-amber-400" bg="bg-amber-50" textColor="text-amber-700" borderColor="border-amber-100" />
              <StatusBadge count={applicationStats.shortlisted} label="Shortlisted" dotColor="bg-blue-500"  bg="bg-blue-50"  textColor="text-blue-700"  borderColor="border-blue-100"  />
              <StatusBadge count={applicationStats.selected}    label="Selected"    dotColor="bg-green-500" bg="bg-green-50" textColor="text-green-700" borderColor="border-green-100" />
              <StatusBadge count={applicationStats.rejected}    label="Rejected"    dotColor="bg-red-400"   bg="bg-red-50"   textColor="text-red-700"   borderColor="border-red-100"   />
            </div>
            {totalApps > 0 && (
              <div className="space-y-1">
                {[
                  { label: 'Pending',     value: applicationStats.pending,     color: 'linear-gradient(90deg,#f59e0b,#fbbf24)' },
                  { label: 'Shortlisted', value: applicationStats.shortlisted, color: 'linear-gradient(90deg,#2563eb,#06b6d4)' },
                  { label: 'Selected',    value: applicationStats.selected,    color: 'linear-gradient(90deg,#22c55e,#34d399)' },
                  { label: 'Rejected',    value: applicationStats.rejected,    color: 'linear-gradient(90deg,#ef4444,#f87171)' },
                ].map(item => (
                  <MiniBar key={item.label} label={item.label} value={item.value}
                    max={totalApps} color={item.color}
                    sub={`${item.value} (${pct(item.value, totalApps)}%)`} />
                ))}
              </div>
            )}
          </div>

          {/* Branch-wise Placement */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-4">
            <SHead icon={GraduationCap} title="Branch-wise Placement" sub="Placement rate per department" />
            {branchStats.length > 0 ? (
              <div className="space-y-1">
                {branchStats.map((branch, index) => (
                  <MiniBar key={index}
                    label={branch.branch || branch._id || 'N/A'}
                    value={branch.placed || 0}
                    max={Math.max(branch.total || 0, 1)}
                    color="linear-gradient(90deg,#2563eb,#06b6d4)"
                    sub={`${branch.placed || 0}/${branch.total || 0} (${Math.round(branch.placementPercentage || 0)}%)`}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10">
                <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center mb-2">
                  <GraduationCap className="w-5 h-5 text-blue-300" />
                </div>
                <p className="text-sm font-semibold text-gray-500">No branch data yet</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Data will appear as students get placed</p>
              </div>
            )}
          </div>

          {/* Package Statistics */}
          {packageStats.maxPackage > 0 && (
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-4">
              <SHead icon={DollarSign} title="Package Statistics" sub="CTC distribution across offers" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <InsightTile label="Highest Package" value={`₹${packageStats.maxPackage.toFixed(1)}L`}
                  sub="Best offer"   color="text-green-600" bg="bg-green-50 border-green-100"  />
                <InsightTile label="Average Package" value={`₹${packageStats.avgPackage.toFixed(1)}L`}
                  sub="Mean CTC"     color="text-blue-600"  bg="bg-blue-50 border-blue-100"    />
                <InsightTile label="Lowest Package"  value={`₹${packageStats.minPackage.toFixed(1)}L`}
                  sub="Minimum CTC"  color="text-amber-600" bg="bg-amber-50 border-amber-100"  />
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-4">
            <SHead icon={Star} title="Quick Actions" sub="Jump to key sections" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { label: 'Manage Jobs',   sub: 'View job postings',   gradient: 'bg-gradient-to-br from-blue-600 to-blue-700',   onClick: () => navigate('/dashboard/college-admin/jobs'),         icon: Briefcase },
                { label: 'Applications', sub: 'Review submissions',   gradient: 'bg-gradient-to-br from-cyan-500 to-blue-600',   onClick: () => navigate('/dashboard/college-admin/applications'), icon: FileText  },
                { label: 'Companies',    sub: 'Recruiting partners',  gradient: 'bg-gradient-to-br from-blue-600 to-indigo-600', onClick: () => navigate('/dashboard/college-admin/companies'),   icon: Building2 },
              ].map(({ label, sub, gradient, onClick, icon: Icon }) => (
                <button key={label} onClick={onClick}
                  className={`group relative overflow-hidden rounded-xl p-3 text-left transition-all duration-200 hover:scale-[1.04] hover:shadow-lg w-full ${gradient}`}>
                  <div className="absolute -top-4 -right-4 w-14 h-14 bg-white/10 rounded-full" />
                  <Icon className="w-4 h-4 text-white mb-2 relative z-10" />
                  <p className="text-xs font-bold text-white leading-none relative z-10">{label}</p>
                  <p className="text-[9px] text-white/70 mt-0.5 relative z-10">{sub}</p>
                </button>
              ))}
            </div>
          </div>

        </div>{/* end LEFT */}

        {/* ── RIGHT (1 col) ── */}
        <div className="flex flex-col gap-4">

          {/* Placement Donut */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-4">
            <SHead icon={BarChart3} title="Placement Snapshot" />
            <div className="flex items-center gap-3 mb-3">
              <div className="relative w-16 h-16 flex-shrink-0">
                <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#dbeafe" strokeWidth="3.5" />
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="url(#ag)" strokeWidth="3.5"
                    strokeDasharray={`${placementRate} ${100 - placementRate}`} strokeLinecap="round" />
                  <defs>
                    <linearGradient id="ag" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#2563eb" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-base font-black text-gray-900">{placementRate}%</span>
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-800">Placement Rate</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{fmt(overviewStats.placedStudents)} of {fmt(overviewStats.totalStudents)}</p>
              </div>
            </div>
            <div>
              {[
                { label: 'Total Students',    value: fmt(overviewStats.totalStudents),        color: 'text-blue-600'   },
                { label: 'Placed Students',   value: fmt(overviewStats.placedStudents),       color: 'text-green-600'  },
                { label: 'Selected Students', value: fmt(overviewStats.selectedStudents ?? 0), color: 'text-indigo-600' },
                { label: 'Total Companies',   value: fmt(overviewStats.totalCompanies),       color: 'text-cyan-600'   },
                { label: 'Total JDs',         value: fmt(overviewStats.totalJDs),             color: 'text-violet-600' },
                { label: 'Applications',      value: fmt(overviewStats.totalApplications),    color: 'text-blue-700'   },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                  <span className="text-xs text-gray-500">{label}</span>
                  <span className={`text-xs font-black ${color}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Hiring Companies */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-4">
            <SHead icon={Building2} title="Top Hiring Companies" sub="Ranked by students hired"
              action="All Companies" onAction={() => navigate('/dashboard/college-admin/companies')} />
            {companyStats.length > 0 ? (
              <div className="space-y-1">
                {companyStats.slice(0, 8).map((company, idx) => {
                  const count  = company.studentsHired || 0;
                  const medals = ['🥇', '🥈', '🥉'];
                  return (
                    <div key={idx} className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-blue-50/70 transition-all">
                      <span className="text-sm w-5 text-center flex-shrink-0">
                        {idx < 3 ? medals[idx] : <span className="text-[10px] font-black text-gray-300">#{idx + 1}</span>}
                      </span>
                      <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-md flex items-center justify-center text-[8px] font-black text-white flex-shrink-0">
                        {(company.companyName || company._id || 'C').substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800 truncate">{company.companyName || company._id || 'Unknown'}</p>
                        <div className="h-1 bg-gray-100 rounded-full mt-1 overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500"
                            style={{ width: `${pct(count, maxCompany)}%` }} />
                        </div>
                      </div>
                      <span className="text-xs font-black text-blue-600 flex-shrink-0">{count}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center mb-2">
                  <Building2 className="w-5 h-5 text-blue-300" />
                </div>
                <p className="text-xs text-gray-400">No hiring data yet</p>
              </div>
            )}
          </div>

          {/* Goal card */}
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
                  { label: 'Students Placed', cur: overviewStats.placedStudents ?? 0, max: Math.max(overviewStats.totalStudents ?? 1, 1), display: `${fmt(overviewStats.placedStudents)}/${fmt(overviewStats.totalStudents)}` },
                  { label: 'Companies',       cur: overviewStats.totalCompanies ?? 0, max: 50, display: `${fmt(overviewStats.totalCompanies)}/50` },
                  { label: 'Active JDs',      cur: overviewStats.activeJDs ?? 0,      max: 50, display: `${fmt(overviewStats.activeJDs)}/50`    },
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
            </div>
          </div>

        </div>{/* end RIGHT */}

      </div>{/* end main grid */}

    </CollegeAdminLayout>
  );
};

export default Analytics;