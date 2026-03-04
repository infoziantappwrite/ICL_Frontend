// src/pages/ProfileDashboard.jsx - REVAMPED: Innovative UI + Live Data + Responsive
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../context/Profilecontext';
import { useAuth } from '../context/AuthContext';
import { jobAPI } from '../api/Api';
import DashboardLayout from '../components/layout/DashboardLayout';
import {
  User, Briefcase, GraduationCap, Code, BookOpen,
  CheckCircle, AlertCircle, TrendingUp, Target,
  Clock, MapPin, Zap, ChevronRight,
  Plus, Edit, FileText, Building2, Star, ArrowRight,
  Flame, BarChart2, PlayCircle, Medal, RefreshCw,
  DollarSign, CheckSquare, Sparkles, Eye, Phone, Globe, Mail
} from 'lucide-react';

const MOCK_COURSES = [
  { id: 1, title: 'Full Stack Web Development', provider: 'ICL Academy', duration: '12 weeks', level: 'Intermediate', tags: ['React','Node.js','MongoDB'], enrolled: 1240, rating: 4.8, color: 'from-blue-600 to-cyan-500', icon: Code },
  { id: 2, title: 'Data Science & ML Fundamentals', provider: 'ICL Academy', duration: '8 weeks', level: 'Beginner', tags: ['Python','Pandas','Scikit-learn'], enrolled: 980, rating: 4.7, color: 'from-blue-500 to-indigo-500', icon: BarChart2 },
  { id: 3, title: 'Cloud & DevOps Essentials', provider: 'ICL Academy', duration: '6 weeks', level: 'Advanced', tags: ['AWS','Docker','Kubernetes'], enrolled: 750, rating: 4.9, color: 'from-cyan-500 to-blue-600', icon: Zap },
];

const MOCK_ASSESSMENTS = [
  { id: 1, title: 'JavaScript Proficiency Test', questions: 30, duration: '45 min', difficulty: 'Medium', status: 'available', badge: 'Silver Badge', color: 'from-blue-500 to-cyan-500' },
  { id: 2, title: 'Aptitude & Reasoning', questions: 50, duration: '60 min', difficulty: 'Medium', status: 'available', badge: 'Gold Badge', color: 'from-blue-600 to-indigo-600' },
  { id: 3, title: 'System Design Basics', questions: 20, duration: '30 min', difficulty: 'Hard', status: 'locked', badge: 'Platinum Badge', color: 'from-cyan-600 to-blue-700' },
];

const timeAgo = (dateStr) => {
  if (!dateStr) return 'Recently';
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 36e5);
  if (hours < 1) return 'Just now';
  if (hours < 24) return hours + 'h ago';
  return Math.floor(hours / 24) + 'd ago';
};

const formatCTC = (min, max) => {
  if (!min && !max) return null;
  const fmt = (v) => v >= 100000 ? (v / 100000).toFixed(1) + 'L' : (v / 1000) + 'K';
  if (min && max) return fmt(min) + ' - ' + fmt(max);
  if (min) return fmt(min) + '+';
  return 'Up to ' + fmt(max);
};

