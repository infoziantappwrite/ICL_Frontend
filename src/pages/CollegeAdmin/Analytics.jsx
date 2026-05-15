// src/pages/CollegeAdmin/Analytics.jsx  —  Campus Placement Intelligence
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, Users, Briefcase, Building2, Award,
  BarChart3, Target, GraduationCap, RefreshCw, ChevronRight,
  CheckCircle2, XCircle, Clock, AlertCircle,
} from 'lucide-react';
import CollegeAdminLayout from '../../components/layout/CollegeAdminLayout';
import { AnalyticsSkeleton } from '../../components/common/SkeletonLoader';
import { collegeAdminAPI, jobAPI } from '../../api/Api';

const fmt = (n) => {
  if (n === undefined || n === null) return '0';
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
};
const pct = (a, b) => (b > 0 ? Math.min(100, Math.round((a / b) * 100)) : 0);

/* ─── CHART: Funnel ──────────────────────── */
const FunnelChart = ({ steps }) => {
  const max = steps[0]?.value || 1;
  const H = 56;
  const COLORS = ['#003399', '#00A9CE', '#10B981', '#F59E0B'];
  return (
    <div className="space-y-2">
      {steps.map((s, i) => {
        const w = Math.max(pct(s.value, max), s.value > 0 ? 8 : 0);
        const isBest = i === steps.length - 1;
        return (
          <div key={i} className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-500 w-20 flex-shrink-0 text-right">{s.label}</span>
            <div className="flex-1 relative" style={{ height: H - 16 }}>
              <div className="h-full rounded-lg transition-all duration-700 flex items-center px-3"
                style={{ width: `${w}%`, backgroundColor: COLORS[i], opacity: 0.85, minWidth: s.value > 0 ? 40 : 0 }}>
                <span className="text-white text-xs font-black whitespace-nowrap">{fmt(s.value)}</span>
              </div>
            </div>
            <span className="text-[10px] font-black w-10 flex-shrink-0"
              style={{ color: COLORS[i] }}>
              {i === 0 ? '100%' : `${pct(s.value, max)}%`}
            </span>
          </div>
        );
      })}
    </div>
  );
};

/* ─── CHART: Donut ───────────────────────── */
const DonutChart = ({ segments, size = 140, thickness = 22, children }) => {
  const r = (size - thickness) / 2;
  const C = 2 * Math.PI * r;
  const cx = size / 2, cy = size / 2;
  let offset = 0;
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  const normalized = segments.map(s => ({ ...s, pct: (s.value / total) * 100 }));
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F1F5F9" strokeWidth={thickness} />
        {normalized.map((seg, i) => {
          const dash = (seg.pct / 100) * C;
          const gap = C - dash;
          const el = (
            <circle key={i} cx={cx} cy={cy} r={r} fill="none"
              stroke={seg.color} strokeWidth={thickness}
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={-offset * C / 100}
              strokeLinecap="butt"
              style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
            />
          );
          offset += seg.pct;
          return el;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
};

/* ─── CHART: Horizontal Bar (grouped) ───── */
const HorizontalBar = ({ label, value, max, color, sub }) => {
  const w = Math.max(pct(value, max), value > 0 ? 2 : 0);
  return (
    <div className="group hover:bg-emerald-50/40 px-2 py-2 rounded-xl transition-colors">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-semibold text-slate-700 truncate max-w-[150px] group-hover:text-emerald-700">{label}</span>
        <div className="flex items-center gap-2 flex-shrink-0">
          {sub && <span className="text-[10px] text-slate-400">{sub}</span>}
          <span className="text-sm font-black" style={{ color }}>{fmt(value)}</span>
        </div>
      </div>
      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${w}%`, backgroundColor: color }} />
      </div>
    </div>
  );
};

/* ─── CHART: Salary Range Bars ───────────── */
const SalaryBar = ({ label, value, maxVal, color }) => {
  const w = Math.max(pct(value, maxVal), value > 0 ? 3 : 0);
  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] font-bold text-slate-500 w-16 flex-shrink-0">{label}</span>
      <div className="flex-1 h-6 bg-slate-50 rounded-lg overflow-hidden border border-slate-100">
        <div className="h-full rounded-lg flex items-center px-2 transition-all duration-700"
          style={{ width: `${w}%`, backgroundColor: color, minWidth: value > 0 ? 48 : 0 }}>
          <span className="text-white text-[10px] font-black whitespace-nowrap">₹{fmt(value)}L</span>
        </div>
      </div>
    </div>
  );
};

/* ─── Panel ──────────────────────────────── */
const Panel = ({ title, icon: Icon, sub, children, color = '#003399', action, onAction, className = '' }) => (
  <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden ${className}`}>
    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}18`, color }}>
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-800 leading-none">{title}</h3>
          {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
        </div>
      </div>
      {action && (
        <button onClick={onAction} className="text-[10px] font-black text-[#003399] flex items-center gap-0.5 px-2 py-1 rounded-lg hover:bg-slate-50 transition-colors">
          {action} <ChevronRight className="w-3 h-3" />
        </button>
      )}
    </div>
    <div className="p-5">{children}</div>
  </div>
);

/* ─── Stat Pill ──────────────────────────── */
const StatPill = ({ icon: Icon, label, value, color }) => (
  <div className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group text-center">
    <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
      style={{ backgroundColor: `${color}15`, color }}>
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <p className="text-2xl font-black leading-none" style={{ color }}>{value}</p>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">{label}</p>
    </div>
  </div>
);

/* ─── CHART: Area Chart ──────────────────── */
const AreaChart = ({ data, width = 600, height = 110, color = '#003399' }) => {
  if (!data || data.length < 2) return (
    <div className="flex items-center justify-center h-24 text-xs text-slate-400">No monthly data available yet</div>
  );
  const max = Math.max(...data.map(d => d.value || d.applications || 0), 1);
  const pad = { t: 10, b: 26, l: 8, r: 8 };
  const w = width - pad.l - pad.r;
  const h = height - pad.t - pad.b;
  const pts = data.map((d, i) => ({
    x: pad.l + (i / (data.length - 1)) * w,
    y: pad.t + h - ((d.value || d.applications || 0) / max) * h,
    label: d.label || `M${i + 1}`,
    value: d.value || d.applications || 0,
  }));
  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${pts[pts.length - 1].x} ${pad.t + h} L ${pts[0].x} ${pad.t + h} Z`;
  const id = `ca-grad-${color.replace('#', '')}`;
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${id})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="3" fill={color} stroke="white" strokeWidth="1.5" />
          <text x={p.x} y={pad.t + h + 16} textAnchor="middle" fontSize="8.5" fill="#94A3B8" fontWeight="600">{p.label}</text>
        </g>
      ))}
    </svg>
  );
};

