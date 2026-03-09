// pages/Courses/MyCourses.jsx
// Student: Dashboard for all enrolled courses with progress, certificates, status tabs
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, PlayCircle, CheckCircle2, Clock, Award, Download,
  AlertCircle, RefreshCw, ChevronRight, BarChart3, Target, Zap
} from 'lucide-react';
import StudentLayout from '../../components/layout/StudentLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { courseAPI } from '../../api/Api';

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_TABS = [
  { key: '',          label: 'All',         icon: BookOpen    },
  { key: 'pending',   label: 'Enrolled',    icon: Clock       },
  { key: 'active',    label: 'In Progress', icon: PlayCircle  },
  { key: 'completed', label: 'Completed',   icon: CheckCircle2 },
];

const STATUS_CONFIG = {
  pending:   { label: 'Enrolled',    color: 'text-amber-700',  bg: 'bg-amber-50 border-amber-200',  dot: 'bg-amber-400' },
  active:    { label: 'In Progress', color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200',    dot: 'bg-blue-500'  },
  completed: { label: 'Completed',   color: 'text-green-700',  bg: 'bg-green-50 border-green-200',  dot: 'bg-green-500' },
  dropped:   { label: 'Dropped',     color: 'text-gray-600',   bg: 'bg-gray-50 border-gray-200',    dot: 'bg-gray-400'  },
};

// ─── Sub-components ───────────────────────────────────────────────────────────
const EmptyState = ({ statusFilter, onBrowse }) => (
  <div className="flex flex-col items-center justify-center py-20">
    <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mb-5">
      <BookOpen className="w-10 h-10 text-blue-300" />
    </div>
    <h3 className="text-lg font-bold text-gray-800 mb-2">
      {statusFilter ? `No ${STATUS_CONFIG[statusFilter]?.label || ''} courses` : 'No courses yet'}
    </h3>
    <p className="text-sm text-gray-500 text-center max-w-xs mb-6">
      {statusFilter
        ? 'You have no courses with this status. Try a different filter.'
        : 'You haven\'t enrolled in any courses yet. Browse our course library to get started.'}
    </p>
    {!statusFilter && (
      <button
        onClick={onBrowse}
        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-medium text-sm hover:from-blue-700 hover:to-cyan-700 transition-all shadow-md"
      >
        <BookOpen className="w-4 h-4" /> Browse Courses
      </button>
    )}
  </div>
);

const CourseProgressCard = ({ enrollment, onNavigate }) => {
  const course = enrollment.courseId;
  if (!course) return null;

  const statusCfg = STATUS_CONFIG[enrollment.status] || STATUS_CONFIG.pending;
  const completedModules = enrollment.moduleProgress?.filter(m => m.completed).length || 0;
  const totalModules = enrollment.moduleProgress?.length || 0;
  const isCompleted = enrollment.status === 'completed';

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* Progress bar top */}
      <div className="h-1 bg-gray-100">
        <div
          className={`h-full transition-all duration-500 ${isCompleted ? 'bg-green-500' : 'bg-gradient-to-r from-blue-500 to-cyan-500'}`}
          style={{ width: `${enrollment.overallProgress || 0}%` }}
        />
      </div>

      <div className="p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            {/* Status badge */}
            <div className="flex items-center gap-2 mb-2">
              <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${statusCfg.bg} ${statusCfg.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                {statusCfg.label}
              </span>
              {course.certificateProvided && isCompleted && enrollment.certificateIssued && (
                <span className="flex items-center gap-1 text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-full">
                  <Award className="w-3 h-3" /> Certified
                </span>
              )}
            </div>

            <h3 className="font-bold text-gray-900 text-base leading-snug line-clamp-2">{course.title}</h3>
            <p className="text-xs text-gray-500 mt-1">{course.category} • {course.level}</p>
          </div>

          {/* Progress ring / percentage */}
          <div className="flex-shrink-0 flex flex-col items-center">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center border-4 ${isCompleted ? 'border-green-400 bg-green-50' : 'border-blue-200 bg-blue-50'}`}>
              {isCompleted ? (
                <CheckCircle2 className="w-6 h-6 text-green-500" />
              ) : (
                <span className={`text-sm font-bold ${enrollment.overallProgress > 0 ? 'text-blue-700' : 'text-gray-400'}`}>
                  {enrollment.overallProgress || 0}%
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
          <span className="flex items-center gap-1">
            <BarChart3 className="w-3.5 h-3.5" />
            {completedModules}/{totalModules} modules
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {course.duration?.hours}h course
          </span>
          {enrollment.enrolledAt && (
            <span>Enrolled {new Date(enrollment.enrolledAt).toLocaleDateString()}</span>
          )}
        </div>

        {/* Module progress detail */}
        {totalModules > 0 && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1.5">
              <span>Progress</span>
              <span>{enrollment.overallProgress || 0}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-green-500' : 'bg-gradient-to-r from-blue-500 to-cyan-500'}`}
                style={{ width: `${enrollment.overallProgress || 0}%` }}
              />
            </div>
          </div>
        )}

        {/* Assessment result */}
        {enrollment.assessmentAttemptId?.percentage !== undefined && (
          <div className="mb-4 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
            <Zap className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <div className="text-xs">
              <span className="font-semibold text-amber-700">Assessment Score: </span>
              <span className="text-amber-600">{enrollment.assessmentAttemptId.percentage}%</span>
              {enrollment.assessmentAttemptId.skillLevelAchieved && (
                <span className="text-amber-600"> • {enrollment.assessmentAttemptId.skillLevelAchieved}</span>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => onNavigate(`/dashboard/student/courses/${course._id}/learn`)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-sm transition-all ${
              isCompleted
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700 shadow-md shadow-blue-200'
            }`}
          >
            <PlayCircle className="w-4 h-4" />
            {isCompleted ? 'Review' : enrollment.overallProgress ? 'Continue' : 'Start'}
          </button>

          {enrollment.certificateUrl && (
            <a
              href={enrollment.certificateUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2.5 border border-green-200 text-green-700 text-sm font-medium rounded-xl hover:bg-green-50 transition-all"
            >
              <Download className="w-4 h-4" />
            </a>
          )}

          <button
            onClick={() => onNavigate(`/dashboard/student/courses/${course._id}`)}
            className="px-3 py-2.5 border border-gray-200 text-gray-600 text-sm rounded-xl hover:border-blue-300 hover:text-blue-600 transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const MyCourses = () => {
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => { fetchEnrollments(); }, [statusFilter]);

  const fetchEnrollments = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await courseAPI.getMyEnrollments(params);
      if (res.success) {
        setEnrollments(res.data || []);
      } else {
        setError(res.message || 'Failed to load courses');
      }
    } catch (err) {
      setError(err.message || 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  // Summary stats across all enrollments (no filter)
  const allEnrollments = enrollments;
  const completedCount = allEnrollments.filter(e => e.status === 'completed').length;
  const activeCount = allEnrollments.filter(e => e.status === 'active').length;
  const certCount = allEnrollments.filter(e => e.certificateIssued).length;
  const avgProgress = allEnrollments.length
    ? Math.round(allEnrollments.reduce((s, e) => s + (e.overallProgress || 0), 0) / allEnrollments.length)
    : 0;

  if (loading && enrollments.length === 0) {
    return <LoadingSpinner message="Loading My Courses..." submessage="Fetching your learning progress" icon={BookOpen} />;
  }

  return (
    <StudentLayout title="My Courses">
      {/* Header Banner */}
      <div className="mb-8">
        <div className="relative bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 rounded-3xl p-8 shadow-2xl shadow-blue-500/30 overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute w-64 h-64 bg-white rounded-full -top-20 -left-20" />
            <div className="absolute w-80 h-80 bg-white rounded-full -bottom-28 -right-28" />
          </div>
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="text-white">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                  <Target className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold">My Learning Journey</h1>
                  <p className="text-blue-100 text-sm">Track your progress and earn certificates</p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                {[
                  { label: 'Total Enrolled', value: enrollments.length, icon: BookOpen },
                  { label: 'In Progress',    value: activeCount,        icon: PlayCircle },
                  { label: 'Completed',      value: completedCount,     icon: CheckCircle2 },
                  { label: 'Certificates',   value: certCount,          icon: Award },
                ].map(stat => (
                  <div key={stat.label} className="bg-white/15 backdrop-blur-sm rounded-2xl p-3 text-center">
                    <stat.icon className="w-5 h-5 text-white/70 mx-auto mb-1" />
                    <div className="text-2xl font-bold text-white">{stat.value}</div>
                    <div className="text-xs text-blue-100">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => navigate('/dashboard/student/courses')}
              className="flex-shrink-0 flex items-center gap-2 bg-white text-blue-700 font-semibold px-5 py-3 rounded-xl hover:bg-blue-50 transition-all shadow-lg"
            >
              <BookOpen className="w-5 h-5" /> Browse More
            </button>
          </div>
        </div>
      </div>

      {/* Average Progress */}
      {enrollments.length > 0 && statusFilter === '' && (
        <div className="mb-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">Overall Learning Progress</span>
            <span className="text-sm font-bold text-blue-600">{avgProgress}%</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-blue-400 to-cyan-500 rounded-full transition-all duration-700"
              style={{ width: `${avgProgress}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">Average progress across all enrolled courses</p>
        </div>
      )}

      {/* Status Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {STATUS_TABS.map(tab => {
          const count = tab.key
            ? enrollments.filter(e => e.status === tab.key).length
            : enrollments.length;
          return (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                statusFilter === tab.key
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${statusFilter === tab.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={fetchEnrollments} className="ml-auto text-sm text-red-600 underline">Retry</button>
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-8">
          <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
        </div>
      )}

      {/* Course Grid */}
      {!loading && (
        enrollments.length === 0 ? (
          <EmptyState statusFilter={statusFilter} onBrowse={() => navigate('/dashboard/student/courses')} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {enrollments.map(enrollment => (
              <CourseProgressCard
                key={enrollment._id}
                enrollment={enrollment}
                onNavigate={navigate}
              />
            ))}
          </div>
        )
      )}
    </StudentLayout>
  );
};

export default MyCourses;