// pages/SuperAdmin/Courses/SuperAdminCourseAnalytics.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  BarChart3, Users, CheckCircle2, Award, TrendingUp, RefreshCw,
  AlertCircle, BookOpen, Activity, Target, ArrowLeft, Layers,
} from 'lucide-react';
import SuperAdminDashboardLayout from '../../../components/layout/SuperAdminDashboardLayout';
import { AnalyticsSkeleton } from '../../../components/common/SkeletonLoader';
import { superAdminCourseAPI } from '../../../api/Api';

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
    blue: 'bg-blue-50 border-blue-100 text-blue-600',
    cyan: 'bg-cyan-50 border-cyan-100 text-cyan-600',
    indigo: 'bg-indigo-50 border-indigo-100 text-indigo-600',
    violet: 'bg-violet-50 border-violet-100 text-violet-700',
    green: 'bg-green-50 border-green-100 text-green-600',
    amber: 'bg-amber-50 border-amber-100 text-amber-600',
  }[color] || 'bg-blue-50 border-blue-100 text-blue-600';

  return (
    <div className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border ${c}`}>
      <div className="w-9 h-9 rounded-xl bg-white/60 flex items-center justify-center flex-shrink-0 shadow-sm">
        <Icon className="w-4.5 h-4.5 text-current" />
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
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs font-semibold text-gray-700">{label}</span>
        <span className="text-xs font-black text-gray-800">
          {count} <span className="text-gray-400 font-normal">({pct}%)</span>
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

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
            <p className="text-xs text-gray-400 mt-1 mb-6">We couldn\'t find analytics for this specific course</p>
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

  const { course, enrollments, completionRate, averageProgress, certificatesIssued, recentCompletions } = analytics;
  const total = enrollments?.total || 0;

  return (
    <SuperAdminDashboardLayout>
      <div className="px-6 py-4 md:px-8 md:py-6 space-y-5 font-sans">

        {/* Brand Header */}
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span className="w-2 h-8 bg-gradient-to-b from-[#003399] to-[#00A9CE] rounded-full" />
              {course?.title || 'Course Analytics'}
            </h1>
            <p className="text-sm text-slate-400 font-medium mt-1">{course?.category} · {course?.level}</p>
          </div>
        </div>

        {/* ══ STATS PILLS ══ */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3 mb-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <StatPill icon={Users} label="Total Enrollments" value={total} sub={`${enrollments?.active || 0} active`} color="blue" />
            <StatPill icon={TrendingUp} label="Completion Rate" value={`${completionRate}%`} sub={`${enrollments?.completed || 0} done`} color="green" />
            <StatPill icon={Activity} label="Avg. Progress" value={`${averageProgress}%`} sub="Across all students" color="indigo" />
            <StatPill icon={Award} label="Certificates" value={certificatesIssued} sub={`${recentCompletions} last 30d`} color="amber" />
          </div>
        </div>

        {/* ══ MAIN GRID ══ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">

          {/* Enrollment Breakdown */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <SHead icon={Target} title="Enrollment Breakdown" sub="Distribution across all students" />
            <div className="space-y-3.5">
              <ProgressBar label="In Progress" value={enrollments?.active || 0} max={total} count={enrollments?.active || 0} color="bg-gradient-to-r from-blue-500 to-cyan-500" />
              <ProgressBar label="Completed" value={enrollments?.completed || 0} max={total} count={enrollments?.completed || 0} color="bg-gradient-to-r from-green-500 to-emerald-500" />
              <ProgressBar label="Pending" value={enrollments?.pending || 0} max={total} count={enrollments?.pending || 0} color="bg-amber-400" />
              <ProgressBar label="Dropped" value={enrollments?.dropped || 0} max={total} count={enrollments?.dropped || 0} color="bg-gray-300" />
            </div>
          </div>

          {/* Performance Summary */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <SHead icon={BarChart3} title="Performance Summary" sub="Key metrics at a glance" />

            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100 rounded-xl p-4 text-center mb-3">
              <div className="text-4xl font-black text-blue-600 mb-0.5">{completionRate}%</div>
              <p className="text-xs font-bold text-blue-500">Overall Completion Rate</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Avg Progress', value: `${averageProgress}%`, color: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
                { label: 'Certs Issued', value: certificatesIssued, color: 'bg-violet-50 text-violet-700 border-violet-100' },
                { label: 'Last 30 Days', value: recentCompletions, color: 'bg-amber-50 text-amber-700 border-amber-100' },
                { label: 'Total Enrolled', value: total, color: 'bg-gray-50 text-gray-700 border-gray-200' },
              ].map(({ label, value, color }) => (
                <div key={label} className={`rounded-xl p-3 text-center border ${color}`}>
                  <div className="text-xl font-black leading-none">{value}</div>
                  <div className="text-[10px] font-semibold opacity-60 mt-1">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

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