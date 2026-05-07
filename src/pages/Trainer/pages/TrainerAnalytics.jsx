import { useState, useEffect } from 'react';
import { BookOpen, BarChart2, Tag, AlertCircle } from 'lucide-react';
import TrainerDashboardLayout from '../../../components/layout/Trainerdashboardlayout';
import { trainerAPI } from '../../../api/Api';

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

const TrainerAnalytics = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

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

  const total     = courses.length;
  const byCategory = courses.reduce((acc, c) => { acc[c.category || 'Other'] = (acc[c.category || 'Other'] || 0) + 1; return acc; }, {});

  return (
    <TrainerDashboardLayout>
      <div className="max-w-screen-xl mx-auto space-y-5 py-2">

        <div>
          <h1 className="text-xl font-black text-slate-800">Analytics</h1>
          <p className="text-xs text-slate-400 mt-0.5">Based on your assigned courses</p>
        </div>

        {/* Notice for what's missing */}
        <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">
            Full analytics (students, completion rates, assessment stats) need additional backend endpoints.
            Currently showing data from <code className="bg-amber-100 px-1 rounded font-mono">GET /api/trainer/courses</code> only.
          </p>
        </div>

        {/* Total courses stat */}
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
                    const pct   = Math.round((count / total) * 100);
                    const color = categoryColor(cat);
                    return (
                      <div key={cat}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                            <Tag className="w-3 h-3" style={{ color }} />
                            {cat}
                          </span>
                          <span className="font-black" style={{ color }}>{count} ({pct}%)</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Course list */}
        {!loading && total > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="text-sm font-black text-slate-800 mb-4">Assigned Courses</h3>
            <div className="space-y-0.5">
              {courses.map((c, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="w-7 h-7 rounded-lg bg-[#003399]/8 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-3.5 h-3.5 text-[#003399]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{c.title}</p>
                    <p className="text-[10px] text-slate-400">{c.category}</p>
                  </div>
                </div>
              ))}
            </div>
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