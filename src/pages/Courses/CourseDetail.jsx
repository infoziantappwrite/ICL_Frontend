// src/pages/Courses/CourseDetail.jsx
// Student: View full course info, enroll, and navigate to learning
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  BookOpen, Clock, Users, Award, Star, ChevronLeft, ChevronRight,
  CheckCircle2, PlayCircle, Download, Globe, AlertCircle, Layers,
  User, Tag, Calendar, BarChart3, Zap, FileText, ArrowRight, Lock,
  RefreshCw, MousePointerClick, MessageSquare, ThumbsUp, Home
} from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { courseAPI } from '../../api/Api';
import StudentLayout from '../../components/layout/StudentLayout';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const STATUS_LABEL = {
  pending: 'Enrolled',
  active: 'In Progress',
  completed: 'Completed',
  dropped: 'Dropped',
};

const TABS = ['About', 'Outcomes', 'Modules', 'Recommendations', 'Testimonials', 'Reviews'];

// ─── Skeleton Loader ──────────────────────────────────────────────────────────
const CourseDetailSkeleton = () => (
  <StudentLayout title="Loading Course...">
    <div className="animate-pulse">
      {/* Hero Section Skeleton */}
      <div className="relative bg-[#f8fafc] border-b border-gray-200 overflow-hidden flex min-h-[440px]">
        <div className="max-w-[1240px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 md:py-20 flex flex-col lg:flex-row justify-between gap-12">
          <div className="max-w-2xl flex-1 space-y-6 pt-4">
            <div className="flex gap-3 mb-6">
              <div className="h-8 w-24 bg-gray-200 rounded-full"></div>
              <div className="h-8 w-24 bg-gray-200 rounded-full"></div>
            </div>
            <div className="h-16 w-3/4 bg-gray-200 rounded-lg"></div>
            <div className="space-y-3 mt-8">
              <div className="h-4 w-full bg-gray-200 rounded"></div>
              <div className="h-4 w-5/6 bg-gray-200 rounded"></div>
            </div>
            <div className="flex items-center gap-4 mt-8">
              <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
              <div className="space-y-2">
                <div className="h-3 w-16 bg-gray-200 rounded"></div>
                <div className="h-4 w-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
          {/* Right Card Skeleton */}
          <div className="w-full lg:w-[400px] flex-shrink-0">
            <div className="bg-white border border-gray-100 rounded-3xl p-8 h-64 flex flex-col justify-end space-y-4 shadow-sm">
              <div className="h-6 w-48 bg-gray-200 rounded"></div>
              <div className="h-4 w-full bg-gray-200 rounded"></div>
              <div className="h-14 w-full bg-gray-200 rounded-2xl mt-4"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Floating Stats Skeleton */}
        <div className="relative z-20 -mt-10 mb-10 bg-white rounded-lg shadow-sm border border-gray-100 flex p-6 gap-6 h-24">
          <div className="flex-1 bg-gray-100 rounded"></div>
          <div className="w-px bg-gray-100"></div>
          <div className="flex-1 bg-gray-100 rounded"></div>
          <div className="w-px bg-gray-100"></div>
          <div className="flex-1 bg-gray-100 rounded"></div>
        </div>

        {/* Layout Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 pb-20 pt-8">
          <div className="lg:col-span-2 space-y-12">
            <div className="h-8 w-48 bg-gray-200 rounded mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 w-full bg-gray-200 rounded"></div>
              <div className="h-4 w-full bg-gray-200 rounded"></div>
              <div className="h-4 w-5/6 bg-gray-200 rounded"></div>
              <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
            </div>
            <div className="h-8 w-48 bg-gray-200 rounded mt-12 mb-4"></div>
            <div className="flex gap-3"><div className="h-10 w-24 bg-gray-200 rounded-full"></div><div className="h-10 w-32 bg-gray-200 rounded-full"></div></div>
          </div>
          <div className="space-y-8">
            <div className="h-64 bg-gray-100 rounded-lg"></div>
            <div className="h-48 bg-gray-100 rounded-lg"></div>
          </div>
        </div>
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

  useEffect(() => {
    fetchCourse();
  }, [courseId]);

  const fetchCourse = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await courseAPI.getCourseById(courseId);
      if (res.success) {
        setCourse(res.data);
        setEnrollment(res.data.enrollment || null);
      } else {
        setError(res.message || 'Course not found');
      }
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
      } else {
        showToast(res.message || 'Enrollment failed', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Enrollment failed', 'error');
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return <CourseDetailSkeleton />;
  }

  if (error || !course) {
    return (
      <StudentLayout title="Course Detail">
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
          <AlertCircle className="w-12 h-12 text-red-500" />
          <p className="text-gray-600">{error || 'Course not found'}</p>
          <button onClick={() => navigate('/dashboard/student/courses')} className="text-blue-600 hover:underline text-[14px]">
            ← Back to courses
          </button>
        </div>
      </StudentLayout>
    );
  }

  const price = course.price?.discounted || course.price?.original || 0;
  const currency = course.price?.currency === 'USD' ? '$' : '₹';
  const isEnrolled = !!enrollment;
  const isCompleted = enrollment?.status === 'completed';

  // Extract instructors or partner details safely
  const partnerName = course.instructor?.name || course.provider?.name || 'Partner Institute';
  const partnerLogo = course.instructor?.logo || course.provider?.logo || null;

  return (
    <StudentLayout title={course.title}>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-lg shadow-xl text-[14px] font-bold transition-all ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
          {toast.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
          {toast.msg}
        </div>
      )}

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
            <span className="text-gray-900 font-bold truncate max-w-[400px]" title={course.title}>
              {course.title.length > 40 ? course.title.substring(0, 40) + '...' : course.title}
            </span>
          </nav>
        </div>
      </div>

      {/* Hero Section (Light Premium Design) */}
      <div className="relative bg-[#f8fafc] border-b border-gray-200 overflow-hidden flex min-h-[440px] text-gray-900">
        {/* Dynamic Abstract Background Elements */}
        <div className="absolute inset-0 z-0 opacity-60">
          {/* Light gradient base */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white to-indigo-50/50"></div>
          {/* Soft Geometric/Abstract Orbs */}
          <div className="absolute top-[-10%] right-[10%] w-[500px] h-[500px] rounded-full bg-blue-100/50 blur-[100px] mix-blend-multiply opacity-70"></div>
          <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-indigo-100/50 blur-[80px] mix-blend-multiply opacity-60"></div>

          {/* Subtle Grid Pattern */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMCwwLDAsMC4wMykiLz48L3N2Zz4=')] [mask-image:linear-gradient(to_bottom,black,transparent)]"></div>
        </div>

        <div className="max-w-[1240px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 md:py-20 relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">

          <div className="max-w-2xl flex-1">


            {/* Top Badges */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <span className="bg-white/80 backdrop-blur-sm border border-gray-200 text-blue-700 text-[12px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full shadow-sm">
                {course.category || 'Premium Course'}
              </span>
              <span className="bg-indigo-50/80 backdrop-blur-sm border border-indigo-200 text-indigo-700 text-[12px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full shadow-sm">
                {course.level || 'All Levels'}
              </span>
              {price === 0 && (
                <span className="bg-emerald-50/80 backdrop-blur-sm border border-emerald-200 text-emerald-700 text-[12px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full shadow-sm">
                  Free Enrollment
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-[24px] md:text-[28px] font-bold text-gray-900 leading-tight mb-2">
              {course.title}
            </h1>

            <p className="text-[14px] text-gray-500 mb-8 max-w-2xl mt-1">
              {course.shortDescription || course.description?.substring(0, 150) + "..." || "Master this topic with hands-on practice, expert guidance, and community support."}
            </p>

            {/* Instructor Mapping */}
            <div className="flex items-center gap-4 bg-white/70 backdrop-blur-md border border-gray-200 p-3 rounded-2xl w-fit shadow-sm">
              {partnerLogo ? (
                <div className="bg-white border border-gray-100 p-1.5 rounded-xl w-12 h-12 flex items-center justify-center flex-shrink-0">
                  <img src={partnerLogo} alt="Partner Logo" className="max-h-full max-w-full object-contain" />
                </div>
              ) : (
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 border border-blue-200 text-blue-700 font-bold text-[18px] rounded-xl flex items-center justify-center flex-shrink-0">
                  {partnerName.charAt(0)}
                </div>
              )}
              <div className="flex flex-col pr-4">
                <span className="text-[11px] text-gray-500 uppercase tracking-widest font-bold mb-0.5">Taught By</span>
                <span className="text-[16px] font-bold text-gray-900 hover:text-blue-700 transition-colors cursor-pointer">{partnerName}</span>
              </div>
            </div>
          </div>

          {/* Right side CTA Card (Light Glassmorphism) */}
          <div className="w-full lg:w-[400px] flex-shrink-0">
            <div className="bg-white/90 backdrop-blur-2xl border border-gray-100 rounded-3xl p-8 shadow-[0_12px_40px_rgba(0,0,0,0.08)] relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-transparent pointer-events-none"></div>

              <h3 className="text-2xl font-bold text-gray-900 mb-2 relative z-10">Start Learning Today</h3>
              <p className="text-gray-600 text-[14px] mb-8 font-medium relative z-10">Join <strong className="text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">{parseInt(course.enrollmentCount || 0).toLocaleString()}</strong> learners already enrolled in this journey.</p>

              {/* Main CTA Area */}
              <div className="relative z-10">
                {!isEnrolled ? (
                  <button
                    onClick={handleEnroll}
                    disabled={enrolling || course.status !== 'Active'}
                    className="w-full bg-gradient-to-r from-blue-600 hover:from-blue-700 to-indigo-600 hover:to-indigo-700 text-white font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-[0_4px_15px_rgba(37,99,235,0.25)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.4)] transform hover:-translate-y-1"
                  >
                    {enrolling ? (
                      <><RefreshCw className="w-5 h-5 animate-spin" /> Enrolling...</>
                    ) : (
                      course.status !== 'Active' ? 'Enrollment Closed' : 'Enroll for Free'
                    )}
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-4">
                      <div className="bg-emerald-100 p-2 rounded-full text-emerald-600">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[12px] text-emerald-700 uppercase font-bold tracking-widest">Status</p>
                        <p className="text-[16px] font-bold text-emerald-900">{STATUS_LABEL[enrollment.status] || enrollment.status}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(`/dashboard/student/courses/${courseId}/learn`)}
                      className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg transform hover:-translate-y-1"
                    >
                      <PlayCircle className="w-5 h-5" /> Go to course
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">

        {/* Floating Stats Ribbon */}
        <div className="relative z-20 -mt-10 mb-10 bg-white rounded-lg shadow-[0_4px_16px_rgba(0,0,0,0.08)] border border-gray-100 flex flex-wrap md:flex-nowrap divide-y md:divide-y-0 md:divide-x divide-gray-100 p-6 gap-y-4">
          {/* Section 1 */}
          <div className="w-full md:w-1/4 px-2">
            <div className="flex items-center gap-2 font-bold text-gray-900 text-[18px]">
              {course.curriculum?.length || 5} modules
            </div>
            <p className="text-[14px] text-gray-600 mt-1">
              Gain insight into a topic and learn the fundamentals.
            </p>
          </div>

          {/* Section 2 */}
          <div className="w-full md:w-1/4 px-2 md:px-6 flex flex-col justify-center">
            <div className="flex items-center gap-1.5 font-bold text-[18px] text-gray-900">
              {course.rating?.average?.toFixed(1) || '4.7'} <Star className="w-5 h-5 text-blue-700 fill-blue-700" />
            </div>
            <p className="text-[14px] text-gray-600 mt-1">
              {course.rating?.count || Math.floor(Math.random() * 500) + 50} reviews
            </p>
          </div>

          {/* Section 3 */}
          <div className="w-full md:w-1/4 px-2 md:px-6">
            <div className="font-bold text-[18px] text-gray-900 flex items-center gap-2">
              {course.level} level
              <AlertCircle className="w-4 h-4 text-gray-400 cursor-help" />
            </div>
            <p className="text-[14px] text-gray-600 mt-1">Recommended experience</p>
          </div>

          {/* Section 4 */}
          <div className="w-full md:w-1/4 px-2 md:px-6">
            <div className="flex items-center gap-1.5 font-bold text-[18px] text-gray-900">
              <ThumbsUp className="w-5 h-5 text-blue-700 fill-blue-700" /> 96%
            </div>
            <p className="text-[14px] text-gray-600 mt-1">Most learners liked this course</p>
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <div className="border-b border-gray-200 mb-8 pt-4 hidden md:block">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`
                   whitespace-nowrap py-4 px-1 border-b-2 font-bold text-[16px] transition-colors
                   ${activeTab === tab
                    ? 'border-blue-700 text-blue-700'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                  }
                 `}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Two Column Layout (Content + Sticky Sidebar) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 pb-20">

          {/* LEFT CONTENT COLUMN */}
          <div className="lg:col-span-2 space-y-12">

            {/* About Tab Content */}
            {(activeTab === 'About' || activeTab === 'Outcomes') && (
              <div className="space-y-12">

                {/* About / Description */}
                <section id="about">
                  <h2 className="text-[24px] font-bold text-gray-900 mb-4">About this course</h2>
                  <div className="text-[16px] leading-relaxed text-gray-700 whitespace-pre-line">
                    {course.description || course.shortDescription || 'No description available for this course.'}
                  </div>
                </section>

                {/* Skills you'll gain */}
                <section id="outcomes">
                  <h2 className="text-[20px] font-bold text-gray-900 mb-4">Skills you'll gain</h2>
                  <div className="flex flex-wrap gap-2.5">
                    {course.learningOutcomes?.length > 0 ? (
                      course.learningOutcomes.map((skill, idx) => (
                        <span key={idx} className="bg-gray-100 text-gray-800 text-[14px] font-medium px-4 py-2 rounded-full border border-gray-200 hover:bg-gray-200 transition-colors cursor-default">
                          {skill}
                        </span>
                      ))
                    ) : (
                      ['Android Development', 'iOS Development', 'React.js', 'Cross Platform Development', 'User Interface (UI)'].map(skill => (
                        <span key={skill} className="bg-gray-100 text-gray-800 text-[14px] font-medium px-4 py-2 rounded-full border border-gray-200 hover:bg-gray-200 transition-colors cursor-default">
                          {skill}
                        </span>
                      ))
                    )}
                  </div>
                </section>

                {/* Tools you'll learn */}
                <section>
                  <h2 className="text-[20px] font-bold text-gray-900 mb-4">Tools you'll learn</h2>
                  <div className="flex flex-wrap gap-2.5">
                    {course.tags?.length > 0 ? (
                      course.tags.map(tag => (
                        <span key={tag} className="bg-gray-100 text-gray-800 text-[14px] font-medium px-4 py-2 rounded-full border border-gray-200 hover:bg-gray-200 transition-colors cursor-default">
                          {tag}
                        </span>
                      ))
                    ) : (
                      ['UI Components', 'React Native'].map(tool => (
                        <span key={tool} className="bg-gray-100 text-gray-800 text-[14px] font-medium px-4 py-2 rounded-full border border-gray-200 hover:bg-gray-200 transition-colors cursor-default">
                          {tool}
                        </span>
                      ))
                    )}
                  </div>
                </section>

              </div>
            )}

            {/* Modules Tab Content */}
            {(activeTab === 'Modules') && (
              <section id="modules">
                <h2 className="text-[24px] font-bold text-gray-900 mb-6">Modules</h2>

                {course.curriculum?.length > 0 ? (
                  <div className="space-y-4">
                    {course.curriculum.map((mod, i) => (
                      <div key={i} className={`border border-gray-200 rounded-lg overflow-hidden transition-all ${expandedModule === i ? 'bg-[#f7f9fa] shadow-sm' : 'bg-white hover:bg-[#f7f9fa]'}`}>
                        <div
                          onClick={() => setExpandedModule(expandedModule === i ? null : i)}
                          className="p-6 flex items-start justify-between cursor-pointer"
                        >
                          <div>
                            <h3 className="text-[18px] font-bold text-gray-900 mb-1">{mod.module}</h3>
                            <p className="text-[14px] text-gray-600">Module {i + 1} • {mod.duration ? `${mod.duration} hours to complete` : 'Self-paced'}</p>
                          </div>

                          <div className="flex items-center gap-2">
                            {expandedModule !== i && (
                              <span className="text-blue-700 font-bold text-[14px] hidden sm:block">Module details</span>
                            )}
                            <ChevronRight className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${expandedModule === i ? 'rotate-90 text-blue-700' : ''}`} />
                          </div>
                        </div>

                        {/* Expanded Content */}
                        {expandedModule === i && (
                          <div className="px-6 pb-6 pt-2 border-t border-gray-100 bg-white">
                            <h4 className="font-bold text-gray-900 mb-3 text-[14px] uppercase tracking-wider">What's included</h4>
                            {mod.topics?.length > 0 ? (
                              <ul className="space-y-3">
                                {mod.topics.map((topic, j) => (
                                  <li key={j} className="flex gap-3 text-[15px] text-gray-700 border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                                    <PlayCircle className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                                    {topic}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-[14px] text-gray-500 italic">Topic details not provided.</p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 border border-gray-200 rounded-lg text-center bg-[#f7f9fa]">
                    <Layers className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium">Detailed syllabus is currently unavailable.</p>
                  </div>
                )}
              </section>
            )}

            {/* Placeholder for other tabs */}
            {['Recommendations', 'Testimonials', 'Reviews'].includes(activeTab) && (
              <div className="py-12 text-center border border-gray-200 border-dashed rounded-lg bg-gray-50">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-[18px] font-bold text-gray-900 mb-1">Coming Soon</h3>
                <p className="text-gray-500 text-[14px]">The {activeTab} section is currently being updated.</p>
              </div>
            )}

          </div>

          {/* RIGHT SIDEBAR COLUMN */}
          <div className="space-y-8">

            {/* Instructor Card */}
            <div className="bg-white p-6 border border-gray-200 rounded-lg shadow-sm">
              <h3 className="text-[20px] font-bold text-gray-900 mb-4">Instructor</h3>

              <div className="flex items-center gap-2 mb-4">
                <p className="text-[14px] text-gray-700">Instructor ratings</p>
                <AlertCircle className="w-4 h-4 text-gray-400 cursor-help" />

                <span className="font-bold text-[16px] text-gray-900 ml-auto">4.8</span>
                <Star className="w-4 h-4 text-blue-700 fill-blue-700" />
                <span className="text-[14px] text-gray-500">({course.rating?.count || '108'} ratings)</span>
              </div>

              <div className="flex items-start gap-4 pt-4 border-t border-gray-100">
                {partnerLogo ? (
                  <div className="w-12 h-12 border border-gray-200 rounded flex items-center justify-center p-1 bg-white flex-shrink-0">
                    <img src={partnerLogo} alt="Logo" className="w-full h-full object-contain" />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-[20px] flex-shrink-0">
                    {partnerName.charAt(0)}
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-[16px] text-blue-700 hover:underline cursor-pointer">{course.instructor?.name ? `Taught by ${course.instructor.name}` : `Taught by ${partnerName} Experts`}</h4>
                  <p className="text-[14px] text-gray-600 mb-1">{partnerName}</p>
                  <p className="text-[12px] text-gray-500 font-medium">132 Courses • 1,295,231 learners</p>
                </div>
              </div>
            </div>

            {/* Offered By Card */}
            <div className="bg-white p-6 border border-gray-200 rounded-lg shadow-sm">
              <h3 className="text-[20px] font-bold text-gray-900 mb-4">Offered by</h3>

              <div className="flex items-center gap-4">
                {partnerLogo ? (
                  <div className="w-16 h-16 border border-gray-200 rounded flex items-center justify-center p-2 bg-white flex-shrink-0">
                    <img src={partnerLogo} alt="Logo" className="w-full h-full object-contain" />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded bg-gray-50 border border-gray-200 flex items-center justify-center p-2 flex-shrink-0">
                    <BookOpen className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <div>
                  <p className="font-bold text-[16px] text-gray-900">{partnerName}</p>
                  <a href="#" className="font-bold text-[14px] text-blue-700 hover:underline mt-1 inline-block">Learn more</a>
                </div>
              </div>
            </div>

            {/* Details to Know Card */}
            <div className="bg-white p-6 border border-gray-200 rounded-lg shadow-sm">
              <h3 className="text-[20px] font-bold text-gray-900 mb-4">Details to know</h3>

              <div className="space-y-5">
                {course.certificateProvided && (
                  <div className="flex gap-4">
                    <Award className="w-6 h-6 text-gray-600 flex-shrink-0" />
                    <div>
                      <p className="font-bold text-[15px] text-gray-900">Shareable certificate</p>
                      <p className="text-[14px] text-gray-600">Add to your LinkedIn profile</p>
                    </div>
                  </div>
                )}

                <div className="flex gap-4">
                  <Globe className="w-6 h-6 text-gray-600 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-[15px] text-gray-900">{course.deliveryMode || '100% online'}</p>
                    <p className="text-[14px] text-gray-600">Start instantly and learn at your own schedule.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Clock className="w-6 h-6 text-gray-600 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-[15px] text-gray-900">Flexible schedule</p>
                    <p className="text-[14px] text-gray-600">Set and maintain flexible deadlines.</p>
                  </div>
                </div>

                {course.language && (
                  <div className="flex gap-4">
                    <FileText className="w-6 h-6 text-gray-600 flex-shrink-0" />
                    <div>
                      <p className="font-bold text-[15px] text-gray-900">{course.language}</p>
                      <p className="text-[14px] text-gray-600">Subtitles available.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Embedded Assessment Notice */}
            {course.assessmentId && (
              <div className="bg-blue-50 p-6 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-5 h-5 text-blue-700" />
                  <h3 className="text-[16px] font-bold text-blue-900">Assessment Included</h3>
                </div>
                <p className="text-[14px] text-blue-800">
                  A linked assessment will trigger upon completion. Validates your skills immediately!
                </p>
              </div>
            )}

          </div>
        </div>

      </div>

    </StudentLayout>
  );
};

export default CourseDetail;