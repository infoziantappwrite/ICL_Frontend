// pages/SuperAdmin/Courses/SuperAdminCourseManagement.jsx
// Super Admin: Manage ALL courses platform-wide — create, edit, delete, assign, analytics
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, Plus, Search, SquarePen, Trash2, BarChart3, Users, RefreshCw,
  AlertCircle, CircleCheck, Clock, X, Send, Star, Globe,
  Building2, ChevronLeft, ChevronRight,
} from 'lucide-react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { superAdminCourseAPI } from '../../../api/Api';

const CATEGORIES = [
  '', 'Full Stack Development', 'Data Science', 'AI/ML', 'DevOps',
  'Cloud Computing', 'Mobile Development', 'Cybersecurity', 'Blockchain', 'Other'
];

const ALL_STATUSES = ['Active', 'Inactive', 'Draft', 'Coming Soon'];

const STATUS_CONFIG = {
  Active:        { color: 'bg-green-100 text-green-700 border-green-200' },
  Inactive:      { color: 'bg-gray-100 text-gray-600 border-gray-200'   },
  Draft:         { color: 'bg-amber-100 text-amber-700 border-amber-200' },
  'Coming Soon': { color: 'bg-blue-100 text-blue-700 border-blue-200'    },
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

const PAGE_SIZE = 10;

const DeleteModal = ({ course, onConfirm, onCancel, loading }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
    <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full">
      <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mb-4">
        <Trash2 className="w-6 h-6 text-red-600" />
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Course?</h3>
      <p className="text-sm text-gray-600 mb-6">
        Delete <strong>{course.title}</strong>? This will soft-delete and hide it from all students.
      </p>
      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-700 text-sm font-medium hover:bg-gray-50">Cancel</button>
        <button onClick={onConfirm} disabled={loading} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-60">
          {loading ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </div>
  </div>
);

const StatusDropdown = ({ course, onStatusChange, changing }) => {
  const [open, setOpen] = useState(false);
  const cfg = STATUS_CONFIG[course.status] || STATUS_CONFIG.Inactive;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        disabled={changing}
        className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border transition-all ${cfg.color} ${changing ? 'opacity-60 cursor-not-allowed' : 'hover:opacity-80 cursor-pointer'}`}
        title="Click to change status"
      >
        {changing
          ? <RefreshCw className="w-3 h-3 animate-spin" />
          : <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[course.status] || 'bg-gray-400'}`} />
        }
        {course.status}
        <svg className="w-2.5 h-2.5 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-20 bg-white rounded-xl shadow-lg border border-gray-100 py-1 min-w-[140px]">
            {ALL_STATUSES.map(s => (
              <button
                key={s}
                onClick={() => { onStatusChange(course, s); setOpen(false); }}
                className={`w-full text-left px-3 py-2 text-xs font-medium hover:bg-gray-50 transition-colors flex items-center gap-2 ${s === course.status ? 'text-blue-600 bg-blue-50' : 'text-gray-700'}`}
              >
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[s] || 'bg-gray-400'}`} />
                {s}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const CourseRow = ({ course, onEdit, onDelete, onAnalytics, onViewEnrollments, onStatusChange, changingStatus }) => {
  const levelColor = LEVEL_COLOR[course.level] || '';
  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 text-sm truncate max-w-[180px]">{course.title}</p>
            <p className="text-xs text-gray-400">{course.category}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-4">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${levelColor}`}>{course.level}</span>
      </td>
      <td className="px-4 py-4">
        <StatusDropdown
          course={course}
          onStatusChange={onStatusChange}
          changing={changingStatus === course._id}
        />
      </td>
      <td className="px-4 py-4">
        {course.collegeId ? (
          <span className="flex items-center gap-1 text-xs text-gray-600">
            <Building2 className="w-3.5 h-3.5 text-gray-400" />
            {course.collegeId.name || 'College'}
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs text-blue-600">
            <Globe className="w-3.5 h-3.5" /> Platform-wide
          </span>
        )}
      </td>
      <td className="px-4 py-4 text-sm text-gray-600">{course.enrollmentCount || 0}</td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-1 text-sm text-gray-600">
          <Clock className="w-3.5 h-3.5 text-gray-400" />{course.duration?.hours}h
        </div>
      </td>
      <td className="px-4 py-4">
        {course.rating?.count > 0
          ? <span className="flex items-center gap-1 text-sm text-gray-600"><Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />{course.rating.average?.toFixed(1)}</span>
          : <span className="text-xs text-gray-400">—</span>}
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-1.5">
          <button onClick={() => onEdit(course._id)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit"><SquarePen className="w-3.5 h-3.5" /></button>
          <button onClick={() => onViewEnrollments(course._id)} className="p-1.5 text-gray-500 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors" title="Enrollments"><Users className="w-3.5 h-3.5" /></button>
          <button onClick={() => onAnalytics(course._id)} className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" title="Analytics"><BarChart3 className="w-3.5 h-3.5" /></button>
          <button onClick={() => onDelete(course)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      </td>
    </tr>
  );
};

const Pagination = ({ page, totalPages, total, pageSize, onPageChange }) => {
  if (totalPages <= 1) return null;
  const from = (page - 1) * pageSize + 1;
  const to   = Math.min(page * pageSize, total);
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

const SuperAdminCourseManagement = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [changingStatus, setChangingStatus] = useState(null);
  const [toast, setToast] = useState(null);
  const [page, setPage] = useState(1);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const fetchCourses = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = { limit: 500, sort: '-createdAt' };
      if (categoryFilter) params.category = categoryFilter;
      if (statusFilter) params.status = statusFilter;
      const res = await superAdminCourseAPI.getAllCourses(params);
      if (res.success) {
        let list = (res.data || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        if (search.trim()) {
          const q = search.toLowerCase();
          list = list.filter(c =>
            c.title?.toLowerCase().includes(q) ||
            c.category?.toLowerCase().includes(q) ||
            c.instructor?.name?.toLowerCase().includes(q) ||
            c.tags?.some(t => t.toLowerCase().includes(q)) ||
            c.collegeId?.name?.toLowerCase().includes(q)
          );
        }
        setCourses(list);
        setPage(1);
      } else { setError(res.message || 'Failed to load courses'); }
    } catch (err) { setError(err.message || 'Failed to load courses'); }
    finally { setLoading(false); }
  }, [search, categoryFilter, statusFilter]);

  useEffect(() => {
    const t = setTimeout(fetchCourses, search ? 400 : 0);
    return () => clearTimeout(t);
  }, [fetchCourses]);

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      const res = await superAdminCourseAPI.deleteCourse(deleteConfirm._id);
      if (res.success) {
        showToast('Course deleted successfully');
        setCourses(prev => prev.filter(c => c._id !== deleteConfirm._id));
        setDeleteConfirm(null);
      } else { showToast(res.message || 'Delete failed', 'error'); }
    } catch (err) { showToast(err.message || 'Delete failed', 'error'); }
    finally { setDeleting(false); }
  };

  const handleStatusChange = async (course, newStatus) => {
    if (newStatus === course.status) return;
    setChangingStatus(course._id);
    try {
      const payload = { status: newStatus, collegeId: course.collegeId?._id || course.collegeId || null };
      const res = await superAdminCourseAPI.updateCourse(course._id, payload);
      if (res.success) {
        setCourses(prev => prev.map(c => c._id === course._id ? { ...c, status: newStatus } : c));
        showToast(`Status changed to "${newStatus}"`);
      } else { showToast(res.message || 'Status update failed', 'error'); }
    } catch (err) { showToast(err.message || 'Status update failed', 'error'); }
    finally { setChangingStatus(null); }
  };

  const stats = {
    total: courses.length,
    active: courses.filter(c => c.status === 'Active').length,
    platformWide: courses.filter(c => !c.collegeId).length,
    totalEnrollments: courses.reduce((s, c) => s + (c.enrollmentCount || 0), 0),
  };

  const totalPages = Math.max(1, Math.ceil(courses.length / PAGE_SIZE));
  const paginated  = courses.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (loading && courses.length === 0)
    return <LoadingSpinner message="Loading Courses..." submessage="Fetching all course data" icon={BookOpen} />;

  return (
    <DashboardLayout title="Course Management">
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-medium ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CircleCheck className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}
      {deleteConfirm && <DeleteModal course={deleteConfirm} onConfirm={handleDelete} onCancel={() => setDeleteConfirm(null)} loading={deleting} />}

      {/* Banner */}
      <div className="mb-6">
        <div className="relative bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 rounded-2xl p-6 shadow-xl overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute w-64 h-64 bg-white rounded-full -top-20 -right-20" />
            <div className="absolute w-48 h-48 bg-white rounded-full bottom-0 left-20" />
          </div>
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="text-white">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Platform Course Management</h1>
                  <p className="text-blue-100 text-sm">Manage all courses across all colleges</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-blue-100">
                <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4" /> {stats.total} Total</span>
                <span className="flex items-center gap-1.5"><CircleCheck className="w-4 h-4" /> {stats.active} Active</span>
                <span className="flex items-center gap-1.5"><Globe className="w-4 h-4" /> {stats.platformWide} Platform-wide</span>
                <span className="flex items-center gap-1.5"><Users className="w-4 h-4" /> {stats.totalEnrollments} Enrollments</span>
              </div>
            </div>
            <button
              onClick={() => navigate('/dashboard/super-admin/courses/create')}
              className="flex-shrink-0 flex items-center gap-2 bg-white text-blue-700 font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-blue-50 transition-all shadow-md hover:scale-105"
            >
              <Plus className="w-5 h-5" /> Create Course
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-sm p-4 mb-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Search title, category, instructor, college..." value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-11 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 text-sm" />
            {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>}
          </div>
          <select value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1); }} className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 text-sm text-gray-700">
            <option value="">All Categories</option>
            {CATEGORIES.filter(Boolean).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 text-sm text-gray-700">
            <option value="">All Statuses</option>
            {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button onClick={fetchCourses} className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl hover:opacity-90 transition-all shadow-sm">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Table */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
          <p className="font-semibold text-gray-800">{courses.length} Courses</p>
          <button onClick={() => navigate('/dashboard/super-admin/courses/assign-batch')} className="flex items-center gap-1.5 text-sm text-blue-600 font-medium hover:text-blue-700">
            <Send className="w-4 h-4" /> Assign to Batch
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><RefreshCw className="w-6 h-6 text-blue-500 animate-spin" /></div>
        ) : courses.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No courses found</p>
            <button onClick={() => navigate('/dashboard/super-admin/courses/create')} className="mt-4 flex items-center gap-2 mx-auto px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">
              <Plus className="w-4 h-4" /> Create Course
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-50">
                    {['Course', 'Level', 'Status', 'Scope', 'Enrolled', 'Duration', 'Rating', 'Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide bg-gradient-to-r from-blue-50 to-cyan-50">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginated.map(course => (
                    <CourseRow
                      key={course._id}
                      course={course}
                      onEdit={id => navigate(`/dashboard/super-admin/courses/edit/${id}`)}
                      onDelete={setDeleteConfirm}
                      onAnalytics={id => navigate(`/dashboard/super-admin/courses/${id}/analytics`)}
                      onViewEnrollments={id => navigate(`/dashboard/super-admin/courses/${id}/enrollments`)}
                      onStatusChange={handleStatusChange}
                      changingStatus={changingStatus}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={totalPages} total={courses.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default SuperAdminCourseManagement;