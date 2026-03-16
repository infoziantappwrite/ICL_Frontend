// src/pages/ProfileDashboard.jsx - Naukri Style (Mobile Responsive) - Full Dashboard
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../context/Profilecontext';
import { useAuth } from '../context/AuthContext';
import { jobAPI } from '../api/Api';
import StudentLayout from '../components/layout/StudentLayout';
import {
  Briefcase, ChevronRight, Edit, Star, Zap, AlertCircle,
  Sparkles, MapPin, CheckCircle, Target, Clock, Users,
  TrendingUp, Award, BookOpen, BarChart2, Rocket, Shield,
  FileText, ArrowRight
} from 'lucide-react';

// ─── Mock Data ───
const MOCK_COURSES = [
  {
    id: 1,
    title: 'Full Stack Web Development',
    provider: 'ICL Academy',
    tags: ['React', 'Node.js'],
    rating: 4.8,
    reviews: 2100,
    duration: '48 hrs',
    enrolled: 2400,
    badge: 'Bestseller',
    badgeColor: 'bg-amber-100 text-amber-700',
    thumbBg: 'from-blue-700 to-blue-500',
    icon: '⚛️',
    price: 'Free',
  },
  {
    id: 2,
    title: 'Data Science Fundamentals',
    provider: 'ICL Academy',
    tags: ['Python', 'Pandas'],
    rating: 4.7,
    reviews: 1800,
    duration: '36 hrs',
    enrolled: 1900,
    badge: 'Trending',
    badgeColor: 'bg-green-100 text-green-700',
    thumbBg: 'from-emerald-700 to-teal-500',
    icon: '🐍',
    price: 'Free',
  },
  {
    id: 3,
    title: 'Cloud Computing with AWS',
    provider: 'ICL Academy',
    tags: ['AWS', 'DevOps'],
    rating: 4.6,
    reviews: 980,
    duration: '30 hrs',
    enrolled: 1200,
    badge: 'New',
    badgeColor: 'bg-purple-100 text-purple-700',
    thumbBg: 'from-purple-700 to-indigo-500',
    icon: '☁️',
    price: '₹499',
  },
];

const MOCK_ASSESSMENTS = [
  {
    id: 1,
    title: 'JavaScript Proficiency',
    questions: 30,
    duration: '45 mins',
    level: 'Beginner to Intermediate',
    tags: ['JS', 'ES6+'],
    tagColors: ['bg-blue-50 text-blue-700', 'bg-indigo-50 text-indigo-700'],
    iconBg: 'bg-blue-50',
    icon: '💻',
    btnColor: 'bg-blue-600 hover:bg-blue-700',
    score: null,
  },
  {
    id: 2,
    title: 'Aptitude & Reasoning',
    questions: 50,
    duration: '60 mins',
    level: 'All levels',
    tags: ['Quant', 'Logical'],
    tagColors: ['bg-amber-50 text-amber-700', 'bg-purple-50 text-purple-700'],
    iconBg: 'bg-green-50',
    icon: '🧠',
    btnColor: 'bg-green-600 hover:bg-green-700',
    score: 78,
    scoreColor: 'text-green-600',
    barColor: 'bg-green-500',
  },
  {
    id: 3,
    title: 'React Developer Quiz',
    questions: 25,
    duration: '30 mins',
    level: 'Intermediate',
    tags: ['React', 'Hooks'],
    tagColors: ['bg-blue-50 text-blue-700', 'bg-purple-50 text-purple-700'],
    iconBg: 'bg-purple-50',
    icon: '⚛️',
    btnColor: 'bg-purple-600 hover:bg-purple-700',
    score: null,
  },
  {
    id: 4,
    title: 'SQL & Database Basics',
    questions: 35,
    duration: '40 mins',
    level: 'Beginner',
    tags: ['SQL', 'MySQL'],
    tagColors: ['bg-orange-50 text-orange-700', 'bg-green-50 text-green-700'],
    iconBg: 'bg-orange-50',
    icon: '🗄️',
    btnColor: 'bg-amber-600 hover:bg-amber-700',
    score: 64,
    scoreColor: 'text-amber-600',
    barColor: 'bg-amber-500',
  },
];

