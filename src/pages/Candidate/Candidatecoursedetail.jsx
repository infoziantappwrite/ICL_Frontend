// src/pages/Candidate/CandidateCourseDetail.jsx

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Clock,
  Users,
  Award,
  Star,
  ChevronRight,
  CheckCircle2,
  PlayCircle,
  Globe,
  AlertCircle,
  Layers,
  BarChart3,
  FileText,
  RefreshCw,
  MessageSquare,
  ThumbsUp,
  Lock,
  Briefcase,
  Rocket,
  UserCheck,
  Building2,
  Medal,
  Check,
} from 'lucide-react';

import { courseAPI } from '../../api/Api';
import CandidateLayout from '../../components/layout/CandidateLayout';

const STATUS_LABEL = {
  pending: 'Enrolled',
  active: 'In Progress',
  completed: 'Completed',
  dropped: 'Dropped',
};

const TABS = ['About', 'Modules', 'Reviews'];

const BUTTON_GRADIENT =
  'bg-gradient-to-r from-[#1c5fc9] via-[#1d79d7] to-[#27a8da] text-white';

const Skeleton = () => (
  <CandidateLayout title="Loading...">
    <div className="min-h-screen bg-white animate-pulse">
      <div className="h-12 bg-white border-b border-slate-100" />
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="h-72 bg-slate-100 rounded-[28px] mb-8" />
      </div>
    </div>
  </CandidateLayout>
);

const Card = ({ children, className = '' }) => (
  <div
    className={`bg-white border border-slate-200 rounded-[26px] shadow-[0_10px_35px_rgba(15,23,42,0.04)] ${className}`}
  >
    {children}
  </div>
);

