// src/pages/SuperAdmin/Analytics.jsx
import { useState, useEffect, useCallback } from 'react';
import apiCall from '../../api/Api';
import {
  BarChart3, Building2, Users, Briefcase, GraduationCap,
  Award, Activity, TrendingUp, Clock,
  CircleCheck, BookOpen, AlertCircle, ArrowUpRight,
  ChevronRight, Star, Zap, UserCheck, CreditCard,
} from 'lucide-react';
import SuperAdminDashboardLayout from '../../components/layout/SuperAdminDashboardLayout';
import { AnalyticsSkeleton } from '../../components/common/SkeletonLoader';

/* ── helpers ── */
const fmt = (n) => n == null ? '0' : n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
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

/* ── KPICard (Mirrors Dashboard Pill style) ── */
const KPICard = ({ icon: Icon, label, value, sub, color }) => {
  const themes = {
    blue:   { bg: 'bg-[#003399]/5',  border: 'border-[#003399]/10', text: 'text-[#003399]' },
    cyan:   { bg: 'bg-[#00A9CE]/5',  border: 'border-[#00A9CE]/10', text: 'text-[#00A9CE]' },
    green:  { bg: 'bg-emerald-50',    border: 'border-emerald-100',  text: 'text-emerald-600' },
    amber:  { bg: 'bg-amber-50',     border: 'border-amber-100',    text: 'text-amber-600' },
    indigo: { bg: 'bg-indigo-50',    border: 'border-indigo-100',   text: 'text-indigo-600' },
    rose:   { bg: 'bg-rose-50',      border: 'border-rose-100',     text: 'text-rose-600' },
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

/* ── Section panel ── */
const Panel = ({ title, icon: Icon, sub, right, children, color = '#003399' }) => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
    
    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
      
      <div className="flex items-center gap-2">
        
        {/* ICON (Dashboard style) */}
        <div
          className="w-6 h-6 rounded-lg flex items-center justify-center border"
          style={{
            backgroundColor: `${color}15`,
            borderColor: `${color}30`,
          }}
        >
          <Icon className="w-3.5 h-3.5" style={{ color }} />
        </div>

        <div>
          <h3 className="text-sm font-bold text-slate-800 leading-none">
            {title}
          </h3>
          {sub && (
            <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>
          )}
        </div>
      </div>

      {right && (
        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
          {right}
        </span>
      )}
    </div>

    <div className="p-5">{children}</div>
  </div>
);

/* ── Empty state ── */
const Empty = ({ text }) => (
  <div className="py-8 text-center">
    <BarChart3 className="w-8 h-8 text-gray-200 mx-auto mb-2" />
    <p className="text-xs text-gray-400">{text}</p>
  </div>
);

/* ══════════════════════════════════════════ */
const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);
  const [colleges, setColleges] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [updated, setUpdated] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [dashRes, colRes, comRes] = await Promise.allSettled([
        apiCall('/super-admin/dashboard'),
        apiCall('/super-admin/colleges?limit=100&sort=-createdAt'),
        apiCall('/super-admin/companies?limit=200'),
      ]);
      if (dashRes.status === 'fulfilled' && dashRes.value?.success)
        setStats(dashRes.value.data?.stats || {});
      if (colRes.status === 'fulfilled' && colRes.value?.success)
        setColleges(colRes.value.colleges || []);
      if (comRes.status === 'fulfilled' && comRes.value?.success) {
        const raw = comRes.value.companies || comRes.value.data?.companies || comRes.value.data || [];
        setCompanies(Array.isArray(raw) ? raw : []);
      }
      setUpdated(new Date());
    } catch { setError('Could not load analytics — check your connection.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); const t = setInterval(load, 60_000); return () => clearInterval(t); }, [load]);

  if (loading && !stats) return <AnalyticsSkeleton layout={SuperAdminDashboardLayout} />;

  /* derived */
  const totalColleges = stats?.totalColleges ?? colleges.length;
  const activeColleges = stats?.activeColleges ?? colleges.filter(c => c.isActive).length;
  const totalStudents = stats?.totalStudents ?? 0;
  const totalAdmins = stats?.totalAdmins ?? 0;
  const totalCompanies = stats?.totalCompanies ?? companies.length;
  const activeCompanies = companies.filter(c => c.isActive).length;
  const totalJobs = stats?.activeJobs ?? 0;
  const totalCourses = stats?.totalCourses ?? 0;
  const totalEnroll = stats?.totalEnrollments ?? 0;

  const colActPct = pct(activeColleges, totalColleges);
  const comActPct = pct(activeCompanies, totalCompanies);
  const enrollPct = pct(totalEnroll, Math.max(totalStudents, 1));

  const topCols = [...colleges]
    .filter(c => (c.liveCounts?.studentsCount || 0) > 0)
    .sort((a, b) => (b.liveCounts?.studentsCount || 0) - (a.liveCounts?.studentsCount || 0))
    .slice(0, 8);
  const maxColStudents = topCols[0]?.liveCounts?.studentsCount || 1;

  const indMap = {};
  companies.forEach(c => { const k = c.industry || 'Other'; indMap[k] = (indMap[k] || 0) + 1; });
  const industries = Object.entries(indMap)
    .map(([name, count]) => ({ name, count, p: pct(count, totalCompanies) }))
    .sort((a, b) => b.count - a.count).slice(0, 7);
  const maxInd = industries[0]?.count || 1;

  const medals = ['🥇', '🥈', '🥉'];

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
              {updated && <span className="font-mono text-[10px] text-[#00A9CE] font-bold"><Clock className="inline w-3 h-3 mr-0.5" />{updated.toLocaleTimeString()}</span>}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
          </div>
        )}

        {/* KPI strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard icon={Building2} label="Colleges" value={fmt(totalColleges)} sub={`${activeColleges} active`} color="blue" />
          <KPICard icon={GraduationCap} label="Students" value={fmt(totalStudents)} sub="platform-wide" color="cyan" />
          <KPICard icon={Briefcase} label="Companies" value={fmt(totalCompanies)} sub={`${activeCompanies} active`} color="indigo" />
          <KPICard icon={Users} label="Admins" value={fmt(totalAdmins)} sub="all accounts" color="amber" />
          <KPICard icon={BarChart3} label="Active Jobs" value={fmt(totalJobs)} sub="live opportunities" color="green" />
          <KPICard icon={BookOpen} label="Courses" value={fmt(totalCourses)} sub="available" color="blue" />
          <KPICard icon={UserCheck} label="Enrollments" value={fmt(totalEnroll)} sub={`${enrollPct}% rate`} color="cyan" />
          <KPICard icon={Activity} label="Active Rate" value={`${colActPct}%`} sub="campus presence" color="rose" />
        </div>

        {/* Row 1: charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">

          {/* Top colleges bar chart */}
          <Panel title="Top Colleges by Students" icon={Award} sub="Ranked by enrollment" right={`${topCols.length} shown`}>
            {topCols.length === 0 ? <Empty text="No student data yet" /> : (
              <div className="space-y-3">
                {topCols.map((col, i) => {
                  const cnt = col.liveCounts?.studentsCount || 0;
                  const adms = col.liveCounts?.adminsCount || 0;
                  return (
                    <div key={col._id}>
                      <div className="flex items-center justify-between mb-1 gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm w-5 text-center flex-shrink-0">
                            {i < 3 ? medals[i] : (
                              <span className="w-5 h-5 rounded-md bg-blue-100 text-blue-600 text-[9px] font-black flex items-center justify-center">
                                {i + 1}
                              </span>
                            )}
                          </span>
                          <span className="text-xs font-semibold text-gray-800 truncate">{col.name}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-[10px] text-gray-400">{adms} admin{adms !== 1 ? 's' : ''}</span>
                          <span className="text-xs font-black text-[#003399]">{cnt.toLocaleString()}</span>
                        </div>
                      </div>
                      <Bar value={cnt} max={maxColStudents} />
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>

          {/* Industry breakdown */}
          <Panel title="Companies by Industry" icon={Briefcase} sub="Distribution across sectors" right={`${companies.length} total`}>
            {industries.length === 0 ? <Empty text="No company data yet" /> : (
              <div className="space-y-3">
                {industries.map(ind => (
                  <div key={ind.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-700 truncate max-w-[160px]">{ind.name}</span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-[10px] text-gray-400">{ind.count}</span>
                        <span className="text-xs font-black text-[#00A9CE] w-8 text-right">{ind.p}%</span>
                      </div>
                    </div>
                    <Bar value={ind.count} max={maxInd} color="from-cyan-500 to-blue-500" />
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>

        {/* Row 2: health + recent colleges + summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Platform health */}
          <Panel title="Platform Health" icon={Activity} sub="Activity rates">
            <div className="space-y-4">
              {[
                { label: 'College Activity', active: activeColleges, total: totalColleges, p: colActPct, color: 'from-[#003399] to-[#00A9CE]' },
                { label: 'Company Activity', active: activeCompanies, total: totalCompanies, p: comActPct, color: 'from-[#00A9CE] to-emerald-400' },
                { label: 'Enrollment Rate', active: totalEnroll, total: Math.max(totalStudents, 1), p: enrollPct, color: 'from-amber-400 to-amber-500' },
              ].map(row => (
                <div key={row.label}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-medium text-gray-600">{row.label}</span>
                    <span className="text-xs font-black text-[#003399]">{row.p}%</span>
                  </div>
                  <Bar value={row.active} max={row.total} color={row.color} />
                  <p className="text-[10px] text-gray-400 mt-0.5">{row.active} of {row.total}</p>
                </div>
              ))}
              <div className="pt-3 border-t border-gray-100 grid grid-cols-2 gap-2">
                <div className="bg-[#003399]/5 rounded-xl p-3 text-center border border-[#003399]/10">
                  <p className="text-xl font-black text-[#003399]">{activeColleges}</p>
                  <p className="text-[10px] text-slate-400 font-bold">Active</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                  <p className="text-xl font-black text-slate-400">{totalColleges - activeColleges}</p>
                  <p className="text-[10px] text-slate-400 font-bold">Inactive</p>
                </div>
              </div>
            </div>
          </Panel>

          {/* Recent colleges */}
          <Panel title="Recently Added" icon={GraduationCap} sub="Latest college registrations" right={`Latest ${Math.min(colleges.length, 5)}`}>
            {colleges.length === 0 ? <Empty text="No colleges yet" /> : (
              <div className="space-y-2">
                {colleges.slice(0, 5).map(col => (
                  <div className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0" style={{ background: 'linear-gradient(135deg,#003399,#00A9CE)"' }}>
                      {(col.code || col.name || '?').substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">{col.name}</p>
                      <p className="text-[10px] text-gray-400">{col.address?.city || '—'} · {(col.liveCounts?.studentsCount || 0)} students</p>
                    </div>
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${col.isActive ? 'bg-[#10b981]' : 'bg-slate-200'}`} />
                  </div>
                ))}
              </div>
            )}
          </Panel>

          {/* Quick summary */}
          <Panel title="Quick Summary" icon={TrendingUp} sub="All platform metrics">
            <div className="space-y-0">
              {[
                { icon: Building2, label: 'Colleges', value: totalColleges, note: `${activeColleges} active`, color: 'text-[#003399]' },
                { icon: GraduationCap, label: 'Students', value: totalStudents, note: 'total', color: 'text-[#00A9CE]' },
                { icon: Building2, label: 'Companies', value: totalCompanies, note: `${activeCompanies} active`, color: 'text-indigo-600' },
                { icon: Briefcase, label: 'Open Jobs', value: totalJobs, note: 'live', color: 'text-amber-600' },
                { icon: BookOpen, label: 'Courses', value: totalCourses, note: 'platform', color: 'text-[#003399]' },
                { icon: Users, label: 'Admins', value: totalAdmins, note: 'all colleges', color: 'text-[#00A9CE]' },
                { icon: Activity, label: 'Enrollments', value: totalEnroll, note: `${enrollPct}% rate`, color: 'text-emerald-600' },

              ].map(({ icon: Icon, label, value, note, color }) => (
                <div key={label} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-3.5 h-3.5 ${color} flex-shrink-0`} />
                    <span className="text-xs text-gray-600">{label}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs font-black ${color}`}>{fmt(value)}</span>
                    <span className="text-[10px] text-gray-400">{note}</span>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

        </div>
      </div>
    </SuperAdminDashboardLayout>
  );
};

export default Analytics;