// pages/CollegeAdmin/Courses/AdminCourseManagement.jsx
// College Admin: VIEW ONLY — no create, edit, or delete rights
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, Search, BarChart3, Users, RefreshCw,
  AlertCircle, CheckCircle2, Clock, Award, X,
  Star, ChevronLeft, ChevronRight, Send,
} from 'lucide-react';
import CollegeAdminLayout from '../../../components/layout/CollegeAdminLayout';
import { TableSkeleton } from '../../../components/common/SkeletonLoader';
import ActionMenu from '../../../components/common/ActionMenu';
import { collegeAdminCourseAPI as courseAPI } from '../../../api/Api';

const CATEGORIES = [
  '', 'Full Stack Development', 'Data Science', 'AI/ML', 'DevOps',
  'Cloud Computing', 'Mobile Development', 'Cybersecurity', 'Blockchain', 'Other'
];

const STATUS_CONFIG = {
  Active:        { label: 'Active',       color: 'bg-green-50 text-green-700 border-green-200' },
  Inactive:      { label: 'Inactive',     color: 'bg-gray-50 text-gray-600 border-gray-200'   },
  Draft:         { label: 'Draft',        color: 'bg-amber-50 text-amber-700 border-amber-200' },
  'Coming Soon': { label: 'Coming Soon',  color: 'bg-[#003399]/5 text-[#003399] border-[#003399]/10'    },
};

const STATUS_DOT = {
  Active: 'bg-green-500',
  Draft: 'bg-amber-500',
  'Coming Soon': 'bg-[#003399]',
  Inactive: 'bg-gray-400',
};

const LEVEL_COLOR = {
  Beginner:     'bg-green-50 text-green-700 border-green-200',
  Intermediate: 'bg-[#003399]/5 text-[#003399] border-[#003399]/10',
  Advanced:     'bg-purple-50 text-purple-700 border-purple-200',
};

const PER_PAGE = 10;

