// pages/CollegeAdmin/Courses/CourseAnalytics.jsx
// Admin: Course analytics — enrollment stats, completion rates, certificate count
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  BarChart3, Users, CheckCircle2, Award, TrendingUp, RefreshCw,
  ChevronLeft, AlertCircle, BookOpen, Target, Activity, Send,
} from 'lucide-react';
import CollegeAdminLayout from '../../../components/layout/CollegeAdminLayout';
import { AnalyticsSkeleton } from '../../../components/common/SkeletonLoader';
import { collegeAdminCourseAPI as courseAPI } from '../../../api/Api';

const SHead = ({ icon: Icon, title, color = '#003399' }) => (
  <div className="flex items-center gap-2 mb-5 pb-3 border-b border-slate-100">
    <div
      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 border"
      style={{ backgroundColor: `${color}15`, borderColor: `${color}30` }}
    >
      <Icon className="w-3.5 h-3.5" style={{ color }} />
    </div>
    <h3 className="font-bold text-slate-800 text-sm">{title}</h3>
  </div>
);

const KpiCard = ({ icon: Icon, label, value, sub, color }) => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border"
      style={{ backgroundColor: `${color}12`, borderColor: `${color}25` }}
    >
      <Icon className="w-5 h-5" style={{ color }} />
    </div>
    <div>
      <p className="text-2xl font-black text-slate-900 leading-none">{value}</p>
      <p className="text-xs font-semibold text-slate-700 mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

