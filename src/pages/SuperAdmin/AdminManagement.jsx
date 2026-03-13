// src/pages/SuperAdmin/AdminManagement.jsx
import { useToast } from '../../context/ToastContext';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiCall from '../../api/Api';
import {
  Users, Plus, Search, SquarePen, Trash2, Eye, Phone, Shield,
  GraduationCap, UserRoundCheck, UserRoundX, ChevronLeft, ChevronRight,
  RefreshCw, Filter, X, TrendingUp, Building2,
} from 'lucide-react';
import SuperAdminDashboardLayout from '../../components/layout/SuperAdminDashboardLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
 
const PAGE_SIZE = 10;
 
const Toggle = ({ checked, onToggle }) => (
  <button type="button" onClick={onToggle}
    className={`relative inline-flex items-center w-9 h-5 rounded-full flex-shrink-0 transition-colors duration-200 focus:outline-none ${
      checked ? 'bg-gradient-to-r from-blue-500 to-cyan-400' : 'bg-gray-300 hover:bg-gray-400'}`}>
    <span className={`inline-block w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${checked ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
  </button>
);
 
const Pagination = ({ page, total, totalPages, pageSize, onPageChange }) => {
  if (totalPages <= 1) return null;
  const from = (page - 1) * pageSize + 1, to = Math.min(page * pageSize, total);
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
    .reduce((acc, p, i, arr) => { if (i > 0 && p - arr[i-1] > 1) acc.push('…'); acc.push(p); return acc; }, []);
  return (
    <div className="px-4 py-3 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between">
      <span className="text-[11px] text-gray-500">Showing {from}–{to} of {total}</span>
      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange(page-1)} disabled={page===1} className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600 disabled:opacity-40 transition-colors"><ChevronLeft className="w-3.5 h-3.5"/></button>
        {pages.map((p,i) => p==='…' ? <span key={`e${i}`} className="px-1.5 text-gray-400 text-xs">…</span>
          : <button key={p} onClick={() => onPageChange(p)} className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${p===page ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-sm' : 'border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600'}`}>{p}</button>)}
        <button onClick={() => onPageChange(page+1)} disabled={page===totalPages} className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600 disabled:opacity-40 transition-colors"><ChevronRight className="w-3.5 h-3.5"/></button>
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
        const sorted = (data.admins || []).sort((a,b) => new Date(b.createdAt)-new Date(a.createdAt));
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
      setAdmins(prev => { const u = prev.map(a => a._id===id ? {...a, isActive: !current} : a); calcStats(u); return u; });
    } catch (err) { toast.error('Error', err.message); }
  };
 
  const filtered = admins.filter(a => {
    const q = searchTerm.toLowerCase();
    return (a.fullName?.toLowerCase().includes(q) || a.email?.toLowerCase().includes(q) || a.college?.name?.toLowerCase().includes(q)) &&
      (filterStatus==='all' || (filterStatus==='active' && a.isActive) || (filterStatus==='inactive' && !a.isActive));
  });
 
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);
 
  // College distribution
  const collegeMap = {};
  admins.forEach(a => { const n = a.college?.name || 'Unknown'; collegeMap[n] = (collegeMap[n]||0)+1; });
  const topColleges = Object.entries(collegeMap).sort((a,b)=>b[1]-a[1]).slice(0,2);
  const maxCol = topColleges[0]?.[1] || 1;
 
  if (loading) return <LoadingSpinner message="Loading Admins…" />;
 
  return (
    <SuperAdminDashboardLayout>
 
      {/* Hero */}
      <div className="relative bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 rounded-2xl px-5 py-4 mb-4 shadow-xl shadow-blue-500/20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-10 -right-10 w-44 h-44 bg-white/10 rounded-full"/>
          <div className="absolute -bottom-8 left-1/3 w-28 h-28 bg-white/10 rounded-full"/>
          <div className="absolute inset-0 opacity-[0.04]" style={{backgroundImage:'radial-gradient(circle,white 1px,transparent 1px)',backgroundSize:'18px 18px'}}/>
        </div>
        <div className="relative flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0"><Users className="w-5 h-5 text-white"/></div>
            <div>
              <h1 className="text-white font-black text-lg leading-tight">Admin Management</h1>
              <p className="text-blue-200 text-[11px] mt-0.5">Manage college administrators · {stats.total} total</p>
            </div>
          </div>
          <button onClick={() => navigate('/dashboard/super-admin/admins/create')}
            className="inline-flex items-center gap-1.5 bg-white text-blue-600 text-xs font-bold px-4 py-2.5 rounded-xl shadow-md hover:bg-blue-50 hover:scale-105 transition-all flex-shrink-0">
            <Plus className="w-4 h-4"/> Add Admin
          </button>
        </div>
      </div>
 
      {/* Stats + college distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="lg:col-span-2 bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-3 flex items-stretch">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full">
            {[
              { icon: Users,          label: 'Total Admins', value: stats.total,    color: 'bg-blue-50 border-blue-100 text-blue-600' },
              { icon: UserRoundCheck, label: 'Active',       value: stats.active,   color: 'bg-cyan-50 border-cyan-100 text-cyan-600' },
              { icon: UserRoundX,     label: 'Inactive',     value: stats.inactive, color: 'bg-red-50 border-red-100 text-red-500' },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className={`flex items-center gap-3 px-4 py-4 rounded-xl border ${color}`}>
                <Icon className="w-4 h-4 flex-shrink-0 opacity-70"/>
                <div><p className="text-xl font-black leading-none">{value}</p><p className="text-[10px] font-semibold opacity-60 mt-0.5">{label}</p></div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-4 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-md flex items-center justify-center"><Building2 className="w-2.5 h-2.5 text-white"/></div>
            <p className="text-xs font-bold text-gray-800">Admins per College</p>
          </div>
          <div className="space-y-3">
            {topColleges.length > 0 ? topColleges.map(([name, count]) => (
              <div key={name}>
                <div className="flex justify-between mb-1">
                  <span className="text-[10px] text-gray-600 truncate max-w-[110px]">{name}</span>
                  <span className="text-[10px] font-black text-blue-600">{count}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400" style={{width:`${Math.round((count/maxCol)*100)}%`}}/>
                </div>
              </div>
            )) : <p className="text-[10px] text-gray-400 text-center py-2">No data</p>}
          </div>
        </div>
      </div>
 
      {/* Search */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-3 mb-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
            <input type="text" placeholder="Search by name, email, or college…" value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"/>
            {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="w-3.5 h-3.5"/></button>}
          </div>
          <div className="flex gap-2">
            <div className="relative flex items-center">
              <Filter className="absolute left-3 w-3.5 h-3.5 text-gray-400 pointer-events-none"/>
              <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
                className="pl-8 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white appearance-none">
                <option value="all">All</option><option value="active">Active</option><option value="inactive">Inactive</option>
              </select>
            </div>
            <button onClick={fetchAdmins} disabled={loading}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl hover:opacity-90 disabled:opacity-60 shadow-sm transition-all">
              <RefreshCw className={`w-3.5 h-3.5 ${loading?'animate-spin':''}`}/> Refresh
            </button>
          </div>
        </div>
      </div>
 
      {/* Table */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {paginated.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-gray-100">
                  {['Admin','College','Contact','Role','Status','Actions'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-[10px] font-black text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginated.map(admin => (
                  <tr key={admin._id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-white text-sm font-black flex-shrink-0 shadow-sm">
                          {admin.fullName?.charAt(0) || 'A'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-gray-900 truncate max-w-[130px]">{admin.fullName || 'N/A'}</p>
                          <p className="text-[10px] text-gray-400 truncate max-w-[130px]">{admin.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <GraduationCap className="w-3 h-3 text-blue-400 flex-shrink-0"/>
                        <span className="text-xs font-medium text-gray-700 truncate max-w-[120px]">{admin.college?.name || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {admin.phone ? (
                        <div className="flex items-center gap-1 text-[11px] text-gray-500"><Phone className="w-3 h-3 text-gray-400"/>{admin.phone}</div>
                      ) : <span className="text-[10px] text-gray-400">N/A</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-700 rounded-lg border border-blue-100">
                        <Shield className="w-3 h-3"/> College Admin
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Toggle checked={admin.isActive} onToggle={() => handleToggle(admin._id, admin.isActive)}/>
                        <span className={`text-[10px] font-bold ${admin.isActive ? 'text-blue-600' : 'text-gray-400'}`}>
                          {admin.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => navigate(`/dashboard/super-admin/admins/${admin._id}`)} className="p-1.5 text-blue-500 hover:bg-blue-100 rounded-lg transition-colors"><Eye className="w-3.5 h-3.5"/></button>
                        <button onClick={() => navigate(`/dashboard/super-admin/admins/edit/${admin._id}`)} className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"><SquarePen className="w-3.5 h-3.5"/></button>
                        <button onClick={() => handleDelete(admin._id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5"/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-3"><Users className="w-7 h-7 text-blue-200"/></div>
              <p className="text-sm font-semibold text-gray-600">No admins found</p>
              <p className="text-xs text-gray-400 mt-1">{searchTerm || filterStatus!=='all' ? 'Try adjusting filters' : 'Add your first admin'}</p>
            </div>
          )}
        </div>
        <Pagination page={page} total={filtered.length} totalPages={totalPages} pageSize={PAGE_SIZE} onPageChange={setPage}/>
      </div>
    </SuperAdminDashboardLayout>
  );
};
export default AdminManagement;