const CandidateCourseDetail = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState('About');
  const [expandedModule, setExpandedModule] = useState(0);

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

  if (loading) return <Skeleton />;

  if (error || !course) {
    return (
      <CandidateLayout title="Course Detail">
        <div className="min-h-[70vh] bg-white flex items-center justify-center px-4">
          <Card className="p-8 max-w-md w-full text-center">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />

            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              Unable to load course
            </h2>

            <p className="text-sm text-gray-500 mb-6">
              {error || 'Course not found'}
            </p>

            <button
              onClick={() => navigate('/dashboard/candidate/courses')}
              className={`px-5 py-3 rounded-2xl ${BUTTON_GRADIENT} font-semibold shadow-[0_8px_25px_rgba(29,121,215,0.35)] hover:shadow-xl hover:brightness-105 hover:scale-[1.02] transition-all duration-300`}
            >
              Back to Courses
            </button>
          </Card>
        </div>
      </CandidateLayout>
    );
  }

  const isEnrolled = !!enrollment;
  const isCompleted = enrollment?.status === 'completed';

  const partnerName =
    course.instructor?.name || course.provider?.name || 'Platform Instructor';

  const partnerLogo = course.instructor?.logo || course.provider?.logo || null;

  const learnCount = parseInt(course.enrollmentCount || 2).toLocaleString();
  const modulesCount = course.curriculum?.length || 1;
  const ratingAverage = course.rating?.average?.toFixed(1) || '0.0';
  const ratingCount = course.rating?.count || 108;

  const fallbackModules = [
    {
      module: 'Introduction to Full Stack Development',
      duration: '30 min',
      topics: ['What is Full Stack Development?', 'Roadmap & Tools Overview'],
    },
    {
      module: 'Frontend Development',
      duration: '45 min',
      topics: ['HTML, CSS, JavaScript', 'React Basics', 'Responsive UI'],
    },
    {
      module: 'Backend Development',
      duration: '60 min',
      topics: ['Node.js Basics', 'Express APIs', 'Routing'],
    },
    {
      module: 'Database & APIs',
      duration: '40 min',
      topics: ['MongoDB Basics', 'CRUD Operations', 'API Testing'],
    },
  ];

  const curriculum =
    course.curriculum?.length > 0 ? course.curriculum : fallbackModules;

  const CTAButton = ({ compact = false }) => (
    <button
      onClick={
        !isEnrolled
          ? handleEnroll
          : () => navigate(`/dashboard/candidate/courses/${courseId}/learn`)
      }
      disabled={!isEnrolled && (enrolling || course.status !== 'Active')}
      className={`w-full rounded-2xl ${BUTTON_GRADIENT} font-semibold flex items-center justify-center gap-3 shadow-[0_8px_25px_rgba(29,121,215,0.35)] hover:shadow-xl hover:brightness-105 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed ${
        compact ? 'py-3 text-sm' : 'py-4 text-[15px]'
      }`}
    >
      {!isEnrolled ? (
        enrolling ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            Enrolling...
          </>
        ) : course.status !== 'Active' ? (
          <>
            <Lock className="w-4 h-4 text-white" />
            Enrollment Closed
          </>
        ) : (
          <>
            <BookOpen className="w-4 h-4 text-white" />
            Get Started
          </>
        )
      ) : (
        <>
          <PlayCircle className="w-5 h-5 text-white" />
          {isCompleted ? 'Review Course' : 'Continue Learning'}
        </>
      )}
    </button>
  );

  return (
    <CandidateLayout title={course.title}>
      <div className="min-h-screen bg-white text-gray-700">
        {toast && (
          <div
            className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl text-sm font-bold ${
              toast.type === 'error'
                ? 'bg-red-600 text-white'
                : 'bg-emerald-600 text-white'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            {toast.msg}
          </div>
        )}

        <div className="bg-white border-b border-slate-100">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <button
              onClick={() => navigate('/dashboard/candidate/courses')}
              className={`px-4 py-2 rounded-xl ${BUTTON_GRADIENT} font-semibold flex items-center gap-2 text-sm shadow-[0_8px_25px_rgba(29,121,215,0.35)] hover:shadow-xl hover:brightness-105 hover:scale-[1.02] transition-all duration-300`}
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
              Back to Courses
            </button>
          </div>
        </div>

        <header className="bg-white">
          <div className="max-w-6xl mx-auto px-6 py-10 lg:py-14">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-8">
                <div className="flex flex-wrap gap-2 mb-6">
                  <span className="bg-blue-50 text-blue-700 border border-blue-100 text-xs font-semibold uppercase tracking-wide px-3 py-1.5 rounded-full">
                    {course.category || 'Full Stack Development'}
                  </span>

                  <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs font-semibold uppercase tracking-wide px-3 py-1.5 rounded-full">
                    {course.level || 'Beginner'}
                  </span>

                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-semibold uppercase tracking-wide px-3 py-1.5 rounded-full">
                    Free
                  </span>

                  {isEnrolled && (
                    <span className="bg-slate-100 text-gray-700 text-xs font-semibold uppercase tracking-wide px-3 py-1.5 rounded-full">
                      {STATUS_LABEL[enrollment.status] || enrollment.status}
                    </span>
                  )}
                </div>

                <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 leading-tight mb-5 max-w-4xl">
                  {course.title}
                </h1>

                <p className="text-base lg:text-lg text-gray-500 leading-8 max-w-3xl mb-7">
                  {course.shortDescription ||
                    course.description ||
                    'Master this course with structured learning and practical understanding.'}
                </p>

                <div className="flex flex-wrap items-center gap-5 mb-8">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                    <span>{ratingAverage}</span>
                    <span className="text-gray-500">({ratingCount})</span>
                  </div>

                  <div className="h-5 w-px bg-slate-200" />

                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <BookOpen className="w-5 h-5 text-gray-500" />
                    {modulesCount} Modules
                  </div>

                  <div className="h-5 w-px bg-slate-200" />

                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Users className="w-5 h-5 text-gray-500" />
                    {learnCount} Learners
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    'Core concepts and fundamentals',
                    'Hands-on projects and practice',
                    'Industry best practices',
                    'Career-ready skills',
                  ].map((item) => (
                    <div
                      key={item}
                      className="bg-white border border-slate-200 rounded-2xl px-4 py-4 shadow-sm flex items-center gap-3"
                    >
                      <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" />
                      <p className="text-sm font-semibold text-gray-700">
                        {item}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-4">
                <Card className="p-6">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mb-5 border border-blue-100">
                    <BookOpen className="w-7 h-7 text-blue-500" />
                  </div>

                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Start Learning
                  </h3>

                  <p className="text-sm text-gray-500 font-medium mb-5">
                    Join{' '}
                    <span className="text-blue-600 font-semibold">
                      {learnCount}
                    </span>{' '}
                    learners already enrolled.
                  </p>

                  <CTAButton />

                  <div className="border-t border-slate-100 mt-6 pt-5 space-y-4">
                    <div className="flex items-center gap-3 text-sm font-semibold text-gray-500">
                      <Globe className="w-4 h-4" />
                      ONLINE
                    </div>

                    <div className="flex items-center gap-3 text-sm font-semibold text-gray-500">
                      <Clock className="w-4 h-4" />
                      Flexible schedule
                    </div>

                    <div className="flex items-center gap-3 text-sm font-semibold text-gray-500">
                      <Award className="w-4 h-4" />
                      Certificate on completion
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </header>

        <section className="bg-white">
          <div className="max-w-6xl mx-auto px-6">
            <Card className="p-0 overflow-hidden">
              <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-slate-100">
                {[
                  {
                    icon: BookOpen,
                    value: modulesCount,
                    label: 'Modules',
                    sub: 'Structured learning',
                  },
                  {
                    icon: Star,
                    value: ratingAverage,
                    label: 'Course Rating',
                    sub: `${course.rating?.count || 0} reviews`,
                  },
                  {
                    icon: BarChart3,
                    value: course.level || 'Beginner',
                    label: 'Recommended',
                    sub: 'experience',
                  },
                  {
                    icon: ThumbsUp,
                    value: '96%',
                    label: 'Learners liked',
                    sub: 'this course',
                  },
                ].map(({ icon: Icon, value, label, sub }) => (
                  <div key={label} className="p-6 flex items-center gap-5">
                    <Icon className="w-9 h-9 text-blue-600 shrink-0" />
                    <div>
                      <p className="text-2xl font-bold text-gray-900 leading-none">
                        {value}
                      </p>
                      <p className="text-sm font-semibold text-gray-700 mt-1">
                        {label}
                      </p>
                      <p className="text-xs font-medium text-gray-500 mt-0.5">
                        {sub}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </section>

        <div className="bg-white border-b border-slate-100 mt-8">
          <div className="max-w-6xl mx-auto px-6">
            <nav className="flex gap-4 overflow-x-auto hide-scrollbar py-3">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shrink-0 ${
                    activeTab === tab
                      ? `${BUTTON_GRADIENT} shadow-[0_8px_25px_rgba(29,121,215,0.35)]`
                      : 'bg-white text-gray-500 border border-slate-200 hover:text-gray-700 hover:shadow-sm'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>
        </div>

        <main className="bg-white">
          <div className="max-w-6xl mx-auto px-6 py-9 pb-24">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 space-y-8">
                {activeTab === 'About' && (
                  <>
                    <Card className="p-7">
                      <div className="flex items-center gap-3 mb-5">
                        <BookOpen className="w-7 h-7 text-blue-500" />
                        <h2 className="text-2xl font-semibold text-gray-900">
                          About this course
                        </h2>
                      </div>

                      <p className="text-base leading-8 text-gray-700 whitespace-pre-line font-medium">
                        {course.description ||
                          course.shortDescription ||
                          'No description available.'}
                      </p>
                    </Card>

                    <Card className="p-7">
                      <div className="flex items-center gap-3 mb-6">
                        <Layers className="w-7 h-7 text-blue-500" />
                        <h2 className="text-2xl font-semibold text-gray-900">
                          Course Curriculum
                        </h2>
                      </div>

                      <ModuleList
                        curriculum={curriculum}
                        expandedModule={expandedModule}
                        setExpandedModule={setExpandedModule}
                        isEnrolled={isEnrolled}
                      />
                    </Card>
                  </>
                )}

                {activeTab === 'Modules' && (
                  <Card className="p-7">
                    <div className="flex items-center gap-3 mb-6">
                      <Layers className="w-7 h-7 text-blue-500" />
                      <h2 className="text-2xl font-semibold text-gray-900">
                        Course Curriculum
                      </h2>
                    </div>

                    <ModuleList
                      curriculum={curriculum}
                      expandedModule={expandedModule}
                      setExpandedModule={setExpandedModule}
                      isEnrolled={isEnrolled}
                    />
                  </Card>
                )}

                {activeTab === 'Reviews' && (
                  <Card className="py-20 px-7 text-center min-h-[250px] flex flex-col items-center justify-center">
                    <MessageSquare className="w-14 h-14 text-slate-300 mx-auto mb-3" />

                    <h3 className="text-xl font-semibold text-gray-900 mb-1">
                      Reviews Coming Soon
                    </h3>

                    <p className="text-gray-500 text-sm font-medium">
                      This section is being updated.
                    </p>
                  </Card>
                )}

                <Card className="p-7 bg-gradient-to-br from-slate-50 via-white to-slate-100">
                  <div className="flex items-center gap-3 mb-7">
                    <Medal className="w-7 h-7 text-amber-500" />
                    <h2 className="text-2xl font-semibold text-gray-900">
                      Why learn this course?
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-5 divide-y md:divide-y-0 md:divide-x divide-slate-200">
                    {[
                      {
                        icon: Briefcase,
                        title: 'In-demand Skills',
                        text: 'Learn skills that companies are actively hiring for.',
                      },
                      {
                        icon: Rocket,
                        title: 'Real-world Projects',
                        text: 'Build projects you can add to your portfolio.',
                      },
                      {
                        icon: UserCheck,
                        title: 'Expert Guidance',
                        text: 'Learn from experienced instructors.',
                      },
                      {
                        icon: BookOpen,
                        title: 'Career Growth',
                        text: 'Boost your career with high-value skills.',
                      },
                    ].map(({ icon: Icon, title, text }) => (
                      <div
                        key={title}
                        className="pt-5 md:pt-0 md:px-5 first:pt-0 first:md:pl-0 last:md:pr-0 text-center"
                      >
                        <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center mx-auto mb-4">
                          <Icon className="w-7 h-7 text-blue-500" />
                        </div>

                        <h3 className="text-sm font-semibold text-gray-900 mb-2">
                          {title}
                        </h3>

                        <p className="text-xs leading-5 font-medium text-gray-500">
                          {text}
                        </p>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              <aside className="hidden lg:block lg:col-span-4 space-y-6">
                <Card className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-5">
                    Instructor
                  </h3>

                  <div className="flex items-center gap-4">
                    {partnerLogo ? (
                      <img
                        src={partnerLogo}
                        alt="Logo"
                        className="w-14 h-14 rounded-2xl object-contain border border-slate-100"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-semibold text-lg">
                        {partnerName.charAt(0)}
                      </div>
                    )}

                    <div>
                      <p className="text-base font-semibold text-blue-600">
                        {partnerName}
                      </p>
                      <p className="text-sm text-gray-500 font-medium">
                        132 Courses • 1.2M Learners
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-5">
                    This course includes
                  </h3>

                  <div className="space-y-5">
                    {[
                      {
                        icon: Globe,
                        title: 'Online learning',
                        sub: 'Learn at your own pace',
                      },
                      {
                        icon: Clock,
                        title: 'Flexible schedule',
                        sub: 'Study on your timeline',
                      },
                      ...(course.certificateProvided
                        ? [
                            {
                              icon: Award,
                              title: 'Certificate included',
                              sub: 'Share on LinkedIn',
                            },
                          ]
                        : []),
                      ...(course.language
                        ? [
                            {
                              icon: FileText,
                              title: course.language,
                              sub: 'Course language',
                            },
                          ]
                        : [
                            {
                              icon: FileText,
                              title: 'English',
                              sub: 'Course language',
                            },
                          ]),
                      {
                        icon: Users,
                        title: 'Lifetime access',
                        sub: 'Learn anytime, anywhere',
                      },
                    ].map(({ icon: Icon, title, sub }) => (
                      <div key={title} className="flex gap-4 items-start">
                        <Icon className="w-5 h-5 text-gray-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {title}
                          </p>
                          <p className="text-sm text-gray-500 font-medium mt-0.5">
                            {sub}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-5">
                    Offered by
                  </h3>

                  <div className="flex items-center gap-4">
                    {partnerLogo ? (
                      <img
                        src={partnerLogo}
                        alt="Logo"
                        className="w-14 h-14 object-contain border border-slate-100 rounded-2xl"
                      />
                    ) : (
                      <div className="w-14 h-14 bg-white border border-slate-200 rounded-2xl flex items-center justify-center">
                        <Building2 className="w-7 h-7 text-gray-500" />
                      </div>
                    )}

                    <p className="text-sm font-semibold text-gray-900">
                      {partnerName}
                    </p>
                  </div>
                </Card>
              </aside>
            </div>
          </div>
        </main>

        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-4 py-3 flex items-center gap-3 shadow-[0_-8px_30px_rgba(15,23,42,0.12)]">
          <div className="shrink-0 min-w-0">
            <p className="text-xs text-gray-500 leading-none font-semibold">
              Course
            </p>
            <p className="text-sm font-semibold text-gray-900 truncate max-w-[130px]">
              {course.title}
            </p>
          </div>

          <div className="flex-1">
            <CTAButton compact />
          </div>
        </div>

        <style>{`
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }

          .hide-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>
      </div>
    </CandidateLayout>
  );
};

const ModuleList = ({
  curriculum,
  expandedModule,
  setExpandedModule,
  isEnrolled,
}) => {
  const visibleModules = curriculum.slice(0, 6);

  return (
    <div className="space-y-3">
      {visibleModules.map((mod, i) => {
        const topics = mod.topics || [];
        const isOpen = expandedModule === i;
        const isFirst = i === 0;
        const isLocked = !isEnrolled && i > 0;

        return (
          <div
            key={i}
            className={`border rounded-2xl overflow-hidden transition-all ${
              isOpen
                ? 'border-blue-200 shadow-sm'
                : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
            }`}
          >
            <button
              onClick={() => setExpandedModule(isOpen ? null : i)}
              className="w-full flex items-center justify-between p-5 text-left bg-white"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div
                  className={`${
                    isFirst
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-slate-100 text-gray-700'
                  } w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold shrink-0`}
                >
                  {i + 1}
                </div>

                <p className="text-sm font-semibold text-gray-900 truncate">
                  {mod.module}
                </p>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <span className="hidden sm:inline text-sm font-medium text-gray-500">
                  {topics.length || 2} Topics • {mod.duration || '30 min'}
                </span>

                {isLocked ? (
                  <Lock className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronRight
                    className={`w-5 h-5 text-gray-500 transition-transform ${
                      isOpen ? 'rotate-90' : ''
                    }`}
                  />
                )}
              </div>
            </button>

            {isOpen && (
              <div className="border-t border-slate-100 bg-white px-6 py-4 space-y-3">
                {(topics.length > 0
                  ? topics
                  : ['What is Full Stack Development?', 'Roadmap & Tools Overview']
                ).map((topic, j) => (
                  <div
                    key={j}
                    className="flex items-center justify-between gap-4 pl-8"
                  >
                    <div className="flex items-center gap-3">
                      <PlayCircle className="w-5 h-5 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">
                        {topic}
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium text-gray-500 hidden sm:inline">
                        {j === 0 ? '10 min' : '20 min'}
                      </span>

                      <Check className="w-5 h-5 text-blue-500 bg-blue-50 rounded-full p-0.5" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default CandidateCourseDetail;