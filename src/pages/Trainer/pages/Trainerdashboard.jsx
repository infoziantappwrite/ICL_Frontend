// src/pages/Trainer/Dashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import {
  BookOpen, Users, ClipboardList, FileText,
  TrendingUp, ChevronRight, Clock, CheckCircle2,
  AlertCircle, Star, Target, BarChart3,
  PlayCircle, Award, MessageSquare, Zap,
  GraduationCap, Eye, Plus, ArrowUpRight,
  Calendar, Activity,
} from 'lucide-react';
import TrainerDashboardLayout from '../../../components/layout/Trainerdashboardlayout';
import { DashboardSkeleton } from '../../../components/common/SkeletonLoader';

/* ─── Helpers ─────────────────────────────── */
const fmt = (n) => {
  if (n === undefined || n === null) return '0';
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
};

const pct = (a, b) => (b > 0 ? Math.min(100, Math.round((a / b) * 100)) : 0);

/* ─── Stat Card ──────────────────────────── */
const StatCard = ({ icon: Icon, label, value, sub, color, onClick }) => {
  const colors = {
    navy:  { bg: '#003399', light: '#EEF2FF', text: '#003399' },
    teal:  { bg: '#00A9CE', light: '#E0F7FC', text: '#00A9CE' },
    green: { bg: '#10B981', light: '#ECFDF5', text: '#059669' },
    amber: { bg: '#F59E0B', light: '#FFFBEB', text: '#D97706' },
    rose:  { bg: '#F43F5E', light: '#FFF1F2', text: '#E11D48' },
    indigo:{ bg: '#6366F1', light: '#EEF2FF', text: '#4F46E5' },
  };
  const c = colors[color] || colors.navy;

  return (
    <button
      onClick={onClick}
      className="group bg-white rounded-2xl border border-slate-100 p-5 text-left w-full shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
          style={{ backgroundColor: c.light }}
        >
          <Icon className="w-5 h-5" style={{ color: c.bg }} />
        </div>
        <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
      </div>
      <p className="text-[28px] font-black leading-none mb-1" style={{ color: c.text }}>{fmt(value)}</p>
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{label}</p>
      {sub && <p className="text-[10px] text-slate-400 mt-1">{sub}</p>}
    </button>
  );
};

