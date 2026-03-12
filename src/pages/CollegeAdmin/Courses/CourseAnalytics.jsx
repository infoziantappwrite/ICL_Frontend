// pages/CollegeAdmin/Courses/CourseAnalytics.jsx
// Admin: Course analytics — enrollment stats, completion rates, certificate count
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  BarChart3, Users, CheckCircle2, Award, TrendingUp, RefreshCw,
  ChevronLeft, AlertCircle, BookOpen, Target, Activity
} from 'lucide-react';
import CollegeAdminLayout from '../../../components/layout/CollegeAdminLayout';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { collegeAdminCourseAPI as courseAPI } from '../../../api/Api';

const StatCard = ({ icon: Icon, label, value, subtext, gradient }) => (
  <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-5">
    <div className="flex items-start justify-between mb-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${gradient}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
    </div>
    <p className="text-2xl font-black text-gray-900 mb-0.5">{value}</p>
    <p className="text-sm font-semibold text-gray-700">{label}</p>
    {subtext && <p className="text-xs text-gray-400 mt-0.5">{subtext}</p>}
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
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

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
      <CollegeAdminLayout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <p className="text-gray-600 font-medium">{error || 'Analytics not available'}</p>
          <button onClick={() => navigate('/dashboard/college-admin/courses')}
            className="flex items-center gap-2 text-sm text-blue-600 font-medium hover:text-blue-700 transition-colors">
            <ChevronLeft className="w-4 h-4" /> Back to Courses
          </button>
        </div>
      </CollegeAdminLayout>
    );
  }

  const { course, enrollments, completionRate, averageProgress, certificatesIssued, recentCompletions } = analytics;
  const total = enrollments?.total || 0;

  return (
    <CollegeAdminLayout>
      {/* Hero Banner */}
      <div className="relative bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 rounded-2xl px-5 py-4 mb-4 shadow-xl shadow-blue-500/20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-10 -right-10 w-44 h-44 bg-white/10 rounded-full" />
          <div className="absolute -bottom-8 left-1/3 w-28 h-28 bg-white/10 rounded-full" />
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle,white 1px,transparent 1px)', backgroundSize: '18px 18px' }} />
        </div>
        <div className="relative flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-black text-lg leading-tight">{course.title}</h1>
              <p className="text-blue-200 text-[11px] mt-0.5">{course.category} · {course.level} · Course Analytics</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={fetchAnalytics}
              className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
            <button
              onClick={() => navigate('/dashboard/college-admin/courses')}
              className="inline-flex items-center gap-1.5 bg-white text-blue-600 text-xs font-bold px-3 py-2 rounded-xl shadow-md hover:bg-blue-50 transition-all"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Back
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Enrollment Status Breakdown */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-5 pb-3 border-b border-gray-50">
            <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <Target className="w-3.5 h-3.5 text-white" />
            </div>
            <h3 className="font-bold text-gray-900 text-sm">Enrollment Status Breakdown</h3>
          </div>
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

          <div className="mt-5 pt-4 border-t border-gray-50">
            <div className="flex items-center justify-center gap-5 flex-wrap">
              {[
                { label: 'Active',     count: enrollments?.active || 0,    color: 'bg-blue-500'  },
                { label: 'Completed',  count: enrollments?.completed || 0, color: 'bg-green-500' },
                { label: 'Pending',    count: enrollments?.pending || 0,   color: 'bg-amber-400' },
                { label: 'Dropped',    count: enrollments?.dropped || 0,   color: 'bg-gray-300'  },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
                  <span className="text-xs text-gray-600">{s.label} <strong className="text-gray-800">({s.count})</strong></span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Performance Summary */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-5 pb-3 border-b border-gray-50">
            <div className="w-7 h-7 bg-gradient-to-br from-purple-500 to-violet-500 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-3.5 h-3.5 text-white" />
            </div>
            <h3 className="font-bold text-gray-900 text-sm">Performance Summary</h3>
          </div>
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-2xl p-5 text-center">
              <div className="text-4xl font-black text-green-600 mb-1">{completionRate}%</div>
              <p className="text-sm text-green-700 font-semibold">Overall Completion Rate</p>
              <p className="text-xs text-green-500 mt-1">{enrollments?.completed || 0} of {total} students completed</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-black text-blue-700">{averageProgress}%</div>
                <div className="text-xs text-blue-500 mt-1 font-medium">Avg Progress</div>
              </div>
              <div className="bg-purple-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-black text-purple-700">{certificatesIssued}</div>
                <div className="text-xs text-purple-500 mt-1 font-medium">Certs Issued</div>
              </div>
              <div className="bg-amber-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-black text-amber-700">{recentCompletions}</div>
                <div className="text-xs text-amber-500 mt-1 font-medium">Last 30 Days</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-black text-gray-700">{total}</div>
                <div className="text-xs text-gray-400 mt-1 font-medium">Total Enrolled</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-4 bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center">
            <Target className="w-3 h-3 text-white" />
          </div>
          <h3 className="font-bold text-gray-900 text-sm">Quick Actions</h3>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate(`/dashboard/college-admin/courses/${courseId}/enrollments`)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl text-sm font-semibold hover:opacity-90 shadow-sm transition-all"
          >
            <Users className="w-4 h-4" /> View All Enrollments
          </button>
          <button
            onClick={() => navigate(`/dashboard/college-admin/courses/edit/${courseId}`)}
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:border-blue-300 hover:text-blue-600 transition-all"
          >
            <BookOpen className="w-4 h-4" /> Edit Course
          </button>
          <button
            onClick={() => navigate('/dashboard/college-admin/courses/assign-batch')}
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:border-blue-300 hover:text-blue-600 transition-all"
          >
            <Target className="w-4 h-4" /> Assign to Batch
          </button>
        </div>
      </div>
    </CollegeAdminLayout>
  );
};

export default CourseAnalytics;