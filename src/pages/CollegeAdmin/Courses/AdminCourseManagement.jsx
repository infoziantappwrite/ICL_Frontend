// pages/CollegeAdmin/Courses/AdminCourseManagement.jsx
// College Admin: VIEW ONLY — no create, edit, or delete rights
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, Search, BarChart3, Users, RefreshCw,
  AlertCircle, CheckCircle2, Award, X,
  Star, ChevronLeft, ChevronRight, Send, Clock,
  FileEdit, Hourglass, XCircle, MessageSquare, Trash2,
} from 'lucide-react';
import CollegeAdminLayout from '../../../components/layout/CollegeAdminLayout';
import { TableSkeleton } from '../../../components/common/SkeletonLoader';
import ActionMenu from '../../../components/common/ActionMenu';
import { collegeAdminCourseAPI as courseAPI, commentAPI } from '../../../api/Api';

const CATEGORIES = [
  '', 'Full Stack Development', 'Data Science', 'AI/ML', 'DevOps',
  'Cloud Computing', 'Mobile Development', 'Cybersecurity', 'Blockchain', 'Other'
];

const STATUS_OPTIONS = [
  { key: 'Active',      icon: CheckCircle2, badge: 'bg-green-50 text-green-700 border-green-200',   dot: 'bg-green-500'  },
  { key: 'Inactive',    icon: XCircle,      badge: 'bg-red-50 text-red-500 border-red-200',          dot: 'bg-red-400'    },
  { key: 'Draft',       icon: FileEdit,     badge: 'bg-amber-50 text-amber-700 border-amber-200',    dot: 'bg-amber-400'  },
  { key: 'Coming Soon', icon: Hourglass,    badge: 'bg-violet-50 text-violet-700 border-violet-200', dot: 'bg-violet-500' },
];

const getStatusCfg = (status) => STATUS_OPTIONS.find(s => s.key === status) || STATUS_OPTIONS[1];

const LEVEL_COLOR = {
  Beginner:     'bg-green-50 text-green-700',
  Intermediate: 'bg-blue-50 text-blue-700',
  Advanced:     'bg-purple-50 text-purple-700',
};

const PER_PAGE = 10;

