// pages/SuperAdmin/Analytics.jsx — Live data from real APIs, no mock fallback
import { useState, useEffect, useCallback } from 'react';
import apiCall from '../../api/Api';
import {
  BarChart3, Building2, Users, Briefcase, GraduationCap,
  Award, Activity, TrendingUp, RefreshCw, Clock,
  CircleCheck, CircleX, BookOpen, AlertCircle, ChevronRight,
  ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';

/* ── helpers ──────────────────────────────────────────────── */
const Bar = ({ value, max, className = '' }) => (
  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
    <div
      className={`h-2 rounded-full transition-all duration-700 ${className || 'bg-gradient-to-r from-blue-600 to-cyan-500'}`}
      style={{ width: `${max > 0 ? Math.min(100, (value / max) * 100) : 0}%` }}
    />
  </div>
);

const KpiCard = ({ icon: Icon, label, value, sub, badge, badgeUp }) => (
  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-white/60 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between mb-3">
      <div className="w-11 h-11 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-md">
        <Icon className="w-5 h-5 text-white" />
      </div>
      {badge !== undefined && (
        <span className={`flex items-center gap-0.5 text-xs font-bold px-2 py-1 rounded-full ${
          badgeUp ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
        }`}>
          {badgeUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {badge}
        </span>
      )}
    </div>
    <p className="text-2xl font-black text-gray-900 tabular-nums">
      {typeof value === 'number' ? value.toLocaleString() : (value ?? '—')}
    </p>
    <p className="text-sm font-semibold text-gray-700 mt-0.5">{label}</p>
    {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
  </div>
);

const Panel = ({ title, icon: Icon, children, right }) => (
  <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-sm overflow-hidden">
    <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center">
          <Icon className="w-4 h-4 text-white" />
        </div>
        <h3 className="font-bold text-gray-900 text-sm">{title}</h3>
      </div>
      {right && <div className="text-xs text-gray-400">{right}</div>}
    </div>
    <div className="p-5">{children}</div>
  </div>
);

const Empty = ({ text }) => (
  <div className="py-10 text-center">
    <BarChart3 className="w-10 h-10 text-gray-200 mx-auto mb-2" />
    <p className="text-sm text-gray-400">{text}</p>
  </div>
);

/* ── main component ───────────────────────────────────────── */
const Analytics = () => {
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [stats,    setStats]    = useState(null);
  const [colleges, setColleges] = useState([]);
  const [companies,setCompanies]= useState([]);
  const [updated,  setUpdated]  = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [dashRes, colRes, comRes] = await Promise.allSettled([
        apiCall('/super-admin/dashboard'),
        apiCall('/super-admin/colleges?limit=100&sort=-createdAt'),
        apiCall('/super-admin/companies?limit=200'),
      ]);

      if (dashRes.status === 'fulfilled' && dashRes.value?.success)
        setStats(dashRes.value.data?.stats || dashRes.value.stats || {});

      if (colRes.status === 'fulfilled' && colRes.value?.success)
        setColleges(colRes.value.colleges || []);

      if (comRes.status === 'fulfilled' && comRes.value?.success) {
        const raw = comRes.value.companies || comRes.value.data?.companies || comRes.value.data || [];
        setCompanies(Array.isArray(raw) ? raw : []);
      }

      setUpdated(new Date());
    } catch {
      setError('Could not load analytics — check your connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, [load]);

  if (loading && !stats && !colleges.length) {
    return <LoadingSpinner message="Loading Analytics…" submessage="Fetching live platform data" />;
  }

  /* ── derived numbers ──────────────────────────────────── */
  const totalColleges   = stats?.totalColleges   ?? colleges.length;
  const activeColleges  = stats?.activeColleges  ?? colleges.filter(c => c.isActive).length;
  const totalStudents   = stats?.totalStudents   ?? colleges.reduce((s,c) => s + (c.liveCounts?.studentsCount || 0), 0);
  const totalAdmins     = stats?.totalAdmins     ?? colleges.reduce((s,c) => s + (c.liveCounts?.adminsCount   || 0), 0);
  const totalCompanies  = stats?.totalCompanies  ?? companies.length;
  const activeCompanies = companies.filter(c => c.isActive).length;
  const totalJobs       = stats?.totalJobs       ?? stats?.activeJobs  ?? 0;
  const totalCourses    = stats?.totalCourses    ?? 0;
  const totalApps       = stats?.totalApplications ?? 0;

  /* top colleges by student count */
  const topCols = [...colleges]
    .filter(c => (c.liveCounts?.studentsCount || 0) > 0)
    .sort((a,b) => (b.liveCounts?.studentsCount||0) - (a.liveCounts?.studentsCount||0))
    .slice(0, 7);
  const maxColStudents = topCols[0]?.liveCounts?.studentsCount || 1;

  /* industry breakdown from companies */
  const indMap = {};
  companies.forEach(c => {
    const k = c.industry || 'Other';
    indMap[k] = (indMap[k] || 0) + 1;
  });
  const industries = Object.entries(indMap)
    .map(([name, count]) => ({ name, count, pct: totalCompanies > 0 ? Math.round((count/totalCompanies)*100) : 0 }))
    .sort((a,b) => b.count - a.count)
    .slice(0, 7);
  const maxInd = industries[0]?.count || 1;

  /* health ratios */
  const colActPct = totalColleges ? Math.round((activeColleges/totalColleges)*100)  : 0;
  const comActPct = totalCompanies? Math.round((activeCompanies/totalCompanies)*100): 0;

  return (
    <DashboardLayout title="Analytics">

      {/* ── Banner ─────────────────────────────────────────── */}
      <div className="mb-5">
        <div className="relative bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 rounded-2xl p-6 shadow-xl overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute w-72 h-72 bg-white rounded-full -top-24 -right-24" />
            <div className="absolute w-48 h-48 bg-white rounded-full bottom-0 left-12" />
          </div>
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-white">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold leading-tight">Platform Analytics</h1>
                  <p className="text-blue-100 text-xs">Live data · auto-refreshes every 60 s</p>
                </div>
              </div>
              {updated && (
                <p className="text-blue-200 text-xs flex items-center gap-1.5 mt-1">
                  <Clock className="w-3 h-3" />
                  Last updated {updated.toLocaleTimeString()}
                </p>
              )}
            </div>
            <button
              onClick={load}
              disabled={loading}
              className="self-start sm:self-auto flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
        </div>
      )}

      {/* ── KPI row 1 ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <KpiCard icon={Building2}     label="Total Colleges"  value={totalColleges}  sub={`${activeColleges} active`} />
        <KpiCard icon={GraduationCap} label="Total Students"  value={totalStudents}  sub="across all colleges" />
        <KpiCard icon={Building2}     label="Companies"       value={totalCompanies} sub={`${activeCompanies} active`} />
        <KpiCard icon={Users}         label="College Admins"  value={totalAdmins}    sub="registered" />
      </div>

      {/* ── KPI row 2 ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <KpiCard icon={Briefcase}   label="Active Jobs"    value={totalJobs}     sub="open positions" />
        <KpiCard icon={BookOpen}    label="Courses"        value={totalCourses}  sub="platform-wide" />
        <KpiCard icon={Activity}    label="Applications"   value={totalApps}     sub="total" />
        <KpiCard icon={CircleCheck} label="Active Colleges" value={activeColleges} sub={`${totalColleges - activeColleges} inactive`} />
      </div>

      {/* ── Charts row ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">

        {/* Top colleges */}
        <Panel title="Top Colleges by Students" icon={Award} right={`${topCols.length} shown`}>
          {topCols.length === 0
            ? <Empty text="No student data available yet" />
            : <div className="space-y-4">
                {topCols.map((col, i) => {
                  const cnt   = col.liveCounts?.studentsCount || 0;
                  const adms  = col.liveCounts?.adminsCount   || 0;
                  return (
                    <div key={col._id}>
                      <div className="flex items-center justify-between mb-1.5 gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                            {i+1}
                          </span>
                          <span className="text-sm font-semibold text-gray-800 truncate">{col.name}</span>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className="text-xs text-gray-400">{adms} admin{adms!==1?'s':''}</span>
                          <span className="text-sm font-bold text-blue-600">{cnt.toLocaleString()}</span>
                        </div>
                      </div>
                      <Bar value={cnt} max={maxColStudents} />
                    </div>
                  );
                })}
              </div>
          }
        </Panel>

        {/* Industry distribution */}
        <Panel title="Companies by Industry" icon={Briefcase} right={`${companies.length} total`}>
          {industries.length === 0
            ? <Empty text="No company data available yet" />
            : <div className="space-y-4">
                {industries.map(ind => (
                  <div key={ind.name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-gray-700 truncate">{ind.name}</span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-gray-400">{ind.count}</span>
                        <span className="text-sm font-bold text-blue-600 w-10 text-right">{ind.pct}%</span>
                      </div>
                    </div>
                    <Bar value={ind.count} max={maxInd} />
                  </div>
                ))}
              </div>
          }
        </Panel>
      </div>

      {/* ── Bottom row ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Platform health */}
        <Panel title="Platform Health" icon={Activity}>
          <div className="space-y-5">
            {[
              { label: 'College Activity',  active: activeColleges,  total: totalColleges,  pct: colActPct },
              { label: 'Company Activity',  active: activeCompanies, total: totalCompanies, pct: comActPct },
            ].map(({ label, active, total, pct }) => (
              <div key={label}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-sm font-medium text-gray-700">{label}</span>
                  <span className="text-sm font-bold text-blue-600">{pct}%</span>
                </div>
                <Bar value={active} max={total || 1} />
                <p className="text-xs text-gray-400 mt-1">{active} of {total} active</p>
              </div>
            ))}

            <div className="pt-3 border-t border-gray-100 grid grid-cols-2 gap-3">
              <div className="bg-emerald-50 rounded-xl p-3 text-center">
                <p className="text-xl font-black text-emerald-600">{activeColleges}</p>
                <p className="text-xs text-gray-500">Active Colleges</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-xl font-black text-gray-500">{totalColleges - activeColleges}</p>
                <p className="text-xs text-gray-500">Inactive</p>
              </div>
            </div>
          </div>
        </Panel>

        {/* Recent colleges */}
        <Panel title="Recently Added Colleges" icon={GraduationCap} right={`Latest ${Math.min(colleges.length, 5)}`}>
          {colleges.length === 0
            ? <Empty text="No colleges registered yet" />
            : <div className="space-y-2.5">
                {colleges.slice(0, 5).map(col => (
                  <div key={col._id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-blue-50/50 transition-colors">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {(col.code || col.name || '?').substring(0,2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{col.name}</p>
                      <p className="text-xs text-gray-400">
                        {col.address?.city || '—'} · {(col.liveCounts?.studentsCount || 0).toLocaleString()} students
                      </p>
                    </div>
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${col.isActive ? 'bg-emerald-400' : 'bg-gray-300'}`} />
                  </div>
                ))}
              </div>
          }
        </Panel>

        {/* Quick summary */}
        <Panel title="Quick Summary" icon={TrendingUp}>
          <div className="space-y-2.5">
            {[
              { icon: Building2,     label: 'Colleges',    value: totalColleges,  note: `${activeColleges} active`   },
              { icon: GraduationCap, label: 'Students',    value: totalStudents,  note: 'total'                      },
              { icon: Building2,     label: 'Companies',   value: totalCompanies, note: `${activeCompanies} active`  },
              { icon: Briefcase,     label: 'Open Jobs',   value: totalJobs,      note: 'live'                       },
              { icon: BookOpen,      label: 'Courses',     value: totalCourses,   note: 'platform'                   },
              { icon: Users,         label: 'Admins',      value: totalAdmins,    note: 'college admins'             },
            ].map(({ icon: Icon, label, value, note }) => (
              <div key={label} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{label}</span>
                </div>
                <div className="text-right flex items-center gap-1.5">
                  <span className="text-sm font-bold text-gray-900 tabular-nums">
                    {(value || 0).toLocaleString()}
                  </span>
                  <span className="text-xs text-gray-400">{note}</span>
                </div>
              </div>
            ))}
          </div>
        </Panel>

      </div>
    </DashboardLayout>
  );
};

export default Analytics;