const TRENDING_SKILLS = [
  { icon: '⚛️', name: 'React.js', jobs: '4,200 jobs' },
  { icon: '🐍', name: 'Python', jobs: '3,800 jobs' },
  { icon: '☁️', name: 'AWS Cloud', jobs: '2,900 jobs' },
  { icon: '🤖', name: 'Gen AI / LLMs', jobs: '1,600 jobs' },
  { icon: '📊', name: 'Data Analytics', jobs: '2,100 jobs' },
];

const TOP_COMPANIES = [
  { initial: 'I', name: 'Infosys', jobs: '142 openings', badge: 'Campus', badgeStyle: 'bg-blue-50 text-blue-700', logoBg: 'bg-blue-600' },
  { initial: 'T', name: 'TCS', jobs: '217 openings', badge: 'Hiring', badgeStyle: 'bg-green-50 text-green-700', logoBg: 'bg-teal-600' },
  { initial: 'W', name: 'Wipro', jobs: '98 openings', badge: 'New', badgeStyle: 'bg-purple-50 text-purple-700', logoBg: 'bg-purple-600' },
  { initial: 'Z', name: 'Zoho', jobs: '56 openings', badge: 'Hot', badgeStyle: 'bg-red-50 text-red-700', logoBg: 'bg-red-600' },
];

const timeAgo = (dateStr) => {
  if (!dateStr) return 'Recently';
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 36e5);
  if (hours < 1) return 'Just now';
  if (hours < 24) return hours + 'h ago';
  const days = Math.floor(hours / 24);
  return `Posted ${days} Day${days > 1 ? 's' : ''} Ago`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2, '0')} ${d.toLocaleString('default', { month: 'short' })}, ${d.getFullYear()}`;
};

// ─── Reusable Card ───
const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] border border-gray-100 ${className}`}>
    {children}
  </div>
);

// ─── Section Header ───
const SectionHeader = ({ title, onViewAll }) => (
  <div className="flex items-center justify-between mb-3">
    <h2 className="text-[15px] sm:text-[17px] md:text-[20px] font-bold text-gray-900">{title}</h2>
    <button onClick={onViewAll} className="text-blue-600 text-[12px] sm:text-[13px] md:text-[14px] font-semibold hover:underline">
      View all
    </button>
  </div>
);

