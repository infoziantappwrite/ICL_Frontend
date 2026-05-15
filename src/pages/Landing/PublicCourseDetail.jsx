// src/pages/Landing/PublicCourseDetail.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Public course detail page — no login required to VIEW.
// Enroll button redirects to /signup (or /login) if user is not authenticated.
// If the user IS authenticated and has a student/candidate role, they are
// redirected to the proper authenticated detail page instead.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  BookOpen, Clock, Users, Award, Star, ChevronRight,
  CheckCircle2, PlayCircle, Globe, AlertCircle, Layers,
  BarChart3, Zap, Lock, RefreshCw, Home,
  ChevronDown, Tag, ArrowRight, Shield,
} from 'lucide-react';
import infoziantLogo from '../../assets/logo.png';

// ─── Styles ──────────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800;900&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap');
  * { box-sizing: border-box; }
  .pub-font  { font-family: 'DM Sans', system-ui, sans-serif; }
  .pub-display { font-family: 'Sora', system-ui, sans-serif; }
  @keyframes pub-fade-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes pub-shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
  .pub-fade-up { animation: pub-fade-up 0.55s ease both; }
  .pub-skeleton { background: linear-gradient(90deg,#f0f4ff 25%,#e8edf8 50%,#f0f4ff 75%); background-size: 200% 100%; animation: pub-shimmer 1.5s ease infinite; border-radius: 10px; }
  .pub-card { background: white; border: 1px solid #e8edf8; border-radius: 20px; box-shadow: 0 4px 24px rgba(13,43,140,0.06); }
  .pub-enroll-btn { background: linear-gradient(135deg,#0d2b8c 0%,#17a8c8 100%); box-shadow: 0 8px 28px rgba(13,43,140,0.35); transition: all 0.3s ease; }
  .pub-enroll-btn:hover { box-shadow: 0 12px 36px rgba(23,168,200,0.5); transform: translateY(-2px); }
  .pub-enroll-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; box-shadow: none; }
  .pub-tab-active { border-bottom: 2px solid #0d2b8c; color: #0d2b8c; }
  .pub-tab { border-bottom: 2px solid transparent; color: #64748b; transition: all 0.2s; }
  .pub-tab:hover { color: #0d2b8c; }
  .pub-module { border: 1px solid #e8edf8; border-radius: 12px; overflow: hidden; transition: all 0.25s; background: white; }
  .pub-module:hover { border-color: #bfdbfe; }
  .hide-sb::-webkit-scrollbar { display: none; }
  .hide-sb { -ms-overflow-style: none; scrollbar-width: none; }
`;

// ─── Category icons ───────────────────────────────────────────────────────────
const CAT_ICONS = {
  'Full Stack Development': Layers,
  'Data Science': BarChart3,
  'AI/ML': Zap, 'AI & Machine Learning': Zap,
  'DevOps': RefreshCw,
  'Cloud Computing': Globe,
  'Mobile Development': PlayCircle, 'Mobile App Development': PlayCircle,
  'Cybersecurity': Shield,
  'Blockchain': Globe,
};

// ─── Level colours ────────────────────────────────────────────────────────────
const LEVEL_STYLE = {
  Beginner:     { bg: '#dcfce7', color: '#16a34a', border: '#bbf7d0' },
  Intermediate: { bg: '#dbeafe', color: '#1d4ed8', border: '#bfdbfe' },
  Advanced:     { bg: '#ede9fe', color: '#6d28d9', border: '#ddd6fe' },
};

const TABS = ['About', 'Curriculum', 'Requirements'];

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const PageSkeleton = () => (
  <div className="pub-font min-h-screen bg-[#f8faff]">
    <div className="h-16 bg-white border-b border-gray-100" />
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-5">
        <div className="h-6 w-1/3 pub-skeleton" />
        <div className="h-10 w-full pub-skeleton" />
        <div className="h-4 w-5/6 pub-skeleton" />
        <div className="h-4 w-2/3 pub-skeleton" />
        <div className="h-40 pub-skeleton" />
      </div>
      <div className="h-72 pub-skeleton" />
    </div>
  </div>
);

// ─── Main ─────────────────────────────────────────────────────────────────────
const PublicCourseDetail = () => {
  const { courseId } = useParams();
  const navigate     = useNavigate();
  const location     = useLocation();

  // Course data passed from landing page via router state (fast path)
  const passedCourse = location.state?.course || null;

  const [course,         setCourse]         = useState(passedCourse);
  const [loading,        setLoading]        = useState(!passedCourse);
  const [error,          setError]          = useState('');
  const [activeTab,      setActiveTab]      = useState('About');
  const [expandedModule, setExpandedModule] = useState(null);
  const [mobileCtaShow,  setMobileCtaShow]  = useState(false);

  // ── Inject styles ─────────────────────────────────────────────────────────
  useEffect(() => {
    const el = document.createElement('style');
    el.textContent = STYLES;
    document.head.appendChild(el);
    return () => document.head.removeChild(el);
  }, []);

  // ── Show mobile CTA after scroll ──────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => setMobileCtaShow(window.scrollY > 300);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // ── Fetch course if not passed via state ──────────────────────────────────
  useEffect(() => {
    if (passedCourse) return; // already have it
    const fetchCourse = async () => {
      setLoading(true);
      setError('');
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        // Public list endpoint — filter to find this specific course
        const res  = await fetch(`${API_URL}/courses?limit=100`, {
          headers: { 'Content-Type': 'application/json' },
        });
        const data = await res.json();
        if (data?.success) {
          const list = data.data?.courses || data.data || data.courses || [];
          const found = list.find(
            c => (c._id || c.id) === courseId
          );
          if (found) {
            setCourse(found);
          } else {
            setError('Course not found or no longer available.');
          }
        } else {
          setError(data?.message || 'Failed to load course.');
        }
      } catch {
        setError('Could not load course details. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [courseId, passedCourse]);

  // ── Derived values ────────────────────────────────────────────────────────
  const goLogin  = () => navigate('/login',  { state: { from: location.pathname } });
  const goSignup = () => navigate('/signup', { state: { from: location.pathname } });

  if (loading) return <PageSkeleton />;

  if (error || !course) {
    return (
      <div className="pub-font min-h-screen bg-[#f8faff] flex flex-col">
        {/* Mini nav */}
        <header className="h-16 bg-white border-b border-gray-100 flex items-center px-6">
          <button onClick={() => navigate('/')} className="flex items-center">
            <img src={infoziantLogo} alt="ICL" className="h-8" />
          </button>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
          <AlertCircle className="w-12 h-12 text-red-300" />
          <p className="text-gray-600 text-sm">{error || 'Course not found'}</p>
          <button
            onClick={() => navigate('/')}
            className="text-[#0d2b8c] text-sm font-semibold hover:underline"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    );
  }

  // Normalise fields
  const rating    = course.averageRating || course.rating?.average || 0;
  const enrolled  = course.enrollmentCount || course.totalEnrollments || 0;
  const duration  = course.duration?.hours
    ? `${course.duration.hours} hours`
    : course.duration?.weeks
      ? `${course.duration.weeks} weeks`
      : course.duration
        ? `${course.duration} hours`
        : null;
  const CatIcon   = CAT_ICONS[course.category] || BookOpen;
  const levelSty  = LEVEL_STYLE[course.level] || { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' };
  const hasImage  = !!(course.thumbnail || course.image);
  const outcomes  = course.learningOutcomes?.length > 0
    ? course.learningOutcomes
    : ['Core fundamentals', 'Hands-on projects', 'Industry best practices', 'Career-ready skills'];
  const prereqs   = course.prerequisites?.length > 0
    ? course.prerequisites
    : ['No prior experience required'];

  // ── CTA — shown on sidebar card + mobile bar ──────────────────────────────
  const EnrollCTA = ({ compact = false }) => (
    <div className={compact ? '' : 'space-y-3'}>
      <button
        onClick={goSignup}
        className={`pub-enroll-btn w-full text-white font-bold rounded-xl flex items-center justify-center gap-2 ${
          compact ? 'py-2.5 text-[13px]' : 'py-3.5 text-[15px]'
        }`}
      >
        <Lock className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
        Sign up to Enroll — Free
      </button>
      {!compact && (
        <button
          onClick={goLogin}
          className="w-full py-2.5 text-[13px] font-semibold rounded-xl border border-[#bfdbfe] text-[#0d2b8c] bg-white hover:bg-[#f0f6ff] transition-colors"
        >
          Already have an account? Sign In
        </button>
      )}
    </div>
  );

  return (
    <div className="pub-font min-h-screen bg-[#f8faff]">

      {/* ── Navbar ──────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-lg border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <button onClick={() => navigate('/')} className="flex items-center shrink-0">
            <img src={infoziantLogo} alt="ICL" className="h-8" />
          </button>
          {/* Breadcrumb */}
          <nav className="hidden md:flex items-center gap-1.5 text-sm text-gray-500 font-medium min-w-0">
            <button onClick={() => navigate('/')} className="hover:text-[#0d2b8c] shrink-0 flex items-center gap-1">
              <Home className="w-4 h-4" /> Home
            </button>
            <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
            <span className="text-gray-400 shrink-0">Courses</span>
            <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
            <span className="text-gray-800 font-semibold truncate max-w-[220px]">{course.title}</span>
          </nav>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={goLogin}
              className="hidden sm:block px-4 py-2 text-[13px] font-semibold text-[#0d2b8c] border border-[#bfdbfe] rounded-xl bg-white hover:bg-[#f0f6ff] transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={goSignup}
              className="px-4 py-2 text-[13px] font-bold text-white rounded-xl pub-enroll-btn"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <div
        className="relative border-b border-gray-200"
        style={{ background: 'linear-gradient(135deg,#f0f4ff 0%,#e8f4ff 100%)' }}
      >
        {/* Mobile image */}
        {hasImage && (
          <div className="lg:hidden w-full h-48 sm:h-64 overflow-hidden">
            <img
              src={course.thumbnail || course.image}
              alt={course.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#f0f4ff] to-transparent pointer-events-none" />
          </div>
        )}

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-14">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 items-start">

            {/* Left — meta */}
            <div className="lg:col-span-2 pub-fade-up">
              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                <span
                  className="text-[11px] font-bold px-3 py-1 rounded-full border"
                  style={{ background: '#eff6ff', color: '#0d2b8c', borderColor: '#bfdbfe' }}
                >
                  {course.category || 'Course'}
                </span>
                <span
                  className="text-[11px] font-bold px-3 py-1 rounded-full border"
                  style={{ background: levelSty.bg, color: levelSty.color, borderColor: levelSty.border }}
                >
                  {course.level || 'All Levels'}
                </span>
                <span className="text-[11px] font-bold px-3 py-1 rounded-full border"
                  style={{ background: '#dcfce7', color: '#16a34a', borderColor: '#bbf7d0' }}>
                  Free
                </span>
                {course.isFeatured && (
                  <span className="text-[11px] font-bold px-3 py-1 rounded-full border bg-amber-50 text-amber-700 border-amber-200">
                    ⚡ Featured
                  </span>
                )}
              </div>

              <h1 className="pub-display text-[22px] sm:text-[28px] lg:text-[34px] font-black text-gray-900 leading-tight mb-3">
                {course.title}
              </h1>

              <p className="text-[14px] sm:text-[15px] text-gray-600 leading-relaxed mb-5">
                {course.shortDescription ||
                  (course.description?.substring(0, 280) + (course.description?.length > 280 ? '…' : '')) ||
                  'Master this topic with expert-led lessons and hands-on projects.'}
              </p>

              {/* Stats row */}
              <div className="flex flex-wrap items-center gap-4 mb-6">
                {rating > 0 && (
                  <div className="flex items-center gap-1.5 text-[13px]">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span className="font-bold text-gray-900">{rating.toFixed(1)}</span>
                    {course.rating?.count > 0 && (
                      <span className="text-gray-400">({course.rating.count} reviews)</span>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-[13px] text-gray-600">
                  <Users className="w-4 h-4 text-blue-400" />
                  <span className="font-medium">
                    {enrolled > 0 ? `${enrolled.toLocaleString()} enrolled` : 'Be first to enroll'}
                  </span>
                </div>
                {course.curriculum?.length > 0 && (
                  <div className="flex items-center gap-1.5 text-[13px] text-gray-600">
                    <BookOpen className="w-4 h-4 text-cyan-400" />
                    <span className="font-medium">{course.curriculum.length} modules</span>
                  </div>
                )}
                {duration && (
                  <div className="flex items-center gap-1.5 text-[13px] text-gray-600">
                    <Clock className="w-4 h-4 text-indigo-400" />
                    <span className="font-medium">{duration}</span>
                  </div>
                )}
              </div>

              {/* What you'll learn — quick preview */}
              <div
                className="rounded-2xl p-5 border"
                style={{ background: 'white', borderColor: '#dbeafe' }}
              >
                <p className="pub-display text-[13px] font-bold text-[#0d2b8c] uppercase tracking-wider mb-3">
                  What you'll learn
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2.5 gap-x-4">
                  {outcomes.slice(0, 6).map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                      <span className="text-[13px] text-gray-700 leading-snug">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right — desktop CTA card */}
            <div className="hidden lg:block pub-fade-up">
              <div className="pub-card sticky top-20 overflow-hidden">
                {/* Image or placeholder */}
                {hasImage ? (
                  <img
                    src={course.thumbnail || course.image}
                    alt={course.title}
                    className="w-full h-44 object-cover"
                  />
                ) : (
                  <div
                    className="w-full h-36 flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg,#dbeafe,#e0f2fe)' }}
                  >
                    <CatIcon className="w-14 h-14 text-white/60" />
                  </div>
                )}

                <div className="p-5">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="pub-display text-2xl font-black text-gray-900">Free</span>
                    <span className="text-[12px] text-gray-400">for all students</span>
                  </div>
                  <p className="text-[12px] text-gray-500 mb-4">
                    Join <strong className="text-[#0d2b8c]">{enrolled > 0 ? enrolled.toLocaleString() : 'students'}</strong> already learning.
                  </p>

                  <EnrollCTA />

                  {/* Auth nudge */}
                  <div
                    className="mt-4 rounded-xl p-3 flex items-start gap-2.5"
                    style={{ background: '#f0f6ff', border: '1px solid #bfdbfe' }}
                  >
                    <Lock className="w-3.5 h-3.5 text-[#0d2b8c] shrink-0 mt-0.5" />
                    <p className="text-[11px] text-[#0d2b8c] leading-relaxed">
                      Create a free account to enroll, track progress, and earn a certificate.
                    </p>
                  </div>

                  <div className="mt-4 space-y-2 pt-4 border-t border-gray-100">
                    {[
                      { icon: Globe,  label: course.deliveryMode || '100% Online'   },
                      { icon: Clock,  label: 'Flexible schedule'                    },
                      ...(course.certificateProvided ? [{ icon: Award, label: 'Certificate on completion' }] : []),
                    ].map(({ icon: Icon, label }) => (
                      <div key={label} className="flex items-center gap-2 text-[12px] text-gray-600">
                        <Icon className="w-3.5 h-3.5 text-gray-400" /> {label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats ribbon ────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-3 overflow-x-auto hide-sb py-3 lg:grid lg:grid-cols-4 lg:divide-x lg:divide-gray-100 lg:py-4">
            {[
              { icon: BookOpen,  val: `${course.curriculum?.length || 0} modules`,                   sub: 'Structured learning' },
              { icon: Star,      val: rating > 0 ? `${rating.toFixed(1)} ★` : '4.7 ★',              sub: 'Average rating'       },
              { icon: BarChart3, val: course.level || 'All Levels',                                   sub: 'Skill level'          },
              { icon: Users,     val: enrolled > 0 ? `${enrolled.toLocaleString()}+` : 'Open',       sub: 'Enrolled learners'    },
            ].map(({ icon: Icon, val, sub }) => (
              <div
                key={val}
                className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-3 py-1.5 shrink-0 lg:bg-transparent lg:border-0 lg:rounded-none lg:px-5 lg:block"
              >
                <Icon className="w-3.5 h-3.5 text-[#0d2b8c] lg:hidden" />
                <div>
                  <p className="text-[11px] font-bold text-gray-700 whitespace-nowrap lg:text-[15px] lg:text-gray-900">{val}</p>
                  <p className="hidden lg:block text-[12px] text-gray-500 mt-0.5">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tab bar ─────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-1 overflow-x-auto hide-sb">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap py-3.5 px-4 text-[13px] font-bold shrink-0 transition-all ${
                activeTab === tab ? 'pub-tab-active' : 'pub-tab'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32 lg:pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">

          {/* ── Left: tab content ── */}
          <div className="lg:col-span-2 space-y-10">

            {/* About */}
            {activeTab === 'About' && (
              <div className="space-y-8 pub-fade-up">
                <section>
                  <h2 className="pub-display text-[20px] font-bold text-gray-900 mb-3">About this course</h2>
                  <p className="text-[14px] leading-relaxed text-gray-700 whitespace-pre-line">
                    {course.description || course.shortDescription || 'No description available.'}
                  </p>
                </section>

                {course.tags?.length > 0 && (
                  <section>
                    <h2 className="pub-display text-[16px] font-bold text-gray-900 mb-3">Skills you'll gain</h2>
                    <div className="flex flex-wrap gap-2">
                      {course.tags.map(tag => (
                        <span
                          key={tag}
                          className="bg-blue-50 text-blue-700 text-[12px] font-medium px-3 py-1.5 rounded-full border border-blue-100"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </section>
                )}

                {/* Feature pills */}
                <section>
                  <h2 className="pub-display text-[16px] font-bold text-gray-900 mb-3">Course features</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { icon: Globe,  title: course.deliveryMode || '100% Online',   desc: 'Learn anywhere, any device'   },
                      { icon: Clock,  title: 'Flexible Schedule',                     desc: 'No fixed timing, self-paced'  },
                      { icon: Users,  title: 'Community Access',                      desc: 'Learn alongside peers'        },
                      ...(course.certificateProvided
                        ? [{ icon: Award, title: 'Certificate', desc: 'Shareable on LinkedIn' }]
                        : []),
                    ].map(({ icon: Icon, title, desc }) => (
                      <div key={title} className="flex items-start gap-3 p-4 rounded-xl border border-gray-100 bg-white">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: '#eff6ff' }}>
                          <Icon className="w-4 h-4 text-[#0d2b8c]" />
                        </div>
                        <div>
                          <p className="text-[13px] font-bold text-gray-900">{title}</p>
                          <p className="text-[11px] text-gray-500">{desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Login CTA banner */}
                <div
                  className="rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden"
                  style={{ background: 'linear-gradient(135deg,#0d2b8c 0%,#17a8c8 100%)' }}
                >
                  <div className="absolute inset-0 opacity-[0.05]"
                    style={{ backgroundImage: 'radial-gradient(circle,white 1px,transparent 1px)', backgroundSize: '20px 20px' }} />
                  <div className="relative">
                    <p className="pub-display text-white font-black text-[18px] sm:text-[20px] mb-1">
                      Ready to start learning?
                    </p>
                    <p className="text-white/70 text-[13px]">
                      Sign up free and enroll in seconds.
                    </p>
                  </div>
                  <button
                    onClick={goSignup}
                    className="relative shrink-0 flex items-center gap-2 bg-white text-[#0d2b8c] font-bold rounded-xl px-6 py-3 text-[13px] hover:bg-blue-50 transition-colors"
                  >
                    Create Free Account <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Curriculum */}
            {activeTab === 'Curriculum' && (
              <div className="pub-fade-up space-y-4">
                <h2 className="pub-display text-[20px] font-bold text-gray-900">Course Curriculum</h2>
                {course.curriculum?.length > 0 ? (
                  <div className="space-y-2">
                    {course.curriculum.map((mod, i) => (
                      <div key={i} className="pub-module">
                        <button
                          onClick={() => setExpandedModule(expandedModule === i ? null : i)}
                          className="w-full flex items-center justify-between p-4 text-left"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-[12px] font-bold shrink-0"
                              style={{
                                background: expandedModule === i ? '#0d2b8c' : '#eff6ff',
                                color: expandedModule === i ? 'white' : '#0d2b8c',
                              }}
                            >
                              {i + 1}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[14px] font-bold text-gray-900 truncate">{mod.module}</p>
                              <p className="text-[11px] text-gray-500">
                                {mod.duration ? `${mod.duration}h` : 'Self-paced'} · {mod.topics?.length || 0} topics
                              </p>
                            </div>
                          </div>
                          <ChevronDown
                            className="w-4 h-4 text-gray-400 shrink-0 transition-transform"
                            style={{ transform: expandedModule === i ? 'rotate(180deg)' : 'none' }}
                          />
                        </button>
                        {expandedModule === i && (
                          <div className="px-4 pb-4 border-t border-blue-50">
                            {mod.topics?.length > 0 ? (
                              <ul className="mt-3 space-y-2">
                                {mod.topics.map((topic, j) => (
                                  <li key={j} className="flex items-start gap-2 text-[13px] text-gray-700 py-1.5 border-b border-gray-50 last:border-0">
                                    <PlayCircle className="w-3.5 h-3.5 text-gray-300 shrink-0 mt-0.5" />
                                    {topic}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-[12px] text-gray-400 italic mt-3">Topic details coming soon.</p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-10 border border-dashed border-gray-200 rounded-2xl text-center bg-white">
                    <Layers className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400 text-[13px]">Curriculum details will be available soon.</p>
                  </div>
                )}

                {/* Locked preview nudge */}
                <div
                  className="rounded-2xl p-5 flex items-center gap-4 border"
                  style={{ background: '#f8faff', borderColor: '#dbeafe' }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: '#eff6ff' }}>
                    <Lock className="w-5 h-5 text-[#0d2b8c]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-gray-900">Full access after enrollment</p>
                    <p className="text-[12px] text-gray-500">Sign up free to watch lessons and track your progress.</p>
                  </div>
                  <button
                    onClick={goSignup}
                    className="shrink-0 px-4 py-2 text-[12px] font-bold text-white rounded-xl pub-enroll-btn"
                  >
                    Enroll Free
                  </button>
                </div>
              </div>
            )}

            {/* Requirements */}
            {activeTab === 'Requirements' && (
              <div className="pub-fade-up space-y-6">
                <section>
                  <h2 className="pub-display text-[20px] font-bold text-gray-900 mb-3">Prerequisites</h2>
                  <ul className="space-y-2">
                    {prereqs.map((p, i) => (
                      <li key={i} className="flex items-start gap-2 text-[14px] text-gray-700">
                        <CheckCircle2 className="w-4 h-4 text-[#0d2b8c] shrink-0 mt-0.5" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </section>
                {course.language && (
                  <section>
                    <h2 className="pub-display text-[16px] font-bold text-gray-900 mb-2">Language</h2>
                    <p className="text-[14px] text-gray-700">{course.language}</p>
                  </section>
                )}
              </div>
            )}
          </div>

          {/* ── Right: desktop sidebar ── */}
          <div className="hidden lg:block space-y-4">

            {/* Instructor */}
            {(course.instructor?.name || course.provider?.name) && (
              <div className="pub-card p-5">
                <h3 className="pub-display text-[14px] font-bold text-gray-900 mb-3">Instructor</h3>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-[#0d2b8c] font-bold text-[15px] shrink-0">
                    {(course.instructor?.name || course.provider?.name).charAt(0)}
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-[#0d2b8c]">{course.instructor?.name || course.provider?.name}</p>
                    <p className="text-[11px] text-gray-500">Course Instructor</p>
                  </div>
                </div>
              </div>
            )}

            {/* Details */}
            <div className="pub-card p-5">
              <h3 className="pub-display text-[14px] font-bold text-gray-900 mb-3">Course Details</h3>
              <div className="space-y-3">
                {[
                  { icon: Globe,  title: course.deliveryMode || '100% Online', sub: 'Learn at your schedule'  },
                  { icon: Clock,  title: 'Flexible schedule',                   sub: 'Set your own pace'       },
                  ...(duration ? [{ icon: Clock, title: duration, sub: 'Total course duration' }] : []),
                  ...(course.certificateProvided ? [{ icon: Award, title: 'Certificate included', sub: 'Share on LinkedIn' }] : []),
                  ...(course.language ? [{ icon: Tag, title: course.language, sub: 'Course language' }] : []),
                ].map(({ icon: Icon, title, sub }) => (
                  <div key={title + sub} className="flex gap-3 items-start">
                    <Icon className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[13px] font-bold text-gray-900 leading-tight">{title}</p>
                      <p className="text-[11px] text-gray-500">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Share CTA */}
            <div className="pub-card p-5">
              <p className="pub-display text-[14px] font-bold text-gray-900 mb-2">Start Learning Today</p>
              <p className="text-[12px] text-gray-500 mb-4">Join thousands of learners and advance your career for free.</p>
              <EnrollCTA />
            </div>
          </div>

        </div>
      </div>

      {/* ── Mobile fixed bottom CTA ─────────────────────────────────────────── */}
      <div
        className={`lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 px-4 py-3 flex items-center gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] transition-transform duration-300 ${
          mobileCtaShow ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="shrink-0 min-w-0">
          <p className="text-[10px] text-gray-400">Course</p>
          <p className="text-[12px] font-bold text-gray-900 truncate max-w-[130px]">{course.title}</p>
        </div>
        <div className="flex-1">
          <EnrollCTA compact />
        </div>
      </div>

      <style>{`
        .hide-sb::-webkit-scrollbar { display: none; }
        .hide-sb { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default PublicCourseDetail;