// src/pages/SuperAdmin/Analytics.jsx  —  Platform Command Center
import { useState, useEffect, useCallback } from 'react';
import apiCall from '../../api/Api';
import {
  BarChart3, Building2, Users, Briefcase, GraduationCap,
  Award, Activity, TrendingUp, Clock, BookOpen,
  AlertCircle, UserCheck, CheckCircle2, Bell, PlayCircle,
  RefreshCw,
} from 'lucide-react';
import SuperAdminDashboardLayout from '../../components/layout/SuperAdminDashboardLayout';
import { AnalyticsSkeleton } from '../../components/common/SkeletonLoader';

const fmt = (n) => {
  const num = Number(n);
  if (!n && n !== 0) return '0';
  if (isNaN(num)) return '0';
  return num >= 1000 ? `${(num / 1000).toFixed(1)}k` : String(num);
};
const pct = (a, b) => (b > 0 ? Math.min(100, Math.round((a / b) * 100)) : 0);

/* ─── CHART: Animated Donut ──────────────── */
const DonutChart = ({ segments, size = 160, thickness = 28, label, sublabel }) => {
  const r = (size - thickness) / 2;
  const circumference = 2 * Math.PI * r;
  const cx = size / 2, cy = size / 2;
  let offset = 0;
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F1F5F9" strokeWidth={thickness} />
        {segments.map((seg, i) => {
          const dash = (seg.value / 100) * circumference;
          const gap = circumference - dash;
          const el = (
            <circle key={i} cx={cx} cy={cy} r={r} fill="none"
              stroke={seg.color} strokeWidth={thickness}
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={-offset * circumference / 100}
              strokeLinecap="round"
              style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dasharray 1s ease' }}
            />
          );
          offset += seg.value;
          return el;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black text-slate-800 leading-none">{label}</span>
        <span className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-wider">{sublabel}</span>
      </div>
    </div>
  );
};

/* ─── CHART: Pie Chart ───────────────────── */
const PieChart = ({ data, size = 180 }) => {
  const cx = size / 2, cy = size / 2, r = size / 2 - 8;
  let cumulative = 0;
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const slices = data.map((d) => {
    const startAngle = (cumulative / total) * 2 * Math.PI - Math.PI / 2;
    cumulative += d.value;
    const endAngle = (cumulative / total) * 2 * Math.PI - Math.PI / 2;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
    const midAngle = (startAngle + endAngle) / 2;
    const labelR = r * 0.65;
    const lx = cx + labelR * Math.cos(midAngle);
    const ly = cy + labelR * Math.sin(midAngle);
    const p = Math.round((d.value / total) * 100);
    return { ...d, path: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`, lx, ly, p };
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {slices.map((s, i) => (
        <g key={i}>
          <path d={s.path} fill={s.color} opacity={0.9} />
          {s.p >= 8 && (
            <text x={s.lx} y={s.ly} textAnchor="middle" dominantBaseline="middle"
              fontSize="9" fontWeight="800" fill="white">{s.p}%</text>
          )}
        </g>
      ))}
    </svg>
  );
};

/* ─── CHART: Area Chart ──────────────────── */
const AreaChart = ({ data, width = 600, height = 120, color = '#003399' }) => {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data.map(d => d.value), 1);
  const pad = { t: 12, b: 28, l: 8, r: 8 };
  const w = width - pad.l - pad.r;
  const h = height - pad.t - pad.b;
  const pts = data.map((d, i) => ({
    x: pad.l + (i / (data.length - 1)) * w,
    y: pad.t + h - (d.value / max) * h,
    label: d.label,
  }));
  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${pts[pts.length - 1].x} ${pad.t + h} L ${pts[0].x} ${pad.t + h} Z`;
  const id = `sa-grad-${color.replace('#', '')}`;
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${id})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="3.5" fill={color} stroke="white" strokeWidth="1.5" />
          <text x={p.x} y={pad.t + h + 15} textAnchor="middle" fontSize="9" fill="#94A3B8" fontWeight="600">{p.label}</text>
        </g>
      ))}
    </svg>
  );
};

