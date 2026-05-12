// pages/Trainer/pages/TrainerAnalytics.jsx
// FIXED: No longer stuck on course-list-only view.
// Now calls GET /courses/:id/analytics (trainer-authorized) for each assigned course
// and renders per-course student data: summary stats + student progress table.

import { useState, useEffect } from 'react';
import {
  BookOpen, BarChart2, Tag, Users, CheckCircle2,
  Activity, TrendingUp, ChevronDown, ChevronUp,
  AlertCircle, Clock, Star,
} from 'lucide-react';
import TrainerDashboardLayout from '../../../components/layout/Trainerdashboardlayout';
import { trainerAPI } from '../../../api/Api';
import apiCall from '../../../api/Api';

/* ── Category color ── */
const categoryColor = (cat) => {
  const map = {
    'Full Stack Development': '#4F46E5',
    'Data Science':           '#16A34A',
    'AI/ML':                  '#9333EA',
    'DevOps':                 '#EA580C',
    'Cloud Computing':        '#0284C7',
    'Mobile Development':     '#CA8A04',
    'Cybersecurity':          '#DC2626',
    'Blockchain':             '#0D9488',
    'Other':                  '#64748B',
  };
  return map[cat] || '#003399';
};

/* ── Stat pill ── */
const Pill = ({ icon: Icon, label, value, color }) => (
  <div className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border ${color}`}>
    <Icon className="w-3.5 h-3.5 flex-shrink-0" />
    <div className="min-w-0">
      <p className="text-base font-black leading-none">{value}</p>
      <p className="text-[9px] font-bold opacity-60 mt-0.5 leading-none">{label}</p>
    </div>
  </div>
);

/* ── Progress mini bar ── */
const MiniBar = ({ value }) => (
  <div className="flex items-center gap-2">
    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full bg-gradient-to-r from-[#003399] to-[#00A9CE] transition-all duration-700"
        style={{ width: `${Math.min(100, value || 0)}%` }}
      />
    </div>
    <span className="text-[10px] font-black text-[#003399] w-7 text-right">{value || 0}%</span>
  </div>
);

/* ── Status badge ── */
const StatusBadge = ({ status }) => {
  const s = {
    active:    'bg-blue-50 text-blue-700 border-blue-100',
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    pending:   'bg-amber-50 text-amber-700 border-amber-100',
    dropped:   'bg-gray-100 text-gray-500 border-gray-200',
  }[status] || 'bg-gray-100 text-gray-500 border-gray-200';
  return (
    <span className={`inline-block px-2 py-0.5 rounded-md border text-[9px] font-bold uppercase tracking-wide ${s}`}>
      {status}
    </span>
  );
};

/* ── Course analytics panel ── */
const CoursePanel = ({ course }) => {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const load = async () => {
    if (data || loading) { setOpen(v => !v); return; }
    setOpen(true);
    setLoading(true);
    setErr('');
    try {
      // Use /courses/:id/analytics — trainer role is authorized here
      const res = await apiCall(`/courses/${course._id}/analytics`);
      if (res?.success) setData(res.data);
      else setErr(res?.message || 'Failed to load analytics');
    } catch (e) {
      setErr(e?.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const s = data?.summary || {};
  const students = data?.students || [];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

      {/* Course header row */}
      <button
        onClick={load}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-slate-50 transition-colors text-left"
      >
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${categoryColor(course.category)}18` }}
        >
          <BookOpen className="w-4 h-4" style={{ color: categoryColor(course.category) }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-800 truncate">{course.title}</p>
          <p className="text-[10px] text-slate-400 flex items-center gap-1">
            <Tag className="w-2.5 h-2.5" style={{ color: categoryColor(course.category) }} />
            {course.category || 'Uncategorized'}
          </p>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />}
      </button>

      {/* Expanded analytics */}
      {open && (
        <div className="border-t border-slate-50 px-5 pb-5 pt-4 space-y-4">

          {loading && (
            <div className="space-y-2 animate-pulse">
              <div className="h-12 bg-slate-100 rounded-xl" />
              <div className="h-24 bg-slate-100 rounded-xl" />
            </div>
          )}

          {err && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {err}
            </div>
          )}

          {data && (
            <>
              {/* Summary stats */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                <Pill icon={Users}        label="Total"     value={s.totalStudents ?? 0}                 color="bg-blue-50 border-blue-100 text-blue-700" />
                <Pill icon={Activity}     label="Active"    value={s.activeStudents ?? 0}                color="bg-cyan-50 border-cyan-100 text-cyan-700" />
                <Pill icon={CheckCircle2} label="Completed" value={s.completedStudents ?? 0}             color="bg-emerald-50 border-emerald-100 text-emerald-700" />
                <Pill icon={TrendingUp}   label="Avg Prog"  value={`${s.averageProgress ?? 0}%`}        color="bg-indigo-50 border-indigo-100 text-indigo-700" />
                <Pill icon={Star}         label="Rate"      value={`${s.completionRate ?? 0}%`}          color="bg-violet-50 border-violet-100 text-violet-700" />
              </div>

              {/* Student table */}
              {students.length > 0 ? (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Students</p>
                  <div className="space-y-1.5">
                    {students.map((st, i) => (
                      <div key={st._id || i} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                        <div className="w-6 h-6 rounded-lg bg-[#003399]/10 flex items-center justify-center text-[#003399] text-[9px] font-black flex-shrink-0">
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">{st.name}</p>
                          <p className="text-[10px] text-slate-400 truncate">{st.email}</p>
                        </div>
                        <div className="flex-shrink-0 w-28">
                          <MiniBar value={st.progress} />
                        </div>
                        <div className="flex-shrink-0">
                          <StatusBadge status={st.status} />
                        </div>
                        {st.completedAt && (
                          <div className="flex-shrink-0 flex items-center gap-1 text-[9px] text-emerald-600 font-semibold">
                            <Clock className="w-2.5 h-2.5" />
                            {new Date(st.completedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-4">No students enrolled yet.</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════ */
const TrainerAnalytics = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await trainerAPI.getCourses();
        setCourses(res.data?.assigned_courses || []);
      } catch {
        setError('Failed to load course data.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const total = courses.length;
  const byCategory = courses.reduce((acc, c) => {
    acc[c.category || 'Other'] = (acc[c.category || 'Other'] || 0) + 1;
    return acc;
  }, {});

  return (
    <TrainerDashboardLayout>
      <div className="max-w-screen-xl mx-auto space-y-5 py-2">

        <div>
          <h1 className="text-xl font-black text-slate-800">Analytics</h1>
          <p className="text-xs text-slate-400 mt-0.5">Click any course to load student analytics</p>
        </div>

        {/* Summary */}
        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:col-span-1">
              <div className="w-10 h-10 rounded-xl bg-[#003399]/10 flex items-center justify-center mb-3">
                <BookOpen className="w-5 h-5 text-[#003399]" />
              </div>
              <p className="text-3xl font-black text-slate-800">{total}</p>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mt-0.5">Total Courses</p>
            </div>

            {/* Category breakdown */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 className="w-4 h-4 text-[#003399]" />
                <h3 className="text-sm font-black text-slate-800">Courses by Category</h3>
              </div>
              {total === 0 ? (
                <p className="text-sm text-slate-400">No courses yet.</p>
              ) : (
                <div className="space-y-2.5">
                  {Object.entries(byCategory).map(([cat, count]) => {
                    const p = Math.round((count / total) * 100);
                    const color = categoryColor(cat);
                    return (
                      <div key={cat}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                            <Tag className="w-3 h-3" style={{ color }} />
                            {cat}
                          </span>
                          <span className="font-black" style={{ color }}>{count} ({p}%)</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${p}%`, backgroundColor: color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Per-course analytics panels */}
        {!loading && courses.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Course Analytics — click to expand
            </p>
            {courses.map((c) => (
              <CoursePanel key={c._id} course={c} />
            ))}
          </div>
        )}

        {loading && (
          <div className="space-y-3 animate-pulse">
            <div className="h-24 bg-white rounded-2xl border border-slate-100" />
            <div className="h-48 bg-white rounded-2xl border border-slate-100" />
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">{error}</div>
        )}
      </div>
    </TrainerDashboardLayout>
  );
};

export default TrainerAnalytics;