// src/pages/SuperAdmin/TrainerManagement.jsx
// Wired to real backend: GET/DELETE /api/super-admin/trainers
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Plus, Search, SquarePen, Trash2,
  Phone, Mail, ChevronLeft, ChevronRight, X,
  AlertCircle, RefreshCw, UserCheck, UserX, ToggleLeft, ToggleRight,
} from 'lucide-react';
import SuperAdminDashboardLayout from '../../components/layout/SuperAdminDashboardLayout';
import ActionMenu from '../../components/common/ActionMenu';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import apiCall from '../../api/Api';

const PAGE_SIZE = 10;

/* ─── Stat Pill ────────────────────────────────────── */
const StatPill = ({ label, value, color }) => (
  <div className="bg-white rounded-xl border border-slate-100 shadow-sm px-4 py-3 flex items-center gap-3">
    <span className={`w-2 h-8 rounded-full flex-shrink-0 ${color}`} />
    <div>
      <p className="text-xl font-black text-slate-900 leading-none">{value}</p>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{label}</p>
    </div>
  </div>
);

/* ─── Pagination ───────────────────────────────────── */
const Pagination = ({ page, total, totalPages, pageSize, onPageChange }) => {
  if (totalPages <= 1) return null;
  const from = (page - 1) * pageSize + 1;
  const to   = Math.min(page * pageSize, total);
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
    .reduce((acc, p, i, arr) => {
      if (i > 0 && p - arr[i - 1] > 1) acc.push('…');
      acc.push(p);
      return acc;
    }, []);
  return (
    <div className="px-4 sm:px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white">
      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
        Showing {from}–{to} of {total}
      </span>
      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange(page - 1)} disabled={page === 1}
          className="p-1.5 rounded-lg border border-slate-100 text-slate-400 hover:border-[#003399]/30 hover:text-[#003399] disabled:opacity-40 transition-all">
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        {pages.map((p, i) =>
          p === '…'
            ? <span key={`e${i}`} className="px-1.5 text-slate-300 text-xs">…</span>
            : <button key={p} onClick={() => onPageChange(p)}
                className={`w-7 h-7 rounded-lg text-xs font-black transition-all ${p === page
                  ? 'bg-[#003399] text-white shadow-md'
                  : 'border border-slate-100 text-slate-500 hover:border-[#003399]/30 hover:text-[#003399]'
                }`}>{p}</button>
        )}
        <button onClick={() => onPageChange(page + 1)} disabled={page === totalPages}
          className="p-1.5 rounded-lg border border-slate-100 text-slate-400 hover:border-[#003399]/30 hover:text-[#003399] disabled:opacity-40 transition-all">
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

/* ─── Mobile Card ──────────────────────────────────── */
const TrainerMobileCard = ({ trainer, onDelete, onToggle, navigate }) => (
  <div className="p-4 border-b border-slate-100 last:border-0">
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#003399] to-[#00A9CE] flex items-center justify-center flex-shrink-0 shadow-sm">
          <span className="text-[10px] font-black text-white">
            {(trainer.fullName || 'T').substring(0, 2).toUpperCase()}
          </span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-800 truncate">{trainer.fullName}</p>
          <p className="text-[11px] text-slate-400 truncate">{trainer.email}</p>
        </div>
      </div>
      <span className={`inline-flex items-center px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-md border flex-shrink-0 ${
        trainer.isActive
          ? 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20'
          : 'bg-rose-50 text-rose-500 border-rose-100'
      }`}>
        {trainer.isActive ? 'Active' : 'Inactive'}
      </span>
    </div>
    <div className="mt-2.5 flex flex-wrap gap-2 text-[11px] text-slate-500">
      {trainer.phone && (
        <span className="flex items-center gap-1">
          <Phone className="w-3 h-3" />{trainer.phone}
        </span>
      )}
    </div>
    <div className="mt-3 flex gap-2">
      <button
        onClick={() => navigate(`/dashboard/super-admin/trainers/edit/${trainer._id}`)}
        className="flex items-center gap-1 text-[11px] font-bold text-[#00A9CE] px-3 py-1.5 rounded-lg border border-[#00A9CE]/20 hover:bg-[#00A9CE]/5 transition-all"
      >
        <SquarePen className="w-3 h-3" />Edit
      </button>
      <button
        onClick={() => onToggle(trainer._id, trainer.isActive, trainer.fullName)}
        className={`flex items-center gap-1 text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-all ${
          trainer.isActive
            ? 'text-amber-500 border-amber-100 hover:bg-amber-50'
            : 'text-emerald-500 border-emerald-100 hover:bg-emerald-50'
        }`}
      >
        {trainer.isActive ? <ToggleLeft className="w-3 h-3" /> : <ToggleRight className="w-3 h-3" />}
        {trainer.isActive ? 'Deactivate' : 'Activate'}
      </button>
      <button
        onClick={() => onDelete(trainer._id, trainer.fullName)}
        className="flex items-center gap-1 text-[11px] font-bold text-rose-500 px-3 py-1.5 rounded-lg border border-rose-100 hover:bg-rose-50 transition-all"
      >
        <Trash2 className="w-3 h-3" />Delete
      </button>
    </div>
  </div>
);

/* ─── Main ─────────────────────────────────────────── */
const TrainerManagement = () => {
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();
  const { isLoading: authLoading } = useAuth(); // wait for session restore before fetching

  const [trainers,     setTrainers]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [apiError,     setApiError]     = useState('');
  const [searchTerm,   setSearchTerm]   = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [page,         setPage]         = useState(1);
  const [deleteId,     setDeleteId]     = useState(null);    // confirm dialog
  const [deleteName,   setDeleteName]   = useState('');

  /* ── Fetch trainers ── */
  const fetchTrainers = useCallback(async () => {
    setLoading(true);
    setApiError('');
    try {
      const data = await apiCall('/super-admin/trainers/all');
      // Response: { success: true, data: [...User docs] }
      // Each doc has: _id, fullName, email, phone?, isActive, role, createdAt, isDeleted
      const list = Array.isArray(data.data) ? data.data : [];
      setTrainers(list);
    } catch (err) {
      setApiError(err.message || 'Failed to load trainers');
    } finally {
      setLoading(false);
    }
  }, []);

  // Only fetch once AuthContext has finished restoring the session token.
  // Without this guard the component fires the API call before the access
  // token is in memory => backend returns 401 NO_TOKEN (race condition).
  useEffect(() => {
    if (!authLoading) fetchTrainers();
  }, [authLoading, fetchTrainers]);

  /* ── Delete ── */
  const confirmDelete = (id, name) => { setDeleteId(id); setDeleteName(name); };
  const cancelDelete  = () => { setDeleteId(null); setDeleteName(''); };

  const handleDelete = async () => {
    if (!deleteId) return;
    const name = deleteName;
    setDeleteId(null);
    setDeleteName('');
    try {
      await apiCall('/trainer/profile', {
        method: 'DELETE',
        body: JSON.stringify({ trainer_id: deleteId }),
      });
      setTrainers(prev => prev.filter(t => t._id !== deleteId));
      success('Deleted', `${name} removed successfully`);
    } catch (err) {
      toastError('Delete Failed', err.message);
    }
  };

  const handleToggleStatus = async (id, currentStatus, name) => {
    // Optimistic update first for snappy UI
    setTrainers(prev => prev.map(t => t._id === id ? { ...t, isActive: !t.isActive } : t));
    try {
      const res = await apiCall(`/super-admin/trainer/${id}/toggle-status`, { method: 'PATCH' });
      // Sync with actual server value in case it differed
      if (res?.trainer) {
        setTrainers(prev => prev.map(t => t._id === id ? { ...t, isActive: res.trainer.isActive } : t));
      }
      success(
        currentStatus ? 'Deactivated' : 'Activated',
        `${name} has been ${currentStatus ? 'deactivated' : 'activated'}.`
      );
    } catch (err) {
      // Roll back the optimistic update on failure
      setTrainers(prev => prev.map(t => t._id === id ? { ...t, isActive: currentStatus } : t));
      toastError('Toggle Failed', err.message || 'Could not update trainer status');
    }
  };

  /* ── Filter & paginate ── */
  const filtered = trainers.filter(t => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      (t.fullName?.toLowerCase().includes(q)) ||
      (t.email?.toLowerCase().includes(q)) ||
      (t.phone?.toLowerCase().includes(q));
    const matchStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active'   && t.isActive) ||
      (filterStatus === 'inactive' && !t.isActive);
    return matchSearch && matchStatus;
  });

  const stats = {
    total:    trainers.length,
    active:   trainers.filter(t => t.isActive).length,
    inactive: trainers.filter(t => !t.isActive).length,
  };

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  /* ─────────────────────────────── RENDER ─────────────────────────────── */
  return (
    <SuperAdminDashboardLayout>
      <div className="px-4 py-4 sm:px-6 md:px-8 md:py-6 space-y-5 font-sans">

        {/* ── Confirm Delete Modal ── */}
        {deleteId && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 max-w-sm w-full">
              <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center mb-4">
                <Trash2 className="w-5 h-5 text-rose-500" />
              </div>
              <h3 className="text-base font-black text-slate-900">Delete Trainer?</h3>
              <p className="text-sm text-slate-500 mt-1">
                This will deactivate <span className="font-bold text-slate-800">{deleteName}</span>'s account.
                This action cannot be undone.
              </p>
              <div className="flex gap-3 mt-5">
                <button onClick={cancelDelete}
                  className="flex-1 px-4 py-2.5 text-sm font-bold border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all">
                  Cancel
                </button>
                <button onClick={handleDelete}
                  className="flex-1 px-4 py-2.5 text-sm font-bold bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-all">
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Header ── */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span className="w-2 h-8 bg-gradient-to-b from-[#003399] to-[#00A9CE] rounded-full" />
              Manage Trainers
            </h1>
            <p className="text-sm text-slate-400 mt-1 font-medium">
              Platform trainers — {stats.total} total
            </p>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 w-full lg:w-auto">
            {/* Search */}
            <div className="relative flex-1 sm:min-w-[240px] lg:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by name, email or phone…"
                value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
                className="w-full pl-9 pr-8 py-2.5 text-xs font-bold border border-slate-100 rounded-xl focus:outline-none focus:border-[#003399]/30 bg-white"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Status filter */}
            <select
              value={filterStatus}
              onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
              className="pl-4 pr-8 py-2.5 text-xs font-black uppercase tracking-wider border border-slate-100 rounded-xl focus:outline-none focus:border-[#003399]/30 bg-white appearance-none cursor-pointer text-slate-600"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            {/* Refresh */}
            <button
              onClick={fetchTrainers}
              title="Refresh"
              className="p-2.5 rounded-xl border border-slate-100 text-slate-400 hover:text-[#003399] hover:border-[#003399]/30 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Add Trainer */}
            <button
              onClick={() => navigate('/dashboard/super-admin/trainers/create')}
              className="inline-flex items-center justify-center gap-2 bg-[#003399] text-white text-[11px] font-black uppercase tracking-wider px-5 py-2.5 rounded-xl hover:bg-[#002d8b] transition-all shadow-lg shadow-blue-500/10 active:scale-95"
            >
              <Plus className="w-4 h-4" /> Add Trainer
            </button>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-3 gap-3">
          <StatPill label="Total"    value={stats.total}    color="bg-gradient-to-b from-[#003399] to-[#00A9CE]" />
          <StatPill label="Active"   value={stats.active}   color="bg-gradient-to-b from-emerald-400 to-emerald-500" />
          <StatPill label="Inactive" value={stats.inactive} color="bg-gradient-to-b from-slate-300 to-slate-400" />
        </div>

        {/* ── API Error banner ── */}
        {apiError && (
          <div className="flex items-center gap-3 bg-rose-50 border border-rose-100 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-rose-800">Could not load trainers</p>
              <p className="text-[11px] text-rose-600 mt-0.5">{apiError}</p>
            </div>
            <button onClick={fetchTrainers}
              className="text-[11px] font-black text-rose-600 px-3 py-1.5 rounded-lg border border-rose-200 hover:bg-rose-100 transition-all flex-shrink-0">
              Retry
            </button>
          </div>
        )}

        {/* ── Table ── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

          {loading ? (
            /* Skeleton */
            <div className="divide-y divide-slate-50">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-4">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 animate-pulse flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-32 bg-slate-100 rounded animate-pulse" />
                    <div className="h-2.5 w-48 bg-slate-100 rounded animate-pulse" />
                  </div>
                  <div className="h-6 w-14 bg-slate-100 rounded-md animate-pulse" />
                </div>
              ))}
            </div>
          ) : paginated.length > 0 ? (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full table-fixed">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      {[
                        ['S.No', 'w-[55px]'],
                        ['Trainer Name', 'w-[180px]'],
                        ['Email', 'w-[210px]'],
                        ['Phone', 'w-[145px]'],
                        ['Status', 'w-[110px]'],
                        ['Joined', 'w-[110px]'],
                        ['Actions', 'w-[80px]'],
                      ].map(([h, w], i) => (
                        <th key={h}
                          className={`px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest ${i === 6 ? 'text-center' : 'text-left'} ${w}`}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginated.map((trainer, index) => {
                      const sNo = (page - 1) * PAGE_SIZE + index + 1;
                      return (
                        <tr key={trainer._id} className="hover:bg-slate-50/30 transition-colors">
                          <td className="px-4 py-4 text-xs font-bold text-slate-400">
                            {String(sNo).padStart(2, '0')}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#003399] to-[#00A9CE] flex items-center justify-center flex-shrink-0 shadow-sm">
                                <span className="text-[10px] font-black text-white">
                                  {(trainer.fullName || 'T').substring(0, 2).toUpperCase()}
                                </span>
                              </div>
                              <p className="text-sm font-bold text-slate-800 truncate">
                                {trainer.fullName || 'N/A'}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-1.5 truncate">
                              <Mail className="w-3 h-3 text-slate-300 flex-shrink-0" />
                              <span className="text-xs font-medium text-slate-500 truncate">
                                {trainer.email || 'N/A'}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            {trainer.phone
                              ? <div className="flex items-center gap-1 text-[11px] text-slate-500 truncate">
                                  <Phone className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                  <span className="truncate">{trainer.phone}</span>
                                </div>
                              : <span className="text-[10px] text-slate-300 italic">N/A</span>}
                          </td>
                          <td className="px-4 py-4">
                            <button
                              onClick={() => handleToggleStatus(trainer._id, trainer.isActive, trainer.fullName)}
                              title={trainer.isActive ? 'Click to Deactivate' : 'Click to Activate'}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-md border transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                                trainer.isActive
                                  ? 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20 hover:bg-[#10b981]/20'
                                  : 'bg-rose-50 text-rose-500 border-rose-100 hover:bg-rose-100'
                              }`}>
                              {trainer.isActive
                                ? <><UserCheck className="w-2.5 h-2.5" />Active</>
                                : <><UserX className="w-2.5 h-2.5" />Inactive</>}
                            </button>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-[11px] text-slate-400">
                              {trainer.createdAt
                                ? new Date(trainer.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })
                                : '—'}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <div className="flex items-center justify-center">
                              <ActionMenu actions={[
                                {
                                  icon: SquarePen,
                                  label: 'Edit Trainer',
                                  onClick: () => navigate(`/dashboard/super-admin/trainers/edit/${trainer._id}`),
                                  color: 'text-[#00A9CE] hover:bg-[#00A9CE]/5',
                                },
                                {
                                  icon: trainer.isActive ? ToggleLeft : ToggleRight,
                                  label: trainer.isActive ? 'Deactivate' : 'Activate',
                                  onClick: () => handleToggleStatus(trainer._id, trainer.isActive, trainer.fullName),
                                  color: trainer.isActive ? 'text-amber-500 hover:bg-amber-50' : 'text-emerald-500 hover:bg-emerald-50',
                                },
                                {
                                  icon: Trash2,
                                  label: 'Delete Trainer',
                                  danger: true,
                                  onClick: () => confirmDelete(trainer._id, trainer.fullName),
                                },
                              ]} />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile List */}
              <div className="md:hidden">
                {paginated.map(t => (
                  <TrainerMobileCard
                    key={t._id}
                    trainer={t}
                    onDelete={confirmDelete}
                    onToggle={handleToggleStatus}
                    navigate={navigate}
                  />
                ))}
              </div>
            </>
          ) : (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-20 bg-slate-50/20 px-4 text-center">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 border border-slate-100 shadow-sm">
                <Users className="w-8 h-8 text-slate-200" />
              </div>
              <p className="text-sm font-black text-slate-800 tracking-tight">No trainers found</p>
              <p className="text-xs text-slate-400 font-medium mt-1">
                {searchTerm || filterStatus !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Add your first trainer to get started'}
              </p>
              {!searchTerm && filterStatus === 'all' && (
                <button
                  onClick={() => navigate('/dashboard/super-admin/trainers/create')}
                  className="mt-4 inline-flex items-center gap-2 bg-[#003399] text-white text-[11px] font-black uppercase tracking-wider px-5 py-2.5 rounded-xl hover:bg-[#002d8b] transition-all"
                >
                  <Plus className="w-4 h-4" /> Add First Trainer
                </button>
              )}
            </div>
          )}

          {!loading && (
            <Pagination
              page={page}
              total={filtered.length}
              totalPages={totalPages}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
            />
          )}
        </div>
      </div>

      {/* Mobile FAB */}
      <button
        onClick={() => navigate('/dashboard/super-admin/trainers/create')}
        className="md:hidden fixed bottom-8 right-8 w-14 h-14 bg-[#003399] text-white rounded-2xl shadow-xl shadow-blue-500/30 z-50 flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
      >
        <Plus className="w-7 h-7" />
      </button>
    </SuperAdminDashboardLayout>
  );
};

export default TrainerManagement;