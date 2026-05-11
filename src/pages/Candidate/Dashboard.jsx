// src/pages/Candidate/Dashboard.jsx - Enhanced, no Jobs
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  BookOpen, ClipboardList, CheckCircle2, ArrowRight, ChevronRight,
  User, RefreshCw, BookMarked, TrendingUp, Award, PlayCircle, Zap,
  BarChart2, AlertCircle, Target,
} from 'lucide-react';
import CandidateLayout from '../../components/layout/CandidateLayout';
import { courseAPI, assessmentAttemptAPI } from '../../api/Api';

const StatCard = ({ icon: Icon, label, value, sub, color }) => (
  <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-gray-100 p-5 flex items-center gap-4 hover:shadow-[0_4px_16px_rgba(0,0,0,0.1)] transition-all duration-300">
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${color}`}>
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <p className="text-[24px] font-black text-gray-900 leading-none">{value}</p>
      <p className="text-[12px] font-semibold text-gray-600 mt-0.5">{label}</p>
      {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

const CourseProgressCard = ({ enrollment, onClick }) => {
  const progress = enrollment.overallProgress || 0;
  const course = enrollment.courseId;
  const isCompleted = enrollment.status === 'completed';
  return (
    <button onClick={onClick}
      className="w-full text-left bg-white rounded-2xl border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-4 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all group">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
          {course?.thumbnail ? <img src={course.thumbnail} alt="" className="w-full h-full object-cover" /> : <BookOpen className="w-5 h-5 text-white" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 text-[13px] truncate group-hover:text-cyan-600 transition-colors">{course?.title || 'Course'}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">{course?.category || ''}</p>
          <div className="mt-2.5">
            <div className="flex justify-between mb-1">
              <span className="text-[10px] text-gray-400 font-medium">Progress</span>
              <span className={`text-[10px] font-bold ${isCompleted ? 'text-green-600' : 'text-cyan-600'}`}>{progress}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-700 ${isCompleted ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-cyan-500 to-blue-500'}`}
                style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
        {isCompleted ? <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-1" /> : <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-cyan-500 flex-shrink-0 mt-1 transition-colors" />}
      </div>
    </button>
  );
};

