// src/pages/Candidate/CandidateMyCourses.jsx - My enrolled courses for candidates
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, PlayCircle, CheckCircle2, Clock, Award, Download,
  AlertCircle, RefreshCw, ChevronRight, BarChart3, Target, Zap,
  BookMarked, TrendingUp, Search, X,
} from 'lucide-react';
import CandidateLayout from '../../components/layout/CandidateLayout';
import { courseAPI } from '../../api/Api';

const STATUS_TABS = [
  { key: '', label: 'All', icon: BookOpen },
  { key: 'pending', label: 'Enrolled', icon: Clock },
  { key: 'active', label: 'In Progress', icon: PlayCircle },
  { key: 'completed', label: 'Completed', icon: CheckCircle2 },
];

const STATUS_CONFIG = {
  pending:   { label: 'Enrolled',     color: 'text-amber-700',  bg: 'bg-amber-50 border-amber-200',  dot: 'bg-amber-400'  },
  active:    { label: 'In Progress',  color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200',    dot: 'bg-blue-500'   },
  completed: { label: 'Completed',    color: 'text-green-700',  bg: 'bg-green-50 border-green-200',  dot: 'bg-green-500'  },
  dropped:   { label: 'Dropped',      color: 'text-gray-600',   bg: 'bg-gray-50 border-gray-200',    dot: 'bg-gray-400'   },
};

const SkeletonCard = () => (
  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
    <div className="aspect-[16/9] bg-gray-200" />
    <div className="p-5 space-y-3">
      <div className="h-3 bg-gray-200 rounded w-1/4" />
      <div className="h-5 bg-gray-200 rounded w-3/4" />
      <div className="h-3 bg-gray-200 rounded w-1/2" />
      <div className="h-2 bg-gray-200 rounded-full" />
      <div className="h-9 bg-gray-200 rounded-xl mt-2" />
    </div>
  </div>
);

const CourseCard = ({ enrollment, onNavigate }) => {
  const course = enrollment.courseId;
  if (!course) return null;

  const statusCfg = STATUS_CONFIG[enrollment.status] || STATUS_CONFIG.pending;
  const completedModules = enrollment.moduleProgress?.filter(m => m.completed).length || 0;
  const totalModules = enrollment.moduleProgress?.length || 0;
  const isCompleted = enrollment.status === 'completed';
  const progress = enrollment.overallProgress || 0;

  return (
    <div className="group bg-white rounded-2xl border border-gray-100 hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)] transition-all duration-300 overflow-hidden flex flex-col h-full">
      {/* Thumbnail */}
      <div className="relative aspect-[16/9] bg-gray-100 overflow-hidden flex-shrink-0 cursor-pointer"
        onClick={() => onNavigate(`/dashboard/candidate/courses/${course._id}`)}>
        {course.thumbnail ? (
          <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 via-cyan-50 to-indigo-50 group-hover:scale-105 transition-transform duration-500">
            <BookOpen className="w-12 h-12 text-blue-200" />
          </div>
        )}

        {/* Status badge */}
        <div className="absolute top-2 right-2">
          <span className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full border bg-white/95 backdrop-blur-sm shadow-sm ${statusCfg.bg} ${statusCfg.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
            {statusCfg.label}
          </span>
        </div>
        {course.certificateProvided && isCompleted && enrollment.certificateIssued && (
          <div className="absolute top-2 left-2">
            <span className="flex items-center gap-1 text-[10px] font-bold text-purple-700 bg-white/95 backdrop-blur-sm border border-purple-200 px-2 py-0.5 rounded-full shadow-sm">
              <Award className="w-3 h-3" /> Certified
            </span>
          </div>
        )}

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gray-200/80">
          <div className={`h-full transition-all duration-500 ${isCompleted ? 'bg-emerald-500' : 'bg-gradient-to-r from-cyan-500 to-blue-500'}`}
            style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Body */}
      <div className="p-4 sm:p-5 flex flex-col flex-1">
        {/* Category & instructor */}
        <p className="text-[11px] text-gray-400 mb-1.5">
          {course.category}{course.instructor?.name ? ` · ${course.instructor.name}` : ''}
        </p>

        <h3 className="font-bold text-gray-900 text-[14px] leading-snug line-clamp-2 mb-3 group-hover:text-blue-600 transition-colors cursor-pointer"
          onClick={() => onNavigate(`/dashboard/candidate/courses/${course._id}`)}>
          {course.title}
        </h3>

        {/* Progress */}
        <div className="mb-3">
          <div className="flex justify-between mb-1.5">
            <span className="text-[11px] text-gray-500 font-medium">Progress</span>
            <span className={`text-[11px] font-bold ${isCompleted ? 'text-emerald-600' : 'text-blue-600'}`}>{progress}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-700 ${isCompleted ? 'bg-emerald-500' : 'bg-gradient-to-r from-cyan-500 to-blue-500'}`}
              style={{ width: `${progress}%` }} />
          </div>
          {totalModules > 0 && (
            <p className="text-[10px] text-gray-400 mt-1">{completedModules}/{totalModules} modules completed</p>
          )}
        </div>

        {/* Action buttons */}
       {/* Action buttons */}
<div className="flex gap-2 mt-auto">
  <button
    onClick={() =>
      onNavigate(`/dashboard/candidate/courses/${course._id}/learn`)
    }
    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[13px] font-bold transition-all hover:-translate-y-0.5 ${
      isCompleted
        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
        : 'text-white shadow-sm hover:shadow-md'
    }`}
    style={
      !isCompleted
        ? {
            background:
              'linear-gradient(135deg, #163c97 0%, #1fa3d8 100%)'
          }
        : {}
    }
  >
    {isCompleted ? (
      <>
        <CheckCircle2 className="w-3.5 h-3.5" />
        Review
      </>
    ) : (
      <>
        <PlayCircle className="w-3.5 h-3.5" />
        Continue
      </>
    )}
  </button>

  {isCompleted &&
    course.certificateProvided &&
    enrollment.certificateIssued && (
      <button
        className="px-3 py-2.5 rounded-xl transition-all hover:opacity-90 text-white shadow-sm"
        style={{
          background:
            'linear-gradient(135deg, #163c97 0%, #1fa3d8 100%)'
        }}
      >
        <Download className="w-4 h-4" />
      </button>
    )}
</div>
      </div>
    </div>
  );
};

