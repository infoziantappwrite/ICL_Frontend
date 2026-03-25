// src/pages/SuperAdmin/CompanyManagement.jsx
import { useToast } from '../../context/ToastContext';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, Plus, Search, SquarePen, Trash2, Eye, MapPin,
  CircleCheck, CircleX, ChevronLeft, ChevronRight,
  RefreshCw, Globe, Briefcase, Filter, X, TrendingUp,
} from 'lucide-react';
import SuperAdminDashboardLayout from '../../components/layout/SuperAdminDashboardLayout';
import { TableSkeleton } from '../../components/common/SkeletonLoader';
import { companyAPI } from '../../api/Api';

const PAGE_SIZE = 10;

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
    red:    'bg-red-50 border-red-100 text-red-500',
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
const CompanyManagement = () => {
  const toast    = useToast();
  const navigate = useNavigate();

  const [loading,      setLoading]      = useState(true);
  const [companies,    setCompanies]    = useState([]);
  const [searchTerm,   setSearchTerm]   = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [page,         setPage]         = useState(1);
  const [stats,        setStats]        = useState({ total: 0, active: 0, inactive: 0 });

  useEffect(() => { fetchCompanies(); }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const response = await companyAPI.getAllCompanies();
      if (response.success) {
        const detailed = await Promise.all(
          response.companies.map(async (company) => {
            try {
              const d = await companyAPI.getCompanyById(company._id);
              if (d.success && d.company)
                return { ...company, headquarters: d.company.headquarters, location: d.company.location };
            } catch {}
            return company;
          })
        );
        const sorted = detailed.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setCompanies(sorted);
        calcStats(sorted);
      }
    } catch (err) {
      toast.error('Error', 'Failed to fetch companies');
    } finally {
      setLoading(false);
    }
  };

  const calcStats = (list) => {
    const total  = list.length;
    const active = list.filter(c => c.isActive).length;
    setStats({ total, active, inactive: total - active });
  };

  const handleDelete = async (id) => {
    try {
      await companyAPI.deleteCompany(id);
      toast.success('Deleted', 'Company deleted');
      setCompanies(prev => { const u = prev.filter(c => c._id !== id); calcStats(u); return u; });
    } catch { toast.error('Error', 'Failed to delete company'); }
  };

  const handleToggle = async (id, current) => {
    try {
      await companyAPI.toggleActiveStatus(id);
      toast.success('Updated', `Company ${current ? 'deactivated' : 'activated'}`);
      setCompanies(prev => { const u = prev.map(c => c._id === id ? { ...c, isActive: !current } : c); calcStats(u); return u; });
    } catch { toast.error('Error', 'Failed to update status'); }
  };

  const filtered = companies.filter(c => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      c.name?.toLowerCase().includes(q) ||
      (c.headquarters?.city || c.location || '').toLowerCase().includes(q) ||
      (c.industry || '').toLowerCase().includes(q);
    const matchStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && c.isActive) ||
      (filterStatus === 'inactive' && !c.isActive);
    return matchSearch && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  /* industry mini-chart */
  const indMap = {};
  companies.forEach(c => { const k = c.industry || 'Other'; indMap[k] = (indMap[k]||0)+1; });
  const topIndustries = Object.entries(indMap).sort((a,b) => b[1]-a[1]).slice(0, 4);
  const maxInd = topIndustries[0]?.[1] || 1;

  if (loading) return <TableSkeleton layout={SuperAdminDashboardLayout} />;

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
        <div className="relative flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-black text-lg leading-tight">Company Management</h1>
              <p className="text-blue-200 text-[11px] mt-0.5">Manage all companies · {stats.total} total</p>
            </div>
          </div>
          <button onClick={() => navigate('/dashboard/super-admin/companies/create')}
            className="inline-flex items-center gap-1.5 bg-white text-blue-600 text-xs font-bold px-4 py-2.5 rounded-xl shadow-md hover:bg-blue-50 hover:scale-105 transition-all flex-shrink-0"
          >
            <Plus className="w-4 h-4" /> Add Company
          </button>
        </div>
      </div>

      {/* Stats + industry mini chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">

        {/* Stat pills */}
        <div className="lg:col-span-2 bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <StatPill icon={Building2}   label="Total"    value={stats.total}    color="blue"   />
            <StatPill icon={CircleCheck} label="Active"   value={stats.active}   color="cyan"   />
            <StatPill icon={CircleX}     label="Inactive" value={stats.inactive} color="red"    />
            <StatPill icon={TrendingUp}  label="Active Rate" value={stats.total > 0 ? `${Math.round((stats.active/stats.total)*100)}%` : '0%'} color="indigo" />
          </div>
        </div>

        {/* Industry mini chart */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-md flex items-center justify-center">
              <Briefcase className="w-2.5 h-2.5 text-white" />
            </div>
            <p className="text-xs font-bold text-gray-800">Top Industries</p>
          </div>
          <div className="space-y-2">
            {topIndustries.length > 0 ? topIndustries.map(([name, count]) => (
              <div key={name}>
                <div className="flex justify-between mb-0.5">
                  <span className="text-[10px] text-gray-600 font-medium truncate max-w-[100px]">{name}</span>
                  <span className="text-[10px] font-black text-blue-600">{count}</span>
                </div>
                <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-700"
                    style={{ width: `${Math.round((count/maxInd)*100)}%` }} />
                </div>
              </div>
            )) : <p className="text-[10px] text-gray-400 text-center py-2">No data yet</p>}
          </div>
        </div>
      </div>

      {/* Search & filter */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-3 mb-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search by name, location, or industry…" value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
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
              <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
                className="pl-8 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white appearance-none"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <button onClick={fetchCompanies} disabled={loading}
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
          {paginated.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-gray-100">
                  {['Company','Industry','Location','Website','Status','Actions'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-[10px] font-black text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginated.map(company => (
                  <tr key={company._id} className="hover:bg-blue-50/30 transition-colors group">

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-white text-sm font-black flex-shrink-0 shadow-sm">
                          {company.name?.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-gray-900 truncate max-w-[140px]">{company.name}</p>
                          {company.email && <p className="text-[10px] text-gray-400 truncate max-w-[140px]">{company.email}</p>}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-700 rounded-lg">
                        {company.industry || 'N/A'}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-[11px] text-gray-500">
                        <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                        {company.headquarters?.city
                          ? [company.headquarters.city, company.headquarters.state].filter(Boolean).join(', ')
                          : company.location || 'N/A'}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      {company.website
                        ? <a href={company.website} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-500 hover:text-blue-700 hover:underline"
                          ><Globe className="w-3 h-3" /> Visit</a>
                        : <span className="text-[10px] text-gray-400">N/A</span>}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Toggle checked={company.isActive} onToggle={() => handleToggle(company._id, company.isActive)} />
                        <span className={`text-[10px] font-bold ${company.isActive ? 'text-blue-600' : 'text-gray-400'}`}>
                          {company.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => navigate(`/dashboard/super-admin/companies/${company._id}`)}
                          className="p-1.5 text-blue-500 hover:bg-blue-100 rounded-lg transition-colors" title="View">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => navigate(`/dashboard/super-admin/companies/edit/${company._id}`)}
                          className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors" title="Edit">
                          <SquarePen className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(company._id)}
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
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-3">
                <Building2 className="w-7 h-7 text-blue-200" />
              </div>
              <p className="text-sm font-semibold text-gray-600">No companies found</p>
              <p className="text-xs text-gray-400 mt-1">
                {searchTerm || filterStatus !== 'all' ? 'Try adjusting your filters' : 'Add your first company'}
              </p>
              {!searchTerm && filterStatus === 'all' && (
                <button onClick={() => navigate('/dashboard/super-admin/companies/create')}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-sm hover:scale-105 transition-all"
                ><Plus className="w-3 h-3" /> Add Company</button>
              )}
            </div>
          )}
        </div>
        <Pagination page={page} total={filtered.length} totalPages={totalPages} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </div>

    </SuperAdminDashboardLayout>
  );
};

export default CompanyManagement;