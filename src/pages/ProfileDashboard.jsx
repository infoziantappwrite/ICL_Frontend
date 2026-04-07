// src/pages/ProfileDashboard.jsx - Naukri Style (Mobile Responsive) - Full Dashboard
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../context/Profilecontext';
import { useAuth } from '../context/AuthContext';
import { jobAPI, courseAPI, assessmentAttemptAPI } from '../api/Api';
import StudentLayout from '../components/layout/StudentLayout';
import {
  Briefcase, ChevronRight, Edit, Star, Zap, Rocket, AlertCircle,
  Clock, MapPin, Users, BookOpen, LayoutDashboard, Search,
  FileText, ArrowRight, Code2, Sparkles, Target, CheckCircle
} from 'lucide-react';


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
const SectionHeader = ({ title }) => (
  <div className="mb-3">
    <h2 className="text-[15px] sm:text-[17px] md:text-[20px] font-bold text-gray-900">{title}</h2>
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
const CourseCard = ({ course, onClick }) => (
  <div onClick={onClick} className="bg-white border border-gray-100 rounded-xl overflow-hidden cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all">
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
        <span className="text-[10px] text-gray-400">({course.reviews >= 1000 ? (course.reviews / 1000).toFixed(1) + 'k' : course.reviews})</span>
      </div>
      <div className="flex items-center gap-3 mt-1.5 text-[10px] text-gray-400">
        <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{course.duration}</span>
        <span className="flex items-center gap-1"><Users className="w-2.5 h-2.5" />{course.enrolled?.toLocaleString() || 0}</span>
      </div>
      <div className="flex flex-wrap gap-1 mt-2">
        {course.tags?.map((t, i) => (
          <span key={i} className="px-1.5 py-0.5 bg-gray-50 border border-gray-100 rounded text-[9px] md:text-[10px] text-gray-600">{t}</span>
        ))}
      </div>
    </div>
    {/* Footer */}
    <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100">
      <span className="text-[13px] font-bold text-blue-600">{course.price}</span>
      <button onClick={(e) => { e.stopPropagation(); onClick && onClick(e); }} className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-colors">
        Enroll
      </button>
    </div>
  </div>
);

// ─── Assessment Card ───
const AssessmentCard = ({ assessment, onStart }) => (
  <div onClick={onStart} className="bg-white border border-gray-100 rounded-xl p-3 md:p-4 cursor-pointer hover:shadow-md transition-shadow flex gap-3">
    <div className={`w-11 h-11 rounded-xl ${assessment.iconBg} flex items-center justify-center text-xl flex-shrink-0`}>
      {assessment.icon}
    </div>
    <div className="flex-1 min-w-0">
      <h4 className="font-bold text-[13px] md:text-[14px] text-gray-900 mb-0.5">{assessment.title}</h4>
      <p className="text-[11px] text-gray-500">{assessment.questions} questions · {assessment.duration} · {assessment.level}</p>
      <div className="flex flex-wrap gap-1.5 mt-2">
        {assessment.tags?.map((tag, i) => (
          <span key={i} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${assessment.tagColors?.[i] || 'bg-gray-100 text-gray-700'}`}>{tag}</span>
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
      <button onClick={(e) => { e.stopPropagation(); onStart && onStart(e); }} className={`mt-2.5 text-[11px] font-bold px-3 py-1.5 rounded-full text-white transition-colors ${assessment.btnColor}`}>
        {assessment.score !== null && assessment.score !== undefined ? 'Retake Test →' : 'Start Test →'}
      </button>
    </div>
  </div>
);

// ─── Job cards grid ───
const JobGrid = ({ items }) => (
  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
    {items.map(job => (
      <FeedJobCard key={job._id || job.id} job={job} onClick={() => { }} />
    ))}
  </div>
);

const ProfileDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, profileCompleteness, isLoading, fetchProfile } = useProfile();
  const [jobs, setJobs] = useState([]);
  const [courses, setCourses] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [activeTab, setActiveTab] = useState('Jobs');
  const [loadingFeeds, setLoadingFeeds] = useState(true);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingAssessments, setLoadingAssessments] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => { fetchProfile(); loadJobs(); loadCourses(); loadAssessments(); }, []);

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

  const loadCourses = async () => {
    try {
      setLoadingCourses(true);
      const res = await courseAPI.getAllCourses({ limit: 4, recommended: 'true' });
      const list = res && (res.courses || res.data || res.results || []);
      const mappedCourses = (Array.isArray(list) ? list : []).slice(0, 3).map((c, i) => {
        const bgColors = ['from-blue-700 to-blue-500', 'from-emerald-700 to-teal-500', 'from-purple-700 to-indigo-500'];
        const badgeColors = ['bg-amber-100 text-amber-700', 'bg-green-100 text-green-700', 'bg-purple-100 text-purple-700'];
        const badges = ['Bestseller', 'Trending', 'New'];
        return {
          id: c._id || i,
          title: c.title || 'Course Title',
          provider: c.instructor?.name || c.provider || 'ICL Academy',
          tags: (Array.isArray(c.tags) && c.tags.length > 0 ? c.tags : (c.category ? [c.category] : ['IT'])).map(t => typeof t === 'object' && t !== null ? (t.name || t.title || 'Tag') : String(t)),
          rating: c.rating?.average?.toFixed(1) || 4.5,
          reviews: c.rating?.count || 1200,
          duration: typeof c.duration === 'object' && c.duration !== null ? (c.duration.hours ? `${c.duration.hours} hrs` : (c.duration.total ? `${c.duration.total} hrs` : (c.duration.value ? `${c.duration.value} hrs` : 'Flexible'))) : (c.duration ? String(c.duration) : 'Flexible'),
          enrolled: typeof c.enrolledCount === 'object' && c.enrolledCount !== null ? (c.enrolledCount.count || c.enrolledCount.total || 1500) : (c.enrolledCount || 1500),
          badge: badges[i % badges.length],
          badgeColor: badgeColors[i % badgeColors.length],
          thumbBg: bgColors[i % bgColors.length],
          icon: c.icon || '⚛️',
          price: typeof c.price === 'object' && c.price !== null ? (c.price.original === 0 && !c.price.discounted ? 'Free' : `₹${c.price.discounted || c.price.original || 0}`) : (c.price === 0 || !c.price ? 'Free' : String(c.price)),
          _id: c._id
        };
      });
      setCourses(mappedCourses);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCourses(false);
    }
  };

  const loadAssessments = async () => {
    try {
      setLoadingAssessments(true);
      const res = await assessmentAttemptAPI.getMyAssignedAssessments();
      const list = res && (res.assessments || res.data || res.results || []);
      const mappedAssessments = (Array.isArray(list) ? list : [])
        .filter(a => a.status === 'pending')
        .slice(0, 4)
        .map((a, i) => {
        const title = a.jd_id?.jobTitle || a.title || a.skill_id?.name || 'Skill Assessment';
        const bgColors = ['bg-blue-50', 'bg-green-50', 'bg-purple-50', 'bg-orange-50'];
        const iconList = ['💻', '🧠', '⚛️', '🗄️'];
        const btnColors = ['bg-blue-600 hover:bg-blue-700', 'bg-green-600 hover:bg-green-700', 'bg-purple-600 hover:bg-purple-700', 'bg-amber-600 hover:bg-amber-700'];
        const tagColorsList = [
          ['bg-blue-50 text-blue-700', 'bg-indigo-50 text-indigo-700'],
          ['bg-amber-50 text-amber-700', 'bg-purple-50 text-purple-700'],
          ['bg-blue-50 text-blue-700', 'bg-purple-50 text-purple-700'],
          ['bg-orange-50 text-orange-700', 'bg-green-50 text-green-700']
        ];
        return {
          id: a._id || i,
          title: title,
          questions: a.questions?.length || a.total_questions || 30,
          duration: a.duration_minutes ? `${a.duration_minutes} mins` : 'Flexible',
          level: a.level || 'All levels',
          tags: (Array.isArray(a.tags) && a.tags.length > 0 ? a.tags.slice(0, 2) : [a.level || 'Skill']).map(t => typeof t === 'object' && t !== null ? (t.name || t.title || 'Tag') : String(t)),
          tagColors: tagColorsList[i % tagColorsList.length],
          iconBg: bgColors[i % bgColors.length],
          icon: iconList[i % iconList.length],
          btnColor: btnColors[i % btnColors.length],
          score: a.score || null,
          scoreColor: (a.score || 0) >= 70 ? 'text-green-600' : 'text-amber-600',
          barColor: (a.score || 0) >= 70 ? 'bg-green-500' : 'bg-amber-500',
          _id: a._id
        };
      });
      setAssessments(mappedAssessments);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAssessments(false);
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

              {/* ── Welcome Note ── */}
              <div className="mb-2">
                <h1 className="text-[20px] md:text-[26px] font-bold text-gray-900 tracking-tight">
                  Hi, <span className="text-blue-600">Welcome {getUserName()}!</span>
                </h1>
                <p className="text-[12px] md:text-[14px] text-gray-500 mt-1">
                  Here's what's happening with your career profile today.
                </p>
              </div>

              {/* ══════════════════════════════════════
                  JOBS BASED ON APPLIES (with tabs)
              ══════════════════════════════════════ */}
              <div>
                <div className="border-b-2 border-gray-200 mb-4">
                  <div className="flex items-center gap-0 overflow-x-auto hide-scrollbar">
                    {['Jobs', 'Assessments'].map(tab => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`pb-2 md:pb-3 px-3 md:px-4 text-[12px] sm:text-[13px] md:text-[14px] font-semibold flex-shrink-0 relative transition-colors ${activeTab === tab ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        {tab} {tab === 'Jobs' ? `(${jobs.length})` : `(${assessments.length})`}
                        {activeTab === tab && <span className="absolute bottom-0 left-0 right-0 h-[2px] md:h-[3px] bg-blue-600 rounded-t" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tab content */}
                {loadingFeeds && activeTab === 'Jobs' ? (
                  <SkeletonGrid count={4} />
                ) : activeTab === 'Jobs' ? (
                  jobs.length > 0 ? <JobGrid items={jobs} /> : (
                    <div className="text-center py-8 md:py-10 text-gray-500 text-[12px] md:text-[13px]">
                      <Briefcase className="w-7 h-7 md:w-8 md:h-8 text-gray-300 mx-auto mb-1.5 md:mb-2" />
                      No jobs found
                    </div>
                  )
                ) : (
                  loadingAssessments ? <SkeletonGrid count={2} /> : (
                    assessments.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {assessments.map(a => <AssessmentCard key={a.id} assessment={a} onStart={() => navigate(`/dashboard/student/assessments/${a._id}/take`)} />)}
                      </div>
                    ) : <div className="text-center py-8 text-[12px] text-gray-500">no assessment</div>
                  )
                )}
              </div>

              {/* ══════════════════════════════════════
                  FEATURED COURSES SECTION
              ══════════════════════════════════════ */}
              <div>
                <SectionHeader title="Top Courses for You" />
                {loadingCourses ? <SkeletonGrid count={3} /> : (
                  courses.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2.5 md:gap-4">
                      {courses.map(c => <CourseCard key={c.id} course={c} onClick={() => navigate(`/dashboard/student/courses/${c._id}`)} />)}
                    </div>
                  ) : <div className="text-center py-8 text-[12px] text-gray-500">No courses available</div>
                )}
              </div>

              {/* ══════════════════════════════════════
                  ASSESSMENTS SECTION
              ══════════════════════════════════════ */}
              <div>
                <SectionHeader title="Skill Assessments" />
                {loadingAssessments ? <SkeletonGrid count={2} /> : (
                  assessments.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {assessments.map(a => <AssessmentCard key={a.id} assessment={a} onStart={() => navigate(`/dashboard/student/assessments/${a._id}/take`)} />)}
                    </div>
                  ) : <div className="text-center py-8 text-[12px] text-gray-500">No assessments available</div>
                )}
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
