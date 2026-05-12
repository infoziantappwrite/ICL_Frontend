// src/pages/SuperAdmin/Analytics.jsx
import { useState, useEffect, useCallback } from 'react';
import apiCall from '../../api/Api';
import {
  BarChart3, Building2, Users, Briefcase, GraduationCap,
  Award, Activity, TrendingUp, Clock, BookOpen,
  AlertCircle, UserCheck, ArrowUpRight, CheckCircle2,
  Bell, PlayCircle,
} from 'lucide-react';
import SuperAdminDashboardLayout from '../../components/layout/SuperAdminDashboardLayout';
import { AnalyticsSkeleton } from '../../components/common/SkeletonLoader';

/* ── helpers ── */
const fmt = (n) => {
  const num = Number(n);
  if (!n && n !== 0) return '0';
  if (isNaN(num)) return '0';
  return num >= 1000 ? `${(num / 1000).toFixed(1)}k` : String(num);
};
const pct = (a, b) => b > 0 ? Math.min(100, Math.round((a / b) * 100)) : 0;

/* ── Mini progress bar ── */
const Bar = ({ value, max, color = 'from-blue-600 to-cyan-500' }) => (
  <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
    <div
      className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-700`}
      style={{ width: `${max > 0 ? Math.min(100, (value / max) * 100) : 0}%` }}
    />
  </div>
);

/* ── KPICard ── */
const KPICard = ({ icon: Icon, label, value, sub, color }) => {
  const themes = {
    blue:   { bg: 'bg-[#003399]/5',  border: 'border-[#003399]/10', text: 'text-[#003399]' },
    cyan:   { bg: 'bg-[#00A9CE]/5',  border: 'border-[#00A9CE]/10', text: 'text-[#00A9CE]' },
    green:  { bg: 'bg-emerald-50',   border: 'border-emerald-100',  text: 'text-emerald-600' },
    amber:  { bg: 'bg-amber-50',     border: 'border-amber-100',    text: 'text-amber-600' },
    indigo: { bg: 'bg-indigo-50',    border: 'border-indigo-100',   text: 'text-indigo-600' },
    rose:   { bg: 'bg-rose-50',      border: 'border-rose-100',     text: 'text-rose-600' },
    violet: { bg: 'bg-violet-50',    border: 'border-violet-100',   text: 'text-violet-600' },
  };
  const t = themes[color] || themes.blue;
  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center gap-4 group">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${t.bg} ${t.border} ${t.text} transition-transform group-hover:scale-110 flex-shrink-0`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-2xl font-black leading-tight ${t.text} tracking-tighter`}>{value}</p>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{label}</p>
        {sub && <p className="text-[9px] text-slate-400 font-medium mt-0.5 whitespace-nowrap">{sub}</p>}
      </div>
    </div>
  );
};

/* ── Growth badge ── */
const GrowthBadge = ({ label, value, color }) => (
  <div className={`rounded-xl border p-3 text-center ${color}`}>
    <div className="flex items-center justify-center gap-1 mb-0.5">
      <ArrowUpRight className="w-3 h-3" />
      <span className="text-lg font-black leading-none">{value}%</span>
    </div>
    <p className="text-[10px] font-semibold opacity-70 leading-none">{label}</p>
  </div>
);

/* ── Section panel ── */
const Panel = ({ title, icon: Icon, sub, right, children, color = '#003399' }) => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg flex items-center justify-center border"
          style={{ backgroundColor: `${color}15`, borderColor: `${color}30` }}>
          <Icon className="w-3.5 h-3.5" style={{ color }} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-800 leading-none">{title}</h3>
          {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
        </div>
      </div>
      {right && <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{right}</span>}
    </div>
    <div className="p-5">{children}</div>
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
  const [overview, setOverview]             = useState({});
  const [trends, setTrends]                 = useState({});
  const [topColleges, setTopColleges]       = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [industryStats, setIndustryStats]   = useState([]);
  const [updated, setUpdated]               = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiCall('/super-admin/analytics');
      const payload = res?.analytics ?? res?.data ?? res;
      if (!payload || typeof payload !== 'object') {
        setError('Unexpected response format from server.');
        return;
      }
      setOverview(payload.overview             || {});
      setTrends(payload.trends                 || {});
      setTopColleges(payload.topColleges       || []);
      setRecentActivity(payload.recentActivity || []);
      setIndustryStats(payload.topIndustries   || payload.industryStats || []);
      setUpdated(new Date());
    } catch (err) {
      setError(err?.message || 'Could not load analytics — check your connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, [load]);

  if (loading && !updated) return <AnalyticsSkeleton layout={SuperAdminDashboardLayout} />;

  /* ── derived numbers ── */
  const totalColleges       = Number(overview?.totalColleges)       || 0;
  const totalStudents       = Number(overview?.totalStudents)       || 0;
  const totalCompanies      = Number(overview?.totalCompanies)      || 0;
  const totalJobs           = Number(overview?.totalJobs)           || 0;
  const totalCourses        = Number(overview?.totalCourses)        || 0;
  const activeCourses       = Number(overview?.activeCourses)       || 0;
  const totalEnrollments    = Number(overview?.totalEnrollments)    || 0;
  const completedEnrollments= Number(overview?.completedEnrollments)|| 0;
  const placedStudents      = Number(overview?.placedStudents)      || 0;
  const placementRate       = Number(overview?.placementRate)       || 0;

  const enrollmentCompletionRate = pct(completedEnrollments, Math.max(totalEnrollments, 1));
  const medals = ['🥇', '🥈', '🥉'];
  const maxPlacements = topColleges[0]?.placements ?? 1;

  return (
    <SuperAdminDashboardLayout>
      <div className="px-6 py-4 md:px-8 md:py-6 space-y-5 font-sans">

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span className="w-2 h-8 bg-gradient-to-b from-[#003399] to-[#00A9CE] rounded-full" />
              Platform Analytics
            </h1>
            <p className="text-sm text-slate-400 mt-1 font-medium flex items-center gap-2">
              Live data · auto-refreshes every 60s
              {updated && (
                <span className="font-mono text-[10px] text-[#00A9CE] font-bold">
                  <Clock className="inline w-3 h-3 mr-0.5" />{updated.toLocaleTimeString()}
                </span>
              )}
            </p>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
          </div>
        )}

        {/* ── KPI Strip (8 cards, no applications) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard icon={Building2}     label="Colleges"         value={fmt(totalColleges)}     sub="registered"                    color="blue"   />
          <KPICard icon={GraduationCap} label="Students"         value={fmt(totalStudents)}     sub="platform-wide"                 color="cyan"   />
          <KPICard icon={Briefcase}     label="Companies"        value={fmt(totalCompanies)}    sub="partnered"                     color="indigo" />
          <KPICard icon={BarChart3}     label="Active Jobs"      value={fmt(totalJobs)}         sub="live opportunities"            color="amber"  />
          <KPICard icon={BookOpen}      label="Total Courses"    value={fmt(totalCourses)}      sub={`${activeCourses} active`}     color="blue"   />
          <KPICard icon={PlayCircle}    label="Enrollments"      value={fmt(totalEnrollments)}  sub={`${fmt(completedEnrollments)} completed`} color="cyan" />
          <KPICard icon={CheckCircle2}  label="Completion Rate"  value={`${enrollmentCompletionRate}%`} sub="of all enrollments"   color="green"  />
          <KPICard icon={UserCheck}     label="Placement Rate"   value={`${placementRate}%`}    sub={`${fmt(placedStudents)} placed`} color="violet" />
        </div>

        {/* ── Growth Trends ── */}
        {Object.keys(trends).length > 0 && (
          <Panel title="Growth Trends" icon={TrendingUp} sub="Month-over-month estimates" color="#003399">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <GrowthBadge label="Colleges"  value={trends.collegesGrowth  ?? 0} color="bg-blue-50 border-blue-100 text-blue-700" />
              <GrowthBadge label="Students"  value={trends.studentsGrowth  ?? 0} color="bg-cyan-50 border-cyan-100 text-cyan-700" />
              <GrowthBadge label="Companies" value={trends.companiesGrowth ?? 0} color="bg-indigo-50 border-indigo-100 text-indigo-700" />
              <GrowthBadge label="Jobs"      value={trends.jobsGrowth      ?? 0} color="bg-amber-50 border-amber-100 text-amber-700" />
            </div>
          </Panel>
        )}

        {/* ── Row: Top Colleges + Industry ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          <Panel title="Top Colleges by Students" icon={Award} sub="Ranked by enrolled students" right={`${topColleges.length} shown`}>
            {topColleges.length === 0 ? <Empty text="No college data yet" /> : (
              <div className="space-y-3">
                {topColleges.map((col, i) => (
                  <div key={col.name || i}>
                    <div className="flex items-center justify-between mb-1 gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm w-5 text-center flex-shrink-0">
                          {i < 3 ? medals[i] : (
                            <span className="w-5 h-5 rounded-md bg-blue-100 text-blue-600 text-[9px] font-black flex items-center justify-center">{i + 1}</span>
                          )}
                        </span>
                        <span className="text-xs font-semibold text-gray-800 truncate">{col.name}</span>
                      </div>
                      <span className="text-xs font-black text-[#003399] flex-shrink-0">{col.students ?? 0} students</span>
                    </div>
                    <Bar value={col.students ?? 0} max={Math.max(topColleges[0]?.students ?? 1, 1)} color="from-[#003399] to-[#00A9CE]" />
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Companies by Industry" icon={Briefcase} sub="Distribution across sectors" right={`${totalCompanies} total`}>
            {industryStats.length === 0 ? <Empty text="No industry data yet" /> : (
              <div className="space-y-3">
                {industryStats.map((ind, i) => {
                  const count = Number(ind.companies ?? ind.count ?? 0);
                  const name  = ind.name ?? ind.industry ?? ind._id ?? `Industry ${i + 1}`;
                  const p     = pct(count, Math.max(totalCompanies, 1));
                  return (
                    <div key={name}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-700 truncate max-w-[160px]">{name}</span>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-[10px] text-gray-400">{count}</span>
                          <span className="text-xs font-black text-[#00A9CE] w-8 text-right">{p}%</span>
                        </div>
                      </div>
                      <Bar value={count} max={Math.max(totalCompanies, 1)} color="from-cyan-500 to-blue-500" />
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>
        </div>

        {/* ── Row: Course Overview + Recent Activity ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          <Panel title="Course Overview" icon={BookOpen} sub="Courses and enrollment health" color="#003399">
            <div className="space-y-4">
              {[
                { label: 'Active Courses',      active: activeCourses,        total: Math.max(totalCourses, 1),     p: pct(activeCourses, Math.max(totalCourses,1)),                          color: 'from-[#003399] to-[#00A9CE]' },
                { label: 'Completed Enrollments', active: completedEnrollments, total: Math.max(totalEnrollments, 1), p: pct(completedEnrollments, Math.max(totalEnrollments, 1)),             color: 'from-emerald-500 to-green-400' },
              ].map(row => (
                <div key={row.label}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-medium text-gray-600">{row.label}</span>
                    <span className="text-xs font-black text-[#003399]">{row.p}%</span>
                  </div>
                  <Bar value={row.active} max={row.total} color={row.color} />
                  <p className="text-[10px] text-gray-400 mt-0.5">{fmt(row.active)} of {fmt(row.total)}</p>
                </div>
              ))}
              <div className="pt-3 border-t border-gray-100 grid grid-cols-3 gap-2">
                {[
                  { label: 'Total Courses',  value: totalCourses,          color: 'bg-blue-50 border-blue-100 text-blue-700' },
                  { label: 'Active',         value: activeCourses,         color: 'bg-cyan-50 border-cyan-100 text-cyan-700' },
                  { label: 'Enrollments',    value: totalEnrollments,      color: 'bg-indigo-50 border-indigo-100 text-indigo-700' },
                ].map(({ label, value, color }) => (
                  <div key={label} className={`rounded-xl p-3 text-center border ${color}`}>
                    <p className="text-lg font-black leading-none">{fmt(value)}</p>
                    <p className="text-[10px] font-bold opacity-60 mt-1">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </Panel>

          <Panel title="Recent Activity" icon={Bell} sub="Latest platform events" right="Live" color="#00A9CE">
            {recentActivity.length === 0 ? <Empty text="No recent activity" /> : (
              <div className="space-y-2">
                {recentActivity.slice(0, 8).map((act, i) => (
                  <div key={i} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="w-7 h-7 rounded-lg bg-[#003399]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Activity className="w-3.5 h-3.5 text-[#003399]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 leading-snug">{act.event}</p>
                      {act.college && <p className="text-[10px] text-[#003399] font-medium truncate">{act.college}</p>}
                    </div>
                    <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap flex-shrink-0">{act.date}</span>
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