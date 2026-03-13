// pages/CollegeAdmin/Assessments/AssessmentManagement.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, SquarePen, Trash2, ChartBar,
  BookOpen, RefreshCw, AlertCircle, CircleCheck,
  Clock, Target, ListChecks, ToggleLeft, ToggleRight, Users,
  ChevronLeft, ChevronRight, Sparkles, ClipboardList,
  TrendingUp, Zap, CheckCircle2, FileText,
} from 'lucide-react';
import CollegeAdminLayout from '../../../components/layout/CollegeAdminLayout';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { assessmentAPI } from '../../../api/Api';

/* ─── status / level config ─────────────────────────────────────────── */
const STATUS_CONFIG = {
  active:   { label: 'Active',   color: 'bg-blue-50 text-blue-700 border-blue-200'  },
  inactive: { label: 'Inactive', color: 'bg-gray-100 text-gray-500 border-gray-200' },
};

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

/* ─── Stat pill (same pattern as Dashboard) ─────────────────────────── */
const StatPill = ({ icon: Icon, label, value, color = 'blue' }) => {
  const c = {
    blue:   'bg-blue-50 border-blue-100 text-blue-600',
    cyan:   'bg-cyan-50 border-cyan-100 text-cyan-600',
    indigo: 'bg-indigo-50 border-indigo-100 text-indigo-600',
    violet: 'bg-violet-50 border-violet-100 text-violet-600',
    green:  'bg-green-50 border-green-100 text-green-600',
    amber:  'bg-amber-50 border-amber-100 text-amber-600',
    gray:   'bg-gray-50 border-gray-200 text-gray-500',
  }[color] || 'bg-blue-50 border-blue-100 text-blue-600';
  return (
    <div className={`flex items-center gap-2 px-3 py-2 border rounded-xl ${c}`}>
      <Icon className="w-4 h-4 flex-shrink-0 opacity-70" />
      <div className="min-w-0">
        <p className="text-sm font-black leading-none">{value}</p>
        <p className="text-[9px] font-medium opacity-60 mt-0.5 leading-none truncate">{label}</p>
      </div>
    </div>
  );
};

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