const Pagination = ({ page, totalPages, onPageChange, total, perPage }) => {
  if (totalPages <= 1) return null;
  const from  = (page - 1) * perPage + 1;
  const to    = Math.min(page * perPage, total);
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
    .reduce((acc, p, i, arr) => {
      if (i > 0 && p - arr[i - 1] > 1) acc.push('ellipsis_' + i);
      acc.push(p);
      return acc;
    }, []);

  return (
    <div className="px-6 py-4 bg-white border-t border-slate-100 flex items-center justify-between">
      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
        Showing {from}–{to} of {total} courses
      </span>
      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange(page - 1)} disabled={page === 1}
          className="p-1.5 rounded-lg border border-slate-100 text-slate-400 hover:border-[#003399]/30 hover:text-[#003399] disabled:opacity-40 transition-all">
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        {pages.map((p) =>
          typeof p === 'string'
            ? <span key={p} className="px-1.5 text-slate-300 text-xs">…</span>
            : <button key={p} onClick={() => onPageChange(p)}
                className={`w-7 h-7 rounded-lg text-xs font-black transition-all ${p === page ? 'bg-[#003399] text-white shadow-md' : 'border border-slate-100 text-slate-500 hover:border-[#003399]/30 hover:text-[#003399]'}`}>
                {p}
              </button>
        )}
        <button onClick={() => onPageChange(page + 1)} disabled={page === totalPages}
          className="p-1.5 rounded-lg border border-slate-100 text-slate-400 hover:border-[#003399]/30 hover:text-[#003399] disabled:opacity-40 transition-all">
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

const CourseRow = ({ course, index, page, onAnalytics, onViewEnrollments, onComments }) => {
  const cfg        = getStatusCfg(course.status);
  const StatusIcon = cfg.icon;
  const levelColor = LEVEL_COLOR[course.level] || 'bg-gray-50 text-gray-600';
  const sNo        = (page - 1) * PER_PAGE + index + 1;

  return (
    <tr className="hover:bg-slate-50/30 transition-colors group">
      <td className="px-3 py-3 text-xs font-bold text-slate-400 w-12">
        {String(sNo).padStart(2, '0')}
      </td>
      <td className="px-3 py-3 min-w-[160px]">
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-800 truncate max-w-[200px] group-hover:text-[#003399] transition-colors">
            {course.title}
          </p>
          <p className="text-[11px] text-slate-400">{course.category}</p>
        </div>
      </td>
      <td className="px-3 py-3">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${levelColor}`}>
          {course.level}
        </span>
      </td>
      <td className="px-3 py-3">
        <span className={`inline-flex items-center gap-1.5 pl-2 pr-2.5 py-1 rounded-full border text-xs font-semibold ${cfg.badge}`}>
          <StatusIcon className="w-3 h-3 flex-shrink-0" />
          {course.status}
        </span>
      </td>
      <td className="px-3 py-3 w-24">
        <div className="flex items-center gap-1.5">
          <Users size={13} className="text-[#00A9CE]" />
          <span className="text-xs font-black text-slate-700">{course.enrollmentCount || 0}</span>
        </div>
      </td>
      <td className="px-3 py-3 text-xs text-slate-500 w-24">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3 h-3 text-slate-400" />
          {course.duration?.hours ? `${course.duration.hours}h` : '—'}
        </div>
      </td>
      <td className="px-3 py-3 text-xs text-slate-500 w-16">
        {course.rating?.count > 0 ? (
          <span className="flex items-center gap-1 text-xs font-black text-amber-500">
            <Star className="w-3 h-3 fill-amber-500" />
            {course.rating.average?.toFixed(1)}
          </span>
        ) : <span className="text-slate-300">—</span>}
      </td>
      <td className="px-3 py-3 text-center w-16">
        <ActionMenu actions={[
          { label: 'Enrollments', icon: Users,         onClick: () => onViewEnrollments(course._id), color: 'text-cyan-600 hover:bg-cyan-50'    },
          { label: 'Analytics',   icon: BarChart3,     onClick: () => onAnalytics(course._id),       color: 'text-purple-600 hover:bg-purple-50' },
          { label: 'Comments',    icon: MessageSquare, onClick: () => onComments(course),            color: 'text-indigo-600 hover:bg-indigo-50' },
        ]} />
      </td>
    </tr>
  );
};

const AdminCourseManagement = () => {
  const navigate = useNavigate();
  const [courses, setCourses]               = useState([]);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState('');
  const [search, setSearch]                 = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter]     = useState('');
  const [page, setPage]                     = useState(1);

  // ── Comments drawer ────────────────────────────────────────────────────────
  const [commentsCourse,   setCommentsCourse]   = useState(null); // {_id, title}
  const [comments,         setComments]         = useState([]);
  const [commentsLoading,  setCommentsLoading]  = useState(false);
  const [commentsError,    setCommentsError]    = useState('');
  const [deletingId,       setDeletingId]       = useState(null);

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
    } catch (_) {}
    setDeletingId(null);
  };

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { limit: 200 };
      if (categoryFilter) params.category = categoryFilter;
      if (statusFilter)   params.status   = statusFilter;
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
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const stats = {
    total:            courses.length,
    active:           courses.filter(c => c.status === 'Active').length,
    totalEnrollments: courses.reduce((s, c) => s + (c.enrollmentCount || 0), 0),
    withCerts:        courses.filter(c => c.certificateProvided).length,
  };

  if (loading && courses.length === 0) {
    return <TableSkeleton layout={CollegeAdminLayout} />;
  }

  return (
    <CollegeAdminLayout>
      <div className="px-6 py-4 md:px-8 md:py-6 space-y-5 font-sans">

        {/* ── Header ─────────────────────────────────────── */}
        <div className="space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span className="w-2 h-8 bg-gradient-to-b from-[#003399] to-[#00A9CE] rounded-full" />
                Course Management
              </h1>
              <p className="text-sm text-slate-400 mt-1 font-medium">
                {stats.total} total · {stats.active} active · {stats.totalEnrollments} enrollments · {stats.withCerts} with certificates
              </p>
            </div>
            <button
              onClick={() => navigate('/dashboard/college-admin/courses/assign-batch')}
              className="w-full md:w-auto inline-flex items-center justify-center gap-2 bg-[#003399] text-white text-[11px] font-black uppercase tracking-wider px-6 py-3 rounded-xl hover:bg-[#002d8b] transition-all shadow-lg shadow-blue-500/10 active:scale-95"
            >
              <Send className="w-4 h-4" /> Assign to Batch
            </button>
          </div>

          {/* Filters row */}
          <div className="flex flex-wrap items-center gap-3">
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
            <select
              value={categoryFilter}
              onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}
              className="pl-4 pr-10 py-2.5 text-xs font-black uppercase tracking-wider border border-slate-100 rounded-xl focus:outline-none focus:border-[#003399]/30 bg-white appearance-none cursor-pointer text-slate-600 min-w-[160px]"
            >
              <option value="">All Categories</option>
              {CATEGORIES.filter(Boolean).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              className="pl-4 pr-10 py-2.5 text-xs font-black uppercase tracking-wider border border-slate-100 rounded-xl focus:outline-none focus:border-[#003399]/30 bg-white appearance-none cursor-pointer text-slate-600 min-w-[140px]"
            >
              <option value="">All Statuses</option>
              {STATUS_OPTIONS.map(s => <option key={s.key} value={s.key}>{s.key}</option>)}
            </select>
          </div>
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
              {filtered.length} Courses
            </span>
            <div className="flex items-center gap-4">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> {stats.active} Active
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-500" /> {stats.withCerts} Certified
              </span>
            </div>
          </div>

          {/* Table body */}
          {loading ? (
            <div className="flex justify-center py-12">
              <RefreshCw className="w-6 h-6 text-[#003399] animate-spin" />
            </div>
          ) : paginated.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <BookOpen className="w-7 h-7 text-slate-300" />
              </div>
              <p className="text-slate-500 font-medium text-sm">No courses found</p>
              <p className="text-slate-400 text-xs mt-1">
                {search || categoryFilter || statusFilter ? 'Try adjusting your filters' : 'No courses available yet'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-3 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left w-12">S.No</th>
                    <th className="px-3 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Course</th>
                    <th className="px-3 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left w-28">Level</th>
                    <th className="px-3 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left w-36">Status</th>
                    <th className="px-3 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left w-24">Enrolled</th>
                    <th className="px-3 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left w-24">Duration</th>
                    <th className="px-3 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left w-16">Rating</th>
                    <th className="px-3 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-16">Actions</th>
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
                      onComments={openComments}
                    />
                  ))}
                </tbody>
              </table>
              <Pagination
                page={page}
                totalPages={totalPages}
                total={filtered.length}
                perPage={PER_PAGE}
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
    </CollegeAdminLayout>
  );
};

export default AdminCourseManagement;