const AssessmentCard = ({ assessment, onClick }) => {
  const attempted = (assessment.attemptCount || 0) > 0;
  const best = assessment.myBestScore;
  const passed = best != null && best >= (assessment.passingScore || 0);
  return (
    <button onClick={onClick}
      className="w-full text-left flex items-center gap-3 p-3.5 bg-white rounded-2xl border border-gray-100 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all group">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${attempted && passed ? 'bg-green-50' : attempted ? 'bg-amber-50' : 'bg-cyan-50'}`}>
        <ClipboardList className={`w-5 h-5 ${attempted && passed ? 'text-green-600' : attempted ? 'text-amber-600' : 'text-cyan-600'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-[13px] text-gray-900 truncate group-hover:text-cyan-600 transition-colors">{assessment.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[11px] text-gray-400">{assessment.totalQuestions || 0}Q · {assessment.totalDuration || 0}min</span>
          {attempted && best != null && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${passed ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>{best}%</span>
          )}
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-cyan-500 flex-shrink-0 transition-colors" />
    </button>
  );
};

const CandidateDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
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

  const firstName = user?.fullName?.split(' ')[0] || user?.name?.split(' ')[0] || 'there';
  const completedCourses = enrollments.filter(e => e.status === 'completed').length;
  const activeCourses = enrollments.filter(e => e.status === 'active').length;
  const attemptedAssessments = assessments.filter(a => (a.attemptCount || 0) > 0).length;
  const scoreArr = assessments.filter(a => a.myBestScore != null);
  const avgScore = scoreArr.length > 0 ? Math.round(scoreArr.reduce((s, a) => s + a.myBestScore, 0) / scoreArr.length) : 0;

  const stats = [
    { icon: BookOpen, label: 'Enrolled Courses', value: enrollments.length, sub: `${activeCourses} in progress`, color: 'bg-blue-50 text-blue-600' },
    { icon: CheckCircle2, label: 'Completed', value: completedCourses, sub: 'courses finished', color: 'bg-emerald-50 text-emerald-600' },
    { icon: ClipboardList, label: 'Assessments', value: assessments.length, sub: `${attemptedAssessments} attempted`, color: 'bg-cyan-50 text-cyan-600' },
    { icon: TrendingUp, label: 'Avg Score', value: avgScore ? `${avgScore}%` : '—', sub: 'across attempts', color: 'bg-violet-50 text-violet-600' },
  ];

  const inProgressCourses = enrollments.filter(e => e.status === 'active' || e.status === 'pending');

  return (
    <CandidateLayout>
      <div className="min-h-screen bg-[#f0f4f8] px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
        <div className="max-w-[1400px] mx-auto space-y-4 sm:space-y-6">

          {/* Hero Header */}
          <div className="relative bg-gradient-to-r from-slate-900 via-blue-950 to-cyan-900 rounded-2xl overflow-hidden p-6 sm:p-8">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-400 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4" />
            </div>
            <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-cyan-500/20 text-cyan-300 text-[11px] font-bold px-3 py-1 rounded-full border border-cyan-500/30 flex items-center gap-1.5">
                    <Zap className="w-3 h-3" />  Candidate
                  </span>
                </div>
                <h1 className="text-[24px] md:text-[32px] font-black text-white leading-tight">
                  Welcome back, <span className="text-cyan-400">{firstName}!</span>
                </h1>
                <p className="text-[13px] text-blue-200 mt-1">Track your learning journey and skill progress.</p>
              </div>
              <button onClick={fetchData}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/10 border border-white/20 backdrop-blur-sm rounded-xl text-[13px] font-semibold text-white hover:bg-white/20 transition-all flex-shrink-0">
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-[13px] text-red-700 flex-1">{error}</p>
              <button onClick={fetchData} className="text-[12px] font-bold text-red-600">Retry</button>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {stats.map(s => <StatCard key={s.label} {...s} />)}
          </div>

          {/* Two columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* My Learning */}
            <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-gray-100 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center"><BookOpen className="w-4 h-4 text-blue-600" /></div>
                  <div>
                    <h2 className="font-bold text-gray-900 text-[15px]">My Learning</h2>
                    <p className="text-[11px] text-gray-400">Active & enrolled courses</p>
                  </div>
                </div>
                <button onClick={() => navigate('/dashboard/candidate/my-courses')} className="text-[12px] font-semibold text-cyan-600 hover:text-cyan-700 flex items-center gap-1">
                  View All <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <div className="p-4 space-y-2">
                {loading ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-gray-50 rounded-2xl p-4 animate-pulse flex gap-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-xl flex-shrink-0" />
                    <div className="flex-1 space-y-2 pt-1"><div className="h-3 bg-gray-200 rounded w-3/4" /><div className="h-2 bg-gray-200 rounded w-1/2" /><div className="h-1.5 bg-gray-200 rounded-full" /></div>
                  </div>
                )) : inProgressCourses.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-3"><BookMarked className="w-7 h-7 text-blue-300" /></div>
                    <p className="text-[13px] font-semibold text-gray-500">No active courses</p>
                    <p className="text-[12px] text-gray-400 mb-3">Explore our course library to get started</p>
                    <button onClick={() => navigate('/dashboard/candidate/courses')}
                      className="inline-flex items-center gap-1.5 text-[12px] font-bold text-cyan-600 bg-cyan-50 hover:bg-cyan-100 px-4 py-2 rounded-xl transition-colors">
                      Browse Courses <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  inProgressCourses.slice(0, 4).map(e => (
                    <CourseProgressCard key={e._id} enrollment={e}
                      onClick={() => navigate(`/dashboard/candidate/courses/${e.courseId?._id || e.courseId}/learn`)} />
                  ))
                )}
              </div>
            </div>

            {/* Assessments */}
            <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-gray-100 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-cyan-50 rounded-xl flex items-center justify-center"><ClipboardList className="w-4 h-4 text-cyan-600" /></div>
                  <div>
                    <h2 className="font-bold text-gray-900 text-[15px]">Assessments</h2>
                    <p className="text-[11px] text-gray-400">Test your knowledge & skills</p>
                  </div>
                </div>
                <button onClick={() => navigate('/dashboard/candidate/assessments')} className="text-[12px] font-semibold text-cyan-600 hover:text-cyan-700 flex items-center gap-1">
                  View All <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <div className="p-4 space-y-2">
                {loading ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-gray-50 rounded-2xl p-3.5 animate-pulse flex gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-xl flex-shrink-0" />
                    <div className="flex-1 space-y-2 pt-1"><div className="h-3 bg-gray-200 rounded w-2/3" /><div className="h-2 bg-gray-200 rounded w-1/3" /></div>
                  </div>
                )) : assessments.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="w-14 h-14 bg-cyan-50 rounded-2xl flex items-center justify-center mx-auto mb-3"><ClipboardList className="w-7 h-7 text-cyan-300" /></div>
                    <p className="text-[13px] font-semibold text-gray-500">No assessments yet</p>
                    <p className="text-[12px] text-gray-400">Assessments will appear here once assigned</p>
                  </div>
                ) : (
                  assessments.slice(0, 5).map(a => (
                    <AssessmentCard key={a._id} assessment={a}
                      onClick={() => navigate(`/dashboard/candidate/assessments/${a._id}/take`)} />
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-gray-100 p-5">
            <h2 className="font-bold text-gray-900 text-[15px] mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" /> Quick Actions
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: BookOpen, label: 'Browse Courses', path: '/dashboard/candidate/courses', color: 'bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-100' },
                { icon: BookMarked, label: 'My Learning', path: '/dashboard/candidate/my-courses', color: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-emerald-100' },
                { icon: ClipboardList, label: 'Assessments', path: '/dashboard/candidate/assessments', color: 'bg-cyan-50 text-cyan-600 hover:bg-cyan-100 border-cyan-100' },
                { icon: User, label: 'My Profile', path: '/profile/my-info', color: 'bg-violet-50 text-violet-600 hover:bg-violet-100 border-violet-100' },
              ].map(a => {
                const Icon = a.icon;
                return (
                  <button key={a.label} onClick={() => navigate(a.path)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${a.color}`}>
                    <Icon className="w-5 h-5" />
                    <span className="text-[12px] font-bold">{a.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Learning Overview */}
          {enrollments.length > 0 && !loading && (
            <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-900 text-[15px] flex items-center gap-2"><BarChart2 className="w-4 h-4 text-blue-500" /> Learning Overview</h2>
                <button onClick={() => navigate('/dashboard/candidate/my-courses')} className="text-[12px] font-semibold text-cyan-600 hover:text-cyan-700 flex items-center gap-1">Details <ChevronRight className="w-3 h-3" /></button>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                {[
                  { label: 'Total Enrolled', value: enrollments.length, icon: BookOpen, color: 'text-blue-600' },
                  { label: 'In Progress', value: activeCourses, icon: PlayCircle, color: 'text-amber-600' },
                  { label: 'Completed', value: completedCourses, icon: Award, color: 'text-emerald-600' },
                ].map(item => (
                  <div key={item.label} className="text-center p-3 bg-gray-50 rounded-xl">
                    <item.icon className={`w-5 h-5 mx-auto mb-1.5 ${item.color}`} />
                    <p className="text-[22px] font-black text-gray-900">{item.value}</p>
                    <p className="text-[11px] text-gray-500 font-medium">{item.label}</p>
                  </div>
                ))}
              </div>
              <div>
                <div className="flex justify-between mb-1.5">
                  <span className="text-[11px] text-gray-500 font-medium">Overall Completion Rate</span>
                  <span className="text-[11px] font-bold text-cyan-600">{Math.round((completedCourses / enrollments.length) * 100)}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-700"
                    style={{ width: `${Math.round((completedCourses / enrollments.length) * 100)}%` }} />
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </CandidateLayout>
  );
};

export default CandidateDashboard;
