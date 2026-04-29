// pages/CollegeAdmin/Assessments/AssessmentManagement.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, SquarePen, Trash2, ChartBar,
  BookOpen, RefreshCw, AlertCircle, CircleCheck,
  Clock, Target, ListChecks, Users,
  ChevronLeft, ChevronRight, Sparkles, ClipboardList,
  CheckCircle2, FileText, Calendar, Ban, Play,
  CalendarCheck, Eye, Hash, Award, X,
} from 'lucide-react';
import CollegeAdminLayout from '../../../components/layout/CollegeAdminLayout';
import { InlineSkeleton } from '../../../components/common/SkeletonLoader';
import ActionMenu from '../../../components/common/ActionMenu';
import { assessmentAPI } from '../../../api/Api';

const STATUS_CONFIG = {
  draft:     { label: 'Draft',     color: 'bg-amber-50 text-amber-700 border-amber-200',   dot: 'bg-amber-400' },
  scheduled: { label: 'Scheduled', color: 'bg-violet-50 text-violet-700 border-violet-200', dot: 'bg-violet-500' },
  active:    { label: 'Active',    color: 'bg-[#003399]/5 text-[#003399] border-[#003399]/20',       dot: 'bg-[#003399] animate-pulse' },
  completed: { label: 'Completed', color: 'bg-green-50 text-green-700 border-green-200',   dot: 'bg-green-500' },
  cancelled: { label: 'Cancelled', color: 'bg-red-50 text-red-500 border-red-200',         dot: 'bg-red-400' },
};

