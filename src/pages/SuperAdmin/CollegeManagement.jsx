// src/pages/SuperAdmin/CollegeManagement.jsx
import { useToast } from '../../context/ToastContext';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import apiCall from '../../api/Api';
import {
  Building2, Plus, Search, Eye, SquarePen, Trash2, MapPin,
  Users, Briefcase, CircleCheck, RefreshCw, Clock, FileText,
  GraduationCap, ChevronLeft, ChevronRight, Filter, X,
} from 'lucide-react';
import SuperAdminDashboardLayout from '../../components/layout/SuperAdminDashboardLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';

/* ── Toggle ── */
const Toggle = ({ checked, onToggle }) => (
  <button type="button" onClick={onToggle}
    className={`relative inline-flex items-center w-9 h-5 rounded-full flex-shrink-0 transition-colors duration-200 focus:outline-none ${
      checked ? 'bg-gradient-to-r from-blue-500 to-cyan-400' : 'bg-gray-300 hover:bg-gray-400'}`}
  >
    <span className={`inline-block w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${
      checked ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
  </button>
);

/* ── Stat pill ── */
const StatPill = ({ icon: Icon, label, value, color }) => {
  const c = {
    blue:   'bg-blue-50 border-blue-100 text-blue-600',
    cyan:   'bg-cyan-50 border-cyan-100 text-cyan-600',
    indigo: 'bg-indigo-50 border-indigo-100 text-indigo-600',
    violet: 'bg-violet-50 border-violet-100 text-violet-600',
  }[color] || 'bg-blue-50 border-blue-100 text-blue-600';
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${c}`}>
      <Icon className="w-4 h-4 flex-shrink-0 opacity-70" />
      <div>
        <p className="text-xl font-black leading-none">{value}</p>
        <p className="text-[10px] font-semibold opacity-60 mt-0.5">{label}</p>
      </div>
    </div>
  );
};

