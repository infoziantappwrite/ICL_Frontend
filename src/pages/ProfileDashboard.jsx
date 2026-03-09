// src/pages/ProfileDashboard.jsx - Naukri Style
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../context/Profilecontext';
import { useAuth } from '../context/AuthContext';
import { jobAPI } from '../api/Api';
import StudentLayout from '../components/layout/StudentLayout';
import {
  User, Briefcase, ChevronRight, Edit, Star, BarChart2,
  CheckCircle, Plus, Zap, AlertCircle, Sparkles, MapPin, CheckSquare, Target
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
  return Math.floor(hours / 24) + 'd ago';
};

// ─── Reusable Naukri-Style Card Wrapper ───
const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 ${className}`}>
    {children}
  </div>
);

const FeedJobCard = ({ job, onClick }) => (
  <div onClick={onClick} className="border border-gray-100 rounded-xl p-4 hover:shadow-md cursor-pointer transition-shadow">
    <div className="flex items-start gap-3 mb-2">
      <div className="w-10 h-10 border border-gray-100 rounded-lg flex items-center justify-center bg-gray-50 flex-shrink-0">
        <span className="font-bold text-gray-500 text-xs">{(job.company?.name || job.companyName || 'C')[0]}</span>
      </div>
      <div>
        <h4 className="font-semibold text-gray-900 text-[15px] leading-tight hover:text-blue-600 transition-colors">{job.title || job.jobTitle}</h4>
        <p className="text-[13px] text-gray-600 mt-0.5">{(job.company && job.company.name) || job.companyName || 'ICL Partner'} <Star className="inline w-3 h-3 text-amber-400 fill-amber-400 ml-1" /> 3.6</p>
      </div>
    </div>
    <div className="flex items-center gap-1.5 text-[12px] text-gray-500 mb-2 font-medium">
      <MapPin className="w-3.5 h-3.5" />
      <span>{job.location || job.jobLocation || 'Remote'}</span>
    </div>
    <div className="text-[11px] text-gray-400 text-right mt-2">
      {timeAgo(job.createdAt)}
    </div>
  </div>
);

const ProfileDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, profileCompleteness, isLoading, fetchProfile } = useProfile();
  const [jobs, setJobs] = useState([]);
  const [activeTab, setActiveTab] = useState('Jobs');
  const [loadingFeeds, setLoadingFeeds] = useState(true);

  useEffect(() => { fetchProfile(); loadJobs(); }, []);

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

  const getUserName = () => (profile?.fullName || user?.fullName || user?.name || 'User');
  const getFirstName = () => getUserName().split(' ')[0];
  const getUserInitials = () => {
    const names = getUserName().split(' ');
    return names.length >= 2 ? (names[0][0] + names[names.length - 1][0]).toUpperCase() : getUserName().substring(0, 2).toUpperCase();
  };

  if (isLoading && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <StudentLayout>
      <div className="min-h-screen bg-[#f8f9fa] -mx-4 lg:-mx-6 -mt-4 lg:-mt-6 px-4 md:px-6 lg:px-8 py-6">
        {/* Max width container modeling standard dashboard bounds */}
        <div className="max-w-[1240px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-6">

          {/* ─────── LEFT COLUMN (Sticky Sidebar) ─────── */}
          <div className="md:col-span-3 md:sticky md:top-[100px] self-start space-y-5">

            {/* 1. User Profile Widget */}
            <Card className="text-center pt-8 pb-6">
              <div className="relative inline-block mb-4">

                {/* Donut Progress */}
                <svg className="w-[104px] h-[104px] transform -rotate-90">
                  <circle
                    cx="52"
                    cy="52"
                    r="48"
                    stroke="#f1f5f9"
                    strokeWidth="6"
                    fill="#f8fafc"
                  />

                  <circle
                    cx="52"
                    cy="52"
                    r="48"
                    stroke={profileCompleteness >= 80 ? '#22c55e' : '#3b82f6'}
                    strokeWidth="6"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray="301.6"
                    strokeDashoffset={301.6 - (301.6 * profileCompleteness) / 100}
                    className="transition-all duration-1000"
                  />
                </svg>

                {/* Initials */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-3xl font-bold text-[#334155] tracking-tight">
                    {getUserInitials()}
                  </div>
                </div>

                {/* Percentage */}
                <div
                  className={`absolute -bottom-2.5 left-1/2 -translate-x-1/2 text-[12px] font-bold px-3 py-0.5 rounded-full border-[3px] border-white ${profileCompleteness >= 80
                    ? 'bg-[#dcfce7] text-[#166534]'
                    : 'bg-[#e0e7ff] text-[#2563eb]'
                    }`}
                >
                  {profileCompleteness}%
                </div>
              </div>

              {/* Name */}
              <h2 className="text-lg font-bold text-gray-900 leading-tight">
                {getUserName()}
              </h2>

              {/* Subtitle */}
              <p className="text-[13px] text-gray-500 mt-1 max-w-[200px] mx-auto leading-snug">
                {profile?.candidateType ||
                  profile?.currentRole ||
                  user?.college?.name ||
                  'Complete your profile to stand out'}
              </p>

              <p className="text-[11px] text-gray-400 mt-2">
                Last updated today
              </p>

              {/* View Profile Button */}
              <button
                onClick={() => navigate('/profile/my-info')}
                className="mt-5 w-[85%] mx-auto block py-2 bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-semibold rounded-full transition-colors"
              >
                View profile
              </button>
            </Card>

            {/* 2. Profile Performance Widget */}
            <Card className="pb-4">

              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 text-[15px]">
                  Profile performance
                </h3>
                <AlertCircle className="w-4 h-4 text-gray-400" />
              </div>

              {/* Stats */}
              <div className="flex pb-4 border-b border-gray-100">

                {/* Skills */}
                <div className="flex-1 cursor-pointer group">
                  <p className="text-[12px] text-gray-500 group-hover:text-blue-600 transition-colors">
                    Skills Added
                  </p>

                  <p className="text-xl font-bold text-gray-900 mt-1 flex items-center gap-1 group-hover:text-blue-600 transition-colors">
                    {profile?.primarySkills?.length || 0}
                    <ChevronRight className="w-4 h-4 text-blue-600" />
                  </p>
                </div>

                <div className="w-px bg-gray-100 mx-4" />

                {/* Experience */}
                <div className="flex-1 cursor-pointer group">
                  <p className="text-[12px] text-gray-500 group-hover:text-blue-600 transition-colors">
                    Experience (yrs)
                  </p>

                  <p className="text-xl font-bold text-gray-900 mt-1 flex items-center gap-1 group-hover:text-blue-600 transition-colors">
                    {profile?.yearsOfExperience || 0}
                    <ChevronRight className="w-4 h-4 text-blue-600" />
                  </p>
                </div>
              </div>

              {/* Boost Button */}
              <button
                onClick={() => navigate('/profile/edit')}
                className="mt-4 w-full flex items-center justify-between text-left group"
              >
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />

                  <span className="text-[13px] font-medium text-gray-700 group-hover:text-gray-900">
                    Get 3X boost to your profile
                  </span>
                </div>

                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-900" />
              </button>

            </Card>

          </div>

          {/* ─────── MAIN CONTENT FEED (Expanded to fill remaining space) ─────── */}
          <div className="md:col-span-9 space-y-5 md:space-y-6">

            {/* 1. Promo / Warning Banner */}
            {profileCompleteness >= 100 ? (
              <div className="bg-[#f0fdf4] rounded-2xl p-5 md:p-6 border border-[#bbf7d0] flex flex-col md:flex-row md:items-center gap-5 md:gap-6 relative overflow-hidden">
                <div className="flex-1 z-10 w-full">
                  <h2 className="text-[20px] md:text-[22px] font-bold text-gray-900 leading-tight">
                    {getFirstName()}, you have an All-Star Profile!
                  </h2>
                  <p className="text-[13px] text-gray-600 mt-1.5">Stand out further by passing a skill assessment</p>
                  <div className="mt-4 md:mt-5 flex flex-wrap items-center gap-3">
                    <button onClick={() => { setActiveTab('Assessments'); document.getElementById('feed-container')?.scrollIntoView({ behavior: 'smooth' }); }} className="bg-[#16a34a] hover:bg-[#15803d] text-white px-4 md:px-5 py-2 md:py-2.5 rounded-full text-[13px] font-bold transition-colors flex items-center gap-2 shadow-sm whitespace-nowrap">
                      <Target className="w-4 h-4" /> Take Assessment
                    </button>
                  </div>
                </div>

                <div className="flex-1 z-10 relative hidden sm:block w-full mt-4 md:mt-0">
                  <div className="grid grid-cols-[1fr_auto_auto] gap-x-2 md:gap-x-4 gap-y-2 md:gap-y-3 text-[12px] md:text-[13px] h-full items-center">
                    <div className="font-bold text-gray-900 pb-2 border-b border-[#bbf7d0]">What will you get</div>
                    <div className="font-medium text-gray-500 pb-2 border-b border-[#bbf7d0] text-center px-2">Profile</div>
                    <div className="font-bold text-[#16a34a] pb-2 border-b border-[#bbf7d0] text-center px-2 bg-[#dcfce7] rounded-t-lg">Certified</div>

                    <div className="text-gray-700 flex items-center gap-2"><Sparkles className="w-3.5 h-3.5 text-gray-400" /> Platform Verified Badge</div>
                    <div className="text-gray-400 text-center">—</div>
                    <div className="text-[#16a34a] flex justify-center bg-[#dcfce7] py-1"><CheckCircle className="w-4 h-4" /></div>

                    <div className="text-gray-700 flex items-center gap-2"><Sparkles className="w-3.5 h-3.5 text-gray-400" /> Top Rank in Recruiter Search</div>
                    <div className="text-gray-400 text-center">—</div>
                    <div className="text-[#16a34a] flex justify-center bg-[#dcfce7] py-1 rounded-b-lg"><CheckCircle className="w-4 h-4" /></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-[#fff9ed] rounded-2xl p-5 md:p-6 border border-[#ffe0b2] flex flex-col md:flex-row md:items-center gap-5 md:gap-6 relative overflow-hidden">
                <div className="flex-1 z-10 w-full">
                  <h2 className="text-[20px] md:text-[22px] font-bold text-gray-900 leading-tight">
                    {getFirstName()}, you are missing out on key features
                  </h2>
                  <p className="text-[13px] text-gray-600 mt-1.5">Complete your profile to unlock all features</p>
                  <div className="mt-4 md:mt-5 flex flex-wrap items-center gap-3">
                    <button onClick={() => navigate('/profile/edit')} className="bg-[#b45309] hover:bg-[#92400e] text-white px-4 md:px-5 py-2 md:py-2.5 rounded-full text-[13px] font-bold transition-colors flex items-center gap-2 shadow-sm whitespace-nowrap">
                      <Star className="w-4 h-4" /> Complete Profile
                    </button>
                    <span className="text-[12px] font-bold text-[#b45309]">Highly Recommended</span>
                  </div>
                </div>

                <div className="flex-1 z-10 relative hidden sm:block w-full mt-4 md:mt-0">
                  <div className="grid grid-cols-[1fr_auto_auto] gap-x-2 md:gap-x-4 gap-y-2 md:gap-y-3 text-[12px] md:text-[13px] h-full items-center">
                    <div className="font-bold text-gray-900 pb-2 border-b border-[#ffe0b2]">What will you get</div>
                    <div className="font-medium text-gray-500 pb-2 border-b border-[#ffe0b2] text-center px-2">Incomplete</div>
                    <div className="font-bold text-[#b45309] pb-2 border-b border-[#ffe0b2] text-center px-2 bg-[#fff1d6] rounded-t-lg">Completed</div>

                    <div className="text-gray-700 flex items-center gap-2"><Sparkles className="w-3.5 h-3.5 text-gray-400" /> Get shortlisted based on skills</div>
                    <div className="text-gray-400 text-center">—</div>
                    <div className="text-[#b45309] flex justify-center bg-[#fff1d6] py-1"><CheckCircle className="w-4 h-4" /></div>

                    <div className="text-gray-700 flex items-center gap-2"><Sparkles className="w-3.5 h-3.5 text-gray-400" /> Unlock relevant assessments</div>
                    <div className="text-gray-400 text-center">—</div>
                    <div className="text-[#b45309] flex justify-center bg-[#fff1d6] py-1 rounded-b-lg"><CheckCircle className="w-4 h-4" /></div>
                  </div>
                </div>
                {/* Background accent curves simulated by blobs */}
                <div className="absolute right-0 bottom-0 w-64 h-64 bg-gradient-to-br from-[#ffe8cc] to-transparent rounded-full opacity-50 translate-x-1/3 translate-y-1/3 blur-2xl pointer-events-none" />
              </div>
            )}

            {/* 2. Feed Tab Container */}
            <Card className="px-0 pb-0 overflow-hidden">
              <div className="px-4 md:px-5 pt-1 pb-3 flex items-center justify-between">
                <h3 className="font-bold text-gray-900 text-[16px] md:text-[18px]">Recommended for you</h3>
                <button onClick={() => navigate('/dashboard/student/jobs')} className="text-blue-600 font-semibold text-[13px] md:text-[14px] hover:underline">View all</button>
              </div>

              {/* Feed Tabs */}
              <div className="flex items-center gap-4 md:gap-6 px-4 md:px-5 border-b border-gray-100 overflow-x-auto hide-scrollbar whitespace-nowrap">
                {['Jobs', 'Courses', 'Assessments'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-3 text-[13px] md:text-[14px] font-medium transition-colors relative flex-shrink-0 ${activeTab === tab ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    {tab} {tab === 'Jobs' && `(${jobs.length})`}
                    {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-blue-600 rounded-t-full" />}
                  </button>
                ))}
              </div>

              {/* Feed Content Grid */}
              <div className="p-4 md:p-5 bg-gray-50/50 min-h-[300px]">
                {loadingFeeds ? (
                  <div className="flex gap-4 overflow-hidden">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="min-w-[240px] md:min-w-[260px] h-[140px] bg-white rounded-xl border border-gray-100 p-4 animate-pulse">
                        <div className="w-10 h-10 bg-gray-200 rounded-lg mb-3" />
                        <div className="h-4 bg-gray-200 w-3/4 mb-2 rounded" />
                        <div className="h-3 bg-gray-100 w-1/2 rounded" />
                      </div>
                    ))}
                  </div>
                ) : activeTab === 'Jobs' ? (
                  <div className="flex gap-4 overflow-x-auto pb-4 snap-x hide-scrollbar">
                    {jobs.map(job => (
                      <div key={job._id || job.id} className="min-w-[240px] md:min-w-[260px] snap-start bg-white w-full sm:w-auto">
                        <FeedJobCard job={job} onClick={() => navigate('/dashboard/student/jobs/' + (job._id || job.id))} />
                      </div>
                    ))}
                  </div>
                ) : activeTab === 'Courses' ? (
                  <div className="flex gap-4 overflow-x-auto pb-4 snap-x hide-scrollbar">
                    {MOCK_COURSES.map(c => (
                      <div key={c.id} className="min-w-[240px] md:min-w-[260px] snap-start bg-white border border-gray-100 rounded-xl p-4 cursor-pointer hover:shadow-md transition-shadow w-full sm:w-auto">
                        <h4 className="font-semibold text-[14px] text-gray-900 truncate">{c.title}</h4>
                        <p className="text-[12px] text-gray-500 mt-1">{c.provider} · <Star className="inline w-3 h-3 text-amber-400 fill-amber-400 ml-0.5" /> {c.rating}</p>
                        <div className="flex gap-1.5 mt-3">
                          {c.tags.map((t, i) => <span key={i} className="px-2 py-0.5 bg-gray-50 text-gray-600 border border-gray-100 rounded text-[10px]">{t}</span>)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-gray-500 text-[13px]">
                    <Target className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    No active assessments available right now.
                  </div>
                )}
              </div>
            </Card>

          </div>

          {/* (Right Column Removed as per request) */}

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