const ProgressBar = ({ label, value, max, color, count }) => {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <span className="text-sm font-bold text-slate-900">
          {count} <span className="text-slate-400 font-normal">({pct}%)</span>
        </span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

const CourseAnalytics = () => {
  const { courseId } = useParams();
  const navigate     = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');

  useEffect(() => { fetchAnalytics(); }, [courseId]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await courseAPI.getCourseAnalytics(courseId);
      if (res.success) setAnalytics(res.data);
      else setError(res.message || 'Failed to load analytics');
    } catch (err) {
      setError(err.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <AnalyticsSkeleton layout={CollegeAdminLayout} />;

  if (error || !analytics) {
    return (
      <CollegeAdminLayout>
        <div className="px-6 py-4 md:px-8 md:py-6">
          <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center border border-red-100">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <p className="text-slate-600 font-medium">{error || 'Analytics not available'}</p>
            <button
              onClick={() => navigate('/dashboard/college-admin/courses')}
              className="inline-flex items-center gap-2 text-sm text-[#003399] font-bold hover:underline"
            >
              <ChevronLeft className="w-4 h-4" /> Back to Courses
            </button>
          </div>
        </div>
      </CollegeAdminLayout>
    );
  }

  const { course, enrollments, completionRate, averageProgress, certificatesIssued, recentCompletions } = analytics;
  const total = enrollments?.total || 0;

  return (
    <CollegeAdminLayout>
      <div className="px-6 py-4 md:px-8 md:py-6 space-y-5 font-sans">

        {/* ── Header ─────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span className="w-2 h-8 bg-gradient-to-b from-[#003399] to-[#00A9CE] rounded-full" />
              Course Analytics
            </h1>
            <p className="text-sm text-slate-400 mt-1 font-medium">
              {course.title} · {course.category} · {course.level}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchAnalytics}
              className="inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-700 text-[11px] font-black uppercase tracking-wider px-4 py-2.5 rounded-xl hover:bg-slate-50 transition-all shadow-sm active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
            <button
              onClick={() => navigate('/dashboard/college-admin/courses')}
              className="inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-700 text-[11px] font-black uppercase tracking-wider px-4 py-2.5 rounded-xl hover:bg-slate-50 transition-all shadow-sm active:scale-95"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Back
            </button>
          </div>
        </div>

        {/* ── KPI Cards ──────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard icon={Users}      label="Total Enrollments" value={total}                  sub={`${enrollments?.active || 0} currently active`}               color="#003399" />
          <KpiCard icon={TrendingUp} label="Completion Rate"   value={`${completionRate}%`}   sub={`${enrollments?.completed || 0} of ${total} completed`}        color="#16a34a" />
          <KpiCard icon={Activity}   label="Avg. Progress"     value={`${averageProgress}%`}  sub="Across all enrolled students"                                  color="#2563eb" />
          <KpiCard icon={Award}      label="Certificates"      value={certificatesIssued}     sub={`${recentCompletions} in last 30 days`}                        color="#d97706" />
        </div>

        {/* ── Detail Cards ───────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Enrollment Status Breakdown */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <SHead icon={Target} title="Enrollment Status Breakdown" />
            <div className="space-y-4">
              <ProgressBar label="In Progress"         value={enrollments?.active || 0}    max={total} count={enrollments?.active || 0}    color="bg-gradient-to-r from-[#003399] to-[#00A9CE]" />
              <ProgressBar label="Completed"           value={enrollments?.completed || 0} max={total} count={enrollments?.completed || 0} color="bg-gradient-to-r from-green-500 to-emerald-500" />
              <ProgressBar label="Pending (Not Started)" value={enrollments?.pending || 0}   max={total} count={enrollments?.pending || 0}   color="bg-amber-400" />
              <ProgressBar label="Dropped"             value={enrollments?.dropped || 0}   max={total} count={enrollments?.dropped || 0}   color="bg-slate-300" />
            </div>
            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-center gap-5 flex-wrap">
              {[
                { label: 'Active',    count: enrollments?.active || 0,    color: 'bg-[#003399]' },
                { label: 'Completed', count: enrollments?.completed || 0, color: 'bg-green-500' },
                { label: 'Pending',   count: enrollments?.pending || 0,   color: 'bg-amber-400' },
                { label: 'Dropped',   count: enrollments?.dropped || 0,   color: 'bg-slate-300' },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
                  <span className="text-xs text-slate-600">{s.label} <strong className="text-slate-800">({s.count})</strong></span>
                </div>
              ))}
            </div>
          </div>

          {/* Performance Summary */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <SHead icon={BarChart3} title="Performance Summary" />
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-2xl p-5 text-center">
                <div className="text-4xl font-black text-green-600 mb-1">{completionRate}%</div>
                <p className="text-sm text-green-700 font-semibold">Overall Completion Rate</p>
                <p className="text-xs text-green-500 mt-1">{enrollments?.completed || 0} of {total} students completed</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: `${averageProgress}%`, label: 'Avg Progress',  bg: 'bg-[#003399]/5',  text: 'text-[#003399]',   sub: 'text-[#00A9CE]' },
                  { value: certificatesIssued,     label: 'Certs Issued',  bg: 'bg-purple-50',    text: 'text-purple-700',  sub: 'text-purple-400' },
                  { value: recentCompletions,      label: 'Last 30 Days',  bg: 'bg-amber-50',     text: 'text-amber-700',   sub: 'text-amber-400'  },
                  { value: total,                  label: 'Total Enrolled', bg: 'bg-slate-50',     text: 'text-slate-700',   sub: 'text-slate-400'  },
                ].map(s => (
                  <div key={s.label} className={`${s.bg} rounded-xl p-4 text-center`}>
                    <div className={`text-2xl font-black ${s.text}`}>{s.value}</div>
                    <div className={`text-xs mt-1 font-medium ${s.sub}`}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Quick Actions ──────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <SHead icon={Target} title="Quick Actions" />
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate(`/dashboard/college-admin/courses/${courseId}/enrollments`)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#003399] text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-[#002d8b] transition-all shadow-md shadow-blue-500/10 active:scale-95"
            >
              <Users className="w-3.5 h-3.5" /> View All Enrollments
            </button>
            <button
              onClick={() => navigate('/dashboard/college-admin/courses/assign-batch')}
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider hover:border-[#003399]/30 hover:text-[#003399] transition-all active:scale-95"
            >
              <Send className="w-3.5 h-3.5" /> Assign to Batch
            </button>
          </div>
        </div>

      </div>
    </CollegeAdminLayout>
  );
};

export default CourseAnalytics;