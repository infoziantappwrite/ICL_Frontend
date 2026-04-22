// src/pages/SuperAdmin/CollegeManagement.jsx
import { useToast } from '../../context/ToastContext';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import apiCall from '../../api/Api';
import ActionMenu from '../../components/common/ActionMenu';
import {
  Building2, Plus, Search, Eye, SquarePen, Trash2, MapPin,
  Users, Briefcase, CircleCheck, Clock, FileText,
  GraduationCap, ChevronLeft, ChevronRight, Filter, X,
} from 'lucide-react';
import SuperAdminDashboardLayout from '../../components/layout/SuperAdminDashboardLayout';
import { TableSkeleton } from '../../components/common/SkeletonLoader';

/* ── Pagination ── */
const Pagination = ({ page, total, totalPages, pageSize, onPageChange }) => {
  if (totalPages <= 1) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
    .reduce((acc, p, i, arr) => { if (i > 0 && p - arr[i - 1] > 1) acc.push('…'); acc.push(p); return acc; }, []);
  return (
    <div className="px-6 py-4 bg-white border-t border-slate-100 flex items-center justify-between">
      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Showing {from}–{to} of {total}</span>
      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange(page - 1)} disabled={page === 1}
          className="p-1.5 rounded-lg border border-slate-100 text-slate-400 hover:border-[#003399]/30 hover:text-[#003399] disabled:opacity-40 transition-all">
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        {pages.map((p, i) => p === '…'
          ? <span key={`e${i}`} className="px-1.5 text-slate-300 text-xs">…</span>
          : <button key={p} onClick={() => onPageChange(p)}
            className={`w-7 h-7 rounded-lg text-xs font-black transition-all ${p === page
                ? 'bg-[#003399] text-white shadow-md shadow-blue-500/10'
                : 'border border-slate-100 text-slate-500 hover:border-[#003399]/30 hover:text-[#003399]'}`}>
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

/* ══════════════════════════════════════════ */
const CollegeManagement = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalColleges, setTotalColleges] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const PAGE_SIZE = 10;

  // Read from URL
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const searchTerm = searchParams.get('search') || '';
  const filterStatus = searchParams.get('status') || 'all';

  const updateParams = (updates) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === '' || value === null || value === undefined) {
        newParams.delete(key);
      } else {
        newParams.set(key, String(value));
      }
    });
    setSearchParams(newParams);
  };

  const fetchColleges = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage, limit: PAGE_SIZE,
        ...(searchTerm && { search: searchTerm }),
        ...(filterStatus !== 'all' && { isActive: filterStatus === 'active' }),
        sort: '-createdAt',
      });
      const data = await apiCall(`/super-admin/colleges?${params}`);
      if (data.success) {
        setColleges(data.colleges || []);
        setTotalPages(data.totalPages || 1);
        setTotalColleges(data.total || 0);
        setLastUpdated(new Date());
      } else toast.error('Error', data.message || 'Failed to fetch colleges');
    } catch { toast.error('Error', 'Error fetching colleges'); }
    finally { setLoading(false); }
  }, [currentPage, searchTerm, filterStatus, toast]);

  useEffect(() => { fetchColleges(); }, [fetchColleges]);
  useEffect(() => {
    const t = setInterval(fetchColleges, 30000);
    return () => clearInterval(t);
  }, [fetchColleges]);

  const handleDelete = async (id) => {
    const data = await apiCall(`/super-admin/colleges/${id}`, { method: 'DELETE' });
    if (data.success) {
      toast.success('Deleted', 'College deleted');
      setColleges(prev => prev.filter(c => c._id !== id));
      setTotalColleges(prev => prev - 1);
    } else toast.error('Error', data.message || 'Failed to delete');
  };

  const handleToggle = async (id, current, name) => {
    const data = await apiCall(`/super-admin/colleges/${id}`, {
      method: 'PUT', body: JSON.stringify({ isActive: !current }),
    });
    if (data.success) {
      toast.success('Updated', `${name} ${current ? 'deactivated' : 'activated'}`);
      setColleges(prev => prev.map(c => c._id === id ? { ...c, isActive: !current } : c));
    } else toast.error('Error', data.message || 'Failed to update');
  };

  if (loading && colleges.length === 0)
    return <TableSkeleton layout={SuperAdminDashboardLayout} />;

  return (
    <SuperAdminDashboardLayout>
      <div className="px-6 py-4 md:px-8 md:py-6 space-y-5 font-sans">

        {/* Header Section */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span className="w-2 h-8 bg-gradient-to-b from-[#003399] to-[#00A9CE] rounded-full" />
              Manage Colleges
            </h1>
            <p className="text-sm text-slate-400 mt-1 font-medium">Directory of registered educational institutions.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="relative flex-1 min-w-[240px] lg:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
              <input type="text" placeholder="Search by name or code..." value={searchTerm}
                onChange={e => updateParams({ search: e.target.value || null, page: null })}
                className="w-full pl-9 pr-4 py-2.5 text-xs font-bold border border-slate-100 rounded-xl focus:outline-none focus:border-[#003399]/30 bg-white placeholder:slate-300"
              />
            </div>
            <select value={filterStatus} onChange={e => updateParams({ status: e.target.value || null, page: null })}
              className="pl-4 pr-10 py-2.5 text-xs font-black uppercase tracking-wider border border-slate-100 rounded-xl focus:outline-none focus:border-[#003399]/30 bg-white appearance-none cursor-pointer text-slate-600"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <button onClick={() => navigate('/dashboard/super-admin/colleges/new')}
              className="inline-flex items-center gap-2 bg-[#003399] text-white text-[11px] font-black uppercase tracking-wider px-5 py-2.5 rounded-xl hover:bg-[#002d8b] transition-all shadow-lg shadow-blue-500/10 active:scale-95"
            >
              <Plus className="w-4 h-4" /> Create New
            </button>
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-lg border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            {colleges.length > 0 ? (
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left align-middle w-20">S.No</th>
                    <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left align-middle">College Name</th>
                    <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left align-middle w-32">Code</th>
                    <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left align-middle w-64">Email</th>
                    <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left align-middle w-36">Total Students</th>
                    <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left align-middle w-32">Status</th>
                    <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center align-middle w-24">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {colleges.map((college, idx) => {
                    const lc = college.liveCounts || {};
                    const sNo = (currentPage - 1) * PAGE_SIZE + idx + 1;
                    return (
                      <tr key={college._id} className="hover:bg-slate-50/30 transition-colors group">
                        <td className="px-4 py-4 text-xs font-bold text-slate-400">{String(sNo).padStart(2, '0')}</td>
                        <td className="px-4 py-4">
                          <p onClick={() => navigate(`/dashboard/super-admin/colleges/${college._id}`)}
                            className="text-sm font-bold text-slate-800 truncate max-w-[240px] cursor-pointer hover:text-[#003399] transition-colors"
                          >
                            {college.name}
                          </p>
                        </td>
                        <td className="px-4 py-4 text-[11px] font-mono font-bold text-slate-500 uppercase tracking-tight italic">{college.code}</td>
                        <td className="px-4 py-4">
                          <p title={college.email} className="text-xs font-medium text-slate-500 truncate max-w-[200px]">
                            {college.email}
                          </p>
                        </td>
                        <td className="px-4 py-4 text-sm font-black text-[#003399] tracking-tight">{lc.studentsCount ?? 0}</td>
                        <td className="px-4 py-4">
                          <button
                            onClick={() => handleToggle(college._id, college.isActive, college.name)}
                            title="Click to toggle status"
                            className={`inline-flex items-center px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-md border transition-all ${college.isActive
                                ? 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20 hover:bg-[#10b981]/20'
                                : 'bg-rose-50 text-rose-500 border-rose-100 hover:bg-rose-100'
                              }`}
                          >
                            {college.isActive ? 'Active' : 'Offline'}
                          </button>
                        </td>
                        <td className="px-4 py-4 align-middle text-center">
                          <div className="flex items-center justify-center">
                            <ActionMenu
                              actions={[
                                {
                                  icon: Eye,
                                  label: 'View Details',
                                  onClick: () => navigate(`/dashboard/super-admin/colleges/${college._id}`),
                                  color: 'text-slate-700 hover:bg-slate-50'
                                },
                                {
                                  icon: SquarePen,
                                  label: 'Edit College',
                                  onClick: () => navigate(`/dashboard/super-admin/colleges/${college._id}/edit`),
                                  color: 'text-[#00A9CE] hover:bg-[#00A9CE]/5'
                                },
                                {
                                  icon: Trash2,
                                  label: 'Delete College',
                                  danger: true,
                                  onClick: () => {
                                    if (window.confirm(`Are you sure you want to delete ${college.name}?`)) {
                                      handleDelete(college._id);
                                    }
                                  },
                                },
                              ]}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 bg-slate-50/20">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 border border-slate-100 shadow-sm">
                  <Building2 className="w-8 h-8 text-slate-200" />
                </div>
                <p className="text-sm font-black text-slate-800 tracking-tight">No institutions found</p>
                <p className="text-xs text-slate-400 font-medium mt-1">{searchTerm ? 'Try adjusting your search query' : 'Start growing the network'}</p>
                {searchTerm && (
                  <button onClick={() => updateParams({ search: null, page: null })} className="mt-4 text-[10px] font-black text-[#003399] uppercase tracking-widest hover:underline">Clear Search</button>
                )}
              </div>
            )}
          </div>
          <Pagination page={currentPage} total={totalColleges} totalPages={totalPages} pageSize={PAGE_SIZE} onPageChange={(p) => updateParams({ page: p })} />
        </div>

      </div>

      {/* Mobile FAB */}
      <button onClick={() => navigate('/dashboard/super-admin/colleges/new')}
        className="md:hidden fixed bottom-8 right-8 w-16 h-16 bg-[#003399] text-white rounded-2xl shadow-xl shadow-blue-500/30 z-50 flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
      >
        <Plus className="w-8 h-8" />
      </button>

    </SuperAdminDashboardLayout>
  );
};

export default CollegeManagement;
