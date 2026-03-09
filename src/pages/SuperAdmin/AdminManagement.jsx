import { useToast } from '../../context/ToastContext';
// pages/SuperAdmin/AdminManagement.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiCall from '../../api/Api';
import {
  Users, Plus, Search, SquarePen, Trash2, Eye, Phone, Shield,
  GraduationCap, UserRoundCheck, UserRoundX, ChevronLeft, ChevronRight, RefreshCw,
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const PAGE_SIZE = 10;

/* ─── Reliable toggle ─── */
const Toggle = ({ checked, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    title={checked ? 'Click to deactivate' : 'Click to activate'}
    className={`relative inline-flex items-center w-9 h-5 rounded-full flex-shrink-0
      transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
      ${checked
        ? 'bg-gradient-to-r from-blue-500 to-cyan-400'
        : 'bg-gray-300 hover:bg-gray-400'}`}
  >
    <span
      className={`inline-block w-4 h-4 bg-white rounded-full shadow-sm
        transform transition-transform duration-200
        ${checked ? 'translate-x-[18px]' : 'translate-x-[2px]'}`}
    />
  </button>
);

const Pagination = ({ page, total, totalPages, pageSize, onPageChange }) => {
  if (totalPages <= 1) return null;
  const from  = (page - 1) * pageSize + 1;
  const to    = Math.min(page * pageSize, total);
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
    .reduce((acc, p, i, arr) => { if (i > 0 && p - arr[i - 1] > 1) acc.push('…'); acc.push(p); return acc; }, []);
  return (
    <div className="px-5 py-3 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between">
      <p className="text-gray-500 text-xs">Showing {from}–{to} of {total}</p>
      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange(page - 1)} disabled={page === 1}
          className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600 disabled:opacity-40 transition-colors">
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        {pages.map((p, i) =>
          p === '…'
            ? <span key={`e${i}`} className="px-1.5 text-gray-400 text-xs">…</span>
            : <button key={p} onClick={() => onPageChange(p)}
                className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${
                  p === page
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                    : 'border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600'}`}>
                {p}
              </button>
        )}
        <button onClick={() => onPageChange(page + 1)} disabled={page === totalPages}
          className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600 disabled:opacity-40 transition-colors">
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

const AdminManagement = () => {
  const toast    = useToast();
  const navigate = useNavigate();
  const [loading,      setLoading]      = useState(true);
  const [admins,       setAdmins]       = useState([]);
  const [searchTerm,   setSearchTerm]   = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [page,         setPage]         = useState(1);
  const [stats,        setStats]        = useState({ total: 0, active: 0, inactive: 0 });

  useEffect(() => { fetchAdmins(); }, []);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const data = await apiCall('/super-admin/admins');
      if (data.success) {
        const sorted = (data.admins || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setAdmins(sorted);
        calcStats(sorted);
      }
    } catch (err) {
      toast.error('Error', 'Failed to fetch admins: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const calcStats = (list) => {
    const active = list.filter(a => a.isActive).length;
    setStats({ total: list.length, active, inactive: list.length - active });
  };

  const handleDeleteAdmin = async (id) => {
    try {
      await apiCall(`/super-admin/admins/${id}`, { method: 'DELETE' });
      toast.success('Deleted', 'Admin deleted successfully');
      setAdmins(prev => { const u = prev.filter(a => a._id !== id); calcStats(u); return u; });
    } catch (err) {
      toast.error('Error', 'Failed to delete admin: ' + err.message);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await apiCall(`/super-admin/admins/${id}/toggle-status`, { method: 'PATCH' });
      toast.success('Updated', `Admin ${currentStatus ? 'deactivated' : 'activated'}`);
      setAdmins(prev => {
        const u = prev.map(a => a._id === id ? { ...a, isActive: !currentStatus } : a);
        calcStats(u);
        return u;
      });
    } catch (err) {
      toast.error('Error', 'Failed to update status: ' + err.message);
    }
  };

  const filtered = admins.filter(a => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      a.fullName?.toLowerCase().includes(q) ||
      a.email?.toLowerCase().includes(q) ||
      a.college?.name?.toLowerCase().includes(q);
    const matchStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active'   && a.isActive) ||
      (filterStatus === 'inactive' && !a.isActive);
    return matchSearch && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (loading) return <LoadingSpinner message="Loading Admins..." />;

  return (
    <DashboardLayout title="Admin Management">

      {/* ── Banner ── */}
      <div className="mb-6">
        <div className="relative bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 rounded-2xl p-6 shadow-xl overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute w-56 h-56 bg-white rounded-full -top-16 -right-16" />
          </div>
          <div className="relative flex items-center justify-between flex-wrap gap-4">
            <div className="text-white">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <h1 className="text-xl font-bold">Admin Management</h1>
              </div>
              <p className="text-blue-100 text-sm">Manage college administrators and their access</p>
            </div>
            <button
              onClick={() => navigate('/dashboard/super-admin/admins/create')}
              className="flex items-center gap-2 bg-white text-blue-600 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-50 transition-all shadow-md hover:scale-105"
            >
              <Plus className="w-4 h-4" /> Add Admin
            </button>
          </div>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Admins', value: stats.total,    icon: Users,          gradient: 'from-blue-600 to-cyan-500',   vc: 'text-gray-900'  },
          { label: 'Active',       value: stats.active,   icon: UserRoundCheck, gradient: 'from-blue-500 to-cyan-400',   vc: 'text-blue-600'  },
          { label: 'Inactive',     value: stats.inactive, icon: UserRoundX,     gradient: 'from-slate-400 to-slate-500', vc: 'text-slate-600' },
        ].map(({ label, value, icon: Icon, gradient, vc }) => (
          <div key={label} className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-white/60 flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-1">{label}</p>
              <p className={`text-2xl font-black ${vc}`}>{value}</p>
            </div>
            <div className={`w-11 h-11 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center shadow-md`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
          </div>
        ))}
      </div>

      {/* ── Search ── */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-sm p-4 mb-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or college..."
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
            />
          </div>
          <div className="flex gap-2">
            <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
              className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white">
              <option value="all">All Admins</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <button onClick={fetchAdmins} disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl hover:opacity-90 disabled:opacity-60 transition-all shadow-sm">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {paginated.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-gray-100">
                  {['Admin', 'College', 'Contact', 'Role', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginated.map(admin => (
                  <tr key={admin._id} className="hover:bg-blue-50/40 transition-colors">

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0">
                          {admin.fullName?.charAt(0) || 'A'}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-gray-900 truncate max-w-[140px]">{admin.fullName || 'N/A'}</div>
                          <div className="text-xs text-gray-400 truncate max-w-[140px]">{admin.email}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <GraduationCap className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                        <span className="text-xs font-medium text-gray-700 truncate max-w-[130px]">
                          {admin.college?.name || 'N/A'}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      {admin.phone
                        ? <div className="flex items-center gap-1.5 text-gray-600 text-xs">
                            <Phone className="w-3.5 h-3.5 text-gray-400" />
                            {admin.phone}
                          </div>
                        : <span className="text-gray-400 text-xs">N/A</span>
                      }
                    </td>

                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-blue-50 text-blue-700 rounded-lg">
                        <Shield className="w-3 h-3" /> College Admin
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Toggle checked={admin.isActive} onToggle={() => handleToggleStatus(admin._id, admin.isActive)} />
                        <span className={`text-xs font-semibold ${admin.isActive ? 'text-blue-600' : 'text-gray-400'}`}>
                          {admin.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => navigate(`/dashboard/super-admin/admins/${admin._id}`)}
                          className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="View">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => navigate(`/dashboard/super-admin/admins/edit/${admin._id}`)}
                          className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors" title="Edit">
                          <SquarePen className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDeleteAdmin(admin._id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-16">
              <Users className="w-14 h-14 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No admins found</p>
              <p className="text-gray-400 text-sm mt-1">
                {searchTerm || filterStatus !== 'all' ? 'Try adjusting filters' : 'Add your first admin'}
              </p>
            </div>
          )}
        </div>
        <Pagination page={page} total={filtered.length} totalPages={totalPages} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </div>
    </DashboardLayout>
  );
};

export default AdminManagement;