const Pagination = ({ page, totalPages, onPageChange, total, perPage }) => {
  if (totalPages <= 1) return null;
  const from = (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1);
  const withEllipsis = pages.reduce((acc, p, i, arr) => {
    if (i > 0 && p - arr[i - 1] > 1) acc.push('…');
    acc.push(p);
    return acc;
  }, []);

  return (
    <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-white">
      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Showing {from}–{to} of {total}</span>
      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange(page - 1)} disabled={page === 1}
          className="p-1.5 rounded-lg border border-slate-100 text-slate-400 hover:border-[#003399]/30 hover:text-[#003399] disabled:opacity-40 transition-colors">
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        {withEllipsis.map((p, i) =>
          p === '…' ? (
            <span key={`e${i}`} className="px-2 text-slate-400 text-xs">…</span>
          ) : (
            <button key={p} onClick={() => onPageChange(p)}
              className={`w-7 h-7 rounded-lg text-xs font-black transition-colors ${p === page ? 'bg-[#003399] text-white shadow-md' : 'border border-slate-100 text-slate-500 hover:border-[#003399]/30 hover:text-[#003399]'}`}>
              {p}
            </button>
          )
        )}
        <button onClick={() => onPageChange(page + 1)} disabled={page === totalPages}
          className="p-1.5 rounded-lg border border-slate-100 text-slate-400 hover:border-[#003399]/30 hover:text-[#003399] disabled:opacity-40 transition-colors">
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

const CourseRow = ({ course, index, page, onAnalytics, onViewEnrollments }) => {
  const statusCfg = STATUS_CONFIG[course.status] || STATUS_CONFIG.Inactive;
  const levelColor = LEVEL_COLOR[course.level] || '';
  const sNo = (page - 1) * PER_PAGE + index + 1;
  return (
    <tr className="hover:bg-slate-50/30 transition-colors group">
      <td className="px-5 py-4 text-xs font-bold text-slate-400">
        {String(sNo).padStart(2, '0')}
      </td>
      <td className="px-5 py-4">
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-800 truncate w-full group-hover:text-[#003399] transition-colors">{course.title}</p>
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{course.category}</p>
        </div>
      </td>
      <td className="px-5 py-4">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border ${levelColor}`}>{course.level}</span>
      </td>
      <td className="px-5 py-4">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${statusCfg.color}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[course.status] || 'bg-gray-400'}`} />
          {statusCfg.label}
        </span>
      </td>
      <td className="px-5 py-4">
        <div className="flex items-center gap-1.5">
          <Users size={14} className="text-[#00A9CE]" />
          <span className="text-xs font-black text-slate-700 uppercase tracking-wider">{course.enrollmentCount || 0}</span>
        </div>
      </td>
      <td className="px-5 py-4">
        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
          <Clock className="w-3 h-3" />
          {course.duration?.hours}h
        </div>
      </td>
      <td className="px-5 py-4">
        {course.rating?.count > 0 ? (
          <span className="flex items-center gap-1 text-xs font-black text-amber-500">
            <Star className="w-3 h-3 fill-amber-500" />
            {course.rating.average?.toFixed(1)}
          </span>
        ) : <span className="text-xs text-slate-300">—</span>}
      </td>
      <td className="px-5 py-4 text-center">
        <div className="flex items-center justify-center">
          <ActionMenu actions={[
            { label: 'Enrollments', icon: Users, onClick: () => onViewEnrollments(course._id), color: 'text-cyan-600 hover:bg-cyan-50' },
            { label: 'Analytics', icon: BarChart3, onClick: () => onAnalytics(course._id), color: 'text-purple-600 hover:bg-purple-50' },
          ]} />
        </div>
      </td>
    </tr>
  );
};

const AdminCourseManagement = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { limit: 200 };
      if (categoryFilter) params.category = categoryFilter;
      if (statusFilter) params.status = statusFilter;
      const res = await courseAPI.getAllCourses(params);
      if (res.success) {
        const sorted = (res.data || []).sort(
          (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        );
        setCourses(sorted);
        setPage(1);
      } else {
        setError(res.message || 'Failed to load courses');
      }
    } catch (err) {
      setError(err.message || 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, statusFilter]);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);
  useEffect(() => { setPage(1); }, [search]);

  const filtered = courses.filter(c => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.title?.toLowerCase().includes(q) ||
      c.category?.toLowerCase().includes(q) ||
      c.instructor?.name?.toLowerCase().includes(q) ||
      c.tags?.some(t => t.toLowerCase().includes(q))
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const stats = {
    total: courses.length,
    active: courses.filter(c => c.status === 'Active').length,
    totalEnrollments: courses.reduce((s, c) => s + (c.enrollmentCount || 0), 0),
    withCerts: courses.filter(c => c.certificateProvided).length,
  };

  if (loading && courses.length === 0) {
    return <TableSkeleton layout={CollegeAdminLayout} />;
  }

  return (
    <CollegeAdminLayout>
      <div className="px-6 py-4 md:px-8 md:py-6 space-y-5 font-sans">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span className="w-2 h-8 bg-gradient-to-b from-[#003399] to-[#00A9CE] rounded-full inline-block flex-shrink-0" />
              Course <span className="text-[#003399]">Management</span>
            </h1>
            <p className="text-sm text-slate-400 mt-1 font-medium">
              View and assign available courses — {stats.total} total
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={fetchCourses} title="Refresh"
              className="inline-flex items-center justify-center gap-1.5 bg-white border border-slate-100 text-slate-500 text-xs font-bold px-4 py-2 rounded-xl hover:border-[#003399]/30 hover:text-[#003399] transition-all">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
            <button
              onClick={() => navigate('/dashboard/college-admin/courses/assign-batch')}
              className="inline-flex items-center gap-1.5 bg-[#003399] hover:bg-[#002d8b] text-white text-[11px] font-black uppercase tracking-wider px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-500/10 active:scale-95"
            >
              <Send className="w-4 h-4" /> Assign to Batch
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
          {[
            { label: 'Total Courses', value: stats.total,    bg: 'bg-[#003399]/5',    tc: 'text-[#003399]',   Icon: BookOpen },
            { label: 'Active',        value: stats.active,   bg: 'bg-emerald-50',     tc: 'text-emerald-700', Icon: CheckCircle2 },
            { label: 'Enrollments',   value: stats.totalEnrollments, bg: 'bg-indigo-50', tc: 'text-indigo-700', Icon: Users },
            { label: 'Certified',     value: stats.withCerts, bg: 'bg-amber-50',      tc: 'text-amber-700',   Icon: Award },
          ].map(({ label, value, bg, tc, Icon }) => (
            <div key={label} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[12px] font-bold text-gray-500 mb-0.5">{label}</p>
                <p className={`text-[24px] font-black ${tc} leading-none`}>{value}</p>
              </div>
              <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${tc}`} />
              </div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Search courses..." value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-10 pr-4 py-2.5 text-xs font-bold border border-slate-100 rounded-xl focus:outline-none focus:border-[#003399]/30 bg-white" />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-gray-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <select value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}
                className="px-4 py-2.5 text-xs font-bold border border-slate-100 rounded-xl focus:outline-none focus:border-[#003399]/30 bg-white appearance-none cursor-pointer min-w-[140px]">
                <option value="">All Categories</option>
                {CATEGORIES.filter(Boolean).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                className="px-4 py-2.5 text-xs font-bold border border-slate-100 rounded-xl focus:outline-none focus:border-[#003399]/30 bg-white appearance-none cursor-pointer min-w-[120px]">
                <option value="">All Statuses</option>
                {Object.keys(STATUS_CONFIG).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto min-h-[300px]">
            {error ? (
              <div className="p-8 text-center">
                <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-2" />
                <p className="text-sm font-bold text-red-600">{error}</p>
              </div>
            ) : paginated.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 bg-[#003399]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-8 h-8 text-[#003399]/40" />
                </div>
                <h3 className="text-lg font-bold text-gray-700 mb-2">No Courses Found</h3>
                <p className="text-slate-400 text-sm">Try adjusting your filters or search query.</p>
              </div>
            ) : (
              <table className="w-full table-fixed">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left w-[60px]">S.No</th>
                    <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left w-[250px]">Course</th>
                    <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left w-[120px]">Level</th>
                    <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left w-[130px]">Status</th>
                    <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left w-[100px]">Enrolled</th>
                    <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left w-[100px]">Duration</th>
                    <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left w-[80px]">Rating</th>
                    <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-[80px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginated.map((course, idx) => (
                    <CourseRow
                      key={course._id}
                      course={course}
                      index={idx}
                      page={page}
                      onAnalytics={id => navigate(`/dashboard/college-admin/courses/${id}/analytics`)}
                      onViewEnrollments={id => navigate(`/dashboard/college-admin/courses/${id}/enrollments`)}
                    />
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            total={filtered.length}
            perPage={PER_PAGE}
            onPageChange={setPage}
          />
        </div>
      </div>
    </CollegeAdminLayout>
  );
};

export default AdminCourseManagement;