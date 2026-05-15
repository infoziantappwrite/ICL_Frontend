// src/pages/Trainer/pages/TrainerAnalytics.jsx  —  Learning Observatory
import { useState, useEffect } from 'react';
import {
  BookOpen, BarChart2, Users, CheckCircle2,
  Activity, TrendingUp, ChevronDown, ChevronUp,
  AlertCircle, Clock, Star, Award, Flame, Zap,
} from 'lucide-react';
import TrainerDashboardLayout from '../../../components/layout/Trainerdashboardlayout';
import { trainerAPI } from '../../../api/Api';
import apiCall from '../../../api/Api';

/* ─── Category color ─────────────────────── */
const categoryColor = (cat) => {
  const map = {
    'Full Stack Development': '#4F46E5',
    'Data Science': '#16A34A',
    'AI/ML': '#9333EA',
    'DevOps': '#EA580C',
    'Cloud Computing': '#0284C7',
    'Mobile Development': '#CA8A04',
    'Cybersecurity': '#DC2626',
    'Blockchain': '#0D9488',
    'Other': '#64748B',
  };
  return map[cat] || '#003399';
};

/* ─── CHART: Radial Progress Ring ────────── */
const RadialRing = ({ value, size = 80, thickness = 8, color = '#003399', children }) => {
  const r = (size - thickness) / 2;
  const C = 2 * Math.PI * r;
  const dash = (Math.min(value, 100) / 100) * C;
  const cx = size / 2, cy = size / 2;
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F1F5F9" strokeWidth={thickness} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={thickness}
          strokeDasharray={`${dash} ${C - dash}`} strokeLinecap="round"
          style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dasharray 1s ease' }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
};

/* ─── CHART: Score Histogram ─────────────── */
const ScoreHistogram = ({ buckets }) => {
  const max = Math.max(...buckets.map(b => b.count), 1);
  const COLORS = ['#EF4444','#F59E0B','#F59E0B','#10B981','#10B981','#003399','#003399','#8B5CF6','#8B5CF6','#00A9CE'];
  return (
    <div className="flex items-end gap-1.5 h-28 w-full">
      {buckets.map((b, i) => {
        const h = Math.max((b.count / max) * 100, b.count > 0 ? 6 : 0);
        return (
          <div key={i} className="flex flex-col items-center gap-1 flex-1">
            <span className="text-[9px] font-black text-slate-400">{b.count > 0 ? b.count : ''}</span>
            <div className="w-full rounded-t-md transition-all duration-700"
              style={{ height: `${h}%`, backgroundColor: COLORS[i], opacity: 0.85, minHeight: b.count > 0 ? 6 : 0 }} />
            <span className="text-[8px] font-semibold text-slate-400">{b.label}</span>
          </div>
        );
      })}
    </div>
  );
};

