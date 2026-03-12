// pages/Courses/MyCourses.jsx
// Student: Dashboard for all enrolled courses with progress, certificates, status tabs
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, PlayCircle, CheckCircle2, Clock, Award, Download,
  AlertCircle, RefreshCw, ChevronRight, BarChart3, Target, Zap, Home
} from 'lucide-react';
import StudentLayout from '../../components/layout/StudentLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { courseAPI } from '../../api/Api';

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_TABS = [
  { key: '', label: 'All', icon: BookOpen },
  { key: 'pending', label: 'Enrolled', icon: Clock },
  { key: 'active', label: 'In Progress', icon: PlayCircle },
  { key: 'completed', label: 'Completed', icon: CheckCircle2 },
];

const STATUS_CONFIG = {
  pending: { label: 'Enrolled', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', dot: 'bg-amber-400' },
  active: { label: 'In Progress', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', dot: 'bg-blue-500' },
  completed: { label: 'Completed', color: 'text-green-700', bg: 'bg-green-50 border-green-200', dot: 'bg-green-500' },
  dropped: { label: 'Dropped', color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200', dot: 'bg-gray-400' },
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
    <div className="group bg-white rounded-xl border border-gray-200 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-all duration-300 overflow-hidden flex flex-col h-full">

      {/* Thumbnail */}
      <div className="relative aspect-[16/9] bg-gray-100 overflow-hidden flex-shrink-0 border-b border-gray-100 cursor-pointer" onClick={() => onNavigate(`/dashboard/student/courses/${course._id}`)}>
        {course.thumbnail ? (
          <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-50 group-hover:scale-105 transition-transform duration-500">
            <BookOpen className="w-12 h-12 text-blue-200" />
          </div>
        )}

        {/* Status badge */}
        <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
          <span className={`flex items-center gap-1.5 text-[11px] font-bold px-2 py-0.5 rounded-full border shadow-[0_2px_4px_rgba(0,0,0,0.05)] ${statusCfg.bg} ${statusCfg.color} bg-white/95 backdrop-blur-sm`}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
            {statusCfg.label}
          </span>
          {course.certificateProvided && isCompleted && enrollment.certificateIssued && (
            <span className="flex items-center gap-1 text-[11px] font-bold text-purple-700 bg-white/95 backdrop-blur-sm border border-purple-200 px-2 py-0.5 rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.05)]">
              <Award className="w-3.5 h-3.5" /> Certified
            </span>
          )}
        </div>

        {/* Progress bar top layer */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100/50 backdrop-blur-md">
          <div
            className={`h-full transition-all duration-500 ${isCompleted ? 'bg-green-500' : 'bg-gradient-to-r from-blue-600 to-cyan-500'}`}
            style={{ width: `${enrollment.overallProgress || 0}%` }}
          />
        </div>
      </div>

      {/* Body */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 bg-white">

        {/* Partner / Instructor */}
        <div className="flex items-center gap-2 mb-2">
          {course.instructor?.logo ? (
            <img src={course.instructor.logo} alt="logo" className="w-4 h-4 object-contain rounded" />
          ) : (
            <div className="w-4 h-4 bg-gray-100 border border-gray-200 rounded text-blue-700 flex items-center justify-center text-[9px] font-bold">
              {course.instructor?.name ? course.instructor.name.charAt(0).toUpperCase() : 'P'}
            </div>
          )}
          <span className="text-[12px] text-gray-600 truncate">{course.instructor?.name || 'Partner Institute'}</span>
        </div>

        {/* Title */}
        <h3
          onClick={() => onNavigate(`/dashboard/student/courses/${course._id}`)}
          className="font-bold text-[16px] text-gray-900 leading-snug mb-1 group-hover:underline decoration-blue-600 decoration-2 underline-offset-2 line-clamp-2 cursor-pointer"
        >
          {course.title}
        </h3>

        {/* Course Type / Level */}
        <p className="text-[12px] text-gray-500 mb-3">
          {course.category} • {course.level}
        </p>

        {/* Progress / Stats row */}
        <div className="flex items-center justify-between gap-4 text-xs text-gray-500 mb-4 pb-4 border-b border-gray-100">
          <span className="flex items-center gap-1">
            <BarChart3 className="w-3.5 h-3.5" />
            {completedModules}/{totalModules}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {course.duration?.hours}h
          </span>
          <span className="font-bold text-blue-600">
            {enrollment.overallProgress || 0}%
          </span>
        </div>

        {/* Assessment result */}
        {enrollment.assessmentAttemptId?.percentage !== undefined && (
          <div className="mb-4 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
            <Zap className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <div className="text-[11px]">
              <span className="font-semibold text-amber-700">Assessment: </span>
              <span className="text-amber-600 font-bold">{enrollment.assessmentAttemptId.percentage}%</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-auto pt-2">
          <button
            onClick={() => onNavigate(`/dashboard/student/courses/${course._id}/learn`)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-[13px] transition-all ${isCompleted
              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              : 'bg-blue-600 text-white hover:bg-blue-700'
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

// ─── Skeleton Loader ────────────────────────────────────────────────────────
const MyCoursesSkeleton = () => (
  <StudentLayout title="My Courses">
    {/* Breadcrumb Navigation - Outside Hero */}
    <div className="bg-white border-b border-gray-100">
      <div className="max-w-[1240px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-3 flex gap-2">
        <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
        <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
        <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
        <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
        <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
      </div>
    </div>

    {/* 2-Column Layout */}
    <div className="relative bg-[#f8fafc] flex-1 min-h-screen">
      <div className="max-w-[1240px] mx-auto w-full px-4 sm:px-6 lg:px-8 pb-10 pt-4 relative z-10">

        {/* Top Heading: Single Column */}
        <div className="w-full mb-8 pt-2">
          <div className="flex gap-3 mb-2">
            <div className="w-32 h-8 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="w-24 h-8 bg-gray-200 rounded-full animate-pulse"></div>
          </div>
          <div className="w-64 h-8 bg-gray-200 rounded-lg animate-pulse mb-3 mt-4"></div>
          <div className="w-full max-w-2xl h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
          <div className="w-3/4 max-w-xl h-4 bg-gray-200 rounded animate-pulse"></div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 relative">

          {/* Left Side: Stats (25%) */}
          <div className="w-full lg:w-[25%] flex flex-col pt-1">
            <div className="pt-5 pb-2">
              <div className="flex flex-col gap-3 mb-6">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="bg-white border border-gray-100 p-3 rounded-2xl flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-xl animate-pulse flex-shrink-0"></div>
                    <div className="flex flex-col gap-2 w-full">
                      <div className="w-12 h-5 bg-gray-200 rounded animate-pulse"></div>
                      <div className="w-20 h-3 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="w-full h-12 bg-gray-200 rounded-2xl animate-pulse"></div>
            </div>
          </div>

          {/* Right Side: Courses (75%) */}
          <div className="w-full lg:w-[75%] flex flex-col pt-1">

            {/* Status Tabs */}
            <div className="pt-6 pb-4 mb-4 -mx-3 px-3">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="w-24 h-10 bg-gray-200 rounded-xl animate-pulse flex-shrink-0"></div>
                ))}
              </div>
            </div>

            {/* Course Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 h-[380px] overflow-hidden flex flex-col">
                  <div className="h-[180px] bg-gray-200 animate-pulse flex-shrink-0"></div>
                  <div className="p-5 flex-1 flex flex-col gap-4">
                    <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="w-full h-5 bg-gray-200 rounded animate-pulse"></div>
                    <div className="w-3/4 h-5 bg-gray-200 rounded animate-pulse"></div>
                    <div className="flex items-center gap-4 mt-auto">
                      <div className="w-full h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                      <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse flex-shrink-0"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  </StudentLayout>
);

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
    return <MyCoursesSkeleton />;
  }

  return (
    <StudentLayout title="My Courses">

      {/* Breadcrumb Navigation - Outside Hero */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-[1240px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center flex-wrap gap-y-2 gap-x-2 text-[14px] text-gray-500 font-medium">
            <button title="Home" onClick={() => navigate('/dashboard/student')} className="hover:text-blue-600 transition-colors flex items-center">
              <Home className="w-4 h-4" />
            </button>
            <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <button onClick={() => navigate('/dashboard/student/courses')} className="hover:text-blue-600 transition-colors">
              Courses
            </button>
            <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="text-gray-900 font-bold">
              My Learning
            </span>
          </nav>
        </div>
      </div>

      {/* 2-Column Layout */}
      <div className="relative bg-[#f8fafc] flex-1 min-h-screen">
        {/* Dynamic Abstract Background Elements */}
        <div className="absolute inset-0 z-0 opacity-40 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white to-indigo-50/50"></div>
          <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-blue-100/50 blur-[100px] mix-blend-multiply opacity-70"></div>
        </div>

        <div className="max-w-[1240px] mx-auto w-full px-4 sm:px-6 lg:px-8 pb-10 pt-4 relative z-10">
          {/* Top Heading: Single Column */}
          <div className="w-full mb-8">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <span className="bg-white/80 backdrop-blur-sm border border-gray-200 text-blue-700 text-[12px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full shadow-sm">
                Student Dashboard
              </span>
              <span className="bg-indigo-50/80 backdrop-blur-sm border border-indigo-200 text-indigo-700 text-[12px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full shadow-sm">
                My Learning
              </span>
            </div>

            <h1 className="text-[28px] md:text-[32px] font-bold text-gray-900 leading-tight mb-2">
              My Learning Journey
            </h1>
            <p className="text-[15px] text-gray-600 max-w-3xl leading-relaxed">
              Track your progress, review past courses, and earn your certificates all in one place.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 relative">

            {/* Left Side: Stats (25%) */}
            <div className="w-full lg:w-[25%] flex flex-col">
              <div className="sticky top-0 z-10 pt-5 pb-2 before:absolute before:inset-0 before:-z-10 before:backdrop-blur-md before:bg-[#f8fafc]/90 before:rounded-b-3xl before:-mx-4 before:shadow-[0_8px_30px_rgb(0,0,0,0.04)] before:border before:border-white/50">
                {/* Stats (Vertical list on the left side) */}
                <div className="flex flex-col gap-3 mb-6 relative z-10">
                  {[
                    { label: 'Total Enrolled', value: enrollments.length, icon: BookOpen },
                    { label: 'In Progress', value: activeCount, icon: PlayCircle },
                    { label: 'Completed', value: completedCount, icon: CheckCircle2 },
                    { label: 'Certificates', value: certCount, icon: Award },
                  ].map(stat => (
                    <div key={stat.label} className="bg-white/90 backdrop-blur-md border border-gray-200/60 p-3 rounded-2xl flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow">
                      <div className="bg-gradient-to-br from-blue-100 to-indigo-100 border border-blue-200/50 w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <stat.icon className="w-5 h-5 text-blue-700" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[18px] font-bold text-gray-900 leading-none mb-1">{stat.value}</span>
                        <span className="text-[11px] text-gray-500 uppercase tracking-widest font-bold">{stat.label}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => navigate('/dashboard/student/courses')}
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-[0_4px_20px_rgb(0,0,0,0.1)] transform hover:-translate-y-0.5 text-sm relative z-10"
                >
                  <BookOpen className="w-4 h-4" /> Browse More
                </button>
              </div>
            </div>

            {/* Right Side: Courses (75%) */}
            <div className="w-full lg:w-[75%] flex flex-col">

              {/* Status Tabs */}
              <div className="sticky top-0 z-20 bg-[#f8fafc]/90 backdrop-blur-md pt-6 pb-4 mb-4 -mx-3 px-3 rounded-b-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50">
                <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
                  {STATUS_TABS.map(tab => {
                    const count = tab.key
                      ? enrollments.filter(e => e.status === tab.key).length
                      : enrollments.length;
                    return (
                      <button
                        key={tab.key}
                        onClick={() => setStatusFilter(tab.key)}
                        className={`flex items-center gap-2 px-5 py-3 rounded-xl text-[14px] font-bold whitespace-nowrap transition-all ${statusFilter === tab.key
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300 bg-opacity-70 backdrop-blur-sm'
                          }`}
                      >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                        <span className={`text-[11px] px-2 py-0.5 rounded-full ${statusFilter === tab.key ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'}`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
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
                <div className="flex justify-center py-12">
                  <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
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
            </div>

          </div>
        </div>
      </div>
    </StudentLayout>
  );
};

export default MyCourses;