// pages/SuperAdmin/Courses/SuperAdminCourseManagement.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, Plus, Search, SquarePen, Trash2, BarChart3, Users,
  RefreshCw, AlertCircle, CircleCheck, X, Send,
  Globe, Building2, ChevronLeft, ChevronRight, ChevronDown,
  FileEdit, Hourglass, CheckCircle2, XCircle, Eye, Lock, MessageSquare
} from 'lucide-react';
import SuperAdminDashboardLayout from '../../../components/layout/SuperAdminDashboardLayout';
import { TableSkeleton } from '../../../components/common/SkeletonLoader';
import ActionMenu from '../../../components/common/ActionMenu';
import apiCall, { commentAPI } from '../../../api/Api';

const CATEGORIES = [
  '', 'Full Stack Development', 'Data Science', 'AI/ML', 'DevOps',
  'Cloud Computing', 'Mobile Development', 'Cybersecurity', 'Blockchain', 'Other',
];
const PAGE_SIZE = 10;

// ── Status config ──────────────────────────────────────────────────────────────
const STATUS_OPTIONS = [
  {
    key: 'Draft',
    icon: FileEdit,
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-400',
    row: 'hover:bg-amber-50',
    desc: 'Not visible to students',
  },
  {
    key: 'Coming Soon',
    icon: Hourglass,
    badge: 'bg-violet-50 text-violet-700 border-violet-200',
    dot: 'bg-violet-500',
    row: 'hover:bg-violet-50',
    desc: 'Visible, auto-activates on start date',
  },
  {
    key: 'Active',
    icon: CheckCircle2,
    badge: 'bg-green-50 text-green-700 border-green-200',
    dot: 'bg-green-500',
    row: 'hover:bg-green-50',
    desc: 'Enrollable by students',
  },
  {
    key: 'Inactive',
    icon: XCircle,
    badge: 'bg-red-50 text-red-500 border-red-200',
    dot: 'bg-red-400',
    row: 'hover:bg-red-50',
    desc: 'Hidden from all students',
  },
];

const getStatusCfg = (status) =>
  STATUS_OPTIONS.find(s => s.key === status) || STATUS_OPTIONS[0];

