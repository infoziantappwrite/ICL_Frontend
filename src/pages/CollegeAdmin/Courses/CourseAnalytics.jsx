// pages/CollegeAdmin/Courses/CourseAnalytics.jsx
// Admin: Course analytics — enrollment stats, completion rates, certificate count
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  BarChart3, Users, CheckCircle2, Award, TrendingUp, RefreshCw,
  ChevronLeft, AlertCircle, Clock, BookOpen, Target, Activity
} from 'lucide-react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { collegeAdminCourseAPI as courseAPI } from '../../../api/Api';

// ─── Sub-components ───────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, subtext, color, gradient }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
    <div className="flex items-start justify-between mb-4">
      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${gradient}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
    <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
    <p className="text-sm font-semibold text-gray-700">{label}</p>
    {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
  </div>
);

const ProgressBar = ({ label, value, max, color, count }) => {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm font-bold text-gray-900">{count} <span className="text-gray-400 font-normal">({pct}%)</span></span>
      </div>
      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const CourseAnalytics = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { fetchAnalytics(); }, [courseId]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await courseAPI.getCourseAnalytics(courseId);
      if (res.success) {
        setAnalytics(res.data);
      } else {
        setError(res.message || 'Failed to load analytics');
      }
    } catch (err) {
      setError(err.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading Analytics..." submessage="Calculating course performance" icon={BarChart3} />;
  }

  if (error || !analytics) {
    return (
      <DashboardLayout title="Course Analytics">
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
          <AlertCircle className="w-12 h-12 text-red-400" />
          <p className="text-gray-600">{error || 'Analytics not available'}</p>
          <button onClick={() => navigate('/dashboard/college-admin/courses')} className="text-blue-600 underline text-sm">
            ← Back to Courses
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const { course, enrollments, completionRate, averageProgress, certificatesIssued, recentCompletions } = analytics;
  const total = enrollments?.total || 0;

  return (
    <DashboardLayout title={`Analytics: ${course.title}`}>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/dashboard/college-admin/courses')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 mb-4 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Courses
        </button>

        <div className="relative bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 rounded-3xl p-8 shadow-2xl shadow-blue-500/30 overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute w-64 h-64 bg-white rounded-full -top-20 -right-20" />
          </div>
          <div className="relative text-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-11 h-11 bg-white/20 rounded-2xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">{course.title}</h1>
                <p className="text-blue-100 text-sm">{course.category} • {course.level}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={fetchAnalytics}
                className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm text-white text-sm px-3 py-1.5 rounded-xl hover:bg-white/30 transition-all"
              >
                <RefreshCw className="w-4 h-4" /> Refresh
              </button>
              <button
                onClick={() => navigate(`/dashboard/college-admin/courses/${courseId}/enrollments`)}
                className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm text-white text-sm px-3 py-1.5 rounded-xl hover:bg-white/30 transition-all"
              >
                <Users className="w-4 h-4" /> View Enrollments
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard
          icon={Users}
          label="Total Enrollments"
          value={total}
          subtext={`${enrollments?.active || 0} currently active`}
          gradient="bg-gradient-to-br from-blue-500 to-blue-600"
        />
        <StatCard
          icon={TrendingUp}
          label="Completion Rate"
          value={`${completionRate}%`}
          subtext={`${enrollments?.completed || 0} of ${total} completed`}
          gradient="bg-gradient-to-br from-green-500 to-emerald-600"
        />
        <StatCard
          icon={Activity}
          label="Avg. Progress"
          value={`${averageProgress}%`}
          subtext="Across all enrolled students"
          gradient="bg-gradient-to-br from-purple-500 to-purple-600"
        />
        <StatCard
          icon={Award}
          label="Certificates Issued"
          value={certificatesIssued}
          subtext={`${recentCompletions} in last 30 days`}
          gradient="bg-gradient-to-br from-amber-400 to-orange-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enrollment Status Breakdown */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-500" />
            Enrollment Status Breakdown
          </h3>
          <div className="space-y-4">
            <ProgressBar
              label="In Progress"
              value={enrollments?.active || 0}
              max={total}
              count={enrollments?.active || 0}
              color="bg-gradient-to-r from-blue-500 to-cyan-500"
            />
            <ProgressBar
              label="Completed"
              value={enrollments?.completed || 0}
              max={total}
              count={enrollments?.completed || 0}
              color="bg-gradient-to-r from-green-500 to-emerald-500"
            />
            <ProgressBar
              label="Pending (Not Started)"
              value={enrollments?.pending || 0}
              max={total}
              count={enrollments?.pending || 0}
              color="bg-amber-400"
            />
            <ProgressBar
              label="Dropped"
              value={enrollments?.dropped || 0}
              max={total}
              count={enrollments?.dropped || 0}
              color="bg-gray-300"
            />
          </div>

          {/* Donut-like visual */}
          <div className="mt-6 pt-6 border-t border-gray-50">
            <div className="flex items-center justify-center gap-6 flex-wrap">
              {[
                { label: 'Active',     count: enrollments?.active || 0,    color: 'bg-blue-500'  },
                { label: 'Completed',  count: enrollments?.completed || 0, color: 'bg-green-500' },
                { label: 'Pending',    count: enrollments?.pending || 0,   color: 'bg-amber-400' },
                { label: 'Dropped',    count: enrollments?.dropped || 0,   color: 'bg-gray-300'  },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${s.color}`} />
                  <span className="text-xs text-gray-600">{s.label} <strong className="text-gray-800">({s.count})</strong></span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Performance Summary */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-500" />
            Performance Summary
          </h3>
          <div className="space-y-4">
            {/* Completion rate visual */}
            <div className="bg-green-50 border border-green-100 rounded-2xl p-5 text-center">
              <div className="text-5xl font-bold text-green-600 mb-1">{completionRate}%</div>
              <p className="text-sm text-green-700 font-medium">Overall Completion Rate</p>
              <p className="text-xs text-green-500 mt-1">{enrollments?.completed || 0} of {total} students completed</p>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-blue-700">{averageProgress}%</div>
                <div className="text-xs text-blue-500 mt-1">Avg Progress</div>
              </div>
              <div className="bg-purple-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-purple-700">{certificatesIssued}</div>
                <div className="text-xs text-purple-500 mt-1">Certs Issued</div>
              </div>
              <div className="bg-amber-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-amber-700">{recentCompletions}</div>
                <div className="text-xs text-amber-500 mt-1">Last 30 Days</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-gray-700">{total}</div>
                <div className="text-xs text-gray-400 mt-1">Total Enrolled</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate(`/dashboard/college-admin/courses/${courseId}/enrollments`)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-all"
          >
            <Users className="w-4 h-4" /> View All Enrollments
          </button>
          <button
            onClick={() => navigate(`/dashboard/college-admin/courses/edit/${courseId}`)}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:border-blue-300 transition-all"
          >
            <BookOpen className="w-4 h-4" /> Edit Course
          </button>
          <button
            onClick={() => navigate('/dashboard/college-admin/courses/assign-batch')}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:border-blue-300 transition-all"
          >
            <Target className="w-4 h-4" /> Assign to Batch
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CourseAnalytics;