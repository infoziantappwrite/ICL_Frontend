import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Users, Search, ChevronLeft, ChevronRight,
  TrendingUp, BookOpen, Mail, Phone, Calendar,
} from 'lucide-react';
import TrainerDashboardLayout from '../../../components/layout/Trainerdashboardlayout';
import { trainerAPI } from '../../../api/Api';

/* ─── Progress pill ─── */
const ProgressPill = ({ value }) => {
  const color = value >= 75 ? '#059669' : value >= 40 ? '#D97706' : '#E11D48';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden w-16">
        <div className="h-full rounded-full" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-black" style={{ color }}>{value}%</span>
    </div>
  );
};

/* ─── Avatar ─── */
const Avatar = ({ name }) => {
  const parts = (name || 'U').split(' ');
  const initials = parts.length >= 2
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    : (name || 'U').substring(0, 2).toUpperCase();
  return (
    <div
      className="w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black text-white flex-shrink-0"
      style={{ background: 'linear-gradient(135deg, #003399, #00A9CE)' }}
    >
      {initials}
    </div>
  );
};

/* ════════ MAIN ════════ */
const TrainerStudents = () => {
  const [searchParams] = useSearchParams();
  const courseIdFilter = searchParams.get('courseId') || '';

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const LIMIT = 15;

  const fetchStudents = async (p = 1, s = '') => {
    setLoading(true);
    try {
      const params = { page: p, limit: LIMIT, search: s };
      if (courseIdFilter) params.courseId = courseIdFilter;
      const res = await trainerAPI.getStudents(params);
      setStudents(res.data?.students || []);
      setTotalPages(res.data?.totalPages || 1);
      setTotal(res.data?.total || 0);
    } catch (e) {
      setError('Failed to load students.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStudents(1, search); }, [courseIdFilter]);

  const handleSearch = (val) => {
    setSearch(val);
    setPage(1);
    fetchStudents(1, val);
  };

  const handlePage = (p) => {
    setPage(p);
    fetchStudents(p, search);
  };

  return (
    <TrainerDashboardLayout>
      <div className="max-w-screen-xl mx-auto space-y-5 py-2">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-black text-slate-800">My Students</h1>
            <p className="text-xs text-slate-400 mt-0.5">{total} students across your courses</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#003399]/5 border border-[#003399]/10">
            <Users className="w-4 h-4 text-[#003399]" />
            <span className="text-xs font-black text-[#003399]">{total} Students</span>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white border border-slate-200 max-w-md">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Search by name..."
            className="bg-transparent text-sm outline-none flex-1 text-slate-700"
          />
        </div>

        {/* Error */}
        {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">{error}</div>}

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Student', 'Email', 'Course', 'Progress', 'Status', 'Enrolled'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(8)].map((_, i) => (
                    <tr key={i} className="border-b border-slate-50">
                      {[...Array(6)].map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-slate-100 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16">
                      <Users className="w-10 h-10 mx-auto text-slate-200 mb-3" />
                      <p className="text-slate-400 text-sm font-bold">No students found</p>
                    </td>
                  </tr>
                ) : students.map((s, i) => (
                  <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={s.student?.fullName} />
                        <span className="text-sm font-bold text-slate-800">{s.student?.fullName || '—'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-500">{s.student?.email || '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold text-slate-700">{s.course?.title || '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <ProgressPill value={s.progress} />
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="text-[10px] font-black px-2 py-0.5 rounded-full capitalize"
                        style={s.status === 'active' ? { background: '#ECFDF5', color: '#059669' } : { background: '#F8FAFC', color: '#64748B' }}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-400">
                        {s.enrolledAt ? new Date(s.enrolledAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
              <p className="text-xs text-slate-400">Page {page} of {totalPages}</p>
              <div className="flex gap-1.5">
                <button
                  onClick={() => handlePage(page - 1)}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-[#003399] hover:border-[#003399]/30 disabled:opacity-40 transition-all"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handlePage(page + 1)}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-[#003399] hover:border-[#003399]/30 disabled:opacity-40 transition-all"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </TrainerDashboardLayout>
  );
};

export default TrainerStudents;