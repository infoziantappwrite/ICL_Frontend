// pages/CollegeAdmin/Assessments/AssessmentManagement.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, SquarePen, Trash2, ChartBar,
  BookOpen, RefreshCw, AlertCircle, CircleCheck,
  Clock, Target, ListChecks, ToggleLeft, ToggleRight, Users,
  ChevronLeft, ChevronRight, Sparkles,
} from 'lucide-react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { assessmentAPI } from '../../../api/Api';

const STATUS_CONFIG = {
  active:   { label: 'Active',   color: 'bg-green-100 text-green-700 border-green-200' },
  inactive: { label: 'Inactive', color: 'bg-gray-100 text-gray-600 border-gray-200'   },
};

const LEVEL_COLOR = {
  Beginner:     'bg-green-50 text-green-700',
  Intermediate: 'bg-blue-50 text-blue-700',
  Advanced:     'bg-purple-50 text-purple-700',
};

const PER_PAGE = 10;

const Pagination = ({ page, totalPages, total, perPage, onPrev, onNext }) => {
  if (totalPages <= 1) return null;
  const from = (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);
  return (
    <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 bg-gray-50/50">
      <span className="text-xs text-gray-500">Showing {from}–{to} of {total}</span>
      <div className="flex items-center gap-2">
        <button onClick={onPrev} disabled={page === 1}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          <ChevronLeft className="w-3.5 h-3.5" /> Prev
        </button>
        <span className="text-xs text-gray-500 px-1">{page} / {totalPages}</span>
        <button onClick={onNext} disabled={page === totalPages}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          Next <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

const AssessmentManagement = () => {
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [toast, setToast] = useState(null);
  const [toggling, setToggling] = useState(null);
  const [page, setPage] = useState(1);

  useEffect(() => { fetchAssessments(); }, []);
  useEffect(() => { setPage(1); }, [search, statusFilter]);

  const fetchAssessments = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await assessmentAPI.getAllAssessments();
      if (res.success) {
        // Sort newest first
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
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <DashboardLayout title="Assessments">
      <div className="space-y-5">

        {/* Toast */}
        {toast && (
          <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-sm font-medium
            ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
            {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CircleCheck className="w-4 h-4" />}
            {toast.msg}
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Assessments</h1>
            <p className="text-gray-500 text-sm mt-0.5">Create and manage skill assessments for students</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/dashboard/college-admin/assessments/generate')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm text-white transition-all"
              style={{ background: 'linear-gradient(135deg, #0e7490, #06b6d4)', boxShadow: '0 2px 10px rgba(6,182,212,0.30)' }}>
              <Sparkles className="w-4 h-4" /> Generate with AI
            </button>
            <button onClick={() => navigate('/dashboard/college-admin/assessments/create')}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-cyan-700 shadow-sm transition-all">
              <Plus className="w-4 h-4" /> New Assessment
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by skill name, level or tags..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700">
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button onClick={fetchAssessments}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-all shadow-sm">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-24"><LoadingSpinner /></div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-700">
            <AlertCircle className="w-8 h-8 mx-auto mb-2" />{error}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Assessments Yet</h3>
            <p className="text-gray-500 text-sm mb-5">Create your first assessment to start evaluating student skills.</p>
            <button onClick={() => navigate('/dashboard/college-admin/assessments/create')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-medium">
              <Plus className="w-4 h-4" /> Create Assessment
            </button>
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50">
              <p className="font-semibold text-gray-800 text-sm">{filtered.length} Assessments</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-gray-100">
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-5 py-3">Skill / Level</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Type</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Details</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Status</th>
                    <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wide px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginated.map(a => {
                    const statusCfg = STATUS_CONFIG[a.status] || STATUS_CONFIG.inactive;
                    const levelColor = LEVEL_COLOR[a.level] || 'bg-gray-100 text-gray-600';
                    const questionCount = Array.isArray(a.questions_id) ? a.questions_id.length : 0;
                    const sourceLabel = {
                      college_admin_manual: 'Manual',
                      college_admin_ai: 'AI',
                      student_skill_based: 'Skill-Based',
                    }[a.source_type] || a.source_type;

                    return (
                      <tr key={a._id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-4">
                          <p className="font-semibold text-gray-900 text-sm">
                            {a.skill_id?.name || a.jd_id?.jobTitle || (a.tags?.length > 0 ? a.tags[0] : null) || <span className="text-gray-400 italic">Unlinked</span>}
                          </p>
                          <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium mt-1 ${levelColor}`}>{a.level}</span>
                          {a.tags?.length > 0 && (
                            <div className="flex gap-1 flex-wrap mt-1">
                              {a.tags.slice(0, 3).map(t => (
                                <span key={t} className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{t}</span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full">{sourceLabel}</span>
                          {a.jd_id && <p className="text-xs text-blue-600 mt-1">{a.jd_id.jobTitle}</p>}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1"><Target className="w-3 h-3" />{questionCount} Qs</span>
                            {a.duration_minutes && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{a.duration_minutes}m</span>}
                            <span className="flex items-center gap-1"><Users className="w-3 h-3" />{a.eligible_students?.length || 0}</span>
                          </div>
                          {a.scheduled_date && (
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(a.scheduled_date).toLocaleDateString()}{a.start_time && ` ${a.start_time}`}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${statusCfg.color}`}>
                            {statusCfg.label}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => navigate(`/dashboard/college-admin/assessments/${a._id}/questions`)}
                              title="Manage Questions" className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                              <ListChecks className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => navigate(`/dashboard/college-admin/assessments/${a._id}/attempts`)}
                              title="View Attempts" className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all">
                              <ChartBar className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleToggleStatus(a._id)} disabled={toggling === a._id}
                              title={a.status === 'active' ? 'Deactivate' : 'Activate'}
                              className="p-1.5 text-gray-500 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-all disabled:opacity-40">
                              {a.status === 'active' ? <ToggleRight className="w-3.5 h-3.5 text-green-600" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                            </button>
                            <button onClick={() => navigate(`/dashboard/college-admin/assessments/${a._id}/edit`)}
                              title="Edit" className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all">
                              <SquarePen className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setDeleteConfirm(a._id)}
                              title="Delete" className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
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
            <Pagination page={page} totalPages={totalPages} total={filtered.length} perPage={PER_PAGE}
              onPrev={() => setPage(p => Math.max(1, p - 1))}
              onNext={() => setPage(p => Math.min(totalPages, p + 1))}
            />
          </div>
        )}
      </div>

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <div className="text-center mb-5">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="font-bold text-gray-900 text-lg">Delete Assessment?</h3>
              <p className="text-gray-500 text-sm mt-1">This will permanently delete the assessment and all its data.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 font-medium">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AssessmentManagement;