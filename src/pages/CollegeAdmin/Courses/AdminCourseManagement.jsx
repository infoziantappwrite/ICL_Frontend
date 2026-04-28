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
  Active:        { label: 'Active',       color: 'bg-green-100 text-green-700 border-green-200' },
  Inactive:      { label: 'Inactive',     color: 'bg-gray-100 text-gray-600 border-gray-200'   },
  Draft:         { label: 'Draft',        color: 'bg-amber-100 text-amber-700 border-amber-200' },
  'Coming Soon': { label: 'Coming Soon',  color: 'bg-blue-100 text-blue-700 border-blue-200'    },
};

const STATUS_DOT = {
  Active: 'bg-green-500',
  Draft: 'bg-amber-500',
  'Coming Soon': 'bg-blue-500',
  Inactive: 'bg-gray-400',
};

const LEVEL_COLOR = {
  Beginner:     'bg-green-50 text-green-700',
  Intermediate: 'bg-blue-50 text-blue-700',
  Advanced:     'bg-purple-50 text-purple-700',
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
    <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
      <p className="text-sm text-gray-500">
        Showing <span className="font-semibold text-gray-700">{from}–{to}</span> of{' '}
        <span className="font-semibold text-gray-700">{total}</span> courses
      </p>
      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange(page - 1)} disabled={page === 1}
          className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        {withEllipsis.map((p, i) =>
          p === '…' ? (
            <span key={`e${i}`} className="px-2 text-gray-400 text-sm">…</span>
          ) : (
            <button key={p} onClick={() => onPageChange(p)}
              className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${p === page ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white' : 'border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600'}`}>
              {p}
            </button>
          )
        )}
        <button onClick={() => onPageChange(page + 1)} disabled={page === totalPages}
          className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const CourseRow = ({ course, onAnalytics, onViewEnrollments }) => {
  const statusCfg = STATUS_CONFIG[course.status] || STATUS_CONFIG.Inactive;
  const levelColor = LEVEL_COLOR[course.level] || '';
  return (
    <tr className="hover:bg-gray-50/80 transition-colors">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 text-sm truncate max-w-[200px]">{course.title}</p>
            <p className="text-xs text-gray-400">{course.category}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-4">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${levelColor}`}>{course.level}</span>
      </td>
      <td className="px-4 py-4">
        <span className={`flex items-center gap-1.5 w-fit text-xs font-medium px-2.5 py-1 rounded-full border ${statusCfg.color}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[course.status] || 'bg-gray-400'}`} />
          {statusCfg.label}
        </span>
      </td>
      <td className="px-4 py-4 text-sm text-gray-600">{course.enrollmentCount || 0}</td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-1 text-sm text-gray-600">
          <Clock className="w-3.5 h-3.5 text-gray-400" />
          {course.duration?.hours}h
        </div>
      </td>
      <td className="px-4 py-4">
        {course.rating?.count > 0 ? (
          <span className="flex items-center gap-1 text-sm text-gray-600">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            {course.rating.average?.toFixed(1)}
          </span>
        ) : <span className="text-xs text-gray-400">—</span>}
      </td>
      <td className="px-4 py-4">
        <ActionMenu actions={[
          { label: 'Enrollments', icon: Users, onClick: () => onViewEnrollments(course._id), color: 'text-cyan-600 hover:bg-cyan-50' },
          { label: 'Analytics', icon: BarChart3, onClick: () => onAnalytics(course._id), color: 'text-purple-600 hover:bg-purple-50' },
        ]} />
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
      <div className="min-h-screen bg-[#f0f4f8] px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4">
        <div className="max-w-[1400px] mx-auto space-y-3 sm:space-y-4">

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
        <div>
          <h1 className="text-[20px] md:text-[26px] font-bold text-gray-900 tracking-tight">
            Course <span className="text-blue-600">Management</span>
          </h1>
          <p className="text-[12px] md:text-[14px] text-gray-500 mt-1">
            {stats.total} total · {stats.active} active · {stats.totalEnrollments} enrollments · {stats.withCerts} with certificates
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          <span className="inline-flex items-center gap-1 bg-gray-50 rounded-lg px-2 py-1 text-[11px] font-bold text-gray-600 border border-gray-200">
            <BookOpen className="w-3 h-3" /> {stats.total} Total
          </span>
          <span className="inline-flex items-center gap-1 bg-green-50 rounded-lg px-2 py-1 text-[11px] font-bold text-emerald-600 border border-green-200">
            {stats.active} Active
          </span>
          <button
            onClick={() => navigate('/dashboard/college-admin/courses/assign-batch')}
            className="inline-flex items-center gap-1.5 bg-blue-600 text-white text-[11px] font-bold px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Send className="w-3 h-3" /> Assign to Batch
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] border border-gray-100 p-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by title, category, instructor, tags..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 text-sm"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <select
            value={categoryFilter}
            onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}
            className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 text-sm text-gray-700"
          >
            <option value="">All Categories</option>
            {CATEGORIES.filter(Boolean).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 text-sm text-gray-700"
          >
            <option value="">All Statuses</option>
            {Object.keys(STATUS_CONFIG).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button
            onClick={fetchCourses}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl hover:opacity-90 transition-all shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
          <p className="font-semibold text-gray-800">{filtered.length} Courses</p>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> {stats.active} Active
            </span>
            <span className="text-xs text-gray-400 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-amber-500" /> {stats.withCerts} Certified
            </span>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
          </div>
        ) : paginated.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <BookOpen className="w-7 h-7 text-blue-300" />
            </div>
            <p className="text-gray-500 font-medium">No courses found</p>
            <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-50">
                    {['Course', 'Level', 'Status', 'Enrolled', 'Duration', 'Rating', 'Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide bg-gradient-to-r from-blue-50 to-cyan-50 first:px-5">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginated.map(course => (
                    <CourseRow
                      key={course._id}
                      course={course}
                      onAnalytics={id => navigate(`/dashboard/college-admin/courses/${id}/analytics`)}
                      onViewEnrollments={id => navigate(`/dashboard/college-admin/courses/${id}/enrollments`)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={page}
              totalPages={totalPages}
              total={filtered.length}
              perPage={PER_PAGE}
              onPageChange={setPage}
            />
          </>
        )}
      </div>
        </div>
      </div>
    </CollegeAdminLayout>
  );
};

export default AdminCourseManagement;