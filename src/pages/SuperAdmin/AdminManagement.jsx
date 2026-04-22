// src/pages/SuperAdmin/AdminManagement.jsx
import { useToast } from '../../context/ToastContext';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiCall from '../../api/Api';
import {
  Users, Plus, Search, SquarePen, Trash2, Eye, Phone, Shield,
  GraduationCap, UserRoundCheck, UserRoundX, ChevronLeft, ChevronRight,
  Filter, X, TrendingUp, Building2,
} from 'lucide-react';
import SuperAdminDashboardLayout from '../../components/layout/SuperAdminDashboardLayout';
import { TableSkeleton } from '../../components/common/SkeletonLoader';
import ActionMenu from '../../components/common/ActionMenu';

const PAGE_SIZE = 10;

const Pagination = ({ page, total, totalPages, pageSize, onPageChange }) => {
  if (totalPages <= 1) return null;
  const from = (page - 1) * pageSize + 1, to = Math.min(page * pageSize, total);
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
    .reduce((acc, p, i, arr) => { if (i > 0 && p - arr[i - 1] > 1) acc.push('…'); acc.push(p); return acc; }, []);
  return (
    <div className="px-6 py-4 bg-white border-t border-slate-100 flex items-center justify-between">
      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Showing {from}–{to} of {total}</span>
      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange(page - 1)} disabled={page === 1} className="p-1.5 rounded-lg border border-slate-100 text-slate-400 hover:border-[#003399]/30 hover:text-[#003399] disabled:opacity-40 transition-all"><ChevronLeft className="w-3.5 h-3.5" /></button>
        {pages.map((p, i) => p === '…' ? <span key={`e${i}`} className="px-1.5 text-slate-300 text-xs">…</span>
          : <button key={p} onClick={() => onPageChange(p)} className={`w-7 h-7 rounded-lg text-xs font-black transition-all ${p === page ? 'bg-[#003399] text-white shadow-md' : 'border border-slate-100 text-slate-500 hover:border-[#003399]/30 hover:text-[#003399]'}`}>{p}</button>)}
        <button onClick={() => onPageChange(page + 1)} disabled={page === totalPages} className="p-1.5 rounded-lg border border-slate-100 text-slate-400 hover:border-[#003399]/30 hover:text-[#003399] disabled:opacity-40 transition-all"><ChevronRight className="w-3.5 h-3.5" /></button>
      </div>
    </div>
  );
};