const StatCard = ({ title, value, icon: Icon, color, onClick, subtitle }) => (
  <div onClick={onClick} className="bg-white/80 backdrop-blur-xl rounded-2xl p-5 shadow-lg border border-white/60 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group">
    <div className="flex items-center justify-between mb-3">
      <div className={"w-12 h-12 bg-gradient-to-br " + color + " rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform"}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
    </div>
    <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
    <p className="text-sm font-medium text-gray-700">{title}</p>
    {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
  </div>
);

const LiveJobCard = ({ job, onClick }) => {
  const ctc = formatCTC(job.salaryRange && job.salaryRange.min, job.salaryRange && job.salaryRange.max);
  return (
    <div onClick={onClick} className="bg-white/80 backdrop-blur-xl rounded-2xl p-5 shadow-md border border-white/60 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl flex items-center justify-center">
            <Building2 className="w-5 h-5 text-blue-600" />
          </div>
          <div className="min-w-0">
            <h4 className="font-semibold text-gray-900 text-sm leading-tight truncate max-w-[160px]">{job.title || job.jobTitle}</h4>
            <p className="text-xs text-gray-500 truncate">{(job.company && job.company.name) || job.companyName || 'ICL Partner'}</p>
          </div>
        </div>
        {job.isPinned && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium flex-shrink-0">Pinned</span>}
      </div>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {(job.skillsRequired || job.skills || []).slice(0, 3).map((s, i) => (
          <span key={i} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100">{s}</span>
        ))}
      </div>
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-3">
          {ctc && <span className="flex items-center gap-1 text-blue-700 font-medium"><DollarSign className="w-3 h-3" />{ctc}</span>}
          {(job.location || job.jobLocation) && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location || job.jobLocation}</span>}
        </div>
        <span className="text-gray-400">{timeAgo(job.createdAt)}</span>
      </div>
      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
        <span className={"text-xs px-2 py-0.5 rounded-full font-medium " + (job.workMode === 'Remote' ? 'bg-blue-50 text-blue-600' : job.workMode === 'Hybrid' ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-100 text-gray-600')}>
          {job.workMode || job.jobType || 'On-site'}
        </span>
        <span className="text-xs text-blue-600 font-medium flex items-center gap-1 group-hover:gap-2 transition-all">View <ChevronRight className="w-3 h-3" /></span>
      </div>
    </div>
  );
};

const CourseCard = ({ course }) => (
  <div className="bg-white/80 backdrop-blur-xl rounded-2xl overflow-hidden shadow-md border border-white/60 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer">
    <div className={"h-1.5 bg-gradient-to-r " + course.color} />
    <div className="p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={"w-10 h-10 bg-gradient-to-br " + course.color + " rounded-xl flex items-center justify-center shadow-sm"}>
          <course.icon className="w-5 h-5 text-white" />
        </div>
        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{course.level}</span>
      </div>
      <h4 className="font-semibold text-gray-900 text-sm mb-1 leading-snug">{course.title}</h4>
      <p className="text-xs text-gray-500 mb-3">{course.provider} · {course.duration}</p>
      <div className="flex flex-wrap gap-1 mb-3">
        {course.tags.map((t, i) => <span key={i} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">{t}</span>)}
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
          <span className="font-medium text-gray-700">{course.rating}</span>
          <span>({course.enrolled.toLocaleString()})</span>
        </div>
        <button className="text-xs text-blue-600 font-semibold flex items-center gap-1 hover:gap-2 transition-all">
          <PlayCircle className="w-3 h-3" /> Enroll
        </button>
      </div>
    </div>
  </div>
);

const AssessmentCard = ({ assessment }) => (
  <div className={"bg-white/80 backdrop-blur-xl rounded-2xl p-5 shadow-md border border-white/60 transition-all duration-300 " + (assessment.status === 'locked' ? 'opacity-60' : 'hover:shadow-xl hover:-translate-y-1 cursor-pointer')}>
    <div className="flex items-start justify-between mb-3">
      <div className={"w-10 h-10 bg-gradient-to-br " + assessment.color + " rounded-xl flex items-center justify-center shadow-sm"}>
        <Medal className="w-5 h-5 text-white" />
      </div>
      {assessment.status === 'locked'
        ? <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Locked</span>
        : <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">Available</span>}
    </div>
    <h4 className="font-semibold text-gray-900 text-sm mb-1">{assessment.title}</h4>
    <p className="text-xs text-blue-500 font-medium mb-3">{assessment.badge}</p>
    <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
      <span className="flex items-center gap-1"><CheckSquare className="w-3 h-3" />{assessment.questions} Q</span>
      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{assessment.duration}</span>
      <span className={"px-1.5 py-0.5 rounded text-xs font-medium " + (assessment.difficulty === 'Easy' ? 'bg-blue-50 text-blue-600' : assessment.difficulty === 'Medium' ? 'bg-blue-100 text-blue-700' : 'bg-indigo-100 text-indigo-700')}>{assessment.difficulty}</span>
    </div>
    {assessment.status !== 'locked' && (
      <button className="w-full py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-xs font-semibold rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all flex items-center justify-center gap-1.5">
        <Sparkles className="w-3 h-3" /> Start Assessment
      </button>
    )}
  </div>
);


const CAREER_TIPS = [
  { icon: '🎯', title: 'Tailor your resume', tip: 'Customize your resume for each job — use keywords from the job description to pass ATS filters.' },
  { icon: '🤝', title: 'Network actively', tip: 'Connect with alumni and professionals on LinkedIn. 70% of jobs are filled through referrals.' },
  { icon: '💡', title: 'Highlight impact', tip: 'Use numbers to quantify achievements. "Improved performance by 30%" beats "improved performance".' },
  { icon: '📚', title: 'Keep learning', tip: 'Add at least one new skill every quarter. Certifications signal commitment to growth.' },
  { icon: '🚀', title: 'Apply early', tip: 'Applications submitted in the first 3 days get 3x more views. Set up job alerts now.' },
];

const CareerTipsCard = () => {
  const [current, setCurrent] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setCurrent(prev => (prev + 1) % CAREER_TIPS.length);
        setFade(true);
      }, 300);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const tip = CAREER_TIPS[current];
  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-5 shadow-md border border-white/60">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-sm">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm">Career Tips</h3>
            <p className="text-xs text-gray-500">Auto-updating every 4s</p>
          </div>
        </div>
        <div className="flex gap-1.5">
          {CAREER_TIPS.map((_, i) => (
            <button
              key={i}
              onClick={() => { setFade(false); setTimeout(() => { setCurrent(i); setFade(true); }, 150); }}
              className={"h-1.5 rounded-full transition-all duration-300 " + (i === current ? 'bg-blue-600 w-5' : 'bg-blue-200 w-1.5 hover:bg-blue-400')}
            />
          ))}
        </div>
      </div>
      <div
        className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-100 transition-opacity duration-300"
        style={{ opacity: fade ? 1 : 0 }}
      >
        <div className="flex items-start gap-3">
          <span className="text-2xl flex-shrink-0">{tip.icon}</span>
          <div>
            <p className="font-semibold text-gray-900 text-sm mb-1">{tip.title}</p>
            <p className="text-xs text-gray-600 leading-relaxed">{tip.tip}</p>
          </div>
        </div>
      </div>
      <div className="flex justify-center gap-1.5 mt-3">
        {CAREER_TIPS.map((_, i) => (
          <div key={i} className={"h-0.5 rounded-full transition-all duration-300 " + (i === current ? 'bg-blue-600 w-6' : 'bg-gray-200 w-3')} />
        ))}
      </div>
    </div>
  );
};

const ResumeCard = ({ profile, navigate }) => {
  const hasResume = !!(profile && (profile.resumeUrl || (profile.documents && profile.documents.resume && profile.documents.resume.url)));
  const resumeUrl = profile && (profile.resumeUrl || (profile.documents && profile.documents.resume && profile.documents.resume.url));
  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-5 shadow-md border border-white/60">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-sm">
          <FileText className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-gray-900 text-sm">Resume & Documents</h3>
          {hasResume
            ? <p className="text-xs text-blue-600 flex items-center gap-1 mt-0.5"><CheckCircle className="w-3 h-3" /> Uploaded — ready to apply!</p>
            : <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><AlertCircle className="w-3 h-3" /> No resume uploaded yet</p>}
        </div>
      </div>
      {!hasResume && (
        <p className="text-xs text-gray-500 mb-3 pl-1">Candidates with a resume get <span className="font-semibold text-blue-600">3x more</span> interview calls.</p>
      )}
      <div className="flex gap-2">
        {hasResume && (
          <a href={resumeUrl} target="_blank" rel="noopener noreferrer" className="flex-1 py-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-blue-100 transition-all">
            <Eye className="w-3 h-3" /> View Resume
          </a>
        )}
        <button onClick={() => navigate('/profile/edit')} className="flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 hover:scale-105 transition-all bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md hover:shadow-blue-400/30">
          <Plus className="w-3 h-3" /> {hasResume ? 'Update Resume' : 'Upload Resume'}
        </button>
      </div>
    </div>
  );
};


const JOB_MARKET_DATA = [
  { role: 'Frontend Developer', demand: 92, trend: '+12%', hot: true },
  { role: 'Data Analyst', demand: 85, trend: '+8%', hot: true },
  { role: 'Full Stack Dev', demand: 78, trend: '+5%', hot: false },
  { role: 'DevOps Engineer', demand: 74, trend: '+15%', hot: true },
  { role: 'UI/UX Designer', demand: 65, trend: '+3%', hot: false },
];

const JobMarketPulse = ({ navigate }) => (
  <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-5 shadow-md border border-white/60">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-sm">
          <TrendingUp className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-gray-900 text-sm">Job Market Pulse</h3>
          <p className="text-xs text-gray-500">Live demand by role</p>
        </div>
      </div>
      <button
        onClick={() => navigate('/dashboard/student/jobs')}
        className="text-xs text-blue-600 font-semibold px-2.5 py-1 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all"
      >
        Explore →
      </button>
    </div>
    <div className="space-y-3">
      {JOB_MARKET_DATA.map((item, i) => (
        <div key={i} className="group cursor-pointer" onClick={() => navigate('/dashboard/student/jobs')}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-700">{item.role}</span>
              {item.hot && (
                <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full font-medium">Hot</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-blue-600">{item.trend}</span>
              <span className="text-xs text-gray-400">{item.demand}%</span>
            </div>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-1.5 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full group-hover:from-blue-600 group-hover:to-cyan-500 transition-all duration-300"
              style={{ width: item.demand + "%" }}
            />
          </div>
        </div>
      ))}
    </div>
    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
      <p className="text-xs text-gray-400">Based on active postings this week</p>
      <div className="flex items-center gap-1">
        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
        <span className="text-xs text-blue-500 font-medium">Live</span>
      </div>
    </div>
  </div>
);

const ProfileDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, profileCompleteness, isLoading, fetchProfile } = useProfile();
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobCount, setJobCount] = useState(0);
  const [lastJobFetch, setLastJobFetch] = useState(null);

  useEffect(() => { fetchProfile(); }, []);

  useEffect(() => { loadJobs(); }, []);

  const loadJobs = async () => {
    try {
      setJobsLoading(true);
      const res = await jobAPI.getAllJobs({ status: 'Active', limit: 6, sortBy: '-isPinned,-createdAt' });
      const list = res && (res.jobs || res.data || res.results || []);
      setJobs(Array.isArray(list) ? list : []);
      setJobCount((res && (res.total || (res.pagination && res.pagination.total))) || (Array.isArray(list) ? list.length : 0));
      setLastJobFetch(new Date());
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
      setJobs([]);
    } finally {
      setJobsLoading(false);
    }
  };

  const getUserName = () => (profile && profile.fullName) || (user && (user.fullName || user.name)) || 'User';
  const getFirstName = () => getUserName().split(' ')[0];
  const getUserInitials = () => {
    const names = getUserName().split(' ');
    if (names.length >= 2) return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    return getUserName().substring(0, 2).toUpperCase();
  };

  const getCompletenessColor = () => {
    if (profileCompleteness >= 80) return 'from-green-500 to-emerald-600';
    if (profileCompleteness >= 50) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-pink-600';
  };

  const getStatus = () => {
    if (profileCompleteness >= 80) return { text: 'Excellent!', emoji: 'star', bg: 'from-green-50 to-emerald-50', border: 'border-green-200' };
    if (profileCompleteness >= 50) return { text: 'Good Progress', emoji: 'thumbs', bg: 'from-yellow-50 to-orange-50', border: 'border-yellow-200' };
    return { text: 'Needs Attention', emoji: 'warning', bg: 'from-red-50 to-pink-50', border: 'border-red-200' };
  };

  if (isLoading && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto">
            <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <User className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <p className="mt-6 text-gray-700 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const status = getStatus();

  const checklistItems = [
    { label: 'Personal Details', done: !!(profile && profile.fullName && profile.gender), icon: User },
    { label: 'Contact Info', done: !!(profile && profile.mobileNumber), icon: MapPin },
    { label: 'Education', done: !!(profile && profile.highestQualification && profile.collegeName), icon: GraduationCap },
    { label: 'Professional Details', done: !!(profile && profile.candidateType && profile.currentStatus), icon: Briefcase },
    { label: 'Skills & Languages', done: !!(profile && profile.primarySkills && profile.primarySkills.length > 0), icon: Code },
    { label: 'Career Goals', done: !!(profile && profile.preferredJobRole), icon: Target },
    { label: 'Resume Uploaded', done: !!(profile && (profile.resumeUrl || (profile.documents && profile.documents.resume && profile.documents.resume.url))), icon: FileText },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-8">

        {/* Welcome Banner */}
        <div className="relative bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 rounded-2xl p-6 lg:p-8 text-white shadow-2xl shadow-blue-500/30 overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(to right,rgba(255,255,255,.1) 1px,transparent 1px),linear-gradient(to bottom,rgba(255,255,255,.1) 1px,transparent 1px)', backgroundSize: '24px 24px' }} />
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 lg:w-16 lg:h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                <span className="text-white font-bold text-xl lg:text-2xl">{getUserInitials()}</span>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                  <span className="text-blue-100 text-sm">Welcome back</span>
                </div>
                <h2 className="text-2xl lg:text-3xl font-bold">{getFirstName()}! 👋</h2>
                <p className="text-blue-100 text-sm mt-1">{(profile && (profile.currentRole || profile.candidateType)) || 'Ready to land your dream job?'}</p>
                {user?.college && (
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-white">
                      <Building2 className="w-3 h-3" />{user.college.name}
                    </span>
                    {user.college.code && (
                      <span className="flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-full text-xs text-blue-100 font-semibold tracking-wider uppercase">
                        {user.college.code}
                      </span>
                    )}
                    {user.college.address?.city && (
                      <span className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-full text-xs text-blue-100">
                        <MapPin className="w-3 h-3" />{[user.college.address.city, user.college.address.state].filter(Boolean).join(', ')}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 sm:flex-col sm:items-end">
              <button onClick={() => navigate('/profile/edit')} className="px-5 py-2.5 bg-white text-blue-600 rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200 flex items-center gap-2 text-sm">
                <Edit className="w-4 h-4" /> Edit Profile
              </button>
              {jobCount > 0 && (
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                  <Flame className="w-4 h-4 text-orange-300" />
                  <span className="text-sm font-medium">{jobCount} Live Jobs</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Profile Strength */}
        <div className={"bg-gradient-to-r " + status.bg + " backdrop-blur-xl rounded-2xl p-5 shadow-md border " + status.border}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <div className={"w-14 h-14 bg-gradient-to-br " + getCompletenessColor() + " rounded-2xl flex items-center justify-center shadow-md flex-shrink-0"}>
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-gray-900">Profile Strength</h3>
                  <span className="text-xs text-gray-500">— {status.text}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-gray-200 rounded-full h-2.5 max-w-xs">
                    <div className={"h-2.5 bg-gradient-to-r " + getCompletenessColor() + " rounded-full transition-all duration-1000"} style={{ width: profileCompleteness + '%' }} />
                  </div>
                  <span className={"text-lg font-bold bg-gradient-to-r " + getCompletenessColor() + " bg-clip-text text-transparent"}>{profileCompleteness}%</span>
                </div>
                {profileCompleteness < 100 && <p className="text-xs text-gray-600 mt-1">Complete profile to get discovered by top employers</p>}
              </div>
            </div>
            {profileCompleteness < 80 && (
              <button onClick={() => navigate('/profile/edit')} className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-medium text-sm flex items-center gap-2 hover:shadow-lg hover:scale-105 transition-all flex-shrink-0">
                <Plus className="w-4 h-4" /> Complete Now
              </button>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Skills Added" value={profile && profile.primarySkills ? profile.primarySkills.length : 0} icon={Code} color="from-blue-600 to-cyan-500" subtitle="Primary skills" onClick={() => navigate('/profile/edit')} />
          <StatCard title="Languages" value={profile && profile.programmingLanguages ? profile.programmingLanguages.length : 0} icon={Zap} color="from-blue-500 to-indigo-500" subtitle="Programming langs" onClick={() => navigate('/profile/edit')} />
          <StatCard title="Experience" value={(profile && profile.yearsOfExperience ? profile.yearsOfExperience : 0) + ' yrs'} icon={Briefcase} color="from-cyan-500 to-blue-500" subtitle={(profile && profile.candidateType) || 'Work experience'} onClick={() => navigate('/profile/edit')} />
          <StatCard title="Live Jobs" value={jobsLoading ? '...' : jobCount} icon={Target} color="from-blue-700 to-indigo-600" subtitle="Available now" onClick={() => navigate('/dashboard/student/jobs')} />
        </div>

        {/* Live Jobs Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
                <Briefcase className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Live Job Opportunities</h3>
                <p className="text-xs text-gray-500">{lastJobFetch ? 'Updated ' + timeAgo(lastJobFetch) : 'Loading...'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={loadJobs} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Refresh">
                <RefreshCw className={"w-4 h-4 " + (jobsLoading ? 'animate-spin' : '')} />
              </button>
              <button onClick={() => navigate('/dashboard/student/jobs')} className="text-sm text-blue-600 font-semibold flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all">
                View All <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {jobsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1,2,3].map(i => (
                <div key={i} className="bg-white/70 rounded-2xl p-5 border border-white/60 animate-pulse">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-11 h-11 bg-gray-200 rounded-xl" />
                    <div className="flex-1"><div className="h-4 bg-gray-200 rounded mb-2 w-3/4" /><div className="h-3 bg-gray-100 rounded w-1/2" /></div>
                  </div>
                  <div className="flex gap-2 mb-3"><div className="h-5 bg-gray-100 rounded-full w-16" /><div className="h-5 bg-gray-100 rounded-full w-14" /></div>
                  <div className="h-3 bg-gray-100 rounded w-full" />
                </div>
              ))}
            </div>
          ) : jobs.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {jobs.map(job => (
                <LiveJobCard key={job._id || job.id} job={job} onClick={() => navigate('/dashboard/student/jobs/' + (job._id || job.id))} />
              ))}
            </div>
          ) : (
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-10 text-center border border-white/60 shadow-md">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-8 h-8 text-blue-300" />
              </div>
              <h4 className="font-semibold text-gray-700 mb-2">No active jobs at the moment</h4>
              <p className="text-sm text-gray-500 mb-4">Check back soon — new opportunities are posted regularly.</p>
              <button onClick={loadJobs} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700 transition-all">Refresh</button>
            </div>
          )}
        </div>

        {/* Two-column: Courses + Right panel */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

          {/* Recommended Courses */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-sm">
                  <BookOpen className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Recommended Courses</h3>
                  <p className="text-xs text-gray-500">Curated for your profile</p>
                </div>
              </div>
              <button className="text-sm text-blue-600 font-semibold flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all">
                Browse All <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-4">
              {MOCK_COURSES.map(course => <CourseCard key={course.id} course={course} />)}
            </div>

            {/* Resume & Documents — integrated in left column */}
            <div className="mt-6">
              <ResumeCard profile={profile} navigate={navigate} />
            </div>

            {/* Career Tips rotating widget */}
            <div className="mt-6">
              <CareerTipsCard />
            </div>

            {/* Job Market Pulse */}
            <div className="mt-6">
              <JobMarketPulse navigate={navigate} />
            </div>
          </div>

          {/* Right: Assessments + Checklist */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
                  <Medal className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Skill Assessments</h3>
                  <p className="text-xs text-gray-500">Earn badges & boost visibility</p>
                </div>
              </div>
              <div className="space-y-4">
                {MOCK_ASSESSMENTS.map(a => <AssessmentCard key={a.id} assessment={a} />)}
              </div>
            </div>

            {/* Profile Checklist */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-5 shadow-md border border-white/60">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                  <CheckSquare className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Profile Checklist</h3>
                  <p className="text-xs text-gray-500">Complete all sections to stand out</p>
                </div>
              </div>
              <div className="space-y-2">
                {checklistItems.map(function(item) {
                  return (
                    <div key={item.label} onClick={() => navigate('/profile/edit')} className={"flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all " + (item.done ? 'bg-blue-50 hover:bg-blue-100' : 'bg-gray-50 hover:bg-gray-100')}>
                      <div className={"w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 " + (item.done ? 'bg-blue-100' : 'bg-gray-200')}>
                        <item.icon className={"w-3.5 h-3.5 " + (item.done ? 'text-blue-600' : 'text-gray-500')} />
                      </div>
                      <span className={"text-sm font-medium flex-1 " + (item.done ? 'text-blue-700' : 'text-gray-600')}>{item.label}</span>
                      {item.done ? <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" /> : <Plus className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                    </div>
                  );
                })}
              </div>
              <button onClick={() => navigate('/profile/edit')} className="mt-4 w-full py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-blue-500/30 hover:scale-105 transition-all flex items-center justify-center gap-2">
                <Edit className="w-4 h-4" /> Update Profile
              </button>
            </div>
          </div>
        </div>


      </div>
    </DashboardLayout>
  );
};

export default ProfileDashboard;