// ─── Compact Job Card ───
const FeedJobCard = ({ job, onClick }) => (
  <div
    onClick={onClick}
    className="border border-gray-100 rounded-xl p-2.5 sm:p-3 md:p-4 hover:shadow-md hover:border-blue-100 cursor-pointer transition-all bg-white h-full flex flex-col justify-between"
  >
    <div>
      {job.isNew && (
        <span className="inline-block mb-1.5 text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">New</span>
      )}
      {job.isHot && (
        <span className="inline-block mb-1.5 text-[9px] font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-700">Hot</span>
      )}
      <div className="flex items-start gap-2 md:gap-3 mb-1.5 md:mb-2">
        <div
          className="w-8 h-8 md:w-10 md:h-10 rounded-md md:rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: job.logoBg || '#e0e7ff' }}
        >
          <span className="font-bold text-white text-[11px] md:text-xs">
            {(job.company?.name || job.companyName || 'C')[0]}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="font-semibold text-gray-900 text-[12px] sm:text-[13px] md:text-[15px] leading-snug line-clamp-2 hover:text-blue-600 transition-colors">
            {job.title || job.jobTitle}
          </h4>
          <p className="text-[10px] sm:text-[11px] md:text-[13px] text-gray-600 mt-0.5 truncate">
            {(job.company && job.company.name) || job.companyName || 'ICL Partner'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1 text-[10px] sm:text-[11px] md:text-[12px] text-gray-500 font-medium">
        <MapPin className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 flex-shrink-0" />
        <span className="truncate">{job.location || job.jobLocation || 'Remote'}</span>
      </div>
    </div>
    <p className="text-[10px] md:text-[11px] text-gray-400 mt-1.5 md:mt-2">{timeAgo(job.createdAt)}</p>
  </div>
);

// ─── Course Card with Thumbnail ───
const CourseCard = ({ course }) => (
  <div className="bg-white border border-gray-100 rounded-xl overflow-hidden cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all">
    {/* Thumbnail */}
    <div className={`h-[90px] bg-gradient-to-br ${course.thumbBg} flex items-center justify-center relative overflow-hidden`}>
      <span className="text-4xl z-10 relative">{course.icon}</span>
      <div className="absolute inset-0 opacity-10 bg-white" />
      <span className={`absolute top-2 right-2 text-[9px] font-bold px-2 py-0.5 rounded-full bg-black/30 text-white`}>
        {course.badge}
      </span>
    </div>
    {/* Body */}
    <div className="p-3">
      <h4 className="font-semibold text-[12px] sm:text-[13px] text-gray-900 line-clamp-2 leading-snug mb-1">{course.title}</h4>
      <p className="text-[10px] sm:text-[11px] text-gray-500">{course.provider}</p>
      <div className="flex items-center gap-1 mt-1.5">
        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
        <span className="text-[11px] font-semibold text-gray-700">{course.rating}</span>
        <span className="text-[10px] text-gray-400">({(course.reviews / 1000).toFixed(1)}k)</span>
      </div>
      <div className="flex items-center gap-3 mt-1.5 text-[10px] text-gray-400">
        <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{course.duration}</span>
        <span className="flex items-center gap-1"><Users className="w-2.5 h-2.5" />{course.enrolled.toLocaleString()}</span>
      </div>
      <div className="flex flex-wrap gap-1 mt-2">
        {course.tags.map((t, i) => (
          <span key={i} className="px-1.5 py-0.5 bg-gray-50 border border-gray-100 rounded text-[9px] md:text-[10px] text-gray-600">{t}</span>
        ))}
      </div>
    </div>
    {/* Footer */}
    <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100">
      <span className="text-[13px] font-bold text-blue-600">{course.price}</span>
      <button className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-colors">
        Enroll
      </button>
    </div>
  </div>
);

// ─── Assessment Card ───
const AssessmentCard = ({ assessment }) => (
  <div className="bg-white border border-gray-100 rounded-xl p-3 md:p-4 cursor-pointer hover:shadow-md transition-shadow flex gap-3">
    <div className={`w-11 h-11 rounded-xl ${assessment.iconBg} flex items-center justify-center text-xl flex-shrink-0`}>
      {assessment.icon}
    </div>
    <div className="flex-1 min-w-0">
      <h4 className="font-bold text-[13px] md:text-[14px] text-gray-900 mb-0.5">{assessment.title}</h4>
      <p className="text-[11px] text-gray-500">{assessment.questions} questions · {assessment.duration} · {assessment.level}</p>
      <div className="flex flex-wrap gap-1.5 mt-2">
        {assessment.tags.map((tag, i) => (
          <span key={i} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${assessment.tagColors[i]}`}>{tag}</span>
        ))}
      </div>
      {assessment.score !== null && assessment.score !== undefined ? (
        <div className="mt-2">
          <div className="flex justify-between text-[10px] text-gray-400 mb-1">
            <span>Last score</span>
            <span className={`font-bold ${assessment.scoreColor}`}>{assessment.score}%</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${assessment.barColor}`} style={{ width: `${assessment.score}%` }} />
          </div>
        </div>
      ) : (
        <p className="text-[10px] text-gray-400 mt-2">Not taken yet</p>
      )}
      <button className={`mt-2.5 text-[11px] font-bold px-3 py-1.5 rounded-full text-white transition-colors ${assessment.btnColor}`}>
        {assessment.score !== null && assessment.score !== undefined ? 'Retake Test →' : 'Start Test →'}
      </button>
    </div>
  </div>
);

// ─── Job cards grid ───
const JobGrid = ({ items }) => (
  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
    {items.map(job => (
      <FeedJobCard key={job._id || job.id} job={job} onClick={() => {}} />
    ))}
  </div>
);

const ProfileDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, profileCompleteness, isLoading, fetchProfile } = useProfile();
  const [jobs, setJobs] = useState([]);
  const [activeTab, setActiveTab] = useState('Jobs');
  const [loadingFeeds, setLoadingFeeds] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => { fetchProfile(); loadJobs(); }, []);

  useEffect(() => {
    if (user && (user._id || user.id)) {
      const userId = user._id || user.id;
      if (!localStorage.getItem(`hasSeenWelcome_${userId}`)) setShowWelcome(true);
    }
  }, [user]);

  const dismissWelcome = () => {
    if (user && (user._id || user.id))
      localStorage.setItem(`hasSeenWelcome_${user._id || user.id}`, 'true');
    setShowWelcome(false);
  };

  const loadJobs = async () => {
    try {
      setLoadingFeeds(true);
      const res = await jobAPI.getAllJobs({ status: 'Active', limit: 8, sortBy: '-createdAt' });
      const list = res && (res.jobs || res.data || res.results || []);
      setJobs(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingFeeds(false);
    }
  };

  const getUserName = () => profile?.fullName || user?.fullName || user?.name || 'User';
  const getFirstName = () => getUserName().split(' ')[0];
  const getUserInitials = () => {
    const names = getUserName().split(' ');
    return names.length >= 2
      ? (names[0][0] + names[names.length - 1][0]).toUpperCase()
      : getUserName().substring(0, 2).toUpperCase();
  };

  const pct = profileCompleteness || 0;

  if (isLoading && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  // ─── Skeleton ───
  const SkeletonGrid = ({ count = 4 }) => (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-[110px] bg-white rounded-xl border border-gray-100 p-2.5 animate-pulse">
          <div className="w-7 h-7 bg-gray-200 rounded-md mb-2" />
          <div className="h-2.5 bg-gray-200 w-3/4 mb-1.5 rounded" />
          <div className="h-2 bg-gray-100 w-1/2 rounded" />
        </div>
      ))}
    </div>
  );

  return (
    <StudentLayout>
      <div className="min-h-screen bg-[#f0f4f8] px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4">
        <div className="max-w-[1240px] mx-auto space-y-3 sm:space-y-4">

          {/* ═══════════════════════════════════════════
              MOBILE PROFILE HERO (hidden on md+)
          ═══════════════════════════════════════════ */}
          <div className="md:hidden">
            <Card className="p-3">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-12 h-12 rounded-full bg-blue-100 border-2 border-blue-200 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-bold text-blue-700">{getUserInitials()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-[15px] font-bold text-gray-900 leading-tight truncate">{getUserName()}</h2>
                  <p className="text-[11px] text-gray-500 leading-snug mt-0.5 line-clamp-1">
                    {profile?.candidateType || profile?.currentRole || user?.college?.name || 'Complete your profile'}
                  </p>
                </div>
                <button
                  onClick={() => navigate('/profile/my-info')}
                  className="flex-shrink-0 w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50"
                >
                  <Edit className="w-3.5 h-3.5 text-gray-500" />
                </button>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-1">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{ width: `${pct}%`, background: pct >= 80 ? '#22c55e' : '#3b82f6' }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-gray-400">
                <span>Last updated {profile?.updatedAt ? formatDate(profile.updatedAt) : 'today'}</span>
                <span className={`font-bold ${pct >= 80 ? 'text-green-600' : 'text-blue-600'}`}>{pct}%</span>
              </div>
              <div className="mt-2.5 pt-2.5 border-t border-gray-100 flex items-center gap-3">
                <div className="flex gap-4 flex-1">
                  <div className="text-center">
                    <p className="text-[16px] font-bold text-gray-900">{profile?.primarySkills?.length || 0}</p>
                    <p className="text-[10px] text-gray-500">Skills</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[16px] font-bold text-gray-900">{profile?.yearsOfExperience || 0}</p>
                    <p className="text-[10px] text-gray-500">Exp (yrs)</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/profile/my-info')}
                  className="py-1.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-semibold rounded-full transition-colors"
                >
                  View profile
                </button>
              </div>
            </Card>
          </div>

          {/* ═══════════════════════════════════════════
              MAIN GRID (sidebar + feed)
          ═══════════════════════════════════════════ */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 md:gap-5">

            {/* ─── LEFT SIDEBAR (desktop only) ─── */}
            <div className="hidden md:block md:col-span-3">
              <div className="sticky top-[15px] space-y-4">

                {/* Desktop Profile Widget */}
                <Card className="p-5 text-center">
                  <div className="relative inline-block mb-4">
                    <svg className="w-[100px] h-[100px] transform -rotate-90">
                      <circle cx="50" cy="50" r="46" stroke="#e8ecf0" strokeWidth="5" fill="#f8fafc" />
                      <circle
                        cx="50" cy="50" r="46"
                        stroke={pct >= 80 ? '#22c55e' : '#3b82f6'}
                        strokeWidth="5" fill="none" strokeLinecap="round"
                        strokeDasharray="289" strokeDashoffset={289 - (289 * pct) / 100}
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold text-[#1e3a5f]">{getUserInitials()}</span>
                    </div>
                    <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 text-[11px] font-bold px-2.5 py-0.5 rounded-full border-2 border-white ${pct >= 80 ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                      {pct}%
                    </div>
                  </div>
                  <h2 className="text-[18px] font-bold text-gray-900 leading-tight">{getUserName()}</h2>
                  <p className="text-[13px] text-gray-500 mt-1 max-w-[200px] mx-auto leading-snug">
                    {profile?.candidateType || profile?.currentRole || user?.college?.name || 'Complete your profile to stand out'}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1.5">
                    {profile?.updatedAt ? `Last updated: ${formatDate(profile.updatedAt)}` : 'Last updated today'}
                  </p>
                  <button
                    onClick={() => navigate('/profile/my-info')}
                    className="mt-5 w-[85%] mx-auto block py-2 bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-semibold rounded-full transition-colors"
                  >
                    View profile
                  </button>
                </Card>

                {/* Quick Stats Strip */}
                <Card className="p-4">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-[20px] font-extrabold text-blue-600">24</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">Applications</p>
                    </div>
                    <div>
                      <p className="text-[20px] font-extrabold text-green-600">8</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">Shortlisted</p>
                    </div>
                    <div>
                      <p className="text-[20px] font-extrabold text-amber-600">3</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">Interviews</p>
                    </div>
                  </div>
                </Card>

                {/* Profile Performance Widget */}
                <Card className="p-4 pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900 text-[15px]">Profile performance</h3>
                    <AlertCircle className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="flex pb-4 border-b border-gray-100">
                    <div className="flex-1 cursor-pointer group">
                      <p className="text-[12px] text-gray-500 group-hover:text-blue-600">Skills Added</p>
                      <p className="text-xl font-bold text-gray-900 mt-1 flex items-center gap-1 group-hover:text-blue-600">
                        {profile?.primarySkills?.length || 0}
                        <ChevronRight className="w-4 h-4 text-blue-600" />
                      </p>
                    </div>
                    <div className="w-px bg-gray-100 mx-4" />
                    <div className="flex-1 cursor-pointer group">
                      <p className="text-[12px] text-gray-500 group-hover:text-blue-600">Experience (yrs)</p>
                      <p className="text-xl font-bold text-gray-900 mt-1 flex items-center gap-1 group-hover:text-blue-600">
                        {profile?.yearsOfExperience || 0}
                        <ChevronRight className="w-4 h-4 text-blue-600" />
                      </p>
                    </div>
                  </div>
                  <button onClick={() => navigate('/profile/my-info')} className="mt-4 w-full flex items-center justify-between text-left group">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-400 group-hover:text-amber-500" />
                      <span className="text-[13px] font-medium text-gray-700 group-hover:text-gray-900">Get 3X boost to your profile</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-900" />
                  </button>
                </Card>

                {/* Skills Card */}
                <Card className="p-4">
                  <h3 className="font-bold text-[14px] text-gray-900 mb-3">Your Top Skills</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {(profile?.primarySkills?.slice(0, 6) || ['React', 'Node.js', 'Python', 'Figma', 'MongoDB']).map((skill, i) => {
                      const colors = [
                        'bg-blue-50 text-blue-700',
                        'bg-green-50 text-green-700',
                        'bg-amber-50 text-amber-700',
                        'bg-purple-50 text-purple-700',
                        'bg-red-50 text-red-700',
                        'bg-teal-50 text-teal-700',
                      ];
                      return (
                        <span key={i} className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${colors[i % colors.length]}`}>
                          {skill}
                        </span>
                      );
                    })}
                  </div>
                </Card>

                {/* Promo / Upgrade Card */}
                <div className="rounded-xl p-4 bg-gradient-to-br from-[#1e3a8a] to-[#3b82f6] text-white text-center">
                  <Rocket className="w-7 h-7 mx-auto mb-2 text-yellow-300" />
                  <h4 className="font-bold text-[14px] mb-1">ICL Pro Membership</h4>
                  <p className="text-[11px] text-blue-100 leading-relaxed">Get 5X more visibility to recruiters and unlock premium courses</p>
                  <button className="mt-3 bg-white text-blue-700 font-bold text-[12px] px-4 py-1.5 rounded-full hover:bg-gray-100 transition-colors">
                    Upgrade Now
                  </button>
                </div>

              </div>
            </div>

            {/* ─── MAIN FEED ─── */}
            <div className="col-span-1 md:col-span-9 space-y-4 sm:space-y-5">

              {/* ── Banner ── */}
              {showWelcome ? (
                <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 rounded-xl p-4 md:p-6 text-white shadow relative overflow-hidden">
                  <h2 className="text-[16px] sm:text-[18px] md:text-[24px] font-bold flex items-center gap-1.5 md:gap-2">
                    <Sparkles className="w-4 h-4 md:w-6 md:h-6 text-yellow-300" /> Welcome to ICL, {getFirstName()}!
                  </h2>
                  <p className="text-[12px] md:text-[14px] text-blue-100 mt-1 md:mt-2 max-w-xl">
                    Your career journey starts here. Set up your profile so recruiters can find you.
                  </p>
                  <div className="mt-3 md:mt-4 flex flex-wrap gap-2 md:gap-3">
                    <button onClick={() => { dismissWelcome(); navigate('/profile/edit'); }} className="bg-white text-blue-700 hover:bg-gray-50 px-3.5 md:px-5 py-1.5 md:py-2.5 rounded-full text-[12px] md:text-[14px] font-bold transition-colors shadow-sm">
                      Complete Profile
                    </button>
                    <button onClick={dismissWelcome} className="px-3.5 md:px-5 py-1.5 md:py-2.5 rounded-full text-[12px] md:text-[14px] font-medium border border-white/30 hover:bg-white/10">
                      Explore Jobs
                    </button>
                  </div>
                  {/* Stats row */}
                  <div className="mt-4 pt-4 border-t border-white/20 flex gap-6">
                    {[['12,400+', 'Active Jobs'], ['800+', 'Companies'], ['92%', 'Placement Rate']].map(([val, label]) => (
                      <div key={label}>
                        <p className="text-[18px] font-extrabold">{val}</p>
                        <p className="text-[11px] text-blue-200">{label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="absolute right-0 top-0 w-40 h-40 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3 pointer-events-none" />
                </div>
              ) : pct >= 100 ? (
                <div className="bg-[#f0fdf4] rounded-xl p-4 md:p-6 border border-[#bbf7d0] flex flex-col sm:flex-row sm:items-center gap-3 md:gap-6">
                  <div className="flex-1">
                    <h2 className="text-[15px] sm:text-[17px] md:text-[22px] font-bold text-gray-900">{getFirstName()}, you have an All-Star Profile!</h2>
                    <p className="text-[11px] sm:text-[12px] md:text-[13px] text-gray-600 mt-1 md:mt-1.5">Stand out further by passing a skill assessment</p>
                    <button onClick={() => setActiveTab('Assessments')} className="mt-2.5 md:mt-4 bg-[#16a34a] hover:bg-[#15803d] text-white px-3.5 md:px-5 py-1.5 md:py-2.5 rounded-full text-[12px] md:text-[13px] font-bold flex items-center gap-1.5 w-fit shadow-sm">
                      <Target className="w-3.5 h-3.5 md:w-4 md:h-4" /> Take Assessment
                    </button>
                  </div>
                  <div className="hidden sm:flex items-center gap-3 flex-shrink-0">
                    <CheckCircle className="w-10 h-10 text-[#16a34a]" />
                    <span className="text-[12px] md:text-[13px] font-semibold text-[#166534]">Certified Profile</span>
                  </div>
                </div>
              ) : (
                <div className="bg-[#fff9ed] rounded-xl p-4 md:p-6 border border-[#ffe0b2]">
                  <h2 className="text-[15px] sm:text-[17px] md:text-[22px] font-bold text-gray-900">{getFirstName()}, you are missing out on key features</h2>
                  <p className="text-[11px] sm:text-[12px] md:text-[13px] text-gray-600 mt-1 md:mt-1.5">Complete your profile to unlock all features</p>
                  <button onClick={() => navigate('/profile/edit')} className="mt-2.5 md:mt-4 bg-[#b45309] hover:bg-[#92400e] text-white px-3.5 md:px-5 py-1.5 md:py-2.5 rounded-full text-[12px] md:text-[13px] font-bold flex items-center gap-1.5 w-fit shadow-sm">
                    <Star className="w-3.5 h-3.5 md:w-4 md:h-4" /> Complete Profile
                  </button>
                </div>
              )}

              {/* ══════════════════════════════════════
                  FEATURED COURSE BANNER
              ══════════════════════════════════════ */}
              <div className="rounded-xl overflow-hidden grid grid-cols-1 sm:grid-cols-2 shadow-sm">
                {/* Left: Info */}
                <div className="bg-[#0f172a] p-5 md:p-6">
                  <span className="inline-block bg-blue-900/50 text-blue-300 text-[11px] font-semibold px-3 py-1 rounded-full mb-3">
                    ✦ Featured Course
                  </span>
                  <h2 className="text-[16px] md:text-[20px] font-extrabold text-white leading-snug">
                    Full Stack Web Development Bootcamp
                  </h2>
                  <p className="text-[12px] text-slate-400 mt-2 leading-relaxed">
                    Master React, Node.js, MongoDB & more. Build 10 real projects and land your first dev job.
                  </p>
                  <div className="flex flex-wrap gap-4 mt-3 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />48 Hours</span>
                    <span className="flex items-center gap-1"><Star className="w-3 h-3 fill-amber-400 text-amber-400" />4.9 Rating</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />2,400 Enrolled</span>
                  </div>
                  <button
                    onClick={() => navigate('/dashboard/student/courses')}
                    className="mt-4 inline-flex items-center gap-2 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white font-bold text-[13px] px-5 py-2 rounded-full transition-all shadow"
                  >
                    Enroll for Free <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                {/* Right: Visual */}
                <div className="bg-gradient-to-br from-blue-700 to-indigo-600 flex items-center justify-center p-6 relative overflow-hidden min-h-[140px]">
                  <div className="text-center z-10 relative">
                    <span className="text-6xl block">💻</span>
                    <p className="text-white/80 text-[11px] mt-2">Live + Recorded Sessions</p>
                    <p className="text-white/50 text-[10px] mt-1">Certificate on Completion</p>
                  </div>
                  {/* Decorative dots */}
                  <div className="absolute top-3 right-3 grid grid-cols-4 gap-1.5 opacity-20">
                    {Array.from({ length: 16 }).map((_, i) => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full bg-white" />
                    ))}
                  </div>
                </div>
              </div>

              {/* ══════════════════════════════════════
                  JOBS BASED ON APPLIES (with tabs)
              ══════════════════════════════════════ */}
              <div>
                <div className="flex items-center justify-between mb-2 md:mb-3">
                  <h2 className="text-[15px] sm:text-[17px] md:text-[20px] font-bold text-gray-900">Jobs based on your applies</h2>
                  <button onClick={() => navigate('/dashboard/student/jobs')} className="text-blue-600 text-[12px] sm:text-[13px] md:text-[14px] font-semibold hover:underline">View all</button>
                </div>

                {/* Tab bar */}
                <div className="flex items-center gap-0 border-b-2 border-gray-200 mb-3 overflow-x-auto hide-scrollbar">
                  {['Jobs', 'Courses', 'Assessments'].map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`pb-2 md:pb-3 px-3 md:px-4 text-[12px] sm:text-[13px] md:text-[14px] font-semibold flex-shrink-0 relative transition-colors ${activeTab === tab ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      {tab} {tab === 'Jobs' && `(${jobs.length})`}
                      {activeTab === tab && <span className="absolute bottom-0 left-0 right-0 h-[2px] md:h-[3px] bg-blue-600 rounded-t" />}
                    </button>
                  ))}
                </div>

                {/* Tab content */}
                {loadingFeeds ? (
                  <SkeletonGrid count={4} />
                ) : activeTab === 'Jobs' ? (
                  jobs.length > 0 ? <JobGrid items={jobs} /> : (
                    <div className="text-center py-8 md:py-10 text-gray-500 text-[12px] md:text-[13px]">
                      <Briefcase className="w-7 h-7 md:w-8 md:h-8 text-gray-300 mx-auto mb-1.5 md:mb-2" />
                      No jobs found
                    </div>
                  )
                ) : activeTab === 'Courses' ? (
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2.5 md:gap-4">
                    {MOCK_COURSES.map(c => <CourseCard key={c.id} course={c} />)}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {MOCK_ASSESSMENTS.map(a => <AssessmentCard key={a.id} assessment={a} />)}
                  </div>
                )}
              </div>

              {/* ══════════════════════════════════════
                  TRENDING SKILLS
              ══════════════════════════════════════ */}
              <div>
                <SectionHeader title="Trending Skills to Learn" onViewAll={() => navigate('/dashboard/student/courses')} />
                <div className="flex flex-wrap gap-2">
                  {TRENDING_SKILLS.map((skill, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-100 rounded-xl cursor-pointer hover:border-blue-200 hover:bg-blue-50 transition-all flex-1 min-w-[120px]"
                    >
                      <span className="text-[18px]">{skill.icon}</span>
                      <div>
                        <p className="text-[12px] font-bold text-gray-900">{skill.name}</p>
                        <p className="text-[10px] text-gray-500">{skill.jobs}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ══════════════════════════════════════
                  FEATURED COURSES SECTION
              ══════════════════════════════════════ */}
              <div>
                <SectionHeader title="Top Courses for You" onViewAll={() => navigate('/dashboard/student/courses')} />
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2.5 md:gap-4">
                  {MOCK_COURSES.map(c => <CourseCard key={c.id} course={c} />)}
                </div>
              </div>

              {/* ══════════════════════════════════════
                  ASSESSMENTS SECTION
              ══════════════════════════════════════ */}
              <div>
                <SectionHeader title="Skill Assessments" onViewAll={() => navigate('/dashboard/student/assessments')} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {MOCK_ASSESSMENTS.map(a => <AssessmentCard key={a.id} assessment={a} />)}
                </div>
              </div>

              {/* ══════════════════════════════════════
                  TOP COMPANIES HIRING
              ══════════════════════════════════════ */}
              <div>
                <SectionHeader title="Top Companies Hiring Now" onViewAll={() => navigate('/dashboard/student/jobs')} />
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {TOP_COMPANIES.map((c, i) => (
                    <div key={i} className="bg-white border border-gray-100 rounded-xl p-3 text-center cursor-pointer hover:shadow-md transition-shadow">
                      <div className={`w-11 h-11 rounded-xl ${c.logoBg} flex items-center justify-center text-white font-bold text-[18px] mx-auto mb-2`}>
                        {c.initial}
                      </div>
                      <p className="text-[13px] font-bold text-gray-900">{c.name}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">{c.jobs}</p>
                      <span className={`inline-block mt-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full ${c.badgeStyle}`}>{c.badge}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ══════════════════════════════════════
                  RESUME BOOSTER BANNER
              ══════════════════════════════════════ */}
              <div className="rounded-xl bg-gradient-to-r from-emerald-700 to-teal-600 p-5 md:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-[15px] md:text-[17px] font-bold text-white">Boost Your Resume Score</h3>
                    <p className="text-[11px] md:text-[12px] text-emerald-100 mt-1 leading-relaxed max-w-md">
                      Upload your resume and get an instant AI-powered score with tips to stand out to recruiters.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button className="bg-white text-emerald-700 font-bold text-[12px] md:text-[13px] px-4 py-2 rounded-full hover:bg-gray-50 transition-colors">
                    Upload Resume
                  </button>
                  <button className="bg-transparent border border-white/40 text-white font-medium text-[12px] md:text-[13px] px-4 py-2 rounded-full hover:bg-white/10 transition-colors">
                    Learn More
                  </button>
                </div>
              </div>

              {/* ══════════════════════════════════════
                  JOBS BASED ON PROFILE
              ══════════════════════════════════════ */}
              <div>
                <SectionHeader title="Jobs based on your profile" onViewAll={() => navigate('/dashboard/student/jobs')} />
                {loadingFeeds ? (
                  <SkeletonGrid count={4} />
                ) : jobs.length > 0 ? (
                  <JobGrid items={jobs.slice(0, 4)} />
                ) : (
                  <div className="text-center py-8 text-gray-500 text-[12px]">
                    <Briefcase className="w-7 h-7 text-gray-300 mx-auto mb-1.5" />
                    Complete your profile to see recommendations
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </StudentLayout>
  );
};

export default ProfileDashboard;