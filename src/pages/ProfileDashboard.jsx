// src/pages/ProfileDashboard.jsx - Naukri Style (Mobile Responsive)
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../context/Profilecontext';
import { useAuth } from '../context/AuthContext';
import { jobAPI } from '../api/Api';
import StudentLayout from '../components/layout/StudentLayout';
import {
  Briefcase, ChevronRight, Edit, Star, Zap, AlertCircle,
  Sparkles, MapPin, CheckCircle, Target
} from 'lucide-react';

const MOCK_COURSES = [
  { id: 1, title: 'Full Stack Web Development', provider: 'ICL Academy', tags: ['React', 'Node.js'], rating: 4.8 },
  { id: 2, title: 'Data Science Fundamentals', provider: 'ICL Academy', tags: ['Python', 'Pandas'], rating: 4.7 }
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

// ─── Compact Job Card (2-per-row on mobile, normal on desktop) ───
const FeedJobCard = ({ job, onClick }) => (
  <div
    onClick={onClick}
    className="border border-gray-100 rounded-xl p-2.5 sm:p-3 md:p-4 hover:shadow-md cursor-pointer transition-shadow bg-white h-full flex flex-col justify-between"
  >
    <div>
      {/* Company logo + name */}
      <div className="flex items-start gap-2 md:gap-3 mb-1.5 md:mb-2">
        <div className="w-8 h-8 md:w-10 md:h-10 border border-gray-100 rounded-md md:rounded-lg flex items-center justify-center bg-gray-50 flex-shrink-0">
          <span className="font-bold text-gray-500 text-[11px] md:text-xs">{(job.company?.name || job.companyName || 'C')[0]}</span>
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

      {/* Location */}
      <div className="flex items-center gap-1 text-[10px] sm:text-[11px] md:text-[12px] text-gray-500 font-medium">
        <MapPin className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 flex-shrink-0" />
        <span className="truncate">{job.location || job.jobLocation || 'Remote'}</span>
      </div>
    </div>

    {/* Posted time */}
    <p className="text-[10px] md:text-[11px] text-gray-400 mt-1.5 md:mt-2">{timeAgo(job.createdAt)}</p>
  </div>
);

// ─── Section header row ───
const SectionHeader = ({ title, onViewAll }) => (
  <div className="flex items-center justify-between mb-2.5">
    <h2 className="text-[15px] sm:text-[17px] md:text-[20px] font-bold text-gray-900">{title}</h2>
    <button onClick={onViewAll} className="text-blue-600 text-[12px] sm:text-[13px] md:text-[14px] font-semibold hover:underline">
      View all
    </button>
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

  // ─── 2-col skeleton ───
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

  // ─── Job cards grid ───
  const JobGrid = ({ items }) => (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
      {items.map(job => (
        <FeedJobCard
          key={job._id || job.id}
          job={job}
          onClick={() => navigate('/dashboard/student/jobs/' + (job._id || job.id))}
        />
      ))}
    </div>
  );

  return (
    <StudentLayout>
      <div className="min-h-screen bg-[#f8f9fa] px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4">
        <div className="max-w-[1240px] mx-auto space-y-3 sm:space-y-4">

          {/* ═══════════════════════════════════════════
              MOBILE PROFILE HERO (hidden on md+)
              Compact: avatar + name + progress bar
          ═══════════════════════════════════════════ */}
          <div className="md:hidden">
            <Card className="p-3">
              {/* Row 1: avatar + name + edit */}
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-12 h-12 rounded-full bg-gray-200 border-2 border-gray-300 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-bold text-gray-600">{getUserInitials()}</span>
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

              {/* Progress bar */}
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

              {/* Stats + View Profile */}
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
              MAIN GRID  (sidebar + feed)
          ═══════════════════════════════════════════ */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 md:gap-5">

            {/* ─── LEFT SIDEBAR (desktop only) ─── */}
            <div className="hidden md:block md:col-span-3 self-start">
              <div className="sticky top-[65px] space-y-4">

                {/* Desktop Profile Widget */}
                <Card className="p-5 text-center">
                  <div className="relative inline-block mb-4">
                    <svg className="w-[100px] h-[100px] transform -rotate-90">
                      <circle cx="50" cy="50" r="46" stroke="#f1f5f9" strokeWidth="5" fill="#f8fafc" />
                      <circle
                        cx="50" cy="50" r="46"
                        stroke={pct >= 80 ? '#22c55e' : '#3b82f6'}
                        strokeWidth="5" fill="none" strokeLinecap="round"
                        strokeDasharray="289" strokeDashoffset={289 - (289 * pct) / 100}
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold text-[#334155]">{getUserInitials()}</span>
                    </div>
                    <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 text-[11px] font-bold px-2.5 py-0.5 rounded-full border-2 border-white ${pct >= 80 ? 'bg-[#dcfce7] text-[#166534]' : 'bg-[#e0e7ff] text-[#2563eb]'}`}>
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

                {/* Desktop Performance Widget */}
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
                  <button onClick={() => navigate('/profile/edit')} className="mt-4 w-full flex items-center justify-between text-left group">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                      <span className="text-[13px] font-medium text-gray-700 group-hover:text-gray-900">Get 3X boost to your profile</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-900" />
                  </button>
                </Card>

              </div>
            </div>

            {/* ─── MAIN FEED ─── */}
            <div className="col-span-1 md:col-span-9 space-y-3 sm:space-y-4">

              {/* ── Banner ── */}
              {showWelcome ? (
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-4 md:p-6 text-white shadow relative overflow-hidden">
                  <h2 className="text-[16px] sm:text-[18px] md:text-[24px] font-bold flex items-center gap-1.5 md:gap-2">
                    <Sparkles className="w-4 h-4 md:w-6 md:h-6 text-yellow-300" /> Welcome to ICL, {getFirstName()}!
                  </h2>
                  <p className="text-[12px] md:text-[14px] text-blue-100 mt-1 md:mt-2 max-w-xl">
                    Set up your profile so recruiters can find you.
                  </p>
                  <div className="mt-3 md:mt-5 flex flex-wrap gap-2 md:gap-3">
                    <button onClick={() => { dismissWelcome(); navigate('/profile/edit'); }} className="bg-white text-blue-700 hover:bg-gray-50 px-3.5 md:px-5 py-1.5 md:py-2.5 rounded-full text-[12px] md:text-[14px] font-bold transition-colors shadow-sm">
                      Get Started
                    </button>
                    <button onClick={dismissWelcome} className="px-3.5 md:px-5 py-1.5 md:py-2.5 rounded-full text-[12px] md:text-[14px] font-medium border border-white/30 hover:bg-white/10">
                      Skip for now
                    </button>
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

              {/* ── Jobs Based on Applies ── */}
              <div>
                <div className="flex items-center justify-between mb-2 md:mb-3">
                  <h2 className="text-[15px] sm:text-[17px] md:text-[20px] font-bold text-gray-900">Jobs based on your applies</h2>
                  <button onClick={() => navigate('/dashboard/student/jobs')} className="text-blue-600 text-[12px] sm:text-[13px] md:text-[14px] font-semibold hover:underline">View all</button>
                </div>

                {/* Tab bar */}
                <div className="flex items-center gap-3 sm:gap-5 md:gap-6 border-b border-gray-200 mb-3 overflow-x-auto hide-scrollbar">
                  {['Jobs', 'Courses', 'Assessments'].map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`pb-2 md:pb-3 text-[12px] sm:text-[13px] md:text-[14px] font-medium flex-shrink-0 relative transition-colors ${activeTab === tab ? 'text-gray-900' : 'text-gray-500'}`}
                    >
                      {tab} {tab === 'Jobs' && `(${jobs.length})`}
                      {activeTab === tab && <span className="absolute bottom-0 left-0 right-0 h-[2px] md:h-[3px] bg-blue-600 rounded-t" />}
                    </button>
                  ))}
                </div>

                {/* Feed grid */}
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
                    {MOCK_COURSES.map(c => (
                      <div key={c.id} className="bg-white border border-gray-100 rounded-xl p-2.5 sm:p-3 md:p-4 cursor-pointer hover:shadow-md transition-shadow">
                        <h4 className="font-semibold text-[12px] sm:text-[13px] md:text-[14px] text-gray-900 line-clamp-2 leading-snug">{c.title}</h4>
                        <p className="text-[10px] sm:text-[11px] md:text-[12px] text-gray-500 mt-1">{c.provider} · <Star className="inline w-2.5 h-2.5 md:w-3 md:h-3 text-amber-400 fill-amber-400" /> {c.rating}</p>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {c.tags.map((t, i) => <span key={i} className="px-1.5 py-0.5 bg-gray-50 text-gray-600 border border-gray-100 rounded text-[9px] md:text-[10px]">{t}</span>)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 md:py-10 text-gray-500 text-[12px] md:text-[13px]">
                    <Target className="w-7 h-7 md:w-8 md:h-8 text-gray-300 mx-auto mb-1.5 md:mb-2" />
                    No assessments available
                  </div>
                )}
              </div>

              {/* ── Jobs Based on Profile ── */}
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