/* ══════════════════════════════════════════════════════════════════════ */
const AssessmentManagement = () => {
  const navigate = useNavigate();
  const [assessments,   setAssessments]   = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState('');
  const [search,        setSearch]        = useState('');
  const [statusFilter,  setStatusFilter]  = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [toast,         setToast]         = useState(null);
  const [toggling,      setToggling]      = useState(null);
  const [page,          setPage]          = useState(1);

  useEffect(() => { fetchAssessments(); }, []);
  useEffect(() => { setPage(1); }, [search, statusFilter]);

  const fetchAssessments = async () => {
    setLoading(true);
    setError('');
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

  const handleToggleStatus = async (id) => {
    setToggling(id);
    try {
      const res = await assessmentAPI.toggleAssessmentStatus(id);
      if (res.success) {
        showToast(`Assessment marked ${res.status}`);
        setAssessments(prev => prev.map(a => a._id === id ? { ...a, status: res.status } : a));
      } else {
        showToast(res.message || 'Toggle failed', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Toggle failed', 'error');
    } finally {
      setToggling(null);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await assessmentAPI.deleteAssessment(id);
      if (res.success) {
        showToast('Assessment deleted successfully');
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
        (a.skill_id?.name || '').toLowerCase().includes(q) ||
        (a.level || '').toLowerCase().includes(q) ||
        (a.tags || []).some(t => t.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // Derived stats
  const totalActive   = assessments.filter(a => a.status === 'active').length;
  const totalInactive = assessments.filter(a => a.status === 'inactive').length;
  const totalAI       = assessments.filter(a => a.source_type === 'college_admin_ai').length;

  return (
    <CollegeAdminLayout>
      <div className="space-y-5">

        {/* ── Toast ── */}
        {toast && (
          <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-sm font-semibold
            ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
            {toast.type === 'error'
              ? <AlertCircle className="w-4 h-4" />
              : <CircleCheck className="w-4 h-4" />}
            {toast.msg}
          </div>
        )}

        {/* ── Hero Banner (mirrors Dashboard style) ── */}
        <div className="relative bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 rounded-2xl px-5 py-4 shadow-xl shadow-blue-500/20 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute inset-0 opacity-[0.06]"
              style={{ backgroundImage: 'radial-gradient(circle,white 1px,transparent 1px)', backgroundSize: '18px 18px' }} />
          </div>
          <div className="relative flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0 border border-white/20">
                <ClipboardList className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-white font-black text-lg leading-tight">Assessments</h1>
                <p className="text-blue-200 text-xs mt-0.5">Create and manage skill assessments for students</p>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  <span className="inline-flex items-center gap-1 bg-white/15 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white border border-white/20">
                    <CheckCircle2 className="w-3 h-3" /> {assessments.length} Total
                  </span>
                  <span className="inline-flex items-center gap-1 bg-white/15 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white border border-white/20">
                    <TrendingUp className="w-3 h-3" /> {totalActive} Active
                  </span>
                  <span className="inline-flex items-center gap-1 bg-white/15 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white border border-white/20">
                    <Zap className="w-3 h-3" /> {totalAI} AI-Generated
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
              <button onClick={fetchAssessments} disabled={loading}
                className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-3 py-2 rounded-xl border border-white/30 transition-all disabled:opacity-50">
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
              </button>
              <button onClick={() => navigate('/dashboard/college-admin/assessments/generate')}
                className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-3 py-2 rounded-xl border border-white/30 transition-all">
                <Sparkles className="w-3.5 h-3.5" /> Generate with AI
              </button>
              <button onClick={() => navigate('/dashboard/college-admin/assessments/create')}
                className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-3 py-2 rounded-xl border border-white/30 transition-all">
                <Plus className="w-3.5 h-3.5" /> New Assessment
              </button>
            </div>
          </div>
        </div>

        {/* ── Stat pills (mirrors Dashboard) ── */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <StatPill icon={ClipboardList} label="Total Assessments" value={assessments.length} color="blue"   />
            <StatPill icon={CheckCircle2}  label="Active"            value={totalActive}         color="green"  />
            <StatPill icon={FileText}      label="Inactive"          value={totalInactive}        color="gray"   />
            <StatPill icon={Sparkles}      label="AI Generated"      value={totalAI}              color="violet" />
          </div>
        </div>

        {/* ── Filters ── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by skill name, level or tags…"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white/80 backdrop-blur focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white/80 backdrop-blur focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700">
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* ── Content ── */}
        {loading ? (
          <div className="flex items-center justify-center py-24"><LoadingSpinner /></div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-700">
            <AlertCircle className="w-8 h-8 mx-auto mb-2" />{error}
          </div>
        ) : filtered.length === 0 ? (
          /* ── Empty state ── */
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-12 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-700 mb-2">No Assessments Yet</h3>
            <p className="text-gray-400 text-sm mb-6">Create your first assessment to start evaluating student skills.</p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <button onClick={() => navigate('/dashboard/college-admin/assessments/generate')}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-blue-200 text-blue-600 rounded-xl font-semibold text-sm hover:bg-blue-50 transition-colors">
                <Sparkles className="w-4 h-4" /> Generate with AI
              </button>
              <button onClick={() => navigate('/dashboard/college-admin/assessments/create')}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl font-semibold text-sm shadow-md shadow-blue-500/20 hover:opacity-90 transition-opacity">
                <Plus className="w-4 h-4" /> Create Assessment
              </button>
            </div>
          </div>
        ) : (
          /* ── Table ── */
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm overflow-hidden">
            {/* Table header bar */}
            <div className="px-5 py-3 bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center">
                  <ClipboardList className="w-3 h-3 text-white" />
                </div>
                <p className="font-bold text-gray-800 text-sm">{filtered.length} Assessment{filtered.length !== 1 ? 's' : ''}</p>
              </div>
              {statusFilter && (
                <span className="text-xs text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full font-semibold capitalize">
                  {statusFilter}
                </span>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/40">
                    {['Skill / Level', 'Type', 'Details', 'Status', 'Actions'].map(h => (
                      <th key={h} className="text-left text-[9px] font-black text-gray-400 uppercase tracking-wider px-5 py-3 first:pl-5 last:pr-5 last:text-right">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginated.map(a => {
                    const statusCfg  = STATUS_CONFIG[a.status] || STATUS_CONFIG.inactive;
                    const levelColor = LEVEL_COLOR[a.level]    || 'bg-gray-100 text-gray-600 border-gray-200';
                    const qCount     = Array.isArray(a.questions_id) ? a.questions_id.length : 0;
                    const srcLabel   = SOURCE_LABEL[a.source_type] || a.source_type;

                    return (
                      <tr key={a._id} className="hover:bg-blue-50/20 transition-colors group">

                        {/* Skill / Level */}
                        <td className="px-5 py-4">
                          <p className="font-bold text-gray-900 text-sm">
                            {a.skill_id?.name || a.jd_id?.jobTitle ||
                             (a.tags?.length > 0 ? a.tags[0] : null) ||
                             <span className="text-gray-400 italic font-normal">Unlinked</span>}
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
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1 bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded-md">
                              <Target className="w-3 h-3 text-blue-400" />{qCount} Qs
                            </span>
                            {a.duration_minutes && (
                              <span className="flex items-center gap-1 bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded-md">
                                <Clock className="w-3 h-3 text-cyan-400" />{a.duration_minutes}m
                              </span>
                            )}
                            <span className="flex items-center gap-1 bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded-md">
                              <Users className="w-3 h-3 text-indigo-400" />{a.eligible_students?.length || 0}
                            </span>
                          </div>
                          {a.scheduled_date && (
                            <p className="text-[10px] text-gray-400 mt-1.5">
                              📅 {new Date(a.scheduled_date).toLocaleDateString()}
                              {a.start_time && ` · ${a.start_time}`}
                            </p>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border ${statusCfg.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${a.status === 'active' ? 'bg-blue-500 animate-pulse' : 'bg-gray-400'}`} />
                            {statusCfg.label}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => navigate(`/dashboard/college-admin/assessments/${a._id}/questions`)}
                              title="Manage Questions"
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                              <ListChecks className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => navigate(`/dashboard/college-admin/assessments/${a._id}/attempts`)}
                              title="View Attempts"
                              className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                              <ChartBar className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(a._id)}
                              disabled={toggling === a._id}
                              title={a.status === 'active' ? 'Deactivate' : 'Activate'}
                              className="p-1.5 text-gray-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-all disabled:opacity-40">
                              {a.status === 'active'
                                ? <ToggleRight className="w-3.5 h-3.5 text-blue-500" />
                                : <ToggleLeft  className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={() => navigate(`/dashboard/college-admin/assessments/${a._id}/edit`)}
                              title="Edit"
                              className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all">
                              <SquarePen className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(a._id)}
                              title="Delete"
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
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

      {/* ── Delete Confirm Modal ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <div className="text-center mb-5">
              <div className="w-12 h-12 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="font-bold text-gray-900 text-lg">Delete Assessment?</h3>
              <p className="text-gray-400 text-sm mt-1">This will permanently delete the assessment and all its data.</p>
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
    </CollegeAdminLayout>
  );
};

export default AssessmentManagement;