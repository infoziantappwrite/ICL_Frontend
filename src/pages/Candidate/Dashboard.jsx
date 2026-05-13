// src/pages/Candidate/Dashboard.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useProfile } from '../../context/Profilecontext';
import {
  BookOpen, ClipboardList, CheckCircle2, ArrowRight, ChevronRight,
  User, RefreshCw, BookMarked, TrendingUp, Award, PlayCircle,
  BarChart2, AlertCircle, Briefcase, Bell, Settings,
} from 'lucide-react';
import CandidateLayout from '../../components/layout/CandidateLayout';
import { courseAPI, assessmentAttemptAPI } from '../../api/Api';

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const CircleProgress = ({ initials, percent }) => {
  const r = 38, circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  const color = percent >= 70 ? '#16a34a' : '#f59e0b';
  return (
    <div className="relative w-24 h-24 mx-auto">
      <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r={r} stroke="#e5e7eb" strokeWidth="5" fill="none" />
        <circle cx="48" cy="48" r={r} stroke={color} strokeWidth="5" fill="none"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          className="transition-all duration-700" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[17px] font-black text-gray-800">{initials}</span>
        <span className="text-[10px] font-bold text-amber-500">{percent}%</span>
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, sub, iconBg, iconColor }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-all">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
      <Icon className={`w-5 h-5 ${iconColor}`} />
    </div>
    <div>
      <p className="text-[26px] font-black text-gray-900 leading-none">{value}</p>
      <p className="text-[13px] font-semibold text-gray-700 mt-1">{label}</p>
      {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

const AvgScoreRing = ({ score, count }) => {
  const r = 32, circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 70 ? '#16a34a' : score >= 40 ? '#f59e0b' : '#ef4444';
  const label = score >= 70 ? 'Excellent 🎉' : score >= 40 ? 'Keep going 🔥' : 'Needs work 💪';
  const labelColor = score >= 70 ? 'text-green-600' : score >= 40 ? 'text-amber-500' : 'text-red-500';
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
      <div className="relative w-[76px] h-[76px] shrink-0">
        <svg className="w-[76px] h-[76px] -rotate-90" viewBox="0 0 76 76">
          <circle cx="38" cy="38" r={r} stroke="#f3f4f6" strokeWidth="6" fill="none" />
          <circle cx="38" cy="38" r={r} stroke={color} strokeWidth="6" fill="none"
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
            className="transition-all duration-700" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[16px] font-black text-gray-800">{score}%</span>
        </div>
      </div>
      <div>
        <p className="text-[14px] font-bold text-gray-900">Avg Score</p>
        <p className="text-[11px] text-gray-400">{count} assessments</p>
        <p className={`text-[11px] font-bold mt-1 ${labelColor}`}>{label}</p>
      </div>
    </div>
  );
};

const AssessmentRow = ({ assessment, onClick }) => {
  const attempted = (assessment.attemptCount || 0) > 0;
  const best = assessment.myBestScore;
  const passed = best != null && best >= (assessment.passingScore || 0);
  return (
    <button onClick={onClick}
      className="w-full text-left flex items-center gap-3 p-3.5 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all group">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0
        ${attempted && passed ? 'bg-green-50' : attempted ? 'bg-amber-50' : 'bg-blue-50'}`}>
        <ClipboardList className={`w-4 h-4
          ${attempted && passed ? 'text-green-600' : attempted ? 'text-amber-500' : 'text-blue-500'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[13px] text-gray-800 truncate group-hover:text-blue-700 transition-colors">
          {assessment.title}
        </p>
        <p className="text-[11px] text-gray-400 mt-0.5">
          {assessment.totalQuestions || 0}Q · {assessment.totalDuration || 0}min
          {attempted && best != null && (
            <span className={`ml-2 font-bold ${passed ? 'text-green-600' : 'text-red-500'}`}>
              · Best: {best}%
            </span>
          )}
        </p>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 shrink-0 transition-colors" />
    </button>
  );
};

const QuickAction = ({ icon: Icon, label, onClick, color }) => (
  <button onClick={onClick}
    className={`flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all hover:translate-x-0.5 ${color}`}>
    <Icon className="w-4 h-4 shrink-0" />
    {label}
  </button>
);

const CandidateDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useProfile();
  const [enrollments, setEnrollments] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [enrollRes, assessRes] = await Promise.allSettled([
        courseAPI.getMyEnrollments(),
        assessmentAttemptAPI.getMyAssignedAssessments(),
      ]);
      if (enrollRes.status === 'fulfilled' && enrollRes.value?.success)
        setEnrollments(enrollRes.value.enrollments || enrollRes.value.data || []);
      if (assessRes.status === 'fulfilled' && assessRes.value?.success)
        setAssessments(assessRes.value.assessments || []);
    } catch { setError('Failed to load dashboard data.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const fullName  = user?.fullName || user?.name || 'Candidate';
  const firstName = fullName.split(' ')[0];
  const getInitials = () => {
    const p = fullName.trim().split(' ');
    return p.length >= 2 ? `${p[0][0]}${p[p.length-1][0]}`.toUpperCase() : fullName.substring(0,2).toUpperCase();
  };

  const completedCourses   = enrollments.filter(e => e.status === 'completed').length;
  const activeCourses      = enrollments.filter(e => e.status === 'active').length;
  const attemptedCount     = assessments.filter(a => (a.attemptCount || 0) > 0).length;
  const pendingAssessments = assessments.filter(a => (a.attemptCount || 0) === 0);
  const scoreArr           = assessments.filter(a => a.myBestScore != null);
  const avgScore           = scoreArr.length > 0
    ? Math.round(scoreArr.reduce((s, a) => s + a.myBestScore, 0) / scoreArr.length) : 0;
  const profilePct = profile?.profileCompletionPercentage || 0;
  const updatedAt  = profile?.updatedAt
    ? new Date(profile.updatedAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })
    : null;

  const stats = [
    { icon: ClipboardList, label: 'Assessments Done', value: attemptedCount,     sub: `Avg ${avgScore}%`,             iconBg: 'bg-blue-50',   iconColor: 'text-blue-500'   },
    { icon: BookOpen,      label: 'Enrolled Courses', value: enrollments.length, sub: `${activeCourses} in progress`, iconBg: 'bg-violet-50', iconColor: 'text-violet-500' },
    { icon: Briefcase,     label: 'Jobs Matched',     value: 0,                  sub: 'Add skills to match',          iconBg: 'bg-green-50',  iconColor: 'text-green-600'  },
    { icon: TrendingUp,    label: 'Profile Score',    value: `${profilePct}%`,   sub: profilePct < 60 ? 'Needs improvement' : profilePct < 90 ? 'Looking good' : 'Complete!', iconBg: 'bg-amber-50', iconColor: 'text-amber-500' },
  ];

  const quickActions = [
    { icon: BookOpen,      label: 'Browse Courses',  path: '/dashboard/candidate/courses',       color: 'text-blue-600 hover:bg-blue-50'     },
    { icon: ClipboardList, label: 'My Assessments',  path: '/dashboard/candidate/assessments',   color: 'text-purple-600 hover:bg-purple-50'  },
    { icon: BookMarked,    label: 'My Learning',     path: '/dashboard/candidate/my-courses',    color: 'text-emerald-600 hover:bg-emerald-50'},
    { icon: User,          label: 'Edit Profile',    path: '/dashboard/candidate/profile',       color: 'text-gray-600 hover:bg-gray-100'     },
    { icon: Bell,          label: 'Notifications',   path: '/dashboard/candidate/notifications', color: 'text-orange-500 hover:bg-orange-50'  },
    { icon: Settings,      label: 'Settings',        path: '/dashboard/candidate/settings',      color: 'text-gray-500 hover:bg-gray-100'     },
  ];

  return (
    <CandidateLayout>
      <div className="min-h-screen bg-[#f3f4f6] px-3 sm:px-4 md:px-6 py-5">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex flex-col lg:flex-row gap-5">

            {/* ══ LEFT SIDEBAR ══════════════════════════════════════════ */}
            <div className="w-full lg:w-[272px] shrink-0 space-y-4">

              {/* Profile card */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
                <CircleProgress initials={getInitials()} percent={profilePct} />
                <h2 className="text-[16px] font-black text-gray-900 mt-3">{fullName}</h2>
                <p className="text-[12px] text-gray-400 mt-0.5">ICL Candidate</p>
                {updatedAt && <p className="text-[11px] text-gray-400 mt-0.5">Updated {updatedAt}</p>}
                <button
  onClick={() => navigate('/dashboard/candidate/profile')}
  className="mt-4 w-full py-2.5 text-white text-[13px] font-bold rounded-xl transition-all shadow-sm hover:opacity-90"
  style={{
    background: 'linear-gradient(135deg, #163c97 0%, #1fa3d8 100%)'
  }}
>
  View Profile
</button>
              </div>

              {/* Avg score ring */}
              {scoreArr.length > 0 && <AvgScoreRing score={avgScore} count={scoreArr.length} />}

              {/* Quick actions */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 px-1">Quick Actions</p>
                <div className="space-y-0.5">
                  {quickActions.map(a => (
                    <QuickAction key={a.label} icon={a.icon} label={a.label}
                      onClick={() => navigate(a.path)} color={a.color} />
                  ))}
                </div>
              </div>
            </div>

            {/* ══ MAIN CONTENT ══════════════════════════════════════════ */}
            <div className="flex-1 min-w-0 space-y-5">

              {/* Greeting */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h1 className="text-[22px] md:text-[26px] font-black text-gray-900">
  {getGreeting()},{' '}
  <span
    style={{
      background: 'linear-gradient(135deg, #163c97 0%, #1fa3d8 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent'
    }}
  >
    {firstName}
  </span>{' '}
  👋
</h1>
                  <p className="text-[13px] text-gray-400 mt-0.5">Here's your career overview for today.</p>
                </div>
                <button onClick={fetchData}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-[12px] font-semibold text-gray-600 hover:bg-gray-50 transition-all shadow-sm shrink-0">
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
                </button>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                  <p className="text-[13px] text-red-700 flex-1">{error}</p>
                  <button onClick={fetchData} className="text-[12px] font-bold text-red-600 hover:underline">Retry</button>
                </div>
              )}

              {/* Stats row */}
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
                {loading
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse space-y-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-xl" />
                        <div className="h-6 w-12 bg-gray-200 rounded" />
                        <div className="h-3 w-24 bg-gray-100 rounded" />
                      </div>
                    ))
                  : stats.map(s => <StatCard key={s.label} {...s} />)
                }
              </div>

              {/* Pending Assessments */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-blue-500" />
                    <h2 className="font-bold text-gray-900 text-[15px]">Pending Assessments</h2>
                  </div>
                  <button onClick={() => navigate('/dashboard/candidate/assessments/history')}
                    className="text-[12px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                    View all <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="p-4">
                  {loading ? (
                    <div className="space-y-2">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex gap-3 p-3.5 rounded-xl bg-gray-50 animate-pulse">
                          <div className="w-9 h-9 bg-gray-200 rounded-xl shrink-0" />
                          <div className="flex-1 space-y-2 pt-1">
                            <div className="h-3 bg-gray-200 rounded w-2/3" />
                            <div className="h-2 bg-gray-100 rounded w-1/3" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : pendingAssessments.length === 0 ? (
                    <div className="text-center py-10">
                      <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
                        <CheckCircle2 className="w-7 h-7 text-green-400" />
                      </div>
                      <p className="text-[14px] font-bold text-gray-700">All caught up!</p>
                      <p className="text-[12px] text-gray-400 mt-1">No pending assessments right now.</p>
                      <button onClick={() => navigate('/dashboard/candidate/assessments/history')}
                        className="mt-3 text-[12px] font-semibold text-blue-600 hover:underline">
                        View history →
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {pendingAssessments.slice(0, 5).map(a => (
                        <AssessmentRow key={a._id} assessment={a}
                          onClick={() => navigate(`/dashboard/candidate/assessments/${a._id}/take`)} />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* My Learning + Overview */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

                {/* My Learning */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-violet-500" />
                      <h2 className="font-bold text-gray-900 text-[15px]">My Learning</h2>
                    </div>
                    <button onClick={() => navigate('/dashboard/candidate/my-courses')}
                      className="text-[12px] font-semibold text-blue-600 flex items-center gap-1">
                      View all <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="p-4 space-y-2">
                    {loading ? Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex gap-3 p-3.5 rounded-xl bg-gray-50 animate-pulse">
                        <div className="w-10 h-10 bg-gray-200 rounded-xl shrink-0" />
                        <div className="flex-1 space-y-2 pt-1">
                          <div className="h-3 bg-gray-200 rounded w-3/4" />
                          <div className="h-1.5 bg-gray-100 rounded-full" />
                        </div>
                      </div>
                    )) : enrollments.length === 0 ? (
                      <div className="text-center py-8">
                        <BookMarked className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                        <p className="text-[13px] text-gray-500 font-semibold">No courses yet</p>
                        <button onClick={() => navigate('/dashboard/candidate/courses')}
                          className="mt-2 text-[12px] font-bold text-blue-600 hover:underline">Browse courses →</button>
                      </div>
                    ) : enrollments.slice(0, 4).map(e => {
                      const course = e.courseId;
                      const progress = e.overallProgress || 0;
                      const done = e.status === 'completed';
                      return (
                        <button key={e._id}
                          onClick={() => navigate(`/dashboard/candidate/courses/${course?._id || course}/learn`)}
                          className="w-full text-left flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/20 transition-all group">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center shrink-0">
                            {course?.thumbnail
                              ? <img src={course.thumbnail} alt="" className="w-full h-full object-cover rounded-xl" />
                              : <BookOpen className="w-4 h-4 text-white" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold text-gray-800 truncate group-hover:text-blue-700 transition-colors">
                              {course?.title || 'Course'}
                            </p>
                            <div className="mt-1.5 flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full transition-all duration-700 ${done ? 'bg-green-500' : 'bg-blue-500'}`}
                                  style={{ width: `${progress}%` }} />
                              </div>
                              <span className={`text-[10px] font-bold shrink-0 ${done ? 'text-green-600' : 'text-blue-500'}`}>{progress}%</span>
                            </div>
                          </div>
                          {done
                            ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                            : <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 shrink-0 transition-colors" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Learning Overview */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-50">
                    <BarChart2 className="w-4 h-4 text-emerald-500" />
                    <h2 className="font-bold text-gray-900 text-[15px]">Learning Overview</h2>
                  </div>
                  <div className="p-5 space-y-4">
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: 'Total',     value: enrollments.length, icon: BookOpen,   color: 'text-blue-500',  bg: 'bg-blue-50'  },
                        { label: 'Active',    value: activeCourses,      icon: PlayCircle, color: 'text-amber-500', bg: 'bg-amber-50' },
                        { label: 'Completed', value: completedCourses,   icon: Award,      color: 'text-green-600', bg: 'bg-green-50' },
                      ].map(item => (
                        <div key={item.label} className={`rounded-xl ${item.bg} p-3 text-center`}>
                          <item.icon className={`w-4 h-4 mx-auto mb-1 ${item.color}`} />
                          <p className="text-[20px] font-black text-gray-900">{item.value}</p>
                          <p className="text-[10px] text-gray-500 font-medium">{item.label}</p>
                        </div>
                      ))}
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-[11px] text-gray-500 font-medium">Completion Rate</span>
                        <span className="text-[11px] font-bold text-blue-600">
                          {enrollments.length > 0 ? Math.round((completedCourses / enrollments.length) * 100) : 0}%
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-700"
                          style={{ width: enrollments.length > 0 ? `${Math.round((completedCourses / enrollments.length) * 100)}%` : '0%' }} />
                      </div>
                    </div>
                    <div className="pt-3 border-t border-gray-50 space-y-2">
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Assessments</p>
                      {[
                        { label: 'Total Assigned', value: assessments.length },
                        { label: 'Attempted',      value: attemptedCount },
                        { label: 'Pending',        value: pendingAssessments.length },
                        { label: 'Average Score',  value: scoreArr.length > 0 ? `${avgScore}%` : '—' },
                      ].map(row => (
                        <div key={row.label} className="flex justify-between">
                          <span className="text-[12px] text-gray-500">{row.label}</span>
                          <span className="text-[12px] font-bold text-gray-900">{row.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </CandidateLayout>
  );
};

export default CandidateDashboard;