/* ─── Section Header ─────────────────────── */
const SHead = ({ icon: Icon, title, sub, action, onAction, color = '#00A9CE' }) => (
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-2">
      <div
        className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 border"
        style={{ backgroundColor: `${color}15`, borderColor: `${color}30`, color }}
      >
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div>
        <h3 className="text-sm font-bold text-slate-800 leading-none">{title}</h3>
        {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
    {action && (
      <button
        onClick={onAction}
        className="text-[10px] font-black text-[#003399] flex items-center gap-0.5 px-2 py-1 rounded-lg hover:bg-slate-50 transition-colors"
      >
        {action} <ChevronRight className="w-3 h-3" />
      </button>
    )}
  </div>
);

/* ─── Course Row ─────────────────────────── */
const CourseRow = ({ name, students, progress, status, onClick }) => {
  const statusConfig = {
    active:   { label: 'Active',   bg: '#ECFDF5', text: '#059669' },
    draft:    { label: 'Draft',    bg: '#F8FAFC', text: '#64748B' },
    archived: { label: 'Archived', bg: '#FFF7ED', text: '#D97706' },
  };
  const s = statusConfig[status] || statusConfig.draft;

  return (
    <button
      onClick={onClick}
      className="group w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors text-left"
    >
      <div className="w-9 h-9 rounded-xl bg-[#003399]/8 flex items-center justify-center flex-shrink-0">
        <BookOpen className="w-4 h-4 text-[#003399]" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-bold text-slate-800 truncate max-w-[140px] group-hover:text-[#003399] transition-colors">{name}</p>
          <span className="text-[9px] font-black px-2 py-0.5 rounded-full ml-2 flex-shrink-0"
            style={{ backgroundColor: s.bg, color: s.text }}>{s.label}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${progress}%`, backgroundColor: '#003399' }}
            />
          </div>
          <span className="text-[10px] text-slate-400 flex-shrink-0">{progress}%</span>
          <span className="text-[10px] text-slate-400 flex items-center gap-0.5 flex-shrink-0">
            <Users className="w-2.5 h-2.5" /> {students}
          </span>
        </div>
      </div>
    </button>
  );
};

/* ─── Student Row ─────────────────────────── */
const StudentRow = ({ name, course, score, trend, initials }) => (
  <div className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
    <div
      className="w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-black text-white flex-shrink-0 shadow-sm"
      style={{ background: 'linear-gradient(135deg,#003399,#00A9CE)' }}
    >
      {initials}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-bold text-slate-800 truncate">{name}</p>
      <p className="text-[10px] text-slate-400 truncate">{course}</p>
    </div>
    <div className="text-right flex-shrink-0">
      <p className="text-xs font-black" style={{ color: score >= 75 ? '#059669' : score >= 50 ? '#D97706' : '#E11D48' }}>
        {score}%
      </p>
      <p className="text-[9px]" style={{ color: trend > 0 ? '#059669' : '#E11D48' }}>
        {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
      </p>
    </div>
  </div>
);

/* ─── Activity Item ──────────────────────── */
const ActivityItem = ({ icon: Icon, title, sub, time, color = '#003399' }) => (
  <div className="flex items-start gap-2.5 py-2 border-b border-slate-50 last:border-0">
    <div
      className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 border"
      style={{ backgroundColor: `${color}10`, borderColor: `${color}20`, color }}
    >
      <Icon className="w-3 h-3" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-semibold text-slate-800 leading-none">{title}</p>
      <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>
    </div>
    <span className="text-[9px] text-slate-300 flex-shrink-0 mt-0.5 font-mono">{time}</span>
  </div>
);

/* ─── Quick Action Tile ──────────────────── */
const QuickAction = ({ icon: Icon, label, desc, onClick, color = '#003399' }) => (
  <button
    onClick={onClick}
    className="group relative overflow-hidden rounded-xl p-3 text-left transition-all duration-200 hover:scale-[1.03] hover:shadow-md w-full bg-white border border-slate-100 hover:border-[#003399]/20"
  >
    <Icon className="w-4 h-4 mb-2 group-hover:scale-110 transition-transform" style={{ color }} />
    <p className="text-xs font-bold text-slate-800 leading-none">{label}</p>
    <p className="text-[10px] text-slate-400 mt-1 leading-tight">{desc}</p>
  </button>
);

/* ─── Assessment Row ─────────────────────── */
const AssessmentRow = ({ title, dueDate, submissions, total, status }) => {
  const pctVal = pct(submissions, total);
  const isUrgent = status === 'due-soon';
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-slate-50 last:border-0">
      <div className={`w-1.5 h-8 rounded-full flex-shrink-0 ${isUrgent ? 'bg-rose-400' : 'bg-[#00A9CE]'}`} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-slate-800 truncate">{title}</p>
        <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
          <Clock className="w-2.5 h-2.5" /> {dueDate}
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-xs font-black text-slate-700">{submissions}/{total}</p>
        <p className="text-[9px]" style={{ color: pctVal >= 70 ? '#059669' : '#D97706' }}>{pctVal}% done</p>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════
   MAIN DASHBOARD
════════════════════════════════════════════ */
const TrainerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { trainerAPI } = await import('../../../api/Api');
        // Only GET /trainer/courses exists — derive totalCourses from it
        const res = await trainerAPI.getCourses();
        const courses = res.data || [];
        setStats({
          totalCourses: courses.length,
          activeStudents: 0,
          pendingAssessments: 0,
          avgCompletion: 0,
          submittedThisWeek: 0,
        });
      } catch {
        setStats({
          totalCourses: 0, activeStudents: 0, pendingAssessments: 0,
          avgCompletion: 0, submittedThisWeek: 0,
        });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const getName = () => user?.fullName || user?.name || 'Trainer';
  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  /* ── Mock data — swap with API responses ── */
  const courses = [
    { name: 'React Fundamentals', students: 38, progress: 85, status: 'active' },
    { name: 'Node.js Backend Dev', students: 29, progress: 60, status: 'active' },
    { name: 'Python for Data Science', students: 41, progress: 45, status: 'active' },
    { name: 'UI/UX Design Basics', students: 16, progress: 100, status: 'archived' },
    { name: 'SQL & Databases', students: 0, progress: 10, status: 'draft' },
  ];

  const topStudents = [
    { name: 'Aanya Sharma', course: 'React Fundamentals', score: 94, trend: 3, initials: 'AS' },
    { name: 'Rahul Verma', course: 'Node.js Backend Dev', score: 88, trend: -2, initials: 'RV' },
    { name: 'Priya Nair', course: 'Python for Data Science', score: 81, trend: 5, initials: 'PN' },
    { name: 'Kiran Patel', course: 'React Fundamentals', score: 76, trend: 1, initials: 'KP' },
  ];

  const assessments = [
    { title: 'React Hooks Quiz', dueDate: 'Today 11:59 PM', submissions: 28, total: 38, status: 'due-soon' },
    { title: 'Node.js Midterm', dueDate: 'May 07, 2026', submissions: 12, total: 29, status: 'upcoming' },
    { title: 'Python Functions Test', dueDate: 'May 10, 2026', submissions: 5, total: 41, status: 'upcoming' },
  ];

  const recentActivity = [
    { icon: CheckCircle2, title: 'Aanya Sharma submitted React Hooks Quiz', sub: 'Score: 96/100', time: '2m ago', color: '#059669' },
    { icon: MessageSquare, title: 'New message in Node.js Backend Dev', sub: 'Rahul Verma asked a question', time: '14m ago', color: '#003399' },
    { icon: AlertCircle, title: 'Kiran Patel missed Python assignment', sub: 'Assignment #4 overdue', time: '1h ago', color: '#E11D48' },
    { icon: Star, title: 'Course review received', sub: '"Best structured course!" — Priya Nair', time: '3h ago', color: '#D97706' },
    { icon: Users, title: '3 new students enrolled', sub: 'SQL & Databases course', time: '5h ago', color: '#00A9CE' },
  ];

  if (loading) return (
    <TrainerDashboardLayout>
      <DashboardSkeleton />
    </TrainerDashboardLayout>
  );

  return (
    <TrainerDashboardLayout>
      <div className="max-w-screen-xl mx-auto space-y-5">

        {/* ── Welcome Banner ── */}
        <div
          className="relative overflow-hidden rounded-2xl p-5 sm:p-6"
          style={{ background: 'linear-gradient(135deg, #003399 0%, #00A9CE 100%)' }}
        >
          {/* Decorative circles */}
          <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/5" />
          <div className="absolute -bottom-8 -right-2 w-44 h-44 rounded-full bg-white/5" />
          <div className="absolute top-2 right-24 w-16 h-16 rounded-full bg-white/5" />

          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="text-blue-100 text-xs font-bold uppercase tracking-widest mb-1">
                {getGreeting()}
              </p>
              <h1 className="text-xl sm:text-2xl font-black text-white leading-tight">
                {getName()} 👋
              </h1>
              <p className="text-blue-100 text-xs mt-1.5 max-w-xs">
                You have <span className="font-black text-white">{stats.pendingAssessments} pending assessments</span> to review and{' '}
                <span className="font-black text-white">{stats.activeStudents} active students</span> this week.
              </p>
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <button
                  onClick={() => navigate('/dashboard/trainer/assessments')}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white text-[#003399] text-xs font-black rounded-xl hover:bg-blue-50 transition-colors shadow-sm"
                >
                  <ClipboardList className="w-3.5 h-3.5" /> Review Assessments
                </button>
                <button
                  onClick={() => navigate('/dashboard/trainer/courses')}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white/15 text-white text-xs font-bold rounded-xl hover:bg-white/25 transition-colors border border-white/20"
                >
                  <BookOpen className="w-3.5 h-3.5" /> My Courses
                </button>
              </div>
            </div>
            <div className="hidden sm:flex flex-col items-end gap-2 flex-shrink-0">
              <div className="bg-white/15 border border-white/20 rounded-xl px-3 py-2 text-right">
                <p className="text-[10px] text-blue-100 font-bold uppercase tracking-wide">Avg Completion</p>
                <p className="text-2xl font-black text-white">{stats.avgCompletion}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          <StatCard
            icon={BookOpen} label="My Courses" value={stats.totalCourses}
            sub="Across all batches" color="navy"
            onClick={() => navigate('/dashboard/trainer/courses')}
          />
          <StatCard
            icon={Users} label="Active Students" value={stats.activeStudents}
            sub="Enrolled this term" color="teal"
            onClick={() => navigate('/dashboard/trainer/students')}
          />
          <StatCard
            icon={ClipboardList} label="Pending Reviews" value={stats.pendingAssessments}
            sub="Awaiting grading" color="rose"
            onClick={() => navigate('/dashboard/trainer/assessments')}
          />

          <StatCard
            icon={TrendingUp} label="Completion" value={`${stats.avgCompletion}%`}
            sub="Avg across courses" color="green"
            onClick={() => navigate('/dashboard/trainer/analytics')}
          />
          <StatCard
            icon={Activity} label="Submissions" value={stats.submittedThisWeek}
            sub="This week" color="amber"
            onClick={() => navigate('/dashboard/trainer/assessments')}
          />
        </div>

        {/* ── Quick Actions ── */}
        <div>
          <SHead icon={Zap} title="Quick Actions" sub="Jump to common tasks" color="#003399" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <QuickAction
              icon={Plus} label="New Assessment" desc="Create quiz or test"
              onClick={() => navigate('/dashboard/trainer/assessments')}
              color="#003399"
            />

            <QuickAction
              icon={Eye} label="View Analytics" desc="Track student progress"
              onClick={() => navigate('/dashboard/trainer/analytics')}
              color="#059669"
            />
            <QuickAction
              icon={MessageSquare} label="Messages" desc="Chat with students"
              onClick={() => navigate('/dashboard/trainer/messages')}
              color="#D97706"
            />
          </div>
        </div>

        {/* ── Main Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* My Courses */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <SHead
              icon={BookOpen} title="My Courses" sub="Progress overview"
              action="View All" onAction={() => navigate('/dashboard/trainer/courses')}
              color="#003399"
            />
            <div className="space-y-0.5">
              {courses.map((c, i) => (
                <CourseRow key={i} {...c} onClick={() => navigate('/dashboard/trainer/courses')} />
              ))}
            </div>
          </div>

          {/* Pending Assessments */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <SHead
              icon={ClipboardList} title="Assessments" sub="Due dates & submissions"
              action="View All" onAction={() => navigate('/dashboard/trainer/assessments')}
              color="#E11D48"
            />
            <div>
              {assessments.map((a, i) => (
                <AssessmentRow key={i} {...a} />
              ))}
            </div>

            {/* Completion ring visual */}
            <div className="mt-4 p-3 rounded-xl flex items-center gap-3" style={{ background: '#003399/5', backgroundColor: '#EEF2FF' }}>
              <div className="relative w-12 h-12 flex-shrink-0">
                <svg viewBox="0 0 40 40" className="w-12 h-12 -rotate-90">
                  <circle cx="20" cy="20" r="16" fill="none" stroke="#E2E8F0" strokeWidth="4" />
                  <circle cx="20" cy="20" r="16" fill="none" stroke="#003399" strokeWidth="4"
                    strokeDasharray={`${pct(45, 108) * 1.005} 100`} strokeLinecap="round" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-[#003399]">
                  {pct(45, 108)}%
                </span>
              </div>
              <div>
                <p className="text-xs font-black text-slate-800">45 / 108 submitted</p>
                <p className="text-[10px] text-slate-400">across all active assessments</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Bottom Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Top Students */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <SHead
              icon={Award} title="Top Students" sub="By performance score"
              action="View All" onAction={() => navigate('/dashboard/trainer/students')}
              color="#D97706"
            />
            <div>
              {topStudents.map((s, i) => (
                <StudentRow key={i} {...s} />
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <SHead
              icon={Activity} title="Recent Activity" sub="Latest updates from your courses"
              color="#00A9CE"
            />
            <div>
              {recentActivity.map((a, i) => (
                <ActivityItem key={i} {...a} />
              ))}
            </div>
          </div>
        </div>

        {/* ── Calendar / Schedule Strip ── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <SHead icon={Calendar} title="This Week's Schedule" sub="Upcoming sessions & deadlines" color="#6366F1" />
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
              const events = [
                [{ label: 'React Q&A', color: '#003399' }],
                [],
                [{ label: 'Node.js Lab', color: '#00A9CE' }, { label: 'Quiz Due', color: '#E11D48' }],
                [{ label: 'Python Lec.', color: '#059669' }],
                [{ label: 'Assignment Due', color: '#D97706' }],
                [],
                [],
              ];
              const isToday = i === new Date().getDay() - 1;
              return (
                <div
                  key={day}
                  className={`rounded-xl p-2.5 border transition-all ${isToday ? 'border-[#003399]/30 bg-[#003399]/5' : 'border-slate-100 bg-slate-50/50'}`}
                >
                  <p className={`text-[10px] font-black uppercase tracking-wide mb-2 ${isToday ? 'text-[#003399]' : 'text-slate-400'}`}>{day}</p>
                  {events[i].length === 0
                    ? <p className="text-[9px] text-slate-300">—</p>
                    : events[i].map((ev, j) => (
                      <div key={j} className="mb-1 last:mb-0 px-1.5 py-0.5 rounded-md text-[9px] font-bold text-white truncate"
                        style={{ backgroundColor: ev.color }}>
                        {ev.label}
                      </div>
                    ))
                  }
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </TrainerDashboardLayout>
  );
};

export default TrainerDashboard;