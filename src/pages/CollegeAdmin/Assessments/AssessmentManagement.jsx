// pages/CollegeAdmin/Assessments/AssessmentManagement.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, SquarePen, Trash2, ChartBar,
  BookOpen, RefreshCw, AlertCircle, CircleCheck,
  Clock, Target, ListChecks, Users,
  ChevronLeft, ChevronRight, Sparkles, ClipboardList,
  CheckCircle2, FileText, Calendar, Ban, Play,
  CalendarCheck, Eye, Hash, Award,
} from 'lucide-react';
import CollegeAdminLayout from '../../../components/layout/CollegeAdminLayout';
import { InlineSkeleton } from '../../../components/common/SkeletonLoader';
import ActionMenu from '../../../components/common/ActionMenu';
import { assessmentAPI } from '../../../api/Api';

/* ─── Status config with the new lifecycle ───────────────────────────── */
const STATUS_CONFIG = {
  draft:     { label: 'Draft',     color: 'bg-amber-50 text-amber-700 border-amber-200',   dot: 'bg-amber-400' },
  scheduled: { label: 'Scheduled', color: 'bg-violet-50 text-violet-700 border-violet-200', dot: 'bg-violet-500' },
  active:    { label: 'Active',    color: 'bg-blue-50 text-blue-700 border-blue-200',       dot: 'bg-blue-500 animate-pulse' },
  completed: { label: 'Completed', color: 'bg-green-50 text-green-700 border-green-200',   dot: 'bg-green-500' },
  cancelled: { label: 'Cancelled', color: 'bg-red-50 text-red-500 border-red-200',         dot: 'bg-red-400' },
};

