// pages/SuperAdmin/Courses/SuperAdminCourseManagement.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, Plus, Search, SquarePen, Trash2, BarChart3, Users,
  RefreshCw, AlertCircle, CircleCheck, Clock, X, Send, Star,
  Globe, Building2, ChevronLeft, ChevronRight, ChevronDown,
  FileEdit, Hourglass, CheckCircle2, XCircle,
} from 'lucide-react';
import SuperAdminDashboardLayout from '../../../components/layout/SuperAdminDashboardLayout';
import { TableSkeleton } from '../../../components/common/SkeletonLoader';
import { superAdminCourseAPI } from '../../../api/Api';

const CATEGORIES = [
  '', 'Full Stack Development', 'Data Science', 'AI/ML', 'DevOps',
  'Cloud Computing', 'Mobile Development', 'Cybersecurity', 'Blockchain', 'Other',
];
const PAGE_SIZE = 10;

// ── Status config — matches reference image style ──────────────────────────
const STATUS_OPTIONS = [
  {
    key:   'Draft',
    icon:  FileEdit,
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    dot:   'bg-amber-400',
    row:   'hover:bg-amber-50',
    desc:  'Not visible to students',
  },
  {
    key:   'Coming Soon',
    icon:  Hourglass,
    badge: 'bg-violet-50 text-violet-700 border-violet-200',
    dot:   'bg-violet-500',
    row:   'hover:bg-violet-50',
    desc:  'Visible, auto-activates on start date',
  },
  {
    key:   'Active',
    icon:  CheckCircle2,
    badge: 'bg-green-50 text-green-700 border-green-200',
    dot:   'bg-green-500',
    row:   'hover:bg-green-50',
    desc:  'Enrollable by students',
  },
  {
    key:   'Inactive',
    icon:  XCircle,
    badge: 'bg-red-50 text-red-500 border-red-200',
    dot:   'bg-red-400',
    row:   'hover:bg-red-50',
    desc:  'Hidden from all students',
  },
];

const getStatusCfg = (status) =>
  STATUS_OPTIONS.find(s => s.key === status) || STATUS_OPTIONS[0];