/* ─── CHART: Weekly Heatmap ──────────────── */
const WeeklyHeatmap = ({ data }) => {
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const weeks = data; // array of 7 arrays (weeks), each with 7 values (days)
  const max = Math.max(...weeks.flat(), 1);
  const cellColor = (val) => {
    if (val === 0) return '#F8FAFC';
    const intensity = val / max;
    if (intensity < 0.25) return '#DBEAFE';
    if (intensity < 0.5)  return '#93C5FD';
    if (intensity < 0.75) return '#3B82F6';
    return '#003399';
  };
  return (
    <div className="overflow-x-auto">
      <div className="flex gap-1 min-w-max">
        <div className="flex flex-col gap-1 pt-5">
          {days.map(d => <span key={d} className="text-[9px] font-bold text-slate-400 h-5 flex items-center">{d}</span>)}
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            <span className="text-[9px] font-bold text-slate-400 text-center h-4 leading-none">W{wi+1}</span>
            {week.map((val, di) => (
              <div key={di} className="w-5 h-5 rounded-sm transition-all duration-500"
                style={{ backgroundColor: cellColor(val) }}
                title={`Week ${wi+1} ${days[di]}: ${val} submissions`} />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-2">
        <span className="text-[9px] text-slate-400 font-semibold">Less</span>
        {['#F8FAFC','#DBEAFE','#93C5FD','#3B82F6','#003399'].map(c => (
          <span key={c} className="w-3 h-3 rounded-sm" style={{ backgroundColor: c }} />
        ))}
        <span className="text-[9px] text-slate-400 font-semibold">More</span>
      </div>
    </div>
  );
};

/* ─── CHART: Sparkline ───────────────────── */
const Sparkline = ({ data, color = '#003399', height = 24, width = 80 }) => {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * width,
    y: height - ((v - min) / range) * height,
  }));
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

/* ─── Course Panel ───────────────────────── */
const CoursePanel = ({ course }) => {
  const [open, setOpen]     = useState(false);
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr]       = useState('');

  const load = async () => {
    if (data || loading) { setOpen(v => !v); return; }
    setOpen(true); setLoading(true); setErr('');
    try {
      const res = await apiCall(`/courses/${course._id}/analytics`);
      if (res?.success) setData(res.data);
      else setErr(res?.message || 'Failed to load analytics');
    } catch (e) {
      setErr(e?.message || 'Failed to load analytics');
    } finally { setLoading(false); }
  };

  const s = data?.summary || {};
  const students = data?.students || [];
  const color = categoryColor(course.category);
  const completion = Number(s.avgCompletionRate ?? s.completion ?? 0);
  const enrolled   = Number(s.enrolledCount ?? s.enrolled ?? course.enrolledCount ?? 0);
  const completed  = Number(s.completedCount ?? s.completed ?? 0);
  const avgScore   = Number(s.avgScore ?? s.averageScore ?? 0);

  /* score buckets — prefer real /score-distribution endpoint data when course matches */
  const BUCKET_LABELS = ['0-10','11-20','21-30','31-40','41-50','51-60','61-70','71-80','81-90','91-100'];
  const buckets = (() => {
    /* If we have real API buckets (global or course-level) use them */
    if (data?.scoreDistribution?.buckets?.length) {
      return BUCKET_LABELS.map((label, i) => {
        const found = data.scoreDistribution.buckets.find(b => b._id === i * 10 || b._id === String(i * 10));
        return { label, count: found?.count || 0 };
      });
    }
    /* Fall back to bucketing enrollment progress % */
    const base = BUCKET_LABELS.map(label => ({ label, count: 0 }));
    students.forEach(st => {
      const score = Number(st.progressPercentage ?? st.completionRate ?? 0);
      const idx = Math.min(Math.floor(score / 10), 9);
      base[idx].count++;
    });
    return base;
  })();

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <button onClick={load}
        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors text-left">
        <RadialRing value={completion} size={52} thickness={6} color={color}>
          <span className="text-[10px] font-black" style={{ color }}>{completion}%</span>
        </RadialRing>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-slate-800 truncate">{course.title}</h3>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border"
              style={{ backgroundColor: `${color}12`, color, borderColor: `${color}25` }}>
              {course.category || 'General'}
            </span>
            <span className="text-[10px] text-slate-400 flex items-center gap-1">
              <Users className="w-3 h-3"/>{enrolled} enrolled
            </span>
            {avgScore > 0 && (
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <Star className="w-3 h-3"/>{avgScore.toFixed(1)}% avg
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-black" style={{ color }}>{completed}</p>
            <p className="text-[9px] text-slate-400">completed</p>
          </div>
          {open ? <ChevronUp className="w-4 h-4 text-slate-400"/> : <ChevronDown className="w-4 h-4 text-slate-400"/>}
        </div>
      </button>

      {open && (
        <div className="border-t border-slate-50 px-5 pb-5 pt-4">
          {loading && (
            <div className="flex items-center gap-2 py-4 text-slate-400">
              <Activity className="w-4 h-4 animate-pulse"/><span className="text-xs">Loading analytics…</span>
            </div>
          )}
          {err && (
            <div className="flex items-center gap-2 py-3 text-rose-500 text-xs bg-rose-50 rounded-xl px-3">
              <AlertCircle className="w-4 h-4 flex-shrink-0"/>{err}
            </div>
          )}
          {data && (
            <div className="space-y-5">
              {/* Summary Rings */}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Completion', val: completion, color: color },
                  { label: 'Avg Score',  val: avgScore,   color: '#F59E0B' },
                  { label: 'Completed',  val: Math.min(100, Math.round((completed / Math.max(enrolled,1)) * 100)), color: '#10B981' },
                  { label: 'Active',     val: Math.min(100, Math.round(((s.activeCount ?? 0) / Math.max(enrolled,1)) * 100)), color: '#00A9CE' },
                ].map((ring, i) => (
                  <div key={i} className="flex flex-col items-center gap-2 p-3 bg-slate-50 rounded-xl">
                    <RadialRing value={ring.val} size={60} thickness={7} color={ring.color}>
                      <span className="text-[10px] font-black" style={{ color: ring.color }}>{Math.round(ring.val)}%</span>
                    </RadialRing>
                    <span className="text-[10px] font-bold text-slate-500">{ring.label}</span>
                  </div>
                ))}
              </div>

              {/* Score Distribution Histogram */}
              <div>
                <h4 className="text-xs font-bold text-slate-600 mb-3 flex items-center gap-1.5">
                  <BarChart2 className="w-3.5 h-3.5 text-slate-400"/> Score Distribution
                </h4>
                <ScoreHistogram buckets={buckets} />
              </div>

              {/* Student Table */}
              {students.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-600 mb-2 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-400"/> Student Progress
                  </h4>
                  <div className="overflow-x-auto rounded-xl border border-slate-100">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50">
                        <tr>
                          {['Student','Email','Progress','Status'].map(h => (
                            <th key={h} className="px-3 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {students.slice(0, 12).map((st, i) => {
                          const prog = Number(st.progressPercentage ?? st.completionRate ?? 0);
                          const progColor = prog >= 75 ? '#10B981' : prog >= 50 ? '#F59E0B' : '#EF4444';
                          return (
                            <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-3 py-2.5 font-semibold text-slate-800">
                                {st.studentId?.fullName || st.studentName || `Student ${i+1}`}
                              </td>
                              <td className="px-3 py-2.5 text-slate-400 truncate max-w-[140px]">
                                {st.studentId?.email || st.email || '—'}
                              </td>
                              <td className="px-3 py-2.5">
                                <div className="flex items-center gap-2">
                                  <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full transition-all duration-700"
                                      style={{ width: `${prog}%`, backgroundColor: progColor }} />
                                  </div>
                                  <span className="font-black text-[10px]" style={{ color: progColor }}>{prog}%</span>
                                </div>
                              </td>
                              <td className="px-3 py-2.5">
                                <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold border uppercase tracking-wide ${
                                  st.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                  st.status === 'active'    ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                  st.status === 'dropped'   ? 'bg-slate-100 text-slate-500 border-slate-200' :
                                  'bg-amber-50 text-amber-700 border-amber-100'
                                }`}>{st.status || 'active'}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {students.length > 12 && (
                      <div className="text-center py-2 text-[10px] text-slate-400 font-semibold border-t border-slate-50">
                        +{students.length - 12} more students
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ─── Stat Card ──────────────────────────── */
const StatCard = ({ icon: Icon, label, value, sub, color }) => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3 hover:shadow-md transition-all group">
    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
      style={{ backgroundColor: `${color}15`, color }}>
      <Icon className="w-5 h-5" />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-xl font-black leading-none" style={{ color }}>{value}</p>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5 truncate">{label}</p>
      {sub && <p className="text-[9px] text-slate-300 mt-0.5">{sub}</p>}
    </div>
  </div>
);

/* ══════════════════════════════════════════ */
/*           TRAINER ANALYTICS                */
/* ══════════════════════════════════════════ */
const TrainerAnalytics = () => {
  const [courses, setCourses]             = useState([]);
  const [scoreDist, setScoreDist]         = useState(null);
  const [progressTimeline, setProgressTimeline] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [coursesRes, scoreRes, timelineRes] = await Promise.allSettled([
          trainerAPI.getCourses(),
          apiCall('/trainer/analytics/score-distribution'),
          apiCall('/trainer/analytics/progress-timeline'),
        ]);
        if (coursesRes.status === 'fulfilled') setCourses(coursesRes.value?.data || []);
        if (scoreRes.status === 'fulfilled' && scoreRes.value?.success) setScoreDist(scoreRes.value.data);
        if (timelineRes.status === 'fulfilled' && timelineRes.value?.success) setProgressTimeline(timelineRes.value.data || []);
      } catch (e) {
        setError(e?.message || 'Could not load analytics');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* Aggregated summary across all courses */
  const totalCourses    = courses.length;
  const totalEnrolled   = courses.reduce((s, c) => s + (c.enrollmentCount ?? c.enrolledCount ?? 0), 0);
  const avgCompletion   = courses.length > 0
    ? Math.round(courses.reduce((s, c) => s + Number(c.completionRate ?? c.avgCompletion ?? 0), 0) / courses.length)
    : 0;
  const activeCourses   = courses.filter(c => c.status === 'active' || c.isActive).length;

  /* Real 12-month progress timeline → reshape into 4-week × 7-day heatmap proxy */
  /* The backend returns monthly data; we spread each month's attempts across weekdays */
  const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const hasTimeline = progressTimeline.length >= 2;
  const heatmapData = (() => {
    if (hasTimeline) {
      /* Take last 4 months, treat each month as one "week" column, spread across 7 days proportionally */
      const last4 = progressTimeline.slice(-4);
      return last4.map(m => {
        const total = m.total_attempts || 0;
        const perDay = Array(7).fill(0).map((_, di) => {
          if (di >= 5) return Math.round(total * 0.04);
          return Math.round(total * (0.15 + Math.sin(di * 0.9) * 0.05));
        });
        return perDay;
      });
    }
    /* No data — show empty heatmap */
    return Array.from({ length: 4 }, () => Array(7).fill(0));
  })();

  /* Real score distribution buckets from /trainer/analytics/score-distribution */
  const realBuckets = (() => {
    if (!scoreDist?.buckets?.length) return null;
    const LABELS = ['0-10','11-20','21-30','31-40','41-50','51-60','61-70','71-80','81-90','91-100'];
    return LABELS.map((label, i) => {
      const found = scoreDist.buckets.find(b => b._id === i * 10 || b._id === String(i * 10));
      return { label, count: found?.count || 0 };
    });
  })();

  /* Overall completion ring data */
  const overallRings = [
    { label: 'Avg Completion', val: avgCompletion,    color: '#003399', size: 100, thick: 12 },
    { label: 'Active Rate',    val: totalCourses > 0 ? Math.round((activeCourses / totalCourses) * 100) : 0, color: '#10B981', size: 80, thick: 10 },
  ];

  if (loading) return (
    <TrainerDashboardLayout>
      <div className="flex items-center justify-center h-64 gap-2 text-slate-400">
        <Activity className="w-5 h-5 animate-pulse"/><span className="text-sm">Loading analytics…</span>
      </div>
    </TrainerDashboardLayout>
  );

  return (
    <TrainerDashboardLayout>
      <div className="max-w-screen-xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span className="w-2 h-8 bg-gradient-to-b from-[#8B5CF6] to-[#003399] rounded-full"/>
              Learning Observatory
            </h1>
            <p className="text-sm text-slate-400 mt-1 font-medium">Per-course breakdown · student performance · engagement signals</p>
          </div>
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
            <Flame className="w-4 h-4 text-amber-500"/>
            <span className="text-xs font-bold text-amber-700">{totalCourses} courses tracked</span>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0"/>{error}
          </div>
        )}

        {/* KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard icon={BookOpen}      label="My Courses"     value={totalCourses}   color="#003399"  />
          <StatCard icon={Users}         label="Total Enrolled" value={totalEnrolled}  color="#8B5CF6"  />
          <StatCard icon={TrendingUp}    label="Avg Completion" value={`${avgCompletion}%`} color="#10B981" />
          <StatCard icon={CheckCircle2}  label="Active Courses" value={activeCourses}  color="#F59E0B"  />
        </div>

        {/* Overview Rings + Heatmap */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Concentric Completion Rings */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-[#003399]/10">
                <Zap className="w-4 h-4 text-[#003399]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Course Health Overview</h3>
                <p className="text-[10px] text-slate-400">Completion & activity rates — all courses</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-4 items-center justify-center">
              {/* Nested rings */}
              <div className="relative" style={{ width: 110, height: 110 }}>
                <RadialRing value={avgCompletion} size={110} thickness={14} color="#003399">
                  <div className="relative" style={{ width: 74, height: 74 }}>
                    <RadialRing
                      value={totalCourses > 0 ? Math.round((activeCourses / totalCourses) * 100) : 0}
                      size={74} thickness={10} color="#10B981">
                      <span className="text-[11px] font-black text-slate-700">{avgCompletion}%</span>
                    </RadialRing>
                  </div>
                </RadialRing>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-3 h-3 rounded-full bg-[#003399]"/>
                    <span className="text-xs font-bold text-slate-700">Avg Completion</span>
                  </div>
                  <p className="text-2xl font-black text-[#003399] pl-5">{avgCompletion}%</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-3 h-3 rounded-full bg-[#10B981]"/>
                    <span className="text-xs font-bold text-slate-700">Active Courses</span>
                  </div>
                  <p className="text-2xl font-black text-[#10B981] pl-5">
                    {totalCourses > 0 ? Math.round((activeCourses / totalCourses) * 100) : 0}%
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-50 space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-500 font-medium">Total Courses</span>
                    <span className="font-black text-[#003399]">{totalCourses}</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-500 font-medium">Total Enrolled</span>
                    <span className="font-black text-[#8B5CF6]">{totalEnrolled}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Submission Heatmap */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-[#003399]/10">
                <Activity className="w-4 h-4 text-[#003399]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Submission Activity</h3>
                <p className="text-[10px] text-slate-400">
                  {hasTimeline ? 'Real monthly attempt data — last 4 months' : 'No submission data yet'}
                </p>
              </div>
            </div>
            <WeeklyHeatmap data={heatmapData} />
            {hasTimeline && (
              <div className="mt-3 flex flex-wrap gap-3">
                {progressTimeline.slice(-4).map((m, i) => (
                  <div key={i} className="text-[10px] text-slate-500 flex items-center gap-1">
                    <span className="font-bold text-[#003399]">{m.total_attempts}</span> attempts in{' '}
                    {MONTH_NAMES[(m.month ?? 1) - 1]} · <span className="text-emerald-600 font-bold">{m.pass_rate}%</span> pass
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Course-wise Radial Summary Strips */}
        {courses.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-[#8B5CF6]/10">
                <Award className="w-4 h-4 text-[#8B5CF6]" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">Course Completion Snapshot</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {courses.slice(0, 10).map((c, i) => {
                const completion = Number(c.completionRate ?? c.avgCompletion ?? 0);
                const color = categoryColor(c.category);
                const enrolled = c.enrollmentCount ?? c.enrolledCount ?? 0;
                return (
                  <div key={i} className="flex flex-col items-center gap-2 p-3 bg-slate-50 rounded-xl hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-slate-100">
                    <RadialRing value={completion} size={64} thickness={8} color={color}>
                      <span className="text-[11px] font-black" style={{ color }}>{completion}%</span>
                    </RadialRing>
                    <div className="text-center">
                      <p className="text-[11px] font-bold text-slate-700 leading-tight line-clamp-2 text-center">{c.title}</p>
                      <p className="text-[9px] text-slate-400 mt-0.5 flex items-center justify-center gap-0.5">
                        <Users className="w-2.5 h-2.5"/>{enrolled}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Per-Course Deep Dive */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-[#003399]/10">
              <BarChart2 className="w-4 h-4 text-[#003399]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Per-Course Analytics</h3>
              <p className="text-[10px] text-slate-400">Click any course to expand detailed student data, score distribution & progress</p>
            </div>
          </div>

          {courses.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-12 text-center">
              <BookOpen className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400 font-semibold">No courses assigned yet</p>
              <p className="text-xs text-gray-300 mt-1">Courses appear here once you're assigned to them</p>
            </div>
          ) : (
            <div className="space-y-3">
              {courses.map(course => <CoursePanel key={course._id} course={course} />)}
            </div>
          )}
        </div>

      </div>
    </TrainerDashboardLayout>
  );
};

export default TrainerAnalytics;