// ── Status Dropdown ────────────────────────────────────────────────────────────
const StatusDropdown = ({ course, onStatusChange, changing }) => {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, openUp: false });
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);
  const cfg = getStatusCfg(course.status);
  const Icon = cfg.icon;

  const openDropdown = () => {
    if (changing) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const dropH = 260;
    const openUp = spaceBelow < dropH;
    setPos({
      left: rect.left,
      top: openUp ? rect.top - dropH - 4 : rect.bottom + 4,
      openUp,
    });
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target) &&
        triggerRef.current && !triggerRef.current.contains(e.target)
      ) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('scroll', () => setOpen(false), true);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('scroll', () => setOpen(false), true);
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        onClick={openDropdown}
        disabled={changing}
        className={[
          'inline-flex items-center gap-1.5 pl-2 pr-1.5 py-1 rounded-full border text-xs font-semibold transition-all select-none',
          cfg.badge,
          changing ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:shadow-sm',
        ].join(' ')}
      >
        {changing
          ? <RefreshCw className="w-3 h-3 animate-spin flex-shrink-0" />
          : <Icon className="w-3 h-3 flex-shrink-0" />
        }
        <span>{course.status}</span>
        <ChevronDown className={`w-3 h-3 opacity-60 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && typeof document !== 'undefined' && ReactDOM.createPortal(
        <div
          ref={dropdownRef}
          style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999, width: 224 }}
          className="bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden"
        >
          <div className="px-3.5 pt-3 pb-2 border-b border-gray-50">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Change Status</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Draft → Coming Soon → Active → Inactive</p>
          </div>
          <div className="py-1.5">
            {STATUS_OPTIONS.map(opt => {
              const OptionIcon = opt.icon;
              const isCurrent = opt.key === course.status;
              return (
                <button
                  key={opt.key}
                  onClick={() => { onStatusChange(course, opt.key); setOpen(false); }}
                  className={[
                    'w-full flex items-center gap-3 px-3.5 py-2.5 transition-colors text-left',
                    isCurrent ? 'bg-gray-50' : opt.row,
                  ].join(' ')}
                >
                  <span className={[
                    'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0',
                    isCurrent ? opt.badge + ' border' : 'bg-gray-100',
                  ].join(' ')}>
                    <OptionIcon className={`w-3.5 h-3.5 ${isCurrent ? '' : 'text-gray-400'}`} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-bold ${isCurrent ? 'text-[#003399]' : 'text-gray-800'}`}>
                        {opt.key}
                      </span>
                      {isCurrent && (
                        <span className="text-[9px] font-black bg-blue-100 text-[#003399] px-1.5 py-0.5 rounded-full">current</span>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-400 leading-tight mt-0.5">{opt.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

// ── Delete Modal ───────────────────────────────────────────────────────────────
const DeleteModal = ({ course, onConfirm, onCancel, loading }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
    <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full">
      <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mb-4">
        <Trash2 className="w-6 h-6 text-red-600" />
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Course?</h3>
      <p className="text-sm text-gray-600 mb-6">
        Delete <strong>{course.title}</strong>? This soft-deletes and hides it from all students.
      </p>
      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-700 text-sm font-medium hover:bg-gray-50 transition-all">Cancel</button>
        <button onClick={onConfirm} disabled={loading} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-60 transition-all">
          {loading ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </div>
  </div>
);

// ── Pagination ─────────────────────────────────────────────────────────────────
const Pagination = ({ page, totalPages, total, pageSize, onPageChange }) => {
  if (totalPages <= 1) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
    .reduce((acc, p, i, arr) => {
      if (i > 0 && p - arr[i - 1] > 1) acc.push('…');
      acc.push(p);
      return acc;
    }, []);

  return (
    <div className="px-6 py-4 bg-white border-t border-slate-100 flex items-center justify-between">
      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
        Showing {from}–{to} of {total} courses
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="p-1.5 rounded-lg border border-slate-100 text-slate-400 hover:border-[#003399]/30 hover:text-[#003399] disabled:opacity-40 transition-all"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        {pages.map((p, i) =>
          p === '…'
            ? <span key={`e${i}`} className="px-1.5 text-slate-300 text-xs">…</span>
            : <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`w-7 h-7 rounded-lg text-xs font-black transition-all ${p === page ? 'bg-[#003399] text-white shadow-md' : 'border border-slate-100 text-slate-500 hover:border-[#003399]/30 hover:text-[#003399]'}`}
            >{p}</button>
        )}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="p-1.5 rounded-lg border border-slate-100 text-slate-400 hover:border-[#003399]/30 hover:text-[#003399] disabled:opacity-40 transition-all"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

// ── Course Row ─────────────────────────────────────────────────────────────────
const CourseRow = ({ course, index, page, onEdit, onDelete, onAnalytics, onViewEnrollments, onStatusChange, changingStatus, onCloseRegistration, onComments }) => {
  const sNo = (page - 1) * PAGE_SIZE + index + 1;

  const levelColor = {
    Beginner: 'bg-green-50 text-green-700',
    Intermediate: 'bg-blue-50 text-blue-700',
    Advanced: 'bg-purple-50 text-purple-700',
  }[course.level] || 'bg-gray-50 text-gray-600';

  const colleges = course.collegeIds?.length > 0
    ? course.collegeIds
    : course.collegeId ? [course.collegeId] : [];
  const platWide = colleges.length === 0;

  const regClosed = course.isRegistrationClosed ||
    (course.registrationDeadline && new Date() > new Date(course.registrationDeadline));

  const actions = [
    { label: 'View Enrollments', icon: Users,         onClick: () => onViewEnrollments(course._id) },
    { label: 'Analytics',         icon: BarChart3,     onClick: () => onAnalytics(course._id) },
    { label: 'Comments',          icon: MessageSquare, onClick: () => onComments(course), color: 'text-indigo-600 hover:bg-indigo-50' },
    { label: 'Edit',              icon: SquarePen,     onClick: () => onEdit(course._id) },
    ...(!regClosed ? [{ label: 'Close Registration', icon: Lock, onClick: () => onCloseRegistration(course) }] : []),
    { label: 'Delete',            icon: Trash2,        onClick: () => onDelete(course), variant: 'danger' },
  ];

  return (
    <tr className="hover:bg-slate-50/30 transition-colors group">
      {/* S.No */}
      <td className="px-3 py-3 text-xs font-bold text-slate-400 w-12">
        {String(sNo).padStart(2, '0')}
      </td>

      {/* Course */}
      <td className="px-3 py-3 min-w-[140px]">
        <div className="flex items-center gap-3">
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-800 truncate max-w-[180px]">{course.title}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <p className="text-[11px] text-slate-400">{course.category}</p>
              {regClosed && (
                <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-orange-600 bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded-full">
                  <Lock className="w-2 h-2" /> Reg. Closed
                </span>
              )}
            </div>
          </div>
        </div>
      </td>

      {/* Level */}
      <td className="px-3 py-3">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${levelColor}`}>{course.level}</span>
      </td>

      {/* Status */}
      <td className="px-3 py-3">
        <StatusDropdown
          course={course}
          onStatusChange={onStatusChange}
          changing={changingStatus === course._id}
        />
      </td>

      {/* Scope */}
      <td className="px-3 py-3">
        {platWide ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 border border-green-100 px-2 py-0.5 rounded-full">
            <Globe className="w-2.5 h-2.5" /> Platform
          </span>
        ) : colleges.length === 1 ? (
          <span className="inline-flex items-center gap-1 text-[10px] text-slate-600">
            <Building2 className="w-2.5 h-2.5 text-slate-400" />
            <span className="truncate max-w-[80px]">{colleges[0]?.name || 'College'}</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[10px] text-slate-600">
            <Building2 className="w-2.5 h-2.5 text-slate-400" />
            {colleges.length} colleges
          </span>
        )}
      </td>

      {/* Enrolled */}
      <td className="px-3 py-3 text-sm font-bold text-slate-700 text-center w-20">
        {course.enrollmentCount ?? 0}
      </td>

      {/* Duration */}
      <td className="px-3 py-3 text-xs text-slate-500 w-20">
        {course.duration?.hours ? `${course.duration.hours}h` : '—'}
      </td>

      {/* Rating */}
      <td className="px-3 py-3 text-xs text-slate-500 w-16">
        {typeof course.rating === 'number' ? course.rating.toFixed(1) :
          (course.rating && !isNaN(Number(course.rating)) ? Number(course.rating).toFixed(1) : '—')}
      </td>

      {/* Actions */}
      <td className="px-3 py-3 text-center w-16">
        <ActionMenu actions={actions} />
      </td>
    </tr>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────
const SuperAdminCourseManagement = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [changingStatus, setChangingStatus] = useState(null);
  const [toast, setToast] = useState(null);
  const [closeRegConfirm, setCloseRegConfirm] = useState(null);
  const [closingReg, setClosingReg] = useState(false);

  // ── Comments drawer ────────────────────────────────────────────────────────
  const [commentsCourse,  setCommentsCourse]  = useState(null);
  const [comments,        setComments]        = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError,   setCommentsError]   = useState('');
  const [deletingId,      setDeletingId]      = useState(null);

  const openComments = async (course) => {
    setCommentsCourse(course);
    setComments([]);
    setCommentsError('');
    setCommentsLoading(true);
    try {
      const res = await commentAPI.getAdminCourseComments(course._id);
      if (res.success) setComments(res.data || []);
      else setCommentsError(res.message || 'Failed to load comments');
    } catch (e) {
      setCommentsError(e.message || 'Failed to load comments');
    } finally {
      setCommentsLoading(false);
    }
  };

  const closeComments = () => { setCommentsCourse(null); setComments([]); };

  const handleDeleteComment = async (commentId) => {
    setDeletingId(commentId);
    try {
      const res = await commentAPI.deleteAnyComment(commentId);
      if (res.success) setComments(prev => prev.filter(c => c._id !== commentId));
      else showToast(res.message || 'Failed to delete', 'error');
    } catch (e) {
      showToast(e.message || 'Failed to delete', 'error');
    }
    setDeletingId(null);
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (search) params.search = search;
      if (categoryFilter) params.category = categoryFilter;
      if (statusFilter) params.status = statusFilter;
      const query = new URLSearchParams(params).toString();
      const res = await apiCall(`/super-admin/courses${query ? '?' + query : ''}`);
      if (res.success) setCourses(res.data || []);
      else setError(res.message || 'Failed to load courses');
    } catch (err) {
      setError(err.message || 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, statusFilter]);

  useEffect(() => {
    const t = setTimeout(fetchCourses, search ? 400 : 0);
    return () => clearTimeout(t);
  }, [fetchCourses]);

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      const res = await apiCall(`/super-admin/courses/${deleteConfirm._id}`, { method: 'DELETE' });
      if (res.success) {
        showToast('Course deleted');
        setCourses(p => p.filter(c => c._id !== deleteConfirm._id));
        setDeleteConfirm(null);
      } else showToast(res.message || 'Delete failed', 'error');
    } catch (err) {
      showToast(err.message || 'Delete failed', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleStatusChange = async (course, newStatus) => {
    if (newStatus === course.status) return;
    setChangingStatus(course._id);
    try {
      const collegeIds = course.collegeIds?.map(c => c._id || c) ||
        (course.collegeId ? [course.collegeId._id || course.collegeId] : []);
      const res = await apiCall(`/super-admin/courses/${course._id}`, { method: 'PATCH', body: JSON.stringify({ status: newStatus, collegeIds }) });
      if (res.success) {
        setCourses(p => p.map(c => c._id === course._id ? { ...c, status: newStatus } : c));
        showToast(`"${course.title}" → ${newStatus}`);
      } else showToast(res.message || 'Update failed', 'error');
    } catch (err) {
      showToast(err.message || 'Update failed', 'error');
    } finally {
      setChangingStatus(null);
    }
  };

  const ALL_STATUSES = ['Draft', 'Coming Soon', 'Active', 'Inactive'];

  const handleCloseRegistration = async () => {
    if (!closeRegConfirm) return;
    setClosingReg(true);
    try {
      const res = await apiCall(`/super-admin/courses/${closeRegConfirm._id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isRegistrationClosed: true }),
      });
      if (res.success) {
        showToast(`Registration closed for "${closeRegConfirm.title}"`);
        setCourses(p => p.map(c =>
          c._id === closeRegConfirm._id ? { ...c, isRegistrationClosed: true } : c
        ));
        setCloseRegConfirm(null);
      } else showToast(res.message || 'Failed to close registration', 'error');
    } catch (err) {
      showToast(err.message || 'Failed to close registration', 'error');
    } finally {
      setClosingReg(false);
    }
  };

  const stats = {
    total: courses.length,
    active: courses.filter(c => c.status === 'Active').length,
    inactive: courses.filter(c => c.status === 'Inactive').length,
  };

  const totalPages = Math.max(1, Math.ceil(courses.length / PAGE_SIZE));
  const paginated = courses.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (loading && courses.length === 0)
    return <TableSkeleton layout={SuperAdminDashboardLayout} />;

  return (
    <SuperAdminDashboardLayout>
      <div className="px-6 py-4 md:px-8 md:py-6 space-y-5 font-sans">

        {/* Toast */}
        {toast && (
          <div className={`fixed top-5 right-5 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-medium transition-all ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
            {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CircleCheck className="w-4 h-4" />}
            {toast.msg}
          </div>
        )}

        {/* Delete Modal */}
        {deleteConfirm && (
          <DeleteModal
            course={deleteConfirm}
            onConfirm={handleDelete}
            onCancel={() => setDeleteConfirm(null)}
            loading={deleting}
          />
        )}

        {/* Close Registration Modal */}
        {closeRegConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full">
              <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center mb-4">
                <Lock className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Close Registration?</h3>
              <p className="text-sm text-gray-600 mb-2">
                Close registration for <strong>{closeRegConfirm.title}</strong>?
              </p>
              <p className="text-xs text-gray-400 mb-6">
                No new students can enroll after this. Once closed, you can create a Course Group from the <strong>Groups</strong> page.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setCloseRegConfirm(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-700 text-sm font-medium hover:bg-gray-50 transition-all">Cancel</button>
                <button onClick={handleCloseRegistration} disabled={closingReg} className="flex-1 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-medium hover:bg-orange-600 disabled:opacity-60 transition-all">
                  {closingReg ? 'Closing...' : 'Close Registration'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span className="w-2 h-8 bg-gradient-to-b from-[#003399] to-[#00A9CE] rounded-full" />
                Course Management
              </h1>
              <p className="text-sm text-slate-400 mt-1 font-medium">
                Manage and monitor all platform courses — {stats.total} total
              </p>
            </div>
            <button
              onClick={() => navigate('/dashboard/super-admin/courses/create')}
              className="w-full md:w-auto inline-flex items-center justify-center gap-2 bg-[#003399] text-white text-[11px] font-black uppercase tracking-wider px-6 py-3 rounded-xl hover:bg-[#002d8b] transition-all shadow-lg shadow-blue-500/10 active:scale-95"
            >
              <Plus className="w-4 h-4" /> Create Course
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[280px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
              <input
                type="text"
                placeholder="Search title, category, instructor..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-9 pr-4 py-2.5 text-xs font-bold border border-slate-100 rounded-xl focus:outline-none focus:border-[#003399]/30 bg-white"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}
              className="pl-4 pr-10 py-2.5 text-xs font-black uppercase tracking-wider border border-slate-100 rounded-xl focus:outline-none focus:border-[#003399]/30 bg-white appearance-none cursor-pointer text-slate-600 min-w-[160px]"
            >
              <option value="">All Categories</option>
              {CATEGORIES.filter(Boolean).map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              className="pl-4 pr-10 py-2.5 text-xs font-black uppercase tracking-wider border border-slate-100 rounded-xl focus:outline-none focus:border-[#003399]/30 bg-white appearance-none cursor-pointer text-slate-600 min-w-[140px]"
            >
              <option value="">All Statuses</option>
              {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Table Card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

          {/* Table Header Row */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
              {courses.length} Courses
            </span>
            <button
              onClick={() => navigate('/dashboard/super-admin/courses/assign-batch')}
              className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[#003399] hover:text-[#002d8b] transition-colors"
            >
              <Send className="w-3.5 h-3.5" /> Assign to Batch
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <RefreshCw className="w-6 h-6 text-[#003399] animate-spin" />
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <BookOpen className="w-7 h-7 text-slate-300" />
              </div>
              <p className="text-slate-500 font-medium text-sm">No courses found</p>
              <p className="text-slate-400 text-xs mt-1">
                {search || categoryFilter || statusFilter ? 'Try adjusting your filters' : 'Create your first course to get started'}
              </p>
              <button
                onClick={() => navigate('/dashboard/super-admin/courses/create')}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#003399] text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-[#002d8b] transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> Create Course
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-3 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left w-12">S.No</th>
                    <th className="px-3 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Course</th>
                    <th className="px-3 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left w-24">Level</th>
                    <th className="px-3 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left w-32">Status</th>
                    <th className="px-3 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left w-32">Scope</th>
                    <th className="px-3 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-20">Enrolled</th>
                    <th className="px-3 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left w-20">Duration</th>
                    <th className="px-3 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left w-16">Rating</th>
                    <th className="px-3 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-16">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginated.map((course, index) => (
                    <CourseRow
                      key={course._id}
                      course={course}
                      index={index}
                      page={page}
                      onEdit={id => navigate(`/dashboard/super-admin/courses/edit/${id}`)}
                      onDelete={setDeleteConfirm}
                      onAnalytics={id => navigate(`/dashboard/super-admin/courses/${id}/analytics`)}
                      onViewEnrollments={id => navigate(`/dashboard/super-admin/courses/${id}/enrollments`)}
                      onStatusChange={handleStatusChange}
                      changingStatus={changingStatus}
                      onCloseRegistration={setCloseRegConfirm}
                      onComments={openComments}
                    />
                  ))}
                </tbody>
              </table>
              <Pagination
                page={page}
                totalPages={totalPages}
                total={courses.length}
                pageSize={PAGE_SIZE}
                onPageChange={setPage}
              />
            </div>
          )}
        </div>

      </div>

      {/* ── Comments Drawer ─────────────────────────────────────────────── */}
      {commentsCourse && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={closeComments} />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-slide-in-right">
            {/* Header */}
            <div className="flex items-start justify-between p-5 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <MessageSquare className="w-4 h-4 text-indigo-600" />
                  <h2 className="text-sm font-black text-slate-800">Student Comments</h2>
                  {comments.length > 0 && (
                    <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                      {comments.length}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 truncate max-w-[300px]">{commentsCourse.title}</p>
              </div>
              <button onClick={closeComments} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {commentsLoading ? (
                <div className="flex justify-center py-10">
                  <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin" />
                </div>
              ) : commentsError ? (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-600">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {commentsError}
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  <p className="text-xs font-semibold">No comments yet for this course.</p>
                </div>
              ) : (
                comments.map((c) => {
                  const name  = c.student_id?.fullName || 'Student';
                  const email = c.student_id?.email || '';
                  const role  = c.student_id?.role || '';
                  const date  = c.created_at
                    ? new Date(c.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                    : '';
                  return (
                    <div key={c._id} className="flex gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 group">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 text-[12px] font-black text-indigo-600 uppercase">
                        {name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-1.5 flex-wrap mb-0.5">
                          <span className="text-xs font-bold text-slate-800">{name}</span>
                          {role && (
                            <span className="text-[10px] text-slate-400 capitalize bg-slate-100 px-1.5 py-0.5 rounded-full">{role}</span>
                          )}
                          {date && <span className="text-[10px] text-slate-400 ml-auto">{date}</span>}
                        </div>
                        {email && <p className="text-[10px] text-slate-400 mb-1">{email}</p>}
                        <p className="text-xs text-slate-600 leading-relaxed break-words">{c.comment}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteComment(c._id)}
                        disabled={deletingId === c._id}
                        className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-100 text-slate-300 hover:text-red-500 transition-all disabled:opacity-50"
                        title="Delete comment"
                      >
                        {deletingId === c._id
                          ? <RefreshCw className="w-3 h-3 animate-spin" />
                          : <Trash2 className="w-3 h-3" />}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slide-in-right {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
        .animate-slide-in-right { animation: slide-in-right 0.25s cubic-bezier(0.16,1,0.3,1) forwards; }
      `}</style>
    </SuperAdminDashboardLayout>
  );
};

export default SuperAdminCourseManagement;