// ── Status Dropdown — uses fixed positioning via getBoundingClientRect
// This renders OUTSIDE every overflow/scroll container so it's never clipped.
const StatusDropdown = ({ course, onStatusChange, changing }) => {
  const [open, setOpen]     = useState(false);
  const [pos, setPos]       = useState({ top: 0, left: 0, openUp: false });
  const triggerRef          = useRef(null);
  const dropdownRef         = useRef(null);
  const cfg                 = getStatusCfg(course.status);
  const Icon                = cfg.icon;

  const openDropdown = () => {
    if (changing) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const dropH = 260; // approximate dropdown height
    const openUp = spaceBelow < dropH;
    setPos({
      left: rect.left,
      top:  openUp ? rect.top - dropH - 4 : rect.bottom + 4,
      openUp,
    });
    setOpen(true);
  };

  // Close on outside click or scroll
  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target) &&
        triggerRef.current  && !triggerRef.current.contains(e.target)
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
      {/* Trigger pill */}
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

      {/* Portal dropdown — fixed to viewport, never clipped */}
      {open && typeof document !== 'undefined' && ReactDOM.createPortal(
        <div
          ref={dropdownRef}
          style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999, width: 224 }}
          className="bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="px-3.5 pt-3 pb-2 border-b border-gray-50">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Change Status</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Draft → Coming Soon → Active → Inactive</p>
          </div>
          {/* Options */}
          <div className="py-1.5">
            {STATUS_OPTIONS.map(opt => {
              const OptionIcon = opt.icon;
              const isCurrent  = opt.key === course.status;
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
                      <span className={`text-xs font-bold ${isCurrent ? 'text-blue-600' : 'text-gray-800'}`}>
                        {opt.key}
                      </span>
                      {isCurrent && (
                        <span className="text-[9px] font-black bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">current</span>
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
        <button onClick={onCancel} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-700 text-sm font-medium hover:bg-gray-50">Cancel</button>
        <button onClick={onConfirm} disabled={loading} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-60">
          {loading ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </div>
  </div>
);

// ── Course Row ─────────────────────────────────────────────────────────────────
const CourseRow = ({ course, onEdit, onDelete, onAnalytics, onViewEnrollments, onStatusChange, changingStatus }) => {
  const levelColor = {
    Beginner:     'bg-green-50 text-green-700',
    Intermediate: 'bg-blue-50 text-blue-700',
    Advanced:     'bg-purple-50 text-purple-700',
  }[course.level] || 'bg-gray-50 text-gray-600';

  // Support both new collegeIds[] and legacy collegeId
  const colleges = course.collegeIds?.length > 0
    ? course.collegeIds
    : course.collegeId ? [course.collegeId] : [];
  const platWide = colleges.length === 0;

  return (
    <tr className="hover:bg-gray-50/80 transition-colors border-b border-gray-50 last:border-0">
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 text-sm truncate max-w-[160px]">{course.title}</p>
            <p className="text-xs text-gray-400">{course.category}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${levelColor}`}>{course.level}</span>
      </td>
      <td className="px-4 py-3.5">
        <StatusDropdown
          course={course}
          onStatusChange={onStatusChange}
          changing={changingStatus === course._id}
        />
      </td>
      <td className="px-4 py-3.5">
        {platWide ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 border border-green-100 px-2 py-0.5 rounded-full">
            <Globe className="w-3 h-3" /> Platform-wide
          </span>
        ) : colleges.length === 1 ? (
          <span className="inline-flex items-center gap-1 text-xs text-gray-600">
            <Building2 className="w-3.5 h-3.5 text-gray-400" />
            <span className="truncate max-w-[90px]">{colleges[0]?.name || 'College'}</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs text-blue-600 font-medium">
            <Building2 className="w-3.5 h-3.5" /> {colleges.length} colleges
          </span>
        )}
      </td>
      <td className="px-4 py-3.5 text-sm text-gray-600">{course.enrollmentCount || 0}</td>
      <td className="px-4 py-3.5">
        <span className="inline-flex items-center gap-1 text-sm text-gray-600">
          <Clock className="w-3.5 h-3.5 text-gray-400" />{course.duration?.hours}h
        </span>
      </td>
      <td className="px-4 py-3.5">
        {course.rating?.count > 0
          ? <span className="flex items-center gap-1 text-sm text-gray-600"><Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />{course.rating.average?.toFixed(1)}</span>
          : <span className="text-xs text-gray-400">—</span>}
      </td>
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-1">
          <button onClick={() => onEdit(course._id)} title="Edit" className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"><SquarePen className="w-3.5 h-3.5" /></button>
          <button onClick={() => onViewEnrollments(course._id)} title="Enrollments" className="p-1.5 rounded-lg text-gray-400 hover:text-cyan-600 hover:bg-cyan-50 transition-colors"><Users className="w-3.5 h-3.5" /></button>
          <button onClick={() => onAnalytics(course._id)} title="Analytics" className="p-1.5 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"><BarChart3 className="w-3.5 h-3.5" /></button>
          <button onClick={() => onDelete(course)} title="Delete" className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      </td>
    </tr>
  );
};

// ── Pagination ─────────────────────────────────────────────────────────────────
const Pagination = ({ page, totalPages, total, pageSize, onPageChange }) => {
  if (totalPages <= 1) return null;
  const from = (page - 1) * pageSize + 1;
  const to   = Math.min(page * pageSize, total);
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1);
  const items = pages.reduce((acc, p, i, arr) => {
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
          className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed">
          <ChevronLeft className="w-4 h-4" />
        </button>
        {items.map((p, i) => p === '…'
          ? <span key={`e${i}`} className="px-1.5 text-gray-400 text-sm">…</span>
          : <button key={p} onClick={() => onPageChange(p)}
              className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${p === page ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white' : 'border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600'}`}>
              {p}
            </button>
        )}
        <button onClick={() => onPageChange(page + 1)} disabled={page === totalPages}
          className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// ══ Main Component ════════════════════════════════════════════════════════════
const SuperAdminCourseManagement = () => {
  const navigate = useNavigate();
  const [courses, setCourses]               = useState([]);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState('');
  const [search, setSearch]                 = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter]     = useState('');
  const [deleteConfirm, setDeleteConfirm]   = useState(null);
  const [deleting, setDeleting]             = useState(false);
  const [changingStatus, setChangingStatus] = useState(null);
  const [toast, setToast]                   = useState(null);
  const [page, setPage]                     = useState(1);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchCourses = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = { limit: 500 };
      if (categoryFilter) params.category = categoryFilter;
      if (statusFilter)   params.status   = statusFilter;
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
            c.collegeIds?.some(col => col?.name?.toLowerCase().includes(q)) ||
            c.collegeId?.name?.toLowerCase().includes(q)
          );
        }
        setCourses(list); setPage(1);
      } else setError(res.message || 'Failed to load courses');
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
        showToast('Course deleted');
        setCourses(p => p.filter(c => c._id !== deleteConfirm._id));
        setDeleteConfirm(null);
      } else showToast(res.message || 'Delete failed', 'error');
    } catch (err) { showToast(err.message || 'Delete failed', 'error'); }
    finally { setDeleting(false); }
  };

  const handleStatusChange = async (course, newStatus) => {
    if (newStatus === course.status) return;
    setChangingStatus(course._id);
    try {
      // collegeIds — support both new array field and legacy single field
      const collegeIds = course.collegeIds?.map(c => c._id || c) ||
                         (course.collegeId ? [course.collegeId._id || course.collegeId] : []);
      // Uses /api/courses/:id — NOT /super-admin/courses/:id
      const res = await superAdminCourseAPI.updateCourse(course._id, { status: newStatus, collegeIds });
      if (res.success) {
        setCourses(p => p.map(c => c._id === course._id ? { ...c, status: newStatus } : c));
        showToast(`"${course.title}" → ${newStatus}`);
      } else showToast(res.message || 'Update failed', 'error');
    } catch (err) { showToast(err.message || 'Update failed', 'error'); }
    finally { setChangingStatus(null); }
  };

  const ALL_STATUSES = ['Draft', 'Coming Soon', 'Active', 'Inactive'];

  const stats = {
    total:        courses.length,
    active:       courses.filter(c => c.status === 'Active').length,
    draft:        courses.filter(c => c.status === 'Draft').length,
    comingSoon:   courses.filter(c => c.status === 'Coming Soon').length,
    inactive:     courses.filter(c => c.status === 'Inactive').length,
    platformWide: courses.filter(c => !c.collegeIds?.length && !c.collegeId).length,
    enrollments:  courses.reduce((s, c) => s + (c.enrollmentCount || 0), 0),
  };

  const totalPages = Math.max(1, Math.ceil(courses.length / PAGE_SIZE));
  const paginated  = courses.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (loading && courses.length === 0)
    return <TableSkeleton layout={SuperAdminDashboardLayout} />;

  return (
    <SuperAdminDashboardLayout>

      {toast && (
        <div className={`fixed top-5 right-5 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-medium ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CircleCheck className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}
      {deleteConfirm && <DeleteModal course={deleteConfirm} onConfirm={handleDelete} onCancel={() => setDeleteConfirm(null)} loading={deleting} />}

      {/* Hero */}
      <div className="relative bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 rounded-2xl px-5 py-4 mb-4 shadow-xl shadow-blue-500/20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-10 -right-10 w-44 h-44 bg-white/10 rounded-full" />
          <div className="absolute -bottom-8 left-1/3 w-28 h-28 bg-white/10 rounded-full" />
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle,white 1px,transparent 1px)', backgroundSize: '18px 18px' }} />
        </div>
        <div className="relative flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-black text-lg leading-tight">Course Management</h1>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                {[
                  { label: `${stats.active} Active`,         color: 'bg-green-400/30 text-green-100'   },
                  { label: `${stats.comingSoon} Coming Soon`, color: 'bg-violet-400/30 text-violet-100' },
                  { label: `${stats.draft} Draft`,           color: 'bg-white/20 text-blue-100'        },
                  { label: `${stats.inactive} Inactive`,     color: 'bg-red-400/20 text-red-200'       },
                  { label: `${stats.platformWide} Platform`, color: 'bg-cyan-400/20 text-cyan-100'     },
                  { label: `${stats.enrollments} Enrolled`,  color: 'bg-white/20 text-blue-100'        },
                ].map(chip => (
                  <span key={chip.label} className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${chip.color}`}>{chip.label}</span>
                ))}
              </div>
            </div>
          </div>
          <button onClick={() => navigate('/dashboard/super-admin/courses/create')}
            className="inline-flex items-center gap-1.5 bg-white text-blue-600 text-xs font-bold px-4 py-2.5 rounded-xl shadow-md hover:bg-blue-50 hover:scale-105 transition-all flex-shrink-0">
            <Plus className="w-4 h-4" /> Create Course
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-3 mb-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search title, category, instructor, college..." value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 text-sm" />
            {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>}
          </div>
          <select value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}
            className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 text-sm text-gray-700">
            <option value="">All Categories</option>
            {CATEGORIES.filter(Boolean).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 text-sm text-gray-700">
            <option value="">All Statuses</option>
            {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button onClick={fetchCourses}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl hover:opacity-90 transition-all shadow-sm">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" /><p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Table — overflow-visible so upward dropdowns aren't clipped */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
          <p className="font-semibold text-gray-800">{courses.length} Courses</p>
          <button onClick={() => navigate('/dashboard/super-admin/courses/assign-batch')}
            className="flex items-center gap-1.5 text-sm text-blue-600 font-medium hover:text-blue-700">
            <Send className="w-4 h-4" /> Assign to Batch
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><RefreshCw className="w-6 h-6 text-blue-500 animate-spin" /></div>
        ) : courses.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <BookOpen className="w-7 h-7 text-blue-300" />
            </div>
            <p className="text-gray-500 font-medium">No courses found</p>
            <button onClick={() => navigate('/dashboard/super-admin/courses/create')}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">
              <Plus className="w-4 h-4" /> Create Course
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-gray-100">
                  {['Course', 'Level', 'Status', 'Scope', 'Enrolled', 'Duration', 'Rating', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide first:px-5">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
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
            <Pagination page={page} totalPages={totalPages} total={courses.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
          </div>
        )}
      </div>

    </SuperAdminDashboardLayout>
  );
};

export default SuperAdminCourseManagement;