/* ── Pagination ── */
const Pagination = ({ page, total, totalPages, pageSize, onPageChange }) => {
  if (totalPages <= 1) return null;
  const from  = (page - 1) * pageSize + 1;
  const to    = Math.min(page * pageSize, total);
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
    .reduce((acc, p, i, arr) => { if (i > 0 && p - arr[i-1] > 1) acc.push('…'); acc.push(p); return acc; }, []);
  return (
    <div className="px-4 py-3 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between">
      <span className="text-[11px] text-gray-500">Showing {from}–{to} of {total}</span>
      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange(page - 1)} disabled={page === 1}
          className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600 disabled:opacity-40 transition-colors">
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        {pages.map((p, i) => p === '…'
          ? <span key={`e${i}`} className="px-1.5 text-gray-400 text-xs">…</span>
          : <button key={p} onClick={() => onPageChange(p)}
              className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${
                p === page
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-sm'
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

/* ══════════════════════════════════════════ */
const CollegeManagement = () => {
  const toast    = useToast();
  const navigate = useNavigate();

  const [colleges,      setColleges]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [searchTerm,    setSearchTerm]    = useState('');
  const [filterStatus,  setFilterStatus]  = useState('all');
  const [currentPage,   setCurrentPage]   = useState(1);
  const [totalPages,    setTotalPages]    = useState(1);
  const [totalColleges, setTotalColleges] = useState(0);
  const [lastUpdated,   setLastUpdated]   = useState(new Date());

  const PAGE_SIZE = 10;

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
  }, [currentPage, searchTerm, filterStatus]);

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

  const totalStudents  = colleges.reduce((s,c) => s + (c.liveCounts?.studentsCount  || 0), 0);
  const totalCompanies = colleges.reduce((s,c) => s + (c.liveCounts?.companiesCount || 0), 0);
  const activeCount    = colleges.filter(c => c.isActive).length;

  if (loading && colleges.length === 0)
    return <LoadingSpinner message="Loading Colleges…" submessage="Fetching college data" />;

  return (
    <SuperAdminDashboardLayout>

      {/* Hero */}
      <div className="relative bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 rounded-2xl px-5 py-4 mb-4 shadow-xl shadow-blue-500/20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-10 -right-10 w-44 h-44 bg-white/10 rounded-full" />
          <div className="absolute -bottom-8 left-1/3 w-28 h-28 bg-white/10 rounded-full" />
          <div className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: 'radial-gradient(circle,white 1px,transparent 1px)', backgroundSize: '18px 18px' }} />
        </div>
        <div className="relative flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-black text-lg leading-tight">College Management</h1>
              <p className="text-blue-200 text-[11px] mt-0.5">Manage all registered colleges · {totalColleges} total</p>
              <p className="text-blue-300 text-[10px] font-mono mt-0.5">
                <Clock className="inline w-3 h-3 mr-0.5" />{lastUpdated.toLocaleTimeString()}
              </p>
            </div>
          </div>
          <button onClick={() => navigate('/dashboard/super-admin/colleges/new')}
            className="inline-flex items-center gap-1.5 bg-white text-blue-600 text-xs font-bold px-4 py-2.5 rounded-xl shadow-md hover:bg-blue-50 hover:scale-105 transition-all flex-shrink-0"
          >
            <Plus className="w-4 h-4" /> Add College
          </button>
        </div>
      </div>

      {/* Stat pills */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-3 mb-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          <StatPill icon={Building2}     label="Total Colleges"  value={totalColleges} color="blue"   />
          <StatPill icon={CircleCheck}   label="Active"          value={activeCount}   color="cyan"   />
          <StatPill icon={GraduationCap} label="Total Students"  value={totalStudents} color="indigo" />
          <StatPill icon={Briefcase}     label="Total Companies" value={totalCompanies} color="violet" />
        </div>
      </div>

      {/* Search & filter bar */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-3 mb-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input type="text" placeholder="Search by name or code…" value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <div className="relative flex items-center">
              <Filter className="absolute left-3 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                className="pl-8 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white appearance-none"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <button onClick={fetchColleges} disabled={loading}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl hover:opacity-90 disabled:opacity-60 transition-all shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {colleges.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-gray-100">
                  {['College','Code','Location','Students','Companies','JDs','Admins','Status','Actions'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-[10px] font-black text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {colleges.map(college => {
                  const lc = college.liveCounts || {};
                  return (
                    <tr key={college._id} className="hover:bg-blue-50/30 transition-colors group">

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-white text-[10px] font-black flex-shrink-0 shadow-sm">
                            {college.code?.substring(0,2)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-gray-900 truncate max-w-[140px]">{college.name}</p>
                            <p className="text-[10px] text-gray-400 truncate max-w-[140px]">{college.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-700 rounded-lg">{college.code}</span>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-[11px] text-gray-500">
                          <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                          {college.address?.city || '—'}, {college.address?.state || '—'}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <button onClick={() => navigate(`/dashboard/super-admin/colleges/${college._id}/students`)}
                          className="flex items-center gap-1 text-xs font-semibold text-gray-700 hover:text-blue-600 transition-colors group/s"
                        >
                          <GraduationCap className="w-3 h-3 text-gray-400 group-hover/s:text-blue-500" />
                          {lc.studentsCount ?? 0}
                        </button>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-xs font-semibold text-gray-700">
                          <Briefcase className="w-3 h-3 text-cyan-500" />
                          {lc.companiesCount ?? 0}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-xs font-semibold text-gray-700">
                          <FileText className="w-3 h-3 text-blue-400" />
                          {lc.jdsCount ?? 0}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-xs font-semibold text-gray-700">
                          <Users className="w-3 h-3 text-indigo-400" />
                          {lc.adminsCount ?? 0}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Toggle checked={college.isActive} onToggle={() => handleToggle(college._id, college.isActive, college.name)} />
                          <span className={`text-[10px] font-bold ${college.isActive ? 'text-blue-600' : 'text-gray-400'}`}>
                            {college.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => navigate(`/dashboard/super-admin/colleges/${college._id}`)}
                            className="p-1.5 text-blue-500 hover:bg-blue-100 rounded-lg transition-colors" title="View">
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => navigate(`/dashboard/super-admin/colleges/${college._id}/edit`)}
                            className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors" title="Edit">
                            <SquarePen className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDelete(college._id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-3">
                <Building2 className="w-7 h-7 text-blue-200" />
              </div>
              <p className="text-sm font-semibold text-gray-600">No colleges found</p>
              <p className="text-xs text-gray-400 mt-1">{searchTerm ? 'Try adjusting your search' : 'Start by adding a new college'}</p>
              {!searchTerm && (
                <button onClick={() => navigate('/dashboard/super-admin/colleges/new')}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-sm hover:scale-105 transition-all"
                ><Plus className="w-3 h-3" /> Add College</button>
              )}
            </div>
          )}
        </div>
        <Pagination page={currentPage} total={totalColleges} totalPages={totalPages} pageSize={PAGE_SIZE} onPageChange={setCurrentPage} />
      </div>

      {/* Mobile FAB */}
      <button onClick={() => navigate('/dashboard/super-admin/colleges/new')}
        className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-full shadow-xl z-50 flex items-center justify-center hover:scale-110 transition-all"
      ><Plus className="w-6 h-6" /></button>

    </SuperAdminDashboardLayout>
  );
};

export default CollegeManagement;