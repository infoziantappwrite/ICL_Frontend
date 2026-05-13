import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Search, ChevronRight, Tag } from 'lucide-react';
import TrainerDashboardLayout from '../../../components/layout/Trainerdashboardlayout';
import { trainerAPI } from '../../../api/Api';

/* ── Category color map ── */
const categoryColor = (cat) => {
  const map = {
    'Full Stack Development': { bg: '#EEF2FF', text: '#4F46E5' },
    'Data Science':           { bg: '#F0FDF4', text: '#16A34A' },
    'AI/ML':                  { bg: '#FDF4FF', text: '#9333EA' },
    'DevOps':                 { bg: '#FFF7ED', text: '#EA580C' },
    'Cloud Computing':        { bg: '#E0F2FE', text: '#0284C7' },
    'Mobile Development':     { bg: '#FEF9C3', text: '#CA8A04' },
    'Cybersecurity':          { bg: '#FEF2F2', text: '#DC2626' },
    'Blockchain':             { bg: '#F0FDFA', text: '#0D9488' },
    'Other':                  { bg: '#F8FAFC', text: '#64748B' },
  };
  return map[cat] || { bg: '#F8FAFC', text: '#64748B' };
};

/* ── Course Card ── */
const CourseCard = ({ course, onClick }) => {
  const cc = categoryColor(course.category);

  return (
    <button
      onClick={onClick}
      className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 overflow-hidden text-left w-full"
    >
      {/* Top accent bar */}
      <div className="h-1.5" style={{ background: 'linear-gradient(90deg, #003399, #00A9CE)' }} />

      <div className="p-5">
        {/* Category badge */}
        <span
          className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full mb-3"
          style={{ backgroundColor: cc.bg, color: cc.text }}
        >
          <Tag className="w-2.5 h-2.5" />
          {course.category || 'Uncategorized'}
        </span>

        {/* Title */}
        <h3 className="text-sm font-black text-slate-800 leading-snug mb-2 group-hover:text-[#003399] transition-colors">
          {course.title}
        </h3>

        {/* Description */}
        {course.description && (
          <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-3 mb-4">
            {course.description}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-50">
          <div className="flex items-center gap-1 text-[10px] text-[#003399] font-black">
            <BookOpen className="w-3 h-3" />
            View Details
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#003399] transition-colors" />
        </div>
      </div>
    </button>
  );
};

/* ── Skeleton ── */
const Skeleton = () => (
  <div className="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse">
    <div className="h-1.5 bg-slate-100 rounded mb-4" />
    <div className="h-4 bg-slate-100 rounded w-1/3 mb-3" />
    <div className="h-4 bg-slate-100 rounded w-3/4 mb-2" />
    <div className="h-3 bg-slate-100 rounded w-full mb-1" />
    <div className="h-3 bg-slate-100 rounded w-5/6 mb-4" />
    <div className="h-px bg-slate-100 mb-3" />
    <div className="h-3 bg-slate-100 rounded w-1/4" />
  </div>
);

/* ════════ MAIN ════════ */
const TrainerCourses = () => {
  const navigate  = useNavigate();
  const [courses, setCourses]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search,  setSearch]    = useState('');
  const [error,   setError]     = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await trainerAPI.getCourses();
        // backend returns: { success: true, data: [{title, description, category, ...}] }
        setCourses(res.data || []);
      } catch (e) {
        setError('Failed to load your courses. Please try again.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = courses.filter(c =>
    c.title?.toLowerCase().includes(search.toLowerCase()) ||
    c.category?.toLowerCase().includes(search.toLowerCase()) ||
    c.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <TrainerDashboardLayout>
      <div className="max-w-screen-xl mx-auto space-y-5 py-2">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-black text-slate-800">My Courses</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {loading ? 'Loading...' : `${courses.length} course${courses.length !== 1 ? 's' : ''} assigned to you`}
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-500">
            <BookOpen className="w-4 h-4 text-[#003399]" />
            {courses.length} Total
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white border border-slate-200 max-w-md">
          <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by title or category..."
            className="bg-transparent text-sm outline-none flex-1 text-slate-700"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">{error}</div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <Skeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
            <BookOpen className="w-12 h-12 mx-auto text-slate-200 mb-4" />
            <p className="text-slate-500 font-bold text-sm">
              {courses.length === 0 ? 'No courses assigned to you yet.' : 'No courses match your search.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((c, i) => (
              <CourseCard
                key={c._id || i}
                course={c}
                onClick={() => navigate(`/dashboard/trainer/courses/${c._id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </TrainerDashboardLayout>
  );
};

export default TrainerCourses;