const STATUS_FILTERS = [
  { value: '',          label: 'All' },
  { value: 'draft',     label: 'Draft' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'active',    label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const LEVEL_COLOR = {
  Beginner:     'bg-[#003399]/5 text-[#003399] border-[#003399]/10',
  Intermediate: 'bg-cyan-50 text-cyan-700 border-cyan-100',
  Advanced:     'bg-indigo-50 text-indigo-700 border-indigo-100',
};

const SOURCE_LABEL = {
  college_admin_manual: 'Manual',
  college_admin_ai:     'AI',
  student_skill_based:  'Skill-Based',
};

const PER_PAGE = 10;

const Pagination = ({ page, totalPages, total, perPage, onPrev, onNext }) => {
  if (totalPages <= 1) return null;
  const from = (page - 1) * perPage + 1;
  const to   = Math.min(page * perPage, total);
  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-white">
      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Showing {from}–{to} of {total}</span>
      <div className="flex items-center gap-1">
        <button onClick={onPrev} disabled={page === 1}
          className="p-1.5 rounded-lg border border-slate-100 text-slate-400 hover:border-[#003399]/30 hover:text-[#003399] disabled:opacity-40 transition-colors">
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        <span className="text-[12px] font-bold text-gray-700 px-2">{page} / {totalPages}</span>
        <button onClick={onNext} disabled={page === totalPages}
          className="p-1.5 rounded-lg border border-slate-100 text-slate-400 hover:border-[#003399]/30 hover:text-[#003399] disabled:opacity-40 transition-colors">
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

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
        className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold rounded-lg bg-[#003399]/5 text-[#003399] border border-[#003399]/20 hover:bg-slate-100 disabled:opacity-40 transition-all">
        <Play className="w-3 h-3" /> Activate
      </button>
    );
  }
  return null;
};

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
      <div className="px-6 py-4 md:px-8 md:py-6 space-y-5 font-sans">

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
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span className="w-2 h-8 bg-gradient-to-b from-[#003399] to-[#00A9CE] rounded-full inline-block flex-shrink-0" />
              Assessment <span className="text-[#003399]">Management</span>
            </h1>
            <p className="text-sm text-slate-400 mt-1 font-medium">
              Create and manage skill assessments for students — {stats.total} total
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={fetchAssessments} title="Refresh"
              className="inline-flex items-center justify-center gap-1.5 bg-white border border-slate-100 text-slate-500 text-xs font-bold px-4 py-2 rounded-xl hover:border-[#003399]/30 hover:text-[#003399] transition-all">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
            <button onClick={() => navigate('/dashboard/college-admin/assessments/generate')}
              className="inline-flex items-center gap-1.5 bg-white border border-[#003399]/20 text-[#003399] hover:bg-slate-50 text-[13px] font-bold px-4 py-2 rounded-xl transition-colors shadow-sm">
              <Sparkles className="w-4 h-4" /> Generate with AI
            </button>
            <button onClick={() => navigate('/dashboard/college-admin/assessments/wizard')}
              className="inline-flex items-center gap-1.5 bg-[#003399] hover:bg-[#002d8b] text-white text-[11px] font-black uppercase tracking-wider px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-500/10 active:scale-95">
              <Plus className="w-4 h-4" /> New Assessment
            </button>
          </div>
        </div>

        {/* ── STAT PILLS ── */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {[
            { label: 'Total', value: stats.total,     bg: 'bg-[#003399]/5 border-[#003399]/10 text-[#003399]' },
            { label: 'Draft', value: stats.draft,     bg: 'bg-amber-50 border-amber-100 text-amber-700' },
            { label: 'Scheduled', value: stats.scheduled, bg: 'bg-violet-50 border-violet-100 text-violet-700' },
            { label: 'Active', value: stats.active,   bg: 'bg-[#003399]/5 border-[#003399]/20 text-[#003399]' },
            { label: 'Completed', value: stats.completed, bg: 'bg-green-50 border-green-100 text-green-700' },
          ].map(s => (
            <div key={s.label}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${s.bg} cursor-pointer hover:shadow-sm transition-all`}
              onClick={() => setStatusFilter(s.label === 'Total' ? '' : s.label.toLowerCase())}>
              <div>
                <p className="text-[20px] font-black tabular-nums leading-none">{s.value}</p>
                <p className="text-[11px] font-bold opacity-70 mt-1 uppercase tracking-wider">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── MAIN PANEL ── */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
          
          {/* Toolbar */}
          <div className="p-4 border-b border-slate-100 flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Search by title, skill, level or tag…" value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 text-xs font-bold border border-slate-100 rounded-xl focus:outline-none focus:border-[#003399]/30 bg-white" />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-gray-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {STATUS_FILTERS.map(f => (
                <button key={f.value}
                  onClick={() => setStatusFilter(f.value)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider border transition-all
                    ${statusFilter === f.value
                      ? 'bg-[#003399] text-white border-[#003399] shadow-md'
                      : 'bg-white text-slate-500 border-slate-100 hover:border-slate-300'}`}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 flex flex-col">
            {loading ? (
              <InlineSkeleton rows={6} className="py-20" />
            ) : filtered.length === 0 ? (
              <div className="text-center py-24">
                <div className="w-16 h-16 bg-[#003399]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-8 h-8 text-[#003399]/40" />
                </div>
                <h3 className="text-lg font-bold text-gray-700 mb-2">No Assessments Found</h3>
                <p className="text-slate-400 text-sm mb-6 max-w-[300px] mx-auto">
                  {search || statusFilter ? 'Try adjusting your search or filter.' : 'Create your first assessment to start evaluating student skills.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full table-fixed">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left w-[60px]">S.No</th>
                      <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left w-[200px]">Assessment</th>
                      <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left w-[120px]">Type</th>
                      <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left w-[220px]">Details</th>
                      <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left w-[130px]">Status</th>
                      <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-[80px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginated.map((a, index) => {
                      const sNo = (page - 1) * PER_PAGE + index + 1;
                      const statusCfg  = STATUS_CONFIG[a.status] || STATUS_CONFIG.draft;
                      const levelColor = LEVEL_COLOR[a.level]    || 'bg-gray-100 text-gray-600 border-gray-200';
                      const qCount     = Array.isArray(a.questions_id) ? a.questions_id.length : 0;
                      const srcLabel   = SOURCE_LABEL[a.source_type] || a.source_type;
                      const canEdit    = ['draft', 'scheduled'].includes(a.status);
                      const canDelete  = ['draft', 'cancelled'].includes(a.status);
                      const canCancel  = ['draft', 'scheduled', 'active'].includes(a.status);
                      const isCompleted = a.status === 'completed';

                      return (
                        <tr key={a._id} className="hover:bg-slate-50/20 transition-colors group">
                          <td className="px-5 py-4 text-xs font-bold text-slate-400">
                            {String(sNo).padStart(2, '0')}
                          </td>
                          <td className="px-5 py-4">
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-slate-800 truncate w-full">
                                {a.title || a.skill_id?.name || a.jd_id?.jobTitle || 'Untitled'}
                              </p>
                              <span className={`inline-flex items-center text-[9px] px-2 py-0.5 rounded-md font-black uppercase tracking-wider border mt-1 ${levelColor}`}>
                                {a.level}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border
                              ${a.source_type === 'college_admin_ai'
                                ? 'bg-indigo-50 text-indigo-600 border-indigo-100'
                                : 'bg-[#003399]/5 text-[#003399] border-[#003399]/10'}`}>
                              {a.source_type === 'college_admin_ai' && <Sparkles className="w-2.5 h-2.5" />}
                              {srcLabel}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                              <span className="flex items-center gap-1 bg-slate-50 px-1.5 py-0.5 rounded-md border border-slate-100">
                                <Hash className="w-2.5 h-2.5 text-[#003399]/40" />{qCount} Qs
                              </span>
                              {a.total_marks > 0 && (
                                <span className="flex items-center gap-1 bg-slate-50 px-1.5 py-0.5 rounded-md border border-slate-100">
                                  <Award className="w-2.5 h-2.5 text-amber-400" />{a.total_marks}m
                                </span>
                              )}
                              {a.duration_minutes && (
                                <span className="flex items-center gap-1 bg-slate-50 px-1.5 py-0.5 rounded-md border border-slate-100">
                                  <Clock className="w-2.5 h-2.5 text-cyan-400" />{a.duration_minutes}min
                                </span>
                              )}
                              <span className="flex items-center gap-1 bg-slate-50 px-1.5 py-0.5 rounded-md border border-slate-100">
                                <Users className="w-2.5 h-2.5 text-indigo-400" />{a.eligible_students?.length || 0}
                              </span>
                            </div>
                            {a.scheduled_date && (
                              <p className="text-[10px] text-[#003399] font-bold mt-1.5 flex items-center gap-1">
                                <Calendar className="w-2.5 h-2.5" />
                                {new Date(a.scheduled_date).toLocaleDateString('en-IN', { day:'2-digit', month:'short' })}
                                {a.start_time && ` · ${a.start_time}`}
                              </p>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex flex-col gap-1.5">
                              <span className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border ${statusCfg.color}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                                {statusCfg.label}
                              </span>
                              <StatusActions assessment={a} onTransition={handleTransition} loading={transitioning === a._id} />
                            </div>
                          </td>
                          <td className="px-5 py-4 text-center">
                            <div className="flex items-center justify-center">
                              <ActionMenu actions={[
                                { label: 'Manage Questions', icon: ListChecks, onClick: () => navigate(`/dashboard/college-admin/assessments/${a._id}/questions`), color: 'text-[#003399] hover:bg-slate-50' },
                                { label: 'View Attempts', icon: ChartBar, onClick: () => navigate(`/dashboard/college-admin/assessments/${a._id}/attempts`), color: 'text-indigo-600 hover:bg-indigo-50' },
                                isCompleted && { label: 'Download Report', icon: FileText, onClick: () => navigate(`/dashboard/college-admin/assessments/${a._id}/attempts`), color: 'text-green-600 hover:bg-green-50' },
                                canEdit && { label: 'Edit', icon: SquarePen, onClick: () => navigate(`/dashboard/college-admin/assessments/${a._id}/edit`), color: 'text-amber-600 hover:bg-amber-50' },
                                canCancel && { label: 'Cancel Assessment', icon: Ban, onClick: () => setCancelConfirm(a._id), color: 'text-orange-600 hover:bg-orange-50' },
                                canDelete && { label: 'Delete', icon: Trash2, onClick: () => setDeleteConfirm(a._id), danger: true },
                              ].filter(Boolean)} />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <Pagination page={page} totalPages={totalPages} total={filtered.length} perPage={PER_PAGE}
            onPrev={() => setPage(p => Math.max(1, p - 1))}
            onNext={() => setPage(p => Math.min(totalPages, p + 1))}
          />
        </div>
      </div>

      {/* Confirmation Modals */}
      {cancelConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 text-center border border-slate-100">
            <div className="w-16 h-16 bg-orange-50 border border-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Ban className="w-8 h-8 text-orange-500" />
            </div>
            <h3 className="font-black text-slate-900 text-xl tracking-tight">Cancel Assessment?</h3>
            <p className="text-slate-400 text-sm mt-2 leading-relaxed">Students will no longer see this assessment. This action cannot be reversed.</p>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setCancelConfirm(null)} className="flex-1 py-3 border border-slate-100 rounded-2xl text-slate-500 hover:bg-slate-50 font-bold text-sm transition-all">Keep It</button>
              <button onClick={() => handleCancel(cancelConfirm)} className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-bold text-sm transition-all shadow-lg shadow-orange-500/20">Cancel Now</button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 text-center border border-slate-100">
            <div className="w-16 h-16 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="font-black text-slate-900 text-xl tracking-tight">Delete Assessment?</h3>
            <p className="text-slate-400 text-sm mt-2 leading-relaxed">This will permanently remove the assessment and all student attempts.</p>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-3 border border-slate-100 rounded-2xl text-slate-500 hover:bg-slate-50 font-bold text-sm transition-all">Keep It</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold text-sm transition-all shadow-lg shadow-red-500/20">Delete Now</button>
            </div>
          </div>
        </div>
      )}
    </CollegeAdminLayout>
  );
};

export default AssessmentManagement;