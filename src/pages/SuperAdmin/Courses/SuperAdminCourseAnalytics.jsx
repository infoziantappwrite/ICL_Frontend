// pages/SuperAdmin/Courses/SuperAdminCourseAnalytics.jsx
// FIXED:
//  1. Destructures from analytics.performance (not root level)
//  2. Renders: performance.avgDaysToComplete
//  3. Renders: trends.enrollmentTrend (30-day chart)
//  4. Renders: trends.recentEnrollments
//  5. Renders: moduleStats[] (module-wise completion)
//  6. Renders: topPerformers[] (top 10 students)
//  7. Renders: revenue.total + currency
//  8. Renders: course.trainer name/email, startDate, endDate, duration, price

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  BarChart3, Users, CheckCircle2, Award, TrendingUp, RefreshCw,
  AlertCircle, BookOpen, Activity, Target, Layers, Calendar,
  DollarSign, User, Clock, Zap, Star, BarChart2,
} from 'lucide-react';
import SuperAdminDashboardLayout from '../../../components/layout/SuperAdminDashboardLayout';
import { AnalyticsSkeleton } from '../../../components/common/SkeletonLoader';
import { superAdminCourseAPI } from '../../../api/Api';

/* ─── helpers ─────────────────────────────── */
const fmt = (n) => n == null ? '0' : n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

/* ─── Section heading ─────────────────────── */
const SHead = ({ icon: Icon, title, sub }) => (
  <div className="flex items-center gap-2 mb-4">
    <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg,#003399,#00A9CE)' }}>
      <Icon className="w-3 h-3 text-white" />
    </div>
    <div>
      <h3 className="text-sm font-bold text-gray-800 leading-none">{title}</h3>
      {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

/* ─── Stat pill ───────────────────────────── */
const StatPill = ({ icon: Icon, label, value, sub, color }) => {
  const c = {
    blue:   'bg-blue-50 border-blue-100 text-blue-600',
    cyan:   'bg-cyan-50 border-cyan-100 text-cyan-600',
    indigo: 'bg-indigo-50 border-indigo-100 text-indigo-600',
    violet: 'bg-violet-50 border-violet-100 text-violet-700',
    green:  'bg-green-50 border-green-100 text-green-600',
    amber:  'bg-amber-50 border-amber-100 text-amber-600',
    rose:   'bg-rose-50 border-rose-100 text-rose-600',
  }[color] || 'bg-blue-50 border-blue-100 text-blue-600';

  return (
    <div className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border ${c}`}>
      <div className="w-9 h-9 rounded-xl bg-white/60 flex items-center justify-center flex-shrink-0 shadow-sm">
        <Icon className="w-4 h-4 text-current" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xl font-black leading-none">{value}</p>
        <p className="text-[10px] font-bold opacity-70 mt-0.5 leading-none">{label}</p>
        {sub && <p className="text-[9px] opacity-50 mt-0.5 leading-none">{sub}</p>}
      </div>
    </div>
  );
};

/* ─── Progress bar ────────────────────────── */
const ProgressBar = ({ label, value, max, color, count }) => {
  const p = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs font-semibold text-gray-700 truncate max-w-[180px]">{label}</span>
        <span className="text-xs font-black text-gray-800 flex-shrink-0 ml-2">
          {count} <span className="text-gray-400 font-normal">({p}%)</span>
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${p}%` }} />
      </div>
    </div>
  );
};

/* ─── Mini trend bar (enrollment chart) ───── */
const TrendChart = ({ data }) => {
  if (!data?.length) return <p className="text-xs text-gray-400 py-4 text-center">No trend data available</p>;
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div className="flex items-end gap-1 h-16">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
          <div
            className="w-full rounded-t bg-gradient-to-t from-[#003399] to-[#00A9CE] opacity-80 group-hover:opacity-100 transition-all"
            style={{ height: `${Math.max(4, (d.count / max) * 56)}px` }}
          />
          {/* tooltip */}
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] rounded px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
            {d.date}: {d.count}
          </div>
        </div>
      ))}
    </div>
  );
};