const AdminManagement = () => {
  const toast = useToast(), navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [admins, setAdmins] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });

  useEffect(() => { fetchAdmins(); }, []);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const data = await apiCall('/super-admin/admins');
      if (data.success) {
        const sorted = (data.admins || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setAdmins(sorted); calcStats(sorted);
      }
    } catch (err) { toast.error('Error', err.message); }
    finally { setLoading(false); }
  };

  const calcStats = (list) => {
    const active = list.filter(a => a.isActive).length;
    setStats({ total: list.length, active, inactive: list.length - active });
  };

  const handleDelete = async (id) => {
    try {
      await apiCall(`/super-admin/admins/${id}`, { method: 'DELETE' });
      toast.success('Deleted', 'Admin deleted');
      setAdmins(prev => { const u = prev.filter(a => a._id !== id); calcStats(u); return u; });
    } catch (err) { toast.error('Error', err.message); }
  };

  const handleToggle = async (id, current) => {
    try {
      await apiCall(`/super-admin/admins/${id}/toggle-status`, { method: 'PATCH' });
      toast.success('Updated', `Admin ${current ? 'deactivated' : 'activated'}`);
      setAdmins(prev => { const u = prev.map(a => a._id === id ? { ...a, isActive: !current } : a); calcStats(u); return u; });
    } catch (err) { toast.error('Error', err.message); }
  };

  const filtered = admins.filter(a => {
    const q = searchTerm.toLowerCase();
    return (a.fullName?.toLowerCase().includes(q) || a.email?.toLowerCase().includes(q) || a.college?.name?.toLowerCase().includes(q)) &&
      (filterStatus === 'all' || (filterStatus === 'active' && a.isActive) || (filterStatus === 'inactive' && !a.isActive));
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (loading) return <TableSkeleton layout={SuperAdminDashboardLayout} />;

  return (
    <SuperAdminDashboardLayout>
      <div className="px-6 py-4 md:px-8 md:py-6 space-y-5 font-sans">

        {/* Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span className="w-2 h-8 bg-gradient-to-b from-[#003399] to-[#00A9CE] rounded-full" />
              Manage Admins
            </h1>
            <p className="text-sm text-slate-400 mt-1 font-medium">Manage college administrators — {stats.total} total</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="relative flex-1 min-w-[240px] lg:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
              <input type="text" placeholder="Search by name, email or college…" value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
                className="w-full pl-9 pr-4 py-2.5 text-xs font-bold border border-slate-100 rounded-xl focus:outline-none focus:border-[#003399]/30 bg-white"
              />
              {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"><X className="w-3.5 h-3.5" /></button>}
            </div>
            <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
              className="pl-4 pr-10 py-2.5 text-xs font-black uppercase tracking-wider border border-slate-100 rounded-xl focus:outline-none focus:border-[#003399]/30 bg-white appearance-none cursor-pointer text-slate-600">
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <button onClick={() => navigate('/dashboard/super-admin/admins/create')}
              className="inline-flex items-center gap-2 bg-[#003399] text-white text-[11px] font-black uppercase tracking-wider px-5 py-2.5 rounded-xl hover:bg-[#002d8b] transition-all shadow-lg shadow-blue-500/10 active:scale-95">
              <Plus className="w-4 h-4" /> Add Admin
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            {paginated.length > 0 ? (
              <table className="w-full table-fixed">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left w-[60px]">
                      S.No
                    </th>
                    <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left w-[160px]">
                      Admin Name
                    </th>
                    <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left w-[220px]">
                      Email
                    </th>
                    <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left w-[180px]">
                      College
                    </th>
                    <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left w-[140px]">
                      Contact
                    </th>
                    <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left w-[120px]">
                      Status
                    </th>
                    <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-[80px]">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {paginated.map((admin, index) => {
                    const sNo = (page - 1) * PAGE_SIZE + index + 1;

                    return (
                      <tr
                        key={admin._id}
                        className="hover:bg-slate-50/30 transition-colors group"
                      >

                        {/* S.No */}
                        <td className="px-4 py-4 text-xs font-bold text-slate-400">
                          {String(sNo).padStart(2, '0')}
                        </td>

                        {/* Admin Name */}
                        <td className="px-4 py-4">
                          <p className="text-sm font-bold text-slate-800 truncate w-full">
                            {admin.fullName || 'N/A'}
                          </p>
                        </td>

                        {/* Email */}
                        <td className="px-4 py-4">
                          <p className="text-xs font-medium text-slate-500 truncate w-full">
                            {admin.email}
                          </p>
                        </td>

                        {/* College */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1.5 truncate w-full">
                            <GraduationCap className="w-3 h-3 text-[#00A9CE] flex-shrink-0" />
                            <span className="text-xs font-medium text-slate-700 truncate w-full">
                              {admin.college?.name || 'N/A'}
                            </span>
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="px-4 py-4">
                          {admin.phone ? (
                            <div className="flex items-center gap-1 text-[11px] text-slate-500 truncate w-full">
                              <Phone className="w-3 h-3 text-slate-400 flex-shrink-0" />
                              <span className="truncate">{admin.phone}</span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-300 italic">N/A</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-4">
                          <button
                            onClick={() => handleToggle(admin._id, admin.isActive)}
                            className={`inline-flex items-center px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-md border transition-all ${admin.isActive
                              ? 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20 hover:bg-[#10b981]/20'
                              : 'bg-rose-50 text-rose-500 border-rose-100 hover:bg-rose-100'
                              }`}
                          >
                            {admin.isActive ? 'Active' : 'Inactive'}
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-4 text-center">
                          <div className="flex items-center justify-center">
                            <ActionMenu
                              actions={[
                                {
                                  icon: Eye,
                                  label: 'View Details',
                                  onClick: () =>
                                    navigate(`/dashboard/super-admin/admins/${admin._id}`),
                                  color: 'text-slate-700 hover:bg-slate-50',
                                },
                                {
                                  icon: SquarePen,
                                  label: 'Edit Admin',
                                  onClick: () =>
                                    navigate(`/dashboard/super-admin/admins/edit/${admin._id}`),
                                  color: 'text-[#00A9CE] hover:bg-[#00A9CE]/5',
                                },
                                {
                                  icon: Trash2,
                                  label: 'Delete Admin',
                                  danger: true,
                                  onClick: () => {
                                    if (
                                      window.confirm(
                                        `Are you sure you want to delete ${admin.fullName}?`
                                      )
                                    ) {
                                      handleDelete(admin._id);
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
                  <Users className="w-8 h-8 text-slate-200" />
                </div>
                <p className="text-sm font-black text-slate-800 tracking-tight">No admins found</p>
                <p className="text-xs text-slate-400 font-medium mt-1">{searchTerm || filterStatus !== 'all' ? 'Try adjusting filters' : 'Add your first admin'}</p>
              </div>
            )}
          </div>
          <Pagination page={page} total={filtered.length} totalPages={totalPages} pageSize={PAGE_SIZE} onPageChange={setPage} />
        </div>
      </div>

      <button onClick={() => navigate('/dashboard/super-admin/admins/create')}
        className="md:hidden fixed bottom-8 right-8 w-16 h-16 bg-[#003399] text-white rounded-2xl shadow-xl shadow-blue-500/30 z-50 flex items-center justify-center hover:scale-110 active:scale-95 transition-all">
        <Plus className="w-8 h-8" />
      </button>
    </SuperAdminDashboardLayout>
  );
};

export default AdminManagement;