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
    <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
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
    violet: 'bg-violet-50 border-violet-100 text-violet-600',
    green:  'bg-green-50 border-green-100 text-green-600',
    amber:  'bg-amber-50 border-amber-100 text-amber-600',
  }[color] || 'bg-blue-50 border-blue-100 text-blue-600';

  return (
    <div className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border ${c}`}>
      <div className="w-9 h-9 rounded-xl bg-white/60 flex items-center justify-center flex-shrink-0 shadow-sm">
        <Icon className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
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

  useEffect(() => { fetchAnalytics(); }, [courseId]);

  const fetchAnalytics = async () => {
    setLoading(true); setError('');
    try {
      const res = await superAdminCourseAPI.getCourseAnalytics(courseId);
      if (res.success) setAnalytics(res.data);
      else setError(res.message || 'Failed to load analytics');
    } catch (err) { setError(err.message || 'Failed to load'); }
    finally { setLoading(false); }
  };

  if (loading) return <AnalyticsSkeleton layout={SuperAdminDashboardLayout} />;

  if (error || !analytics) return (
    <SuperAdminDashboardLayout>
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center">
          <AlertCircle className="w-6 h-6 text-red-400" />
        </div>
        <p className="text-sm font-semibold text-gray-600">{error || 'Analytics unavailable'}</p>
        <button
          onClick={() => navigate('/dashboard/super-admin/courses')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Courses
        </button>
      </div>
    </SuperAdminDashboardLayout>
  );

  const { course, enrollments, completionRate, averageProgress, certificatesIssued, recentCompletions } = analytics;
  const total = enrollments?.total || 0;

  return (
    <SuperAdminDashboardLayout>

      {/* ══ HERO BANNER ══ */}
      <div className="relative bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 rounded-2xl px-5 py-4 mb-4 shadow-xl shadow-blue-500/20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-10 -right-10 w-44 h-44 bg-white/10 rounded-full" />
          <div className="absolute -bottom-8 left-1/3 w-28 h-28 bg-white/10 rounded-full" />
          <div className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: 'radial-gradient(circle,white 1px,transparent 1px)', backgroundSize: '18px 18px' }} />
        </div>
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <button
                onClick={() => navigate('/dashboard/super-admin/courses')}
                className="text-blue-200 hover:text-white text-[11px] font-semibold flex items-center gap-1 mb-1 transition-colors"
              >
                <ArrowLeft className="w-3 h-3" /> Back to Courses
              </button>
              <h1 className="text-white font-black text-base leading-tight line-clamp-1">{course.title}</h1>
              <p className="text-blue-200 text-[11px] mt-0.5">{course.category} · {course.level}</p>
            </div>
          </div>
          <button
            onClick={fetchAnalytics}
            className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-3 py-2 rounded-xl border border-white/20 transition-all hover:scale-105 flex-shrink-0 self-start sm:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      {/* ══ STATS PILLS ══ */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-3 mb-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <StatPill icon={Users}      label="Total Enrollments" value={total}                  sub={`${enrollments?.active || 0} active`}    color="blue"   />
          <StatPill icon={TrendingUp} label="Completion Rate"   value={`${completionRate}%`}   sub={`${enrollments?.completed || 0} done`}    color="green"  />
          <StatPill icon={Activity}   label="Avg. Progress"     value={`${averageProgress}%`}  sub="Across all students"                      color="indigo" />
          <StatPill icon={Award}      label="Certificates"      value={certificatesIssued}      sub={`${recentCompletions} last 30d`}          color="amber"  />
        </div>
      </div>

      {/* ══ MAIN GRID ══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">

        {/* Enrollment Breakdown */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-4">
          <SHead icon={Target} title="Enrollment Breakdown" sub="Status distribution across all students" />
          <div className="space-y-3.5">
            <ProgressBar label="In Progress" value={enrollments?.active || 0}    max={total} count={enrollments?.active || 0}    color="bg-gradient-to-r from-blue-500 to-cyan-500" />
            <ProgressBar label="Completed"   value={enrollments?.completed || 0} max={total} count={enrollments?.completed || 0} color="bg-gradient-to-r from-green-500 to-emerald-500" />
            <ProgressBar label="Pending"     value={enrollments?.pending || 0}   max={total} count={enrollments?.pending || 0}   color="bg-amber-400" />
            <ProgressBar label="Dropped"     value={enrollments?.dropped || 0}   max={total} count={enrollments?.dropped || 0}   color="bg-gray-300" />
          </div>
        </div>

        {/* Performance Summary */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-4">
          <SHead icon={BarChart3} title="Performance Summary" sub="Key metrics at a glance" />

          {/* Big completion rate */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100 rounded-xl p-4 text-center mb-3">
            <div className="text-4xl font-black text-blue-600 mb-0.5">{completionRate}%</div>
            <p className="text-xs font-bold text-blue-500">Overall Completion Rate</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Avg Progress',   value: `${averageProgress}%`, color: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
              { label: 'Certs Issued',   value: certificatesIssued,    color: 'bg-violet-50 text-violet-700 border-violet-100' },
              { label: 'Last 30 Days',   value: recentCompletions,     color: 'bg-amber-50 text-amber-700 border-amber-100' },
              { label: 'Total Enrolled', value: total,                  color: 'bg-gray-50 text-gray-700 border-gray-200' },
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
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-4">
        <SHead icon={Layers} title="Quick Actions" sub="Navigate to related pages" />
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => navigate(`/dashboard/super-admin/courses/${courseId}/enrollments`)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs font-bold rounded-xl shadow-sm hover:scale-[1.02] transition-all"
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

    </SuperAdminDashboardLayout>
  );
};

export default SuperAdminCourseAnalytics;