// Status filter chips shown in the header
const STATUS_FILTERS = [
  { value: '',          label: 'All' },
  { value: 'draft',     label: 'Draft' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'active',    label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const LEVEL_COLOR = {
  Beginner:     'bg-blue-50 text-blue-700 border-blue-100',
  Intermediate: 'bg-cyan-50 text-cyan-700 border-cyan-100',
  Advanced:     'bg-indigo-50 text-indigo-700 border-indigo-100',
};

const SOURCE_LABEL = {
  college_admin_manual: 'Manual',
  college_admin_ai:     'AI',
  student_skill_based:  'Skill-Based',
};

const PER_PAGE = 10;

/* ─── Pagination ─────────────────────────────────────────────────────── */
const Pagination = ({ page, totalPages, total, perPage, onPrev, onNext }) => {
  if (totalPages <= 1) return null;
  const from = (page - 1) * perPage + 1;
  const to   = Math.min(page * perPage, total);
  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/40">
      <span className="text-xs text-gray-400">Showing {from}–{to} of {total}</span>
      <div className="flex items-center gap-2">
        <button onClick={onPrev} disabled={page === 1}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          <ChevronLeft className="w-3.5 h-3.5" /> Prev
        </button>
        <span className="text-xs text-gray-400 px-1 font-mono">{page} / {totalPages}</span>
        <button onClick={onNext} disabled={page === totalPages}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          Next <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

/* ─── Status Action button builder ──────────────────────────────────── */
// Returns CTA buttons based on current status
const StatusActions = ({ assessment, onTransition, loading }) => {
  const s = assessment.status;
  const hasSchedule = assessment.scheduled_date && assessment.start_time && assessment.end_time;

  if (s === 'draft') {
    return (
      <button
        disabled={loading || !hasSchedule}
        title={!hasSchedule ? 'Set schedule first (edit assessment)' : 'Move to Scheduled'}
        onClick={() => onTransition(assessment._id, 'scheduled')}
        className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold rounded-lg bg-violet-50 text-violet-600 border border-violet-200 hover:bg-violet-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
        <CalendarCheck className="w-3 h-3" /> Schedule
      </button>
    );
  }
  if (s === 'scheduled') {
    return (
      <button
        disabled={loading}
        onClick={() => onTransition(assessment._id, 'active')}
        className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold rounded-lg bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 disabled:opacity-40 transition-all">
        <Play className="w-3 h-3" /> Activate
      </button>
    );
  }
  return null;
};

/* ══════════════════════════════════════════════════════════════════════ */
const AssessmentManagement = () => {
  const navigate = useNavigate();
  const [assessments,   setAssessments]   = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState('');
  const [search,        setSearch]        = useState('');
  const [statusFilter,  setStatusFilter]  = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [cancelConfirm, setCancelConfirm] = useState(null);
  const [toast,         setToast]         = useState(null);
  const [transitioning, setTransitioning] = useState(null);
  const [page,          setPage]          = useState(1);

  useEffect(() => { fetchAssessments(); }, []);
  useEffect(() => { setPage(1); }, [search, statusFilter]);

  const fetchAssessments = async () => {
    setLoading(true); setError('');
    try {
      const res = await assessmentAPI.getAllAssessments();
      if (res.success) {
        const sorted = (res.assessments || []).sort(
          (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        );
        setAssessments(sorted);
      } else {
        setError(res.message || 'Failed to load assessments');
      }
    } catch (err) {
      setError(err.message || 'Failed to load assessments');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleTransition = async (id, newStatus) => {
    setTransitioning(id);
    try {
      const res = await assessmentAPI.transitionStatus(id, newStatus);
      if (res.success) {
        showToast(`Assessment moved to "${newStatus}"`);
        setAssessments(prev => prev.map(a => a._id === id ? { ...a, status: newStatus } : a));
      } else {
        showToast(res.message || 'Status change failed', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Status change failed', 'error');
    } finally {
      setTransitioning(null);
    }
  };

  const handleCancel = async (id) => {
    setCancelConfirm(null);
    await handleTransition(id, 'cancelled');
  };

  const handleDelete = async (id) => {
    try {
      const res = await assessmentAPI.deleteAssessment(id);
      if (res.success) {
        showToast('Assessment deleted');
        setAssessments(prev => prev.filter(a => a._id !== id));
      } else {
        showToast(res.message || 'Delete failed', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Delete failed', 'error');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const filtered = assessments.filter(a => {
    if (statusFilter && a.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        (a.title || '').toLowerCase().includes(q) ||
        (a.skill_id?.name || '').toLowerCase().includes(q) ||
        (a.jd_id?.jobTitle || '').toLowerCase().includes(q) ||
        (a.level || '').toLowerCase().includes(q) ||
        (a.tags || []).some(t => t.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // Derived stats
  const stats = {
    total:     assessments.length,
    draft:     assessments.filter(a => a.status === 'draft').length,
    scheduled: assessments.filter(a => a.status === 'scheduled').length,
    active:    assessments.filter(a => a.status === 'active').length,
    completed: assessments.filter(a => a.status === 'completed').length,
    ai:        assessments.filter(a => a.source_type === 'college_admin_ai').length,
  };

  return (
    <CollegeAdminLayout>
      <div className="min-h-screen bg-[#f0f4f8] px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4">
        <div className="max-w-[1400px] mx-auto space-y-3 sm:space-y-4">

        {/* ── Toast ── */}
        {toast && (
          <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-sm font-semibold
            ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
            {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CircleCheck className="w-4 h-4" />}
            {toast.msg}
          </div>
        )}

        {/* ── HEADER ── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
          <div>
            <h1 className="text-[20px] md:text-[26px] font-bold text-gray-900 tracking-tight">
              Assessment <span className="text-blue-600">Management</span>
            </h1>
            <p className="text-[12px] md:text-[14px] text-gray-500 mt-1">
              Create and manage skill assessments for students
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={fetchAssessments} title="Refresh"
              className="inline-flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 text-[13px] font-bold px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors shadow-sm focus:outline-none">
              <RefreshCw className="w-4 h-4" />
            </button>
            <button onClick={() => navigate('/dashboard/college-admin/assessments/generate')}
              className="inline-flex items-center gap-1.5 bg-white border border-blue-200 text-blue-600 hover:bg-blue-50 text-[13px] font-bold px-4 py-2 rounded-lg transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <Sparkles className="w-4 h-4" /> Generate with AI
            </button>
            <button onClick={() => navigate('/dashboard/college-admin/assessments/create')}
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-bold px-4 py-2 rounded-lg transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1">
              <Plus className="w-4 h-4" /> New Assessment
            </button>
          </div>
        </div>

                {/* ── MAIN PANEL ── */}
        <div className="bg-white rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] border border-gray-100 flex flex-col">

          {/* Top Panel - Stats Row */}
          <div className="p-4 border-b border-gray-100 grid grid-cols-2 sm:grid-cols-5 gap-3 bg-gray-50/50">
            {[
              { label: 'Total', value: stats.total,     bg: 'bg-blue-50 border-blue-100 text-blue-700' },
              { label: 'Draft', value: stats.draft,     bg: 'bg-amber-50 border-amber-100 text-amber-700' },
              { label: 'Scheduled', value: stats.scheduled, bg: 'bg-violet-50 border-violet-100 text-violet-700' },
              { label: 'Active', value: stats.active,   bg: 'bg-blue-50 border-blue-200 text-blue-700' },
              { label: 'Completed', value: stats.completed, bg: 'bg-green-50 border-green-100 text-green-700' },
            ].map(s => (
              <div key={s.label}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${s.bg} cursor-pointer hover:shadow-sm transition-all`}
                onClick={() => setStatusFilter(s.label === 'Total' ? '' : s.label.toLowerCase())}>
                <div>
                  <p className="text-[20px] font-bold tabular-nums leading-none text-gray-900">{s.value}</p>
                  <p className="text-[11px] font-bold opacity-70 mt-1 uppercase tracking-wider">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Search + Filter */}
          <div className="p-4 border-b border-gray-100 flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by title, skill, level or tag…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white transition-colors"
              />
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {STATUS_FILTERS.map(f => (
                <button key={f.value}
                  onClick={() => setStatusFilter(f.value)}
                  className={`px-3 py-1.5 rounded-lg text-[13px] font-semibold border transition-all
                    ${statusFilter === f.value
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

        {/* ── Error ── */}
        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        
        {loading ? (
          <InlineSkeleton rows={6} className="py-20" />
        ) : filtered.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-16 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-700 mb-2">No Assessments Found</h3>
            <p className="text-gray-400 text-sm mb-6">
              {search || statusFilter ? 'Try adjusting your search or filter.' : 'Create your first assessment to start evaluating student skills.'}
            </p>
            {!search && !statusFilter && (
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <button onClick={() => navigate('/dashboard/college-admin/assessments/generate')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-blue-200 text-blue-600 rounded-xl font-semibold text-sm hover:bg-blue-50 transition-colors">
                  <Sparkles className="w-4 h-4" /> Generate with AI
                </button>
                <button onClick={() => navigate('/dashboard/college-admin/assessments/create')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl font-semibold text-sm shadow-md shadow-blue-500/20 hover:opacity-90">
                  <Plus className="w-4 h-4" /> Create Assessment
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Table header bar */}
            <div className="px-5 py-3 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-100 rounded-md flex items-center justify-center">
                  <ClipboardList className="w-3 h-3 text-blue-600" />
                </div>
                <p className="font-bold text-gray-800 text-sm">{filtered.length} Assessment{filtered.length !== 1 ? 's' : ''}</p>
              </div>
            </div>

            <div className="flex-1 overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {['Assessment', 'Type', 'Details', 'Status', 'Actions'].map(h => (
                      <th key={h} className="text-left text-[9px] font-black text-gray-400 uppercase tracking-wider px-5 py-3 last:pr-5 last:text-right">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginated.map(a => {
                    const statusCfg  = STATUS_CONFIG[a.status] || STATUS_CONFIG.draft;
                    const levelColor = LEVEL_COLOR[a.level]    || 'bg-gray-100 text-gray-600 border-gray-200';
                    const qCount     = Array.isArray(a.questions_id) ? a.questions_id.length : 0;
                    const srcLabel   = SOURCE_LABEL[a.source_type] || a.source_type;
                    const canEdit    = ['draft', 'scheduled'].includes(a.status);
                    const canDelete  = ['draft', 'cancelled'].includes(a.status);
                    const canCancel  = ['draft', 'scheduled', 'active'].includes(a.status);
                    const isCompleted = a.status === 'completed';

                    return (
                      <tr key={a._id} className="hover:bg-blue-50/20 transition-colors group">

                        {/* Assessment title / skill */}
                        <td className="px-5 py-4 max-w-[200px]">
                          <p className="text-[14px] font-bold text-gray-900 truncate">
                            {a.title || a.skill_id?.name || a.jd_id?.jobTitle || (
                              <span className="text-gray-400 italic font-normal">Untitled</span>
                            )}
                          </p>
                          <span className={`inline-flex items-center text-[10px] px-2 py-0.5 rounded-full font-semibold border mt-1 ${levelColor}`}>
                            {a.level}
                          </span>
                          {a.tags?.length > 0 && (
                            <div className="flex gap-1 flex-wrap mt-1.5">
                              {a.tags.slice(0, 3).map(t => (
                                <span key={t} className="text-[10px] bg-blue-50 text-blue-500 border border-blue-100 px-1.5 py-0.5 rounded-md">{t}</span>
                              ))}
                            </div>
                          )}
                        </td>

                        {/* Type */}
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border
                            ${a.source_type === 'college_admin_ai'
                              ? 'bg-indigo-50 text-indigo-600 border-indigo-100'
                              : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                            {a.source_type === 'college_admin_ai' && <Sparkles className="w-2.5 h-2.5" />}
                            {srcLabel}
                          </span>
                          {a.jd_id && (
                            <p className="text-[10px] text-blue-500 mt-1 truncate max-w-[120px]">{a.jd_id.jobTitle}</p>
                          )}
                        </td>

                        {/* Details */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2 flex-wrap text-xs text-gray-500">
                            <span className="flex items-center gap-1 bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded-md">
                              <Hash className="w-3 h-3 text-blue-400" />{qCount} Qs
                            </span>
                            {a.total_marks > 0 && (
                              <span className="flex items-center gap-1 bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded-md">
                                <Award className="w-3 h-3 text-amber-400" />{a.total_marks}m
                              </span>
                            )}
                            {a.duration_minutes && (
                              <span className="flex items-center gap-1 bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded-md">
                                <Clock className="w-3 h-3 text-cyan-400" />{a.duration_minutes}min
                              </span>
                            )}
                            <span className="flex items-center gap-1 bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded-md">
                              <Users className="w-3 h-3 text-indigo-400" />{a.eligible_students?.length || 0}
                            </span>
                          </div>
                          {a.scheduled_date && (
                            <p className="text-[10px] text-gray-400 mt-1.5 flex items-center gap-1">
                              <Calendar className="w-2.5 h-2.5" />
                              {new Date(a.scheduled_date).toLocaleDateString()}
                              {a.start_time && ` · ${a.start_time}`}
                              {a.end_time && ` – ${a.end_time}`}
                            </p>
                          )}
                        </td>

                        {/* Status + Transition CTA */}
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border ${statusCfg.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                            {statusCfg.label}
                          </span>
                          <div className="mt-1.5">
                            <StatusActions
                              assessment={a}
                              onTransition={handleTransition}
                              loading={transitioning === a._id}
                            />
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4">
                          <ActionMenu actions={[
                            { label: 'Manage Questions', icon: ListChecks, onClick: () => navigate(`/dashboard/college-admin/assessments/${a._id}/questions`), color: 'text-blue-600 hover:bg-blue-50' },
                            { label: 'View Attempts', icon: ChartBar, onClick: () => navigate(`/dashboard/college-admin/assessments/${a._id}/attempts`), color: 'text-indigo-600 hover:bg-indigo-50' },
                            isCompleted && { label: 'Download Report', icon: FileText, onClick: () => navigate(`/dashboard/college-admin/assessments/${a._id}/attempts`), color: 'text-green-600 hover:bg-green-50' },
                            canEdit && { label: 'Edit', icon: SquarePen, onClick: () => navigate(`/dashboard/college-admin/assessments/${a._id}/edit`), color: 'text-amber-600 hover:bg-amber-50' },
                            canCancel && { label: 'Cancel Assessment', icon: Ban, onClick: () => setCancelConfirm(a._id), color: 'text-orange-600 hover:bg-orange-50' },
                            canDelete && { label: 'Delete', icon: Trash2, onClick: () => setDeleteConfirm(a._id), danger: true },
                          ].filter(Boolean)} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <Pagination
              page={page} totalPages={totalPages} total={filtered.length} perPage={PER_PAGE}
              onPrev={() => setPage(p => Math.max(1, p - 1))}
              onNext={() => setPage(p => Math.min(totalPages, p + 1))}
            />
          </div>
        )}
        </div>

        {/* ── Cancel Confirm Modal ── */}
        {cancelConfirm && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
              <div className="text-center mb-5">
                <div className="w-12 h-12 bg-orange-50 border border-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Ban className="w-6 h-6 text-orange-500" />
                </div>
                <h3 className="font-bold text-gray-900 text-lg">Cancel Assessment?</h3>
                <p className="text-gray-400 text-sm mt-1">This will mark the assessment as cancelled. Students will no longer see it. This cannot be undone.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setCancelConfirm(null)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 font-semibold text-sm transition-colors">
                  Keep It
                </button>
                <button onClick={() => handleCancel(cancelConfirm)}
                  className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-sm transition-colors">
                  Cancel Assessment
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Delete Confirm Modal ── */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
              <div className="text-center mb-5">
                <div className="w-12 h-12 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Trash2 className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="font-bold text-gray-900 text-lg">Delete Assessment?</h3>
                <p className="text-gray-400 text-sm mt-1">This will permanently delete the assessment and all associated data.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 font-semibold text-sm transition-colors">
                  Cancel
                </button>
                <button onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm transition-colors">
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </CollegeAdminLayout>
  );
};

export default AssessmentManagement;