/* ══════════════════════════════════════════ */
/*         COLLEGE ADMIN ANALYTICS            */
/* ══════════════════════════════════════════ */
const Analytics = () => {
  const navigate = useNavigate();
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange]   = useState('all');

  const [overviewStats, setOverviewStats] = useState({
    totalStudents: 0, totalCompanies: 0, totalJDs: 0, activeJDs: 0,
    selectedStudents: 0, placedStudents: 0, placementPercentage: 0,
  });
  const [jobStats, setJobStats]           = useState({ active: 0, closed: 0, draft: 0, cancelled: 0 });
  const [branchStats, setBranchStats]     = useState([]);
  const [companyStats, setCompanyStats]   = useState([]);
  const [packageStats, setPackageStats]   = useState({ avgPackage: 0, maxPackage: 0, minPackage: 0 });
  const [monthlyTrends, setMonthlyTrends] = useState([]);

  const fetchAllData = async () => {
    try {
      setRefreshing(true);
      const [dashboardData, analyticsData, jobsData] = await Promise.all([
        collegeAdminAPI.getDashboard().catch(() => ({ success: false })),
        collegeAdminAPI.getAnalytics().catch(() => ({ success: false })),
        collegeAdminAPI.getJobs({ limit: 500 }).catch(() => ({ success: false })),
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

      if (analyticsData.success) {
        if (analyticsData.branchStats)    setBranchStats(analyticsData.branchStats);
        if (analyticsData.companyStats)   setCompanyStats(analyticsData.companyStats);
        if (analyticsData.packageStats)   setPackageStats(analyticsData.packageStats);
        if (analyticsData.monthlyTrends)  setMonthlyTrends(analyticsData.monthlyTrends);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchAllData(); }, [timeRange]);

  if (loading) return <AnalyticsSkeleton layout={CollegeAdminLayout} />;

  const placementRate = overviewStats.placementPercentage ??
    pct(overviewStats.placedStudents ?? 0, overviewStats.totalStudents ?? 0);
  const maxCompany    = Math.max(...companyStats.map(c => c.studentsHired || 0), 1);
  const maxBranch     = Math.max(...branchStats.map(b => b.placed || b.total || 0), 1);
  const totalJobs     = jobStats.active + jobStats.closed + jobStats.draft + jobStats.cancelled;

  /* Funnel steps — uses real API fields; no estimated fallbacks */
  const appliedCount = overviewStats.appliedStudents ?? overviewStats.selectedStudents ?? 0;
  const funnelSteps = [
    { label: 'Enrolled',  value: overviewStats.totalStudents ?? 0 },
    { label: 'Applied',   value: appliedCount },
    { label: 'Selected',  value: overviewStats.selectedStudents ?? 0 },
    { label: 'Placed',    value: overviewStats.placedStudents ?? 0 },
  ];

  /* Monthly application timeline from API */
  const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const monthSpark = monthlyTrends.length >= 2
    ? monthlyTrends.map(m => ({ label: MONTH_NAMES[(m._id?.month ?? 1) - 1], value: m.applications || 0 }))
    : [];

  /* Job status donut segments */
  const jobDonutSegs = [
    { value: jobStats.active,    color: '#10B981', label: 'Active' },
    { value: jobStats.closed,    color: '#003399', label: 'Closed' },
    { value: jobStats.draft,     color: '#F59E0B', label: 'Draft'  },
    { value: jobStats.cancelled, color: '#EF4444', label: 'Cancelled' },
  ].filter(s => s.value > 0);

  return (
    <CollegeAdminLayout>
      <div className="px-6 py-4 md:px-8 md:py-6 space-y-6 font-sans">

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span className="w-2 h-8 bg-gradient-to-b from-[#003399] to-[#10B981] rounded-full" />
              Placement Intelligence
            </h1>
            <p className="text-sm text-slate-400 mt-1 font-medium">Campus recruitment analytics & insights</p>
          </div>
          <div className="flex items-center gap-2">
            {['all','month','week'].map(r => (
              <button key={r} onClick={() => setTimeRange(r)}
                className={`text-[11px] font-bold px-3 py-1.5 rounded-lg capitalize transition-colors ${timeRange === r ? 'bg-[#003399] text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                {r}
              </button>
            ))}
            <button onClick={fetchAllData} disabled={refreshing}
              className="flex items-center gap-1.5 bg-[#003399] text-white text-[12px] font-bold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 shadow-sm">
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatPill icon={Users}       label="Students"   value={fmt(overviewStats.totalStudents)}   color="#003399" />
          <StatPill icon={CheckCircle2} label="Placed"    value={fmt(overviewStats.placedStudents)}  color="#10B981" />
          <StatPill icon={Target}      label="Rate"       value={`${placementRate}%`}                color="#00A9CE" />
          <StatPill icon={Briefcase}   label="Live JDs"   value={fmt(overviewStats.activeJDs)}       color="#F59E0B" />
          <StatPill icon={Building2}   label="Companies"  value={fmt(overviewStats.totalCompanies)}  color="#8B5CF6" />
          <StatPill icon={Award}       label="Selected"   value={fmt(overviewStats.selectedStudents)} color="#EF4444" />
        </div>

        {/* Funnel + Job Status Donut */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Funnel Chart */}
          <Panel title="Placement Funnel" icon={Target}
            sub="Student journey from enrollment to placement" color="#003399" className="lg:col-span-2">
            <FunnelChart steps={funnelSteps} />
            <div className="mt-4 pt-3 border-t border-slate-50 grid grid-cols-4 gap-2 text-center">
              {funnelSteps.map((s, i) => {
                const COLORS = ['#003399','#00A9CE','#10B981','#F59E0B'];
                return (
                  <div key={i}>
                    <p className="text-lg font-black" style={{ color: COLORS[i] }}>{fmt(s.value)}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">{s.label}</p>
                  </div>
                );
              })}
            </div>
          </Panel>

          {/* Job Status Donut */}
          <Panel title="Job Status" icon={Briefcase}
            sub="Distribution of all job postings" color="#F59E0B">
            <div className="flex flex-col items-center gap-4">
              <DonutChart segments={jobDonutSegs.length ? jobDonutSegs : [{ value: 1, color: '#E2E8F0' }]} size={148} thickness={24}>
                <div className="text-center">
                  <p className="text-2xl font-black text-slate-800">{totalJobs}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total JDs</p>
                </div>
              </DonutChart>
              <div className="w-full space-y-2">
                {[
                  { label: 'Active',    val: jobStats.active,    color: '#10B981', bg: 'bg-emerald-50', icon: CheckCircle2 },
                  { label: 'Closed',   val: jobStats.closed,    color: '#003399', bg: 'bg-blue-50',    icon: Award },
                  { label: 'Draft',    val: jobStats.draft,     color: '#F59E0B', bg: 'bg-amber-50',   icon: Clock },
                  { label: 'Cancelled',val: jobStats.cancelled, color: '#EF4444', bg: 'bg-rose-50',    icon: XCircle },
                ].map(row => (
                  <div key={row.label} className={`flex items-center justify-between px-3 py-1.5 rounded-xl ${row.bg}`}>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: row.color }}/>
                      <span className="text-xs font-semibold text-slate-700">{row.label}</span>
                    </div>
                    <span className="text-sm font-black" style={{ color: row.color }}>{row.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </Panel>
        </div>

        {/* Branch-wise + Company Hiring */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Branch-wise Placement */}
          <Panel title="Branch-wise Placement" icon={GraduationCap}
            sub="Students placed per department" color="#10B981"
            action="View Details" onAction={() => navigate('/dashboard/college-admin/students')}>
            {branchStats.length === 0 ? (
              <div className="py-8 text-center">
                <BarChart3 className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-xs text-gray-400">No branch data available yet</p>
                <p className="text-[10px] text-gray-300 mt-1">Branch analytics appear once students are placed</p>
              </div>
            ) : (
              <div className="space-y-1">
                {branchStats.slice(0, 8).map((b, i) => (
                  <HorizontalBar
                    key={i}
                    label={b.branch || b.department || `Branch ${i+1}`}
                    value={b.placed || 0}
                    max={maxBranch}
                    color={['#10B981','#00A9CE','#003399','#F59E0B','#8B5CF6','#EF4444','#EC4899','#14B8A6'][i % 8]}
                    sub={`of ${b.total || 0}`}
                  />
                ))}
              </div>
            )}
          </Panel>

          {/* Company Hiring Leaders */}
          <Panel title="Company Hiring Leaders" icon={Building2}
            sub="Top recruiters by students hired" color="#8B5CF6"
            action="All Companies" onAction={() => navigate('/dashboard/college-admin/companies')}>
            {companyStats.length === 0 ? (
              <div className="py-8 text-center">
                <BarChart3 className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-xs text-gray-400">No company hiring data yet</p>
              </div>
            ) : (
              <div className="space-y-1">
                {companyStats.slice(0, 8).map((c, i) => (
                  <HorizontalBar
                    key={i}
                    label={c.company || c.name || `Company ${i+1}`}
                    value={c.studentsHired || c.hired || 0}
                    max={maxCompany}
                    color={i === 0 ? '#8B5CF6' : i === 1 ? '#003399' : '#00A9CE'}
                  />
                ))}
              </div>
            )}
          </Panel>
        </div>

        {/* Salary Package Analysis */}
        <Panel title="Salary Package Analysis" icon={Award}
          sub="Package distribution — min / avg / max (in Lakhs)" color="#F59E0B">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
            <div className="space-y-3">
              <SalaryBar label="Minimum" value={packageStats.minPackage || 0}
                maxVal={Math.max(packageStats.maxPackage, 1)} color="#00A9CE" />
              <SalaryBar label="Average" value={packageStats.avgPackage || 0}
                maxVal={Math.max(packageStats.maxPackage, 1)} color="#F59E0B" />
              <SalaryBar label="Maximum" value={packageStats.maxPackage || 0}
                maxVal={Math.max(packageStats.maxPackage, 1)} color="#10B981" />
            </div>
            <div className="flex flex-col gap-3">
              {[
                { label: 'Min Package', value: `₹${packageStats.minPackage || 0}L`, color: '#00A9CE', bg: 'bg-cyan-50' },
                { label: 'Avg Package', value: `₹${packageStats.avgPackage || 0}L`, color: '#F59E0B', bg: 'bg-amber-50' },
                { label: 'Max Package', value: `₹${packageStats.maxPackage || 0}L`, color: '#10B981', bg: 'bg-emerald-50' },
              ].map(row => (
                <div key={row.label} className={`${row.bg} rounded-xl p-3 flex items-center justify-between`}>
                  <span className="text-xs font-bold text-slate-600">{row.label}</span>
                  <span className="text-lg font-black" style={{ color: row.color }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Panel>

        {/* Monthly Application Trend */}
        <Panel title="Monthly Application Trend" icon={TrendingUp}
          sub={monthSpark.length >= 2 ? `Real data — ${monthSpark[0].label} to ${monthSpark[monthSpark.length-1].label}` : 'No monthly data yet'}
          color="#003399">
          <AreaChart data={monthSpark} width={640} height={110} color="#003399" />
          <p className="text-[10px] text-slate-400 mt-2">Applications submitted per month — from your college's job drives</p>
        </Panel>

        {/* Placement Rate Visual */}
        <div className="bg-gradient-to-r from-[#003399] to-[#00A9CE] rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="text-white">
              <p className="text-[11px] font-bold uppercase tracking-widest text-blue-100">Overall Placement Rate</p>
              <p className="text-5xl font-black mt-1">{placementRate}%</p>
              <p className="text-blue-100 text-sm mt-2">
                {fmt(overviewStats.placedStudents)} of {fmt(overviewStats.totalStudents)} students successfully placed
              </p>
            </div>
            <div className="flex gap-4">
              <DonutChart
                segments={[
                  { value: placementRate, color: 'rgba(255,255,255,0.9)' },
                  { value: 100 - placementRate, color: 'rgba(255,255,255,0.15)' },
                ]}
                size={130} thickness={20}>
                <span className="text-2xl font-black text-white">{placementRate}%</span>
              </DonutChart>
            </div>
          </div>
        </div>

      </div>
    </CollegeAdminLayout>
  );
};

export default Analytics;