/* ══════════════════════════════════════════ */
const SuperAdminCourseAnalytics = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAnalytics = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await superAdminCourseAPI.getCourseAnalytics(courseId);
      if (res.success) setAnalytics(res.data);
      else setError(res.message || 'Failed to load analytics');
    } catch (err) {
      setError(err.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (courseId) fetchAnalytics();
  }, [courseId]);

  if (loading) return <AnalyticsSkeleton layout={SuperAdminDashboardLayout} />;

  if (error || !analytics) {
    return (
      <SuperAdminDashboardLayout>
        <div className="p-6 md:p-8 font-sans">
          <div className="mb-6">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span className="w-2 h-8 bg-gradient-to-b from-[#003399] to-[#00A9CE] rounded-full" />
              Course Analytics
            </h1>
            <p className="text-sm text-slate-400 font-medium mt-1">Insights and performance metrics</p>
          </div>
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <p className="text-sm font-black text-gray-800">{error || 'Analytics not found'}</p>
            <p className="text-xs text-gray-400 mt-1 mb-6">We couldn't find analytics for this specific course</p>
            <button
              onClick={() => navigate('/dashboard/super-admin/courses')}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#003399] text-white text-xs font-black rounded-xl shadow-lg shadow-blue-500/10 active:scale-95 transition-all"
            >
              Go to Courses List
            </button>
          </div>
        </div>
      </SuperAdminDashboardLayout>
    );
  }

  // ✅ FIXED: correct destructuring — performance is nested
  const {
    course,
    enrollments,
    performance,
    trends,
    moduleStats,
    topPerformers,
    revenue,
  } = analytics;

  // ✅ FIXED: pull fields from performance object (not root)
  const {
    completionRate    = 0,
    averageProgress   = 0,
    avgDaysToComplete = 0,
    certificatesIssued = 0,
    recentCompletions  = 0,
  } = performance || {};

  const total = enrollments?.total || 0;

  return (
    <SuperAdminDashboardLayout>
      <div className="px-6 py-4 md:px-8 md:py-6 space-y-5 font-sans">

        {/* Header */}
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span className="w-2 h-8 bg-gradient-to-b from-[#003399] to-[#00A9CE] rounded-full" />
              {course?.title || 'Course Analytics'}
            </h1>
            <p className="text-sm text-slate-400 font-medium mt-1">{course?.category} · {course?.level}</p>
          </div>
          <button
            onClick={fetchAnalytics}
            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50 transition-all self-start sm:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        {/* ══ COURSE INFO (trainer, dates, price) — was missing ══ */}
        {course && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <SHead icon={BookOpen} title="Course Details" sub="Trainer, schedule and pricing info" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {course.trainer && (
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div className="flex items-center gap-1.5 mb-1">
                    <User className="w-3 h-3 text-[#003399]" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Trainer</span>
                  </div>
                  <p className="text-xs font-bold text-slate-800 truncate">{course.trainer.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{course.trainer.email}</p>
                </div>
              )}
              {(course.startDate || course.endDate) && (
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Calendar className="w-3 h-3 text-[#003399]" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Schedule</span>
                  </div>
                  <p className="text-xs font-bold text-slate-800">{fmtDate(course.startDate)}</p>
                  <p className="text-[10px] text-slate-400">→ {fmtDate(course.endDate)}</p>
                </div>
              )}
              {course.duration && (
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Clock className="w-3 h-3 text-[#003399]" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Duration</span>
                  </div>
                  <p className="text-xs font-bold text-slate-800">
                    {typeof course.duration === 'object'
                      ? [course.duration.hours && `${course.duration.hours}h`, course.duration.weeks && `${course.duration.weeks}w`].filter(Boolean).join(' / ') || '—'
                      : `${course.duration} hrs`}
                  </p>
                  {avgDaysToComplete > 0 && <p className="text-[10px] text-slate-400">avg {avgDaysToComplete}d to complete</p>}
                </div>
              )}
              {revenue != null && (
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div className="flex items-center gap-1.5 mb-1">
                    <DollarSign className="w-3 h-3 text-[#003399]" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Revenue</span>
                  </div>
                  <p className="text-xs font-bold text-slate-800">
                    {revenue.currency || 'INR'} {fmt(revenue.total)}
                  </p>
                  <p className="text-[10px] text-slate-400">{total} enrollments</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ STATS PILLS — now from performance.* (was undefined before) ══ */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            <StatPill icon={Users}        label="Total Enrolled"   value={fmt(total)}              sub={`${enrollments?.active || 0} active`}      color="blue"   />
            <StatPill icon={TrendingUp}   label="Completion Rate"  value={`${completionRate}%`}    sub={`${enrollments?.completed || 0} done`}      color="green"  />
            <StatPill icon={Activity}     label="Avg. Progress"    value={`${averageProgress}%`}   sub="across all students"                        color="indigo" />
            <StatPill icon={Award}        label="Certificates"     value={fmt(certificatesIssued)} sub={`${recentCompletions} last 30d`}            color="amber"  />
            <StatPill icon={Clock}        label="Avg Days"         value={`${avgDaysToComplete}d`} sub="to complete"                                color="violet" />
            <StatPill icon={Zap}          label="Recent (7d)"      value={fmt(trends?.recentEnrollments ?? 0)} sub="new enrollments"                color="cyan"   />
          </div>
        </div>

        {/* ══ MAIN GRID ══ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Enrollment Breakdown */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <SHead icon={Target} title="Enrollment Breakdown" sub="Distribution across all students" />
            <div className="space-y-3.5">
              <ProgressBar label="In Progress" value={enrollments?.active || 0}    max={total} count={enrollments?.active || 0}    color="bg-gradient-to-r from-blue-500 to-cyan-500" />
              <ProgressBar label="Completed"   value={enrollments?.completed || 0} max={total} count={enrollments?.completed || 0} color="bg-gradient-to-r from-green-500 to-emerald-500" />
              <ProgressBar label="Pending"     value={enrollments?.pending || 0}   max={total} count={enrollments?.pending || 0}   color="bg-amber-400" />
              <ProgressBar label="Dropped"     value={enrollments?.dropped || 0}   max={total} count={enrollments?.dropped || 0}   color="bg-gray-300" />
            </div>
          </div>

          {/* Performance Summary */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <SHead icon={BarChart3} title="Performance Summary" sub="Key metrics at a glance" />
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100 rounded-xl p-4 text-center mb-3">
              <div className="text-4xl font-black text-blue-600 mb-0.5">{completionRate}%</div>
              <p className="text-xs font-bold text-blue-500">Overall Completion Rate</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Avg Progress',   value: `${averageProgress}%`,   color: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
                { label: 'Certs Issued',   value: fmt(certificatesIssued),  color: 'bg-violet-50 text-violet-700 border-violet-100' },
                { label: 'Last 30 Days',   value: fmt(recentCompletions),   color: 'bg-amber-50 text-amber-700 border-amber-100' },
                { label: 'Avg Days Done',  value: `${avgDaysToComplete}d`,  color: 'bg-rose-50 text-rose-700 border-rose-100' },
                { label: 'Total Enrolled', value: fmt(total),               color: 'bg-gray-50 text-gray-700 border-gray-200' },
                { label: 'Recent 7d',      value: fmt(trends?.recentEnrollments ?? 0), color: 'bg-cyan-50 text-cyan-700 border-cyan-100' },
              ].map(({ label, value, color }) => (
                <div key={label} className={`rounded-xl p-3 text-center border ${color}`}>
                  <div className="text-lg font-black leading-none">{value}</div>
                  <div className="text-[10px] font-semibold opacity-60 mt-1 leading-tight">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══ ENROLLMENT TREND CHART — was entirely missing ══ */}
        {trends?.enrollmentTrend?.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <SHead icon={BarChart2} title="Enrollment Trend (Last 30 Days)" sub="Daily enrollments over the past month" />
            <TrendChart data={trends.enrollmentTrend} />
            <p className="text-[10px] text-gray-400 mt-2 text-center">Hover bars for daily counts</p>
          </div>
        )}

        {/* ══ MODULE STATS — was entirely missing ══ */}
        {moduleStats?.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <SHead icon={Layers} title="Module Progress" sub="Completion rate per module" />
            <div className="space-y-3">
              {moduleStats.map((m, i) => (
                <ProgressBar
                  key={m.moduleName || m._id || i}
                  label={m.moduleName || m._id || `Module ${i + 1}`}
                  value={m.completedCount || 0}
                  max={m.totalStudents || 1}
                  count={`${m.completedCount || 0}/${m.totalStudents || 0}`}
                  color="bg-gradient-to-r from-[#003399] to-[#00A9CE]"
                />
              ))}
            </div>
          </div>
        )}

        {/* ══ TOP PERFORMERS — was entirely missing ══ */}
        {topPerformers?.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <SHead icon={Star} title="Top Performers" sub="Top 10 students by progress" />
            <div className="space-y-1.5">
              {topPerformers.map((s, i) => (
                <div key={s._id || i} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#003399] to-[#00A9CE] flex items-center justify-center text-white text-[9px] font-black flex-shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{s.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{s.email}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {s.completedAt && (
                      <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded-md">✓ Done</span>
                    )}
                    <span className="text-xs font-black text-[#003399]">{s.progress}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ QUICK ACTIONS ══ */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <SHead icon={Layers} title="Quick Actions" sub="Navigate to related sections" />
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => navigate(`/dashboard/super-admin/courses/${courseId}/enrollments`)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#003399] hover:bg-[#002d8b] text-white text-xs font-black rounded-xl shadow-sm hover:scale-[1.02] transition-all"
            >
              <Users className="w-3.5 h-3.5" /> View Enrollments
            </button>
            <button
              onClick={() => navigate(`/dashboard/super-admin/courses/edit/${courseId}`)}
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 bg-white text-gray-700 text-xs font-semibold rounded-xl hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-all"
            >
              <BookOpen className="w-3.5 h-3.5" /> Edit Course
            </button>
            <button
              onClick={() => navigate('/dashboard/super-admin/courses/assign-batch')}
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 bg-white text-gray-700 text-xs font-semibold rounded-xl hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-all"
            >
              <Target className="w-3.5 h-3.5" /> Assign to Batch
            </button>
          </div>
        </div>

      </div>
    </SuperAdminDashboardLayout>
  );
};

export default SuperAdminCourseAnalytics;