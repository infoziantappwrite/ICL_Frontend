// pages/CollegeAdmin/Courses/CourseEnrollments.jsx
// Admin: View all students enrolled in a specific course with progress details
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Users, ChevronLeft, Search, RefreshCw, AlertCircle, CheckCircle2,
  Award, BarChart3, X, ChevronRight, Clock, TrendingUp,
} from 'lucide-react';
import CollegeAdminLayout from '../../../components/layout/CollegeAdminLayout';
import { TableSkeleton } from '../../../components/common/SkeletonLoader';
import { collegeAdminCourseAPI as courseAPI } from '../../../api/Api';

const STATUS_CONFIG = {
  pending:   { label: 'Enrolled',     badge: 'bg-amber-50 text-amber-700 border-amber-200',   dot: 'bg-amber-400'  },
  active:    { label: 'In Progress',  badge: 'bg-blue-50 text-blue-700 border-blue-200',       dot: 'bg-blue-500'   },
  completed: { label: 'Completed',    badge: 'bg-green-50 text-green-700 border-green-200',    dot: 'bg-green-500'  },
  dropped:   { label: 'Dropped',      badge: 'bg-gray-50 text-gray-600 border-gray-200',       dot: 'bg-gray-400'   },
};

const ProgressBar = ({ value = 0 }) => (
  <div className="flex items-center gap-2">
    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all"
        style={{
          width: `${Math.min(100, value)}%`,
          background: value >= 100 ? '#16a34a' : value >= 50 ? '#2563eb' : '#f59e0b',
        }}
      />
    </div>
    <span className="text-[10px] font-bold text-slate-500 w-7 text-right tabular-nums">{Math.round(value)}%</span>
  </div>
);