/* ─── CHART: Vertical Bar Chart ─────────── */
const VerticalBarChart = ({ data, height = 150, color = '#003399', accent = '#00A9CE' }) => {
  if (!data || !data.length) return null;
  const max = Math.max(...data.map(d => d.value), 1);
  const pad = { t: 16, b: 32, l: 4, r: 4 };
  const W = 420;
  const barW = Math.max(10, Math.floor((W - pad.l - pad.r) / data.length) - 8);
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${W} ${height}`}>
      {data.map((d, i) => {
        const slot = (W - pad.l - pad.r) / data.length;
        const x = pad.l + i * slot + slot / 2 - barW / 2;
        const barH = Math.max(((d.value / max) * (height - pad.t - pad.b)), d.value > 0 ? 4 : 0);
        const y = pad.t + (height - pad.t - pad.b) - barH;
        const isTop = d.value === max;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={barH} rx="5"
              fill={isTop ? accent : color} opacity={isTop ? 1 : 0.65} />
            <text x={x + barW / 2} y={height - pad.b + 14} textAnchor="middle"
              fontSize="8" fill="#94A3B8" fontWeight="600">{d.label}</text>
            {d.value > 0 && (
              <text x={x + barW / 2} y={y - 4} textAnchor="middle"
                fontSize="8" fill={isTop ? accent : '#003399'} fontWeight="800">{fmt(d.value)}</text>
            )}
          </g>
        );
      })}
    </svg>
  );
};

/* ─── Panel + KPI ────────────────────────── */
const Panel = ({ title, icon: Icon, sub, right, children, color = '#003399', className = '' }) => (
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
      {right && <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{right}</span>}
    </div>
    <div className="p-5">{children}</div>
  </div>
);

const KPI = ({ icon: Icon, label, value, color, delta }) => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3 hover:shadow-md transition-all group">
    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
      style={{ backgroundColor: `${color}18`, color }}>
      <Icon className="w-5 h-5" />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-xl font-black leading-none" style={{ color }}>{value}</p>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5 truncate">{label}</p>
    </div>
    {delta !== undefined && (
      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full flex-shrink-0 ${delta >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>
        {delta >= 0 ? '↑' : '↓'}{Math.abs(delta)}%
      </span>
    )}
  </div>
);

const Empty = ({ text }) => (
  <div className="py-8 text-center">
    <BarChart3 className="w-8 h-8 text-gray-200 mx-auto mb-2" />
    <p className="text-xs text-gray-400">{text}</p>
  </div>
);

/* ══════════════════════════════════════════ */
const Analytics = () => {
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState('');
  const [overview, setOverview]               = useState({});
  const [trends, setTrends]                   = useState({});
  const [topColleges, setTopColleges]         = useState([]);
  const [recentActivity, setRecentActivity]   = useState([]);
  const [industryStats, setIndustryStats]     = useState([]);
  const [monthlyTimeline, setMonthlyTimeline] = useState([]);
  const [updated, setUpdated]                 = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await apiCall('/super-admin/analytics');
      const payload = res?.analytics ?? res?.data ?? res;
      if (!payload || typeof payload !== 'object') { setError('Unexpected response format.'); return; }
      setOverview(payload.overview             || {});
      setTrends(payload.trends                 || {});
      setTopColleges(payload.topColleges       || []);
      setRecentActivity(payload.recentActivity || []);
      setIndustryStats(payload.topIndustries   || payload.industryStats || []);
      setMonthlyTimeline(payload.monthlyTimeline || []);
      setUpdated(new Date());
    } catch (err) {
      setError(err?.message || 'Could not load analytics.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); const t = setInterval(load, 60_000); return () => clearInterval(t); }, [load]);

  if (loading && !updated) return <AnalyticsSkeleton layout={SuperAdminDashboardLayout} />;

  const totalColleges        = Number(overview?.totalColleges)        || 0;
  const activeColleges       = Number(overview?.activeColleges)       || 0;
  const totalStudents        = Number(overview?.totalStudents)        || 0;
  const totalCompanies       = Number(overview?.totalCompanies)       || 0;
  const totalJobs            = Number(overview?.totalJobs)            || 0;
  const totalCourses         = Number(overview?.totalCourses)         || 0;
  const activeCourses        = Number(overview?.activeCourses)        || 0;
  const totalEnrollments     = Number(overview?.totalEnrollments)     || 0;
  const completedEnrollments = Number(overview?.completedEnrollments) || 0;
  const placedStudents       = Number(overview?.placedStudents)       || 0;
  const placementRate        = Number(overview?.placementRate)        || 0;

  const activationPct      = pct(activeColleges, Math.max(totalColleges, 1));
  const enrollmentCmplPct  = pct(completedEnrollments, Math.max(totalEnrollments, 1));
  const courseActivePct    = pct(activeCourses, Math.max(totalCourses, 1));
  const maxColStudents     = Math.max(...topColleges.map(c => c.students ?? 0), 1);

  /* Use real monthly timeline from API; fall back to flat line if no data yet */
  const growthSpark = monthlyTimeline.length >= 2
    ? monthlyTimeline.map(m => ({ label: m.label, value: m.students }))
    : (() => {
        const currentMonth = new Date().getMonth();
        const monthLabels = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        return monthLabels.slice(0, currentMonth + 1).map((label, i, arr) => ({
          label,
          value: Math.max(1, Math.round((totalStudents / arr.length) * (0.3 + (i / Math.max(arr.length - 1, 1)) * 0.7))),
        }));
      })();

  const COLORS = ['#003399','#00A9CE','#10B981','#F59E0B','#8B5CF6','#EF4444','#EC4899','#14B8A6'];
  const pieTotalCo = industryStats.reduce((s, d) => s + Number(d.companies ?? d.count ?? 0), 0) || totalCompanies || 1;
  const pieData = industryStats.slice(0, 7).map((ind, i) => ({
    label: ind.name ?? ind.industry ?? ind._id ?? `Sector ${i + 1}`,
    value: Number(ind.companies ?? ind.count ?? 0),
    color: COLORS[i % COLORS.length],
  }));

  const barData = topColleges.slice(0, 8).map(c => ({
    label: (c.name ?? '').split(' ').slice(0, 2).join(' '),
    value: c.students ?? 0,
  }));

  return (
    <SuperAdminDashboardLayout>
      <div className="px-6 py-4 md:px-8 md:py-6 space-y-6 font-sans">

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span className="w-2 h-8 bg-gradient-to-b from-[#003399] to-[#00A9CE] rounded-full" />
              Platform Analytics
            </h1>
            <p className="text-sm text-slate-400 mt-1 font-medium flex items-center gap-2">
              Command-centre view · auto-refreshes every 60 s
              {updated && <span className="font-mono text-[10px] text-[#00A9CE] font-bold flex items-center gap-1"><Clock className="w-3 h-3"/>{updated.toLocaleTimeString()}</span>}
            </p>
          </div>
          <button onClick={load} className="flex items-center gap-1.5 bg-[#003399] hover:bg-[#002277] text-white text-[12px] font-bold px-4 py-2 rounded-xl transition-colors shadow-sm">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0"/>{error}
          </div>
        )}

        {/* KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <KPI icon={Building2}     label="Colleges"        value={fmt(totalColleges)}        color="#003399" delta={trends.collegesGrowth}  />
          <KPI icon={GraduationCap} label="Students"        value={fmt(totalStudents)}        color="#00A9CE" delta={trends.studentsGrowth}  />
          <KPI icon={Briefcase}     label="Companies"       value={fmt(totalCompanies)}       color="#8B5CF6" delta={trends.companiesGrowth} />
          <KPI icon={BarChart3}     label="Active Jobs"     value={fmt(totalJobs)}            color="#F59E0B" delta={trends.jobsGrowth}      />
          <KPI icon={BookOpen}      label="Total Courses"   value={fmt(totalCourses)}         color="#003399" />
          <KPI icon={PlayCircle}    label="Enrollments"     value={fmt(totalEnrollments)}     color="#00A9CE" />
          <KPI icon={CheckCircle2}  label="Completed"       value={fmt(completedEnrollments)} color="#10B981" />
          <KPI icon={UserCheck}     label="Placed Students" value={fmt(placedStudents)}       color="#EF4444" />
        </div>

        {/* Three Donut Charts */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { segs: [{ value: activationPct, color: '#003399' }, { value: 100 - activationPct, color: '#E2E8F0' }],
              label: `${activationPct}%`, sub2: 'ACTIVE', title: 'College Activation', sub: `${activeColleges} of ${totalColleges} live`, dot: '#003399' },
            { segs: [{ value: enrollmentCmplPct, color: '#10B981' }, { value: 100 - enrollmentCmplPct, color: '#E2E8F0' }],
              label: `${enrollmentCmplPct}%`, sub2: 'COMPLETED', title: 'Enrollment Completion', sub: `${fmt(completedEnrollments)} of ${fmt(totalEnrollments)}`, dot: '#10B981' },
            { segs: [{ value: courseActivePct, color: '#00A9CE' }, { value: 100 - courseActivePct, color: '#E2E8F0' }],
              label: `${courseActivePct}%`, sub2: 'ACTIVE', title: 'Course Activity', sub: `${activeCourses} of ${totalCourses} running`, dot: '#00A9CE' },
          ].map((d, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col items-center gap-3">
              <div className="text-center">
                <h3 className="text-sm font-bold text-slate-800">{d.title}</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">{d.sub}</p>
              </div>
              <DonutChart segments={d.segs} label={d.label} sublabel={d.sub2} size={140} thickness={20} />
              <div className="flex gap-4 text-[10px] font-bold text-slate-500">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: d.dot }}/>Active</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-200"/>Inactive</span>
              </div>
            </div>
          ))}
        </div>

        {/* Area Chart: Student Growth */}
        <Panel title="Student Growth Trend" icon={TrendingUp}
          sub={monthlyTimeline.length >= 2 ? `Real monthly registrations — ${monthlyTimeline[0]?.label} to ${monthlyTimeline[monthlyTimeline.length-1]?.label}` : 'Estimated distribution — no monthly data yet'}
          color="#003399">
          <div className="w-full overflow-x-auto">
            <AreaChart data={growthSpark} width={680} height={130} color="#003399" />
          </div>
          <div className="flex gap-6 mt-2">
            <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1.5">
              <span className="w-5 h-0.5 bg-[#003399] rounded-full inline-block"/>Platform-wide total: {fmt(totalStudents)} students
            </span>
          </div>
        </Panel>

        {/* Vertical Bar + Pie */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <Panel title="Top Colleges by Students" icon={Award} sub="Enrolled student count" color="#003399" className="lg:col-span-3">
            {barData.length === 0 ? <Empty text="No college data yet" /> : (
              <>
                <VerticalBarChart data={barData} height={150} color="#003399" accent="#00A9CE" />
                <div className="mt-4 space-y-1">
                  {topColleges.slice(0, 5).map((c, i) => (
                    <div key={i} className="flex items-center gap-3 group hover:bg-slate-50 px-2 py-1.5 rounded-xl transition-colors">
                      <span className="text-[10px] font-black text-slate-300 w-4 flex-shrink-0">#{i+1}</span>
                      <span className="text-xs font-semibold text-slate-700 truncate w-36 flex-shrink-0 group-hover:text-[#003399]">{c.name}</span>
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct(c.students ?? 0, maxColStudents)}%`, backgroundColor: i === 0 ? '#003399' : '#00A9CE' }} />
                      </div>
                      <span className="text-xs font-black flex-shrink-0" style={{ color: i === 0 ? '#003399' : '#00A9CE' }}>{fmt(c.students)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Panel>

          <Panel title="Industry Distribution" icon={Briefcase} sub="Companies by sector" color="#8B5CF6" className="lg:col-span-2">
            {pieData.length === 0 ? <Empty text="No industry data yet" /> : (
              <>
                <div className="flex justify-center mb-3">
                  <PieChart data={pieData} size={170} />
                </div>
                <div className="space-y-1.5 mt-1">
                  {pieData.map((d, i) => (
                    <div key={i} className="flex items-center gap-2 text-[11px]">
                      <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: d.color }}/>
                      <span className="text-slate-600 truncate flex-1">{d.label}</span>
                      <span className="font-black text-slate-700">{fmt(d.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Panel>
        </div>

        {/* Placement Gauge + Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Panel title="Placement Overview" icon={UserCheck} sub="Students placed across all colleges" color="#10B981">
            <div className="flex items-center gap-6">
              <DonutChart
                segments={[{ value: placementRate, color: '#10B981' }, { value: 100 - placementRate, color: '#E2E8F0' }]}
                label={`${placementRate}%`} sublabel="PLACED" size={120} thickness={18}
              />
              <div className="space-y-2 flex-1">
                {[
                  { label: 'Total Students',  value: fmt(totalStudents),  color: '#003399' },
                  { label: 'Placed Students', value: fmt(placedStudents), color: '#10B981' },
                  { label: 'Placement Rate',  value: `${placementRate}%`, color: '#00A9CE' },
                  { label: 'Active Jobs',     value: fmt(totalJobs),      color: '#F59E0B' },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between py-1 border-b border-slate-50 last:border-0">
                    <span className="text-xs text-slate-500 font-medium">{row.label}</span>
                    <span className="text-sm font-black" style={{ color: row.color }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </Panel>

          <Panel title="Recent Activity" icon={Bell} sub="Latest platform events" right="Live" color="#00A9CE">
            {recentActivity.length === 0 ? <Empty text="No recent activity" /> : (
              <div className="space-y-0.5">
                {recentActivity.slice(0, 7).map((act, i) => (
                  <div key={i} className="flex items-start gap-3 py-2 border-b border-slate-50 last:border-0">
                    <div className="w-6 h-6 rounded-lg bg-[#003399]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Activity className="w-3 h-3 text-[#003399]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 leading-snug">{act.event}</p>
                      {act.college && <p className="text-[10px] text-[#003399] font-medium truncate">{act.college}</p>}
                    </div>
                    <span className="text-[9px] text-slate-300 font-medium whitespace-nowrap flex-shrink-0">{act.date}</span>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>

      </div>
    </SuperAdminDashboardLayout>
  );
};

export default Analytics;