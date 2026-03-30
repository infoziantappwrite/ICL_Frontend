// src/pages/Courses/CourseDetail.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  BookOpen, Clock, Users, Award, Star, ChevronLeft, ChevronRight,
  CheckCircle2, PlayCircle, Download, Globe, AlertCircle, Layers,
  User, Tag, Calendar, BarChart3, Zap, FileText, ArrowRight, Lock,
  RefreshCw, MousePointerClick, MessageSquare, ThumbsUp, Home
} from 'lucide-react';
import { TableSkeleton } from '../../components/common/SkeletonLoader';
import { courseAPI } from '../../api/Api';
import StudentLayout from '../../components/layout/StudentLayout';

const STATUS_LABEL = {
  pending: 'Enrolled',
  active: 'In Progress',
  completed: 'Completed',
  dropped: 'Dropped',
};

const TABS = ['About', 'Outcomes', 'Modules', 'Reviews'];

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const CourseDetailSkeleton = () => (
  <StudentLayout title="Loading...">
    <div className="animate-pulse">
      <div className="bg-white border-b border-gray-100 h-10" />
      <div className="bg-[#f8fafc] h-48 md:h-64" />
      <div className="max-w-[1240px] mx-auto px-3 md:px-6 lg:px-8 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="h-6 bg-gray-200 rounded w-2/3" />
          <div className="h-4 bg-gray-100 rounded w-full" />
          <div className="h-4 bg-gray-100 rounded w-5/6" />
        </div>
        <div className="h-48 bg-gray-100 rounded-2xl" />
      </div>
    </div>
  </StudentLayout>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const CourseDetail = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState('About');
  const [expandedModule, setExpandedModule] = useState(null);

  useEffect(() => { fetchCourse(); }, [courseId]);

  const fetchCourse = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await courseAPI.getCourseById(courseId);
      if (res.success) {
        setCourse(res.data);
        setEnrollment(res.data.enrollment || null);
      } else setError(res.message || 'Course not found');
    } catch (err) {
      setError(err.message || 'Failed to load course');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      const res = await courseAPI.enrollInCourse(courseId);
      if (res.success) {
        setEnrollment(res.data);
        showToast('Successfully enrolled! Start learning now.');
      } else showToast(res.message || 'Enrollment failed', 'error');
    } catch (err) {
      showToast(err.message || 'Enrollment failed', 'error');
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) return <CourseDetailSkeleton />;

  if (error || !course) {
    return (
      <StudentLayout title="Course Detail">
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 p-6">
          <AlertCircle className="w-10 h-10 text-red-400" />
          <p className="text-gray-600 text-sm">{error || 'Course not found'}</p>
          <button onClick={() => navigate('/dashboard/student/courses')} className="text-blue-600 text-sm hover:underline">
            ← Back to courses
          </button>
        </div>
      </StudentLayout>
    );
  }

  const price = course.price?.discounted || course.price?.original || 0;
  const isEnrolled = !!enrollment;
  const isCompleted = enrollment?.status === 'completed';
  const partnerName = course.instructor?.name || course.provider?.name || 'Partner Institute';
  const partnerLogo = course.instructor?.logo || course.provider?.logo || null;
  const hasImage = !!(course.thumbnail || course.image);

  // ─── CTA Button (shared between desktop card + mobile bar)
  const CTAButton = ({ compact = false }) => !isEnrolled ? (
    <button
      onClick={handleEnroll}
      disabled={enrolling || course.status !== 'Active'}
      className={`w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-md ${compact ? 'py-2.5 text-[13px]' : 'py-3.5 text-[15px]'}`}
    >
      {enrolling ? <><RefreshCw className="w-4 h-4 animate-spin" /> Enrolling...</> : course.status !== 'Active' ? 'Enrollment Closed' : 'Enroll for Free'}
    </button>
  ) : (
    <button
      onClick={() => navigate(`/dashboard/student/courses/${courseId}/learn`)}
      className={`w-full bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-md ${compact ? 'py-2.5 text-[13px]' : 'py-3.5 text-[15px]'}`}
    >
      <PlayCircle className={compact ? 'w-4 h-4' : 'w-5 h-5'} />
      {isCompleted ? 'Review Course' : 'Continue Learning'}
    </button>
  );

  return (
    <StudentLayout title={course.title}>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-[13px] font-bold ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* ── Breadcrumb ── */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-[1240px] mx-auto w-full px-3 sm:px-4 md:px-6 lg:px-8 py-2">
          <nav className="flex items-center gap-1.5 text-sm text-gray-500 font-medium overflow-x-auto hide-scrollbar">
            <button onClick={() => navigate('/dashboard/student')} className="hover:text-blue-600 flex-shrink-0">
              <Home className="w-[18px] h-[18px]" />
            </button>
            <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <button onClick={() => navigate('/dashboard/student/courses')} className="hover:text-blue-600 flex-shrink-0">Courses</button>
            <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="text-gray-900 font-bold truncate">{course.title}</span>
          </nav>
        </div>
      </div>

      {/* ══ MOBILE: Course image banner (hidden on lg+) ══ */}
      {hasImage && (
        <div className="lg:hidden w-full h-44 sm:h-56 overflow-hidden">
          <img
            src={course.thumbnail || course.image}
            alt={course.title}
            className="w-full h-full object-cover"
          />
          {/* subtle bottom fade */}
          <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none" />
        </div>
      )}

      {/* ── Hero ── */}
      <div className="relative bg-gradient-to-br from-[#f0f4ff] via-white to-[#f5f0ff] border-b border-gray-200">
        <div className="max-w-[1240px] mx-auto w-full px-3 sm:px-4 md:px-6 lg:px-8 py-5 md:py-12 flex flex-col lg:flex-row items-start gap-6 lg:gap-12">

          {/* Left: Info */}
          <div className="flex-1 min-w-0">
            {/* Badges */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              <span className="bg-white border border-blue-200 text-blue-700 text-[10px] md:text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm">
                {course.category || 'Course'}
              </span>
              <span className="bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] md:text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                {course.level || 'All Levels'}
              </span>
              {price === 0 && (
                <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] md:text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                  Free
                </span>
              )}
              {isEnrolled && (
                <span className="bg-gray-900 text-white text-[10px] md:text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                  {STATUS_LABEL[enrollment.status] || enrollment.status}
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-[18px] sm:text-[22px] md:text-[30px] font-bold text-gray-900 leading-tight mb-2">
              {course.title}
            </h1>

            <p className="text-[12px] md:text-[14px] text-gray-500 leading-relaxed mb-4">
              {course.shortDescription || course.description?.substring(0, 250) + '...' || 'Master this topic with hands-on practice and expert guidance.'}
            </p>

            {/* Stats row */}
            <div className="flex items-center gap-3 flex-wrap mt-1">
              <div className="flex items-center gap-1 text-[11px] md:text-[12px] text-gray-600">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span className="font-bold text-gray-900">{course.rating?.average?.toFixed(1) || '4.7'}</span>
                <span className="text-gray-400">({course.rating?.count || 108})</span>
              </div>
              <span className="text-gray-300">•</span>
              <div className="flex items-center gap-1 text-[11px] md:text-[12px] text-gray-600">
                <BookOpen className="w-3.5 h-3.5 text-gray-400" />
                {course.curriculum?.length || 5} modules
              </div>
              <span className="text-gray-300">•</span>
              <div className="flex items-center gap-1 text-[11px] md:text-[12px] text-gray-600">
                <Users className="w-3.5 h-3.5 text-gray-400" />
                {parseInt(course.enrollmentCount || 0).toLocaleString()} learners
              </div>
            </div>

            {/* What you'll learn — always visible */}
            <div className="mt-5 pt-5 border-t border-gray-200/70">
              <p className="text-[11px] md:text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-2.5">What you'll learn</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4">
                {(course.learningOutcomes?.length > 0
                  ? course.learningOutcomes.slice(0, 4)
                  : course.tags?.length > 0
                    ? course.tags.slice(0, 4)
                    : ['Core concepts and fundamentals', 'Hands-on practical projects', 'Industry best practices', 'Career-ready skills']
                ).map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    <span className="text-[12px] md:text-[13px] text-gray-700 leading-snug">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Feature pills row */}
            <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-gray-200/60">
              {[
                { icon: Globe, label: course.deliveryMode || '100% Online' },
                { icon: Clock, label: 'Flexible Schedule' },
                ...(course.certificateProvided ? [{ icon: Award, label: 'Certificate' }] : []),
                { icon: Layers, label: `${course.curriculum?.length || 5} Modules` },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-1.5 bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm">
                  <Icon className="w-3.5 h-3.5 text-blue-500" />
                  <span className="text-[11px] md:text-[12px] font-semibold text-gray-700">{label}</span>
                </div>
              ))}
            </div>

            {/* Instructor row */}
            <div className="flex items-center gap-2 mt-4">
              {partnerLogo ? (
                <img src={partnerLogo} alt={partnerName} className="w-7 h-7 rounded-lg object-contain border border-gray-200 flex-shrink-0" />
              ) : (
                <div className="w-7 h-7 rounded-lg bg-blue-100 border border-blue-200 text-blue-700 font-bold text-[12px] flex items-center justify-center flex-shrink-0">
                  {partnerName.charAt(0)}
                </div>
              )}
              <span className="text-[11px] text-gray-500">Taught by <span className="font-bold text-gray-800">{partnerName}</span></span>
            </div>
          </div>



          {/* Right: CTA Card — desktop only, image at top */}
          <div className="hidden lg:block w-full lg:w-[360px] flex-shrink-0">
            <div className="bg-white border border-gray-200 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.08)] overflow-hidden">
              {/* Course image thumbnail */}
              {hasImage ? (
                <img
                  src={course.thumbnail || course.image}
                  alt={course.title}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-36 bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-100 flex items-center justify-center">
                  <BookOpen className="w-12 h-12 text-blue-300" />
                </div>
              )}

              {/* Card body */}
              <div className="p-5">
                <h3 className="text-[18px] font-bold text-gray-900 mb-1">Start Learning</h3>
                <p className="text-[13px] text-gray-500 mb-4">
                  Join <strong className="text-blue-700">{parseInt(course.enrollmentCount || 0).toLocaleString()}</strong> learners already enrolled.
                </p>
                {isEnrolled && (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 flex items-center gap-3 mb-4">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Status</p>
                      <p className="text-[13px] font-bold text-emerald-900">{STATUS_LABEL[enrollment.status] || enrollment.status}</p>
                    </div>
                  </div>
                )}
                <CTAButton />
                <div className="mt-4 space-y-2.5 pt-4 border-t border-gray-100">
                  {[
                    { icon: Globe, label: course.deliveryMode || '100% Online' },
                    { icon: Clock, label: 'Flexible schedule' },
                    ...(course.certificateProvided ? [{ icon: Award, label: 'Certificate on completion' }] : []),
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-center gap-2.5 text-[12px] text-gray-600">
                      <Icon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      {label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── Stats ribbon (mobile: horizontal scroll pills, desktop: grid) ── */}
      <div className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-20">
        <div className="max-w-[1240px] mx-auto px-3 md:px-6 lg:px-8">
          {/* Mobile: scrollable pill row */}
          <div className="flex gap-3 overflow-x-auto hide-scrollbar py-2.5 lg:hidden">
            {[
              { icon: BookOpen, value: `${course.curriculum?.length || 5} modules` },
              { icon: Star, value: `${course.rating?.average?.toFixed(1) || '4.7'} rated` },
              { icon: BarChart3, value: `${course.level || 'All'} level` },
              { icon: ThumbsUp, value: '96% liked' },
            ].map(({ icon: Icon, value }) => (
              <div key={value} className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-full px-3 py-1.5 flex-shrink-0">
                <Icon className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-[11px] font-bold text-gray-700 whitespace-nowrap">{value}</span>
              </div>
            ))}
          </div>
          {/* Desktop: 4-col row */}
          <div className="hidden lg:grid grid-cols-4 divide-x divide-gray-100 py-4">
            {[
              { label: `${course.curriculum?.length || 5} modules`, sub: 'Gain insight into fundamentals' },
              { label: `${course.rating?.average?.toFixed(1) || '4.7'} ★`, sub: `${course.rating?.count || 108} reviews` },
              { label: `${course.level} level`, sub: 'Recommended experience' },
              { label: '96%', sub: 'Learners liked this' },
            ].map(({ label, sub }) => (
              <div key={label} className="px-5">
                <p className="text-[16px] font-bold text-gray-900">{label}</p>
                <p className="text-[12px] text-gray-500 mt-0.5">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div className="bg-white border-b border-gray-200 sticky top-[50px] z-10">
        <div className="max-w-[1240px] mx-auto px-3 md:px-6 lg:px-8">
          <nav className="flex gap-1 overflow-x-auto hide-scrollbar">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap py-3 px-2 md:px-4 border-b-2 text-[12px] md:text-[14px] font-bold flex-shrink-0 transition-colors ${activeTab === tab ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-[1240px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-8 pb-24 lg:pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-10">

          {/* LEFT CONTENT */}
          <div className="lg:col-span-2 space-y-8">

            {/* About / Outcomes */}
            {(activeTab === 'About' || activeTab === 'Outcomes') && (
              <div className="space-y-6 md:space-y-10">
                <section>
                  <h2 className="text-[16px] md:text-[22px] font-bold text-gray-900 mb-3">About this course</h2>
                  <p className="text-[13px] md:text-[15px] leading-relaxed text-gray-700 whitespace-pre-line">
                    {course.description || course.shortDescription || 'No description available.'}
                  </p>
                </section>

                <section>
                  <h2 className="text-[15px] md:text-[18px] font-bold text-gray-900 mb-3">Skills you'll gain</h2>
                  <div className="flex flex-wrap gap-2">
                    {(course.learningOutcomes?.length > 0 ? course.learningOutcomes : ['Android Development', 'React.js', 'Cross Platform', 'UI Design']).map((skill, i) => (
                      <span key={i} className="bg-gray-100 text-gray-800 text-[12px] md:text-[13px] font-medium px-3 py-1.5 rounded-full border border-gray-200">
                        {skill}
                      </span>
                    ))}
                  </div>
                </section>

                {course.tags?.length > 0 && (
                  <section>
                    <h2 className="text-[15px] md:text-[18px] font-bold text-gray-900 mb-3">Tools you'll use</h2>
                    <div className="flex flex-wrap gap-2">
                      {course.tags.map(tag => (
                        <span key={tag} className="bg-blue-50 text-blue-700 text-[12px] md:text-[13px] font-medium px-3 py-1.5 rounded-full border border-blue-100">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}

            {/* Modules */}
            {activeTab === 'Modules' && (
              <section>
                <h2 className="text-[16px] md:text-[22px] font-bold text-gray-900 mb-4">Course Modules</h2>
                {course.curriculum?.length > 0 ? (
                  <div className="space-y-2">
                    {course.curriculum.map((mod, i) => (
                      <div key={i} className={`border border-gray-200 rounded-xl overflow-hidden transition-all ${expandedModule === i ? 'bg-blue-50/40 border-blue-200' : 'bg-white hover:bg-gray-50'}`}>
                        <button
                          onClick={() => setExpandedModule(expandedModule === i ? null : i)}
                          className="w-full flex items-center justify-between p-3 md:p-4 text-left"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center text-[11px] md:text-[12px] font-bold flex-shrink-0 ${expandedModule === i ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                              {i + 1}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[13px] md:text-[15px] font-bold text-gray-900 truncate">{mod.module}</p>
                              <p className="text-[11px] text-gray-500">{mod.duration ? `${mod.duration}h` : 'Self-paced'} • {mod.topics?.length || 0} topics</p>
                            </div>
                          </div>
                          <ChevronRight className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${expandedModule === i ? 'rotate-90 text-blue-600' : ''}`} />
                        </button>

                        {expandedModule === i && (
                          <div className="px-3 md:px-4 pb-3 border-t border-blue-100">
                            {mod.topics?.length > 0 ? (
                              <ul className="mt-2 space-y-1.5">
                                {mod.topics.map((topic, j) => (
                                  <li key={j} className="flex items-start gap-2 text-[12px] md:text-[13px] text-gray-700 py-1.5 border-b border-gray-100 last:border-0">
                                    <PlayCircle className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                                    {topic}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-[12px] text-gray-400 italic mt-2">Topic details not available.</p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 border border-gray-200 rounded-xl text-center bg-gray-50">
                    <Layers className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 text-[13px]">Syllabus is currently unavailable.</p>
                  </div>
                )}
              </section>
            )}

            {/* Reviews placeholder */}
            {activeTab === 'Reviews' && (
              <div className="py-10 text-center border border-dashed border-gray-200 rounded-xl bg-gray-50">
                <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <h3 className="text-[15px] font-bold text-gray-900 mb-1">Reviews Coming Soon</h3>
                <p className="text-gray-500 text-[13px]">This section is being updated.</p>
              </div>
            )}

          </div>

          {/* RIGHT SIDEBAR — desktop only */}
          <div className="hidden lg:block space-y-4">

            {/* Instructor */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-5 shadow-sm">
              <h3 className="text-[15px] font-bold text-gray-900 mb-3">Instructor</h3>
              <div className="flex items-center gap-3">
                {partnerLogo ? (
                  <img src={partnerLogo} alt="Logo" className="w-10 h-10 rounded-lg object-contain border border-gray-100" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-[16px] flex-shrink-0">
                    {partnerName.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="text-[14px] font-bold text-blue-700">{course.instructor?.name ? `${course.instructor.name}` : partnerName}</p>
                  <p className="text-[12px] text-gray-500">132 Courses • 1.2M learners</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-gray-100">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span className="text-[13px] font-bold text-gray-900">4.8</span>
                <span className="text-[12px] text-gray-500">instructor rating</span>
              </div>
            </div>

            {/* Details */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-5 shadow-sm">
              <h3 className="text-[15px] font-bold text-gray-900 mb-3">Details</h3>
              <div className="space-y-3">
                {[
                  { icon: Globe, title: course.deliveryMode || '100% Online', sub: 'Learn at your own schedule' },
                  { icon: Clock, title: 'Flexible schedule', sub: 'Set your own deadlines' },
                  ...(course.certificateProvided ? [{ icon: Award, title: 'Certificate included', sub: 'Share on LinkedIn' }] : []),
                  ...(course.language ? [{ icon: FileText, title: course.language, sub: 'Course language' }] : []),
                ].map(({ icon: Icon, title, sub }) => (
                  <div key={title} className="flex gap-3 items-start">
                    <Icon className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[13px] font-bold text-gray-900 leading-tight">{title}</p>
                      <p className="text-[11px] text-gray-500">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Offered By */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-5 shadow-sm">
              <h3 className="text-[15px] font-bold text-gray-900 mb-3">Offered by</h3>
              <div className="flex items-center gap-3">
                {partnerLogo ? (
                  <img src={partnerLogo} alt="Logo" className="w-10 h-10 object-contain border border-gray-100 rounded-lg" />
                ) : (
                  <div className="w-10 h-10 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-gray-400" />
                  </div>
                )}
                <div>
                  <p className="text-[13px] font-bold text-gray-900">{partnerName}</p>
                  <a href="#" className="text-[12px] text-blue-600 hover:underline">Learn more</a>
                </div>
              </div>
            </div>

            {/* Assessment badge */}
            {course.assessmentId && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <Zap className="w-4 h-4 text-blue-700" />
                  <h3 className="text-[13px] font-bold text-blue-900">Assessment Included</h3>
                </div>
                <p className="text-[12px] text-blue-700 leading-relaxed">Validates your skills on completion!</p>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ══ Mobile: Fixed bottom CTA bar ══ */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 px-4 py-3 flex items-center gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="flex-shrink-0 min-w-0">
          <p className="text-[11px] text-gray-500 leading-none">Course</p>
          <p className="text-[13px] font-bold text-gray-900 truncate max-w-[120px]">{course.title}</p>
        </div>
        <div className="flex-1">
          <CTAButton compact={true} />
        </div>
      </div>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </StudentLayout>
  );
};

export default CourseDetail;