const CandidateMyCourses = () => {
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const fetchEnrollments = async () => {
    setLoading(true); setError('');
    try {
      const res = await courseAPI.getMyEnrollments();
      if (res?.success) setEnrollments(res.enrollments || res.data || []);
      else setError(res?.message || 'Failed to load your courses');
    } catch {
      setError('Failed to load your courses. Please try again.');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchEnrollments(); }, []);

  const filtered = enrollments.filter(e => {
    const course = e.courseId;
    const matchSearch = !search || course?.title?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || e.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Tab counts
  const counts = {
    '': enrollments.length,
    'pending': enrollments.filter(e => e.status === 'pending').length,
    'active': enrollments.filter(e => e.status === 'active').length,
    'completed': enrollments.filter(e => e.status === 'completed').length,
  };

  // Stats
  const completedCourses = enrollments.filter(e => e.status === 'completed').length;
  const avgProgress = enrollments.length > 0
    ? Math.round(enrollments.reduce((s, e) => s + (e.overallProgress || 0), 0) / enrollments.length)
    : 0;
  const certificates = enrollments.filter(e => e.certificateIssued).length;

  return (
    <CandidateLayout>
      <div className="min-h-screen bg-[#f0f4f8] px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
        <div className="max-w-[1400px] mx-auto space-y-4 sm:space-y-5">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
           <h1 className="text-[22px] md:text-[28px] font-black text-gray-900 tracking-tight">
  My{' '}
  <span
    style={{
      background: 'linear-gradient(135deg, #163c97 0%, #1fa3d8 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent'
    }}
  >
    Learning
  </span>
</h1>
              <p className="text-[13px] text-gray-500 mt-1">
                {loading ? 'Loading...' : `${enrollments.length} enrolled courses`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={fetchEnrollments}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 rounded-xl text-[13px] font-semibold text-gray-600 hover:border-cyan-300 hover:text-cyan-600 transition-all shadow-sm">
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
              </button>
              <button
  onClick={() => navigate('/dashboard/candidate/courses')}
  className="inline-flex items-center gap-1.5 px-4 py-2 text-white rounded-xl text-[13px] font-semibold transition-all shadow-sm hover:opacity-90"
  style={{
    background: 'linear-gradient(135deg, #163c97 0%, #1fa3d8 100%)'
  }}
>
  <BookOpen className="w-3.5 h-3.5" />
  Browse More
</button>
            </div>
          </div>

          {/* Stats */}
          {!loading && enrollments.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Total Enrolled', value: enrollments.length, icon: BookOpen, color: 'bg-blue-50 text-blue-600' },
                { label: 'Completed', value: completedCourses, icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-600' },
                { label: 'Avg Progress', value: `${avgProgress}%`, icon: TrendingUp, color: 'bg-cyan-50 text-cyan-600' },
                { label: 'Certificates', value: certificates, icon: Award, color: 'bg-violet-50 text-violet-600' },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${s.color}`}><s.icon className="w-4 h-4" /></div>
                  <div><p className="text-[20px] font-black text-gray-900 leading-none">{s.value}</p><p className="text-[11px] text-gray-400 font-medium">{s.label}</p></div>
                </div>
              ))}
            </div>
          )}

          {/* Tabs + Search */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex gap-1 bg-white rounded-2xl border border-gray-100 p-1 shadow-[0_1px_4px_rgba(0,0,0,0.04)] overflow-x-auto">
              {STATUS_TABS.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
  key={tab.key}
  onClick={() => setStatusFilter(tab.key)}
  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold whitespace-nowrap transition-all ${
    statusFilter === tab.key
      ? 'text-white shadow-sm'
      : 'text-gray-500 hover:text-blue-700 hover:bg-blue-50'
  }`}
  style={
    statusFilter === tab.key
      ? {
          background: 'linear-gradient(135deg, #163c97 0%, #1fa3d8 100%)'
        }
      : {}
  }
>
  <Icon className="w-3.5 h-3.5" />

  {tab.label}

  <span
    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
      statusFilter === tab.key
        ? 'bg-white/20 text-white'
        : 'bg-gray-100 text-gray-500'
    }`}
  >
    {counts[tab.key]}
  </span>
</button>
                );
              })}
            </div>
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search my courses..."
                className="w-full pl-9 pr-3 py-2 text-[13px] border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-cyan-100 focus:border-cyan-400 outline-none" />
              {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" /></button>}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-[13px] text-red-700 flex-1">{error}</p>
              <button onClick={fetchEnrollments} className="text-[12px] font-bold text-red-600 flex items-center gap-1">
                <RefreshCw className="w-3.5 h-3.5" /> Retry
              </button>
            </div>
          )}

          {/* Content */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100">
              <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mb-5">
                <BookOpen className="w-10 h-10 text-blue-200" />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">
                {statusFilter ? `No ${STATUS_CONFIG[statusFilter]?.label || ''} courses` : 'No courses yet'}
              </h3>
              <p className="text-sm text-gray-500 text-center max-w-xs mb-6">
                {statusFilter
                  ? 'You have no courses with this status. Try a different filter.'
                  : "You haven't enrolled in any courses yet. Browse our library to get started."}
              </p>
              {!statusFilter && (
                <button onClick={() => navigate('/dashboard/candidate/courses')}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl font-medium text-sm hover:from-cyan-700 hover:to-blue-700 transition-all shadow-md">
                  <BookOpen className="w-4 h-4" /> Browse Courses
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map(enrollment => (
                <CourseCard key={enrollment._id} enrollment={enrollment} onNavigate={navigate} />
              ))}
            </div>
          )}

        </div>
      </div>
    </CandidateLayout>
  );
};

export default CandidateMyCourses;