const CourseEnrollments = () => {
  const { courseId } = useParams();
  const navigate     = useNavigate();

  const [enrollments, setEnrollments] = useState([]);
  const [courseTitle, setCourseTitle] = useState('');
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [search, setSearch]           = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => { fetchData(); fetchCourse(); }, [courseId]);
  useEffect(() => { fetchData(); }, [statusFilter]);

  const fetchCourse = async () => {
    try {
      const res = await courseAPI.getCourseById(courseId);
      if (res.success) setCourseTitle(res.data.title);
    } catch {}
  };

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const params = { limit: 100 };
      if (statusFilter) params.status = statusFilter;
      const res = await courseAPI.getCourseEnrollments(courseId, params);
      if (res.success) {
        setEnrollments(res.data || []);
      } else {
        setError(res.message || 'Failed to load enrollments');
      }
    } catch (err) {
      setError(err.message || 'Failed to load enrollments');
    } finally {
      setLoading(false);
    }
  };

  const filtered = enrollments.filter(e => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      e.userId?.fullName?.toLowerCase().includes(q) ||
      e.userId?.name?.toLowerCase().includes(q) ||
      e.userId?.email?.toLowerCase().includes(q) ||
      e.userId?.studentInfo?.rollNumber?.toLowerCase().includes(q)
    );
  });

  const stats = {
    total:       enrollments.length,
    completed:   enrollments.filter(e => e.status === 'completed').length,
    active:      enrollments.filter(e => e.status === 'active').length,
    certs:       enrollments.filter(e => e.certificateIssued).length,
    avgProgress: enrollments.length
      ? Math.round(enrollments.reduce((s, e) => s + (e.overallProgress || 0), 0) / enrollments.length)
      : 0,
  };

  if (loading && enrollments.length === 0) {
    return <TableSkeleton layout={CollegeAdminLayout} />;
  }

  return (
    <CollegeAdminLayout>
      <div className="px-6 py-4 md:px-8 md:py-6 space-y-5 font-sans">

        {/* ── Header ─────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span className="w-2 h-8 bg-gradient-to-b from-[#003399] to-[#00A9CE] rounded-full" />
              Enrolled Students
            </h1>
            <p className="text-sm text-slate-400 mt-1 font-medium">
              {courseTitle || 'Course'} · {stats.total} total · {stats.active} active · {stats.completed} completed · {stats.certs} certified
            </p>
          </div>
          <button
            onClick={() => navigate('/dashboard/college-admin/courses')}
            className="w-full md:w-auto inline-flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 text-[11px] font-black uppercase tracking-wider px-5 py-3 rounded-xl hover:bg-slate-50 transition-all shadow-sm active:scale-95"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
        </div>

        {/* ── KPI Cards ──────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Total Enrolled', value: stats.total,             icon: Users,        color: '#003399' },
            { label: 'Completed',      value: stats.completed,         icon: CheckCircle2, color: '#16a34a' },
            { label: 'Avg Progress',   value: `${stats.avgProgress}%`, icon: TrendingUp,   color: '#2563eb' },
            { label: 'Certificates',   value: stats.certs,             icon: Award,        color: '#d97706' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border"
                style={{ backgroundColor: `${color}12`, borderColor: `${color}25` }}
              >
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <div>
                <p className="text-xl font-black text-slate-900 leading-none">{value}</p>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Error ──────────────────────────────────────── */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* ── Table Card ─────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

          {/* Card header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
              {filtered.length} Students
            </span>
            <button
              onClick={() => navigate(`/dashboard/college-admin/courses/${courseId}/analytics`)}
              className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[#003399] hover:text-[#002d8b] transition-colors"
            >
              <BarChart3 className="w-3.5 h-3.5" /> View Analytics
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 px-6 py-4 border-b border-slate-100">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by name, email or roll no..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 border border-slate-100 hover:border-slate-200 rounded-xl focus:outline-none focus:border-[#003399]/30 text-xs font-bold bg-white transition-all"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="pl-4 pr-10 py-2.5 text-xs font-black uppercase tracking-wider border border-slate-100 rounded-xl focus:outline-none focus:border-[#003399]/30 bg-white appearance-none cursor-pointer text-slate-600 min-w-[140px]"
            >
              <option value="">All Statuses</option>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>

          {/* Table body */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <RefreshCw className="w-6 h-6 text-[#003399] animate-spin" />
              <p className="text-xs text-slate-400 font-medium">Loading enrollments…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100">
                <Users className="w-7 h-7 text-slate-200" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-slate-600">No students found</p>
                <p className="text-xs text-slate-400 mt-0.5">No enrollments match your criteria.</p>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="text-left px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider w-12">S.No</th>
                    <th className="text-left px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">Student</th>
                    <th className="text-left px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider w-32">Status</th>
                    <th className="text-left px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider w-36">Progress</th>
                    <th className="text-left px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider hidden sm:table-cell w-24">Modules</th>
                    <th className="text-left px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider hidden md:table-cell w-28">Enrolled</th>
                    <th className="text-left px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider hidden lg:table-cell w-28">Certificate</th>
                    <th className="text-left px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider hidden lg:table-cell">Assigned By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((e, index) => {
                    const statusCfg     = STATUS_CONFIG[e.status] || STATUS_CONFIG.pending;
                    const completedMods = e.moduleProgress?.filter(m => m.completed).length || 0;
                    const totalMods     = e.moduleProgress?.length || 0;
                    return (
                      <tr key={e._id} className="hover:bg-slate-50/60 transition-colors group">
                        <td className="px-4 py-3 text-[10px] text-slate-400 font-bold">
                          {String(index + 1).padStart(2, '0')}
                        </td>
                        <td className="px-4 py-3">
                          <div className="min-w-0">
                            <p className="font-bold text-slate-800 truncate group-hover:text-[#003399] transition-colors">
                              {e.userId?.fullName || e.userId?.name || e.userId?.email || '—'}
                            </p>
                            {e.userId?.studentInfo?.rollNumber && (
                              <p className="text-[10px] text-[#00A9CE] font-black uppercase tracking-wider">
                                {e.userId.studentInfo.rollNumber}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-bold ${statusCfg.badge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                            {statusCfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 min-w-[100px]">
                          <ProgressBar value={e.overallProgress || 0} />
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell text-slate-600 font-bold">
                          {completedMods}/{totalMods}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell text-slate-400">
                          {e.enrolledAt
                            ? new Date(e.enrolledAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
                            : '—'}
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          {e.certificateIssued ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-50 border border-green-100 px-2 py-0.5 rounded-full">
                              <Award className="w-3 h-3" /> Issued
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell text-slate-500 font-medium truncate max-w-[140px]">
                          {e.assignedBy?.fullName || e.assignedBy?.name || 'Self-enrolled'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </CollegeAdminLayout>
  );
};

export default CourseEnrollments;