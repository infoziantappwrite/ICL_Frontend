// pages/CollegeAdmin/CompanyManagement.jsx
import { useToast } from '../../context/ToastContext';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, Plus, Search, SquarePen, Trash2, Eye, MapPin,
  CircleCheck, CircleX, ChevronLeft, ChevronRight,
  RefreshCw, Globe, Briefcase, Filter, X, TrendingUp,
} from 'lucide-react';
import CollegeAdminLayout from '../../components/layout/CollegeAdminLayout';
import { TableSkeleton } from '../../components/common/SkeletonLoader';
import ActionMenu from '../../components/common/ActionMenu';
import { collegeAdminAPI } from '../../api/Api';

const PAGE_SIZE = 10;

/* ── Toggle ── */
const Toggle = ({ checked, onToggle }) => (
  <button type="button" onClick={onToggle}
    className={`relative inline-flex items-center w-9 h-5 rounded-full flex-shrink-0 transition-colors duration-200 focus:outline-none ${
      checked ? 'bg-gradient-to-r from-[#003399] to-[#00A9CE]' : 'bg-gray-300 hover:bg-gray-400'}`}
  >
    <span className={`inline-block w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${
      checked ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
  </button>
);

/* ── Stat pill ── */
const StatPill = ({ icon: Icon, label, value, color }) => {
  const c = {
    blue:   'text-[#003399]',
    cyan:   'text-cyan-600',
    indigo: 'text-indigo-600',
    red:    'text-red-500',
  }[color] || 'text-[#003399]';
  return (
    <div className={`flex items-center gap-3 p-4 rounded-xl shadow-sm bg-white border border-slate-100`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${c.replace('text-', 'bg-').replace('600', '50').replace('500', '50')}`}>
        <Icon className={`w-5 h-5 ${c}`} />
      </div>
      <div className="flex-1">
        <p className="text-[12px] font-bold text-gray-500 mb-0.5">{label}</p>
        <p className={`text-[24px] font-black leading-none ${c}`}>{value}</p>
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
    <div className="px-6 py-4 bg-white border-t border-slate-100 flex items-center justify-between">
      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Showing {from}–{to} of {total}</span>
      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange(page - 1)} disabled={page === 1}
          className="p-1.5 rounded-lg border border-slate-100 text-slate-400 hover:border-[#003399]/30 hover:text-[#003399] disabled:opacity-40 transition-colors">
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        {pages.map((p, i) => p === '…'
          ? <span key={`e${i}`} className="px-1.5 text-slate-400 text-xs">…</span>
          : <button key={p} onClick={() => onPageChange(p)}
              className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${
                p === page
                  ? 'bg-[#003399] text-white shadow-md shadow-blue-500/10'
                  : 'border border-slate-100 text-slate-500 hover:border-[#003399]/30 hover:text-[#003399]'}`}>
              {p}
            </button>
        )}
        <button onClick={() => onPageChange(page + 1)} disabled={page === totalPages}
          className="p-1.5 rounded-lg border border-slate-100 text-slate-400 hover:border-[#003399]/30 hover:text-[#003399] disabled:opacity-40 transition-colors">
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
  useEffect(() => { setPage(1); }, [searchTerm, filterStatus]);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const response = await collegeAdminAPI.getCompanies();
      if (response.success) {
        const sorted = (response.companies || []).sort(
          (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        );
        setCompanies(sorted);
        calcStats(sorted);
      }
    } catch (err) {
      toast.error('Error', 'Failed to fetch companies: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const calcStats = (list) => {
    const total  = list.length;
    const active = list.filter(c => c.isActive).length;
    setStats({ total, active, inactive: total - active });
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) return;
    try {
      await collegeAdminAPI.deleteCompany(id);
      toast.success('Deleted', 'Company deleted successfully');
      setCompanies(prev => { const u = prev.filter(c => c._id !== id); calcStats(u); return u; });
    } catch (err) { toast.error('Error', 'Failed to delete company: ' + err.message); }
  };

  const handleToggle = async (id, current) => {
    try {
      const updated = companies.map(c => c._id === id ? { ...c, isActive: !current } : c);
      setCompanies(updated);
      calcStats(updated);
      await collegeAdminAPI.updateCompany(id, { isActive: !current });
      toast.success('Updated', `Company ${current ? 'deactivated' : 'activated'} successfully`);
    } catch (err) {
      toast.error('Error', 'Failed to update status: ' + err.message);
      fetchCompanies();
    }
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

  if (loading) return <TableSkeleton layout={CollegeAdminLayout} />;

  return (
    <CollegeAdminLayout>
      <div className="px-6 py-4 md:px-8 md:py-6 space-y-5 font-sans">

      {/* ══ HEADER ══ */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span className="w-2 h-8 bg-gradient-to-b from-[#003399] to-[#00A9CE] rounded-full inline-block flex-shrink-0" />
                Company <span className="text-[#003399]">Management</span>
              </h1>
              <p className="text-sm text-slate-400 mt-1 font-medium">
                Manage all companies · {stats.total} total
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={() => navigate('/dashboard/college-admin/companies/create')}
                className="inline-flex items-center gap-1.5 bg-[#003399] hover:bg-[#002d8b] text-white text-[11px] font-black uppercase tracking-wider px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-500/10 active:scale-95">
                <Plus className="w-4 h-4"/> Add Company
              </button>
            </div>
          </div>

      {/* Stats + industry mini chart */}
      <div className="hidden grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <StatPill icon={Building2}   label="Total"       value={stats.total}    color="blue"   />
            <StatPill icon={CircleCheck} label="Active"      value={stats.active}   color="cyan"   />
            <StatPill icon={CircleX}     label="Inactive"    value={stats.inactive} color="red"    />
            <StatPill icon={TrendingUp}  label="Active Rate" value={stats.total > 0 ? `${Math.round((stats.active/stats.total)*100)}%` : '0%'} color="indigo" />
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 bg-[#003399] rounded-md flex items-center justify-center">
              <Briefcase className="w-2.5 h-2.5 text-white" />
            </div>
            <p className="text-xs font-bold text-gray-800">Top Industries</p>
          </div>
          <div className="space-y-2">
            {topIndustries.length > 0 ? topIndustries.map(([name, count]) => (
              <div key={name}>
                <div className="flex justify-between mb-0.5">
                  <span className="text-[10px] text-gray-600 font-medium truncate max-w-[100px]">{name}</span>
                  <span className="text-[10px] font-black text-[#003399]">{count}</span>
                </div>
                <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#003399] to-[#00A9CE] transition-all duration-700"
                    style={{ width: `${Math.round((count/maxInd)*100)}%` }} />
                </div>
              </div>
            )) : <p className="text-[10px] text-slate-400 text-center py-2">No data yet</p>}
          </div>
        </div>
      </div>

      {/* ══ MAIN PANEL ══ */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-100 flex flex-col">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-2">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search by name, location, or industry…" value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 text-xs font-bold border border-slate-100 rounded-xl focus:outline-none focus:border-[#003399]/30 bg-white"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-gray-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <div className="relative flex items-center">
              <Filter className="absolute left-3 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                className="pl-8 pr-8 py-2.5 text-xs font-bold border border-slate-100 rounded-xl focus:outline-none focus:border-[#003399]/30 bg-white appearance-none transition-colors"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <button onClick={fetchCompanies} disabled={loading}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-black bg-white text-slate-500 border border-slate-100 rounded-xl hover:border-[#003399]/30 hover:text-[#003399] disabled:opacity-60 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
          <div className="flex-1 overflow-hidden">
        <div className="overflow-x-auto">
          {paginated.length > 0 ? (
            <table className="w-full table-fixed">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left w-[60px]">
                    S.No
                  </th>
                  <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left w-[200px]">
                    Company
                  </th>
                  <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left w-[150px]">
                    Industry
                  </th>
                  <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left w-[200px]">
                    Location
                  </th>
                  <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left w-[120px]">
                    Website
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
                {paginated.map((company, index) => {
                  const sNo = (page - 1) * PAGE_SIZE + index + 1;
                  return (
                    <tr key={company._id} className="hover:bg-slate-50/30 transition-colors group">
                      <td className="px-4 py-4 text-xs font-bold text-slate-400">
                        {String(sNo).padStart(2, '0')}
                      </td>
                      <td className="px-4 py-4">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-800 truncate w-full">{company.name}</p>
                          {company.email && <p className="text-[10px] text-slate-400 truncate w-full">{company.email}</p>}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-[#00A9CE]/5 text-[#00A9CE] rounded-md border border-[#00A9CE]/15">
                          {company.industry || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 truncate w-full">
                          <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                          <span className="truncate">
                            {company.headquarters?.city
                              ? [company.headquarters.city, company.headquarters.state].filter(Boolean).join(', ')
                              : company.location || 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {company.website
                          ? <a href={company.website} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] font-black text-[#003399] hover:underline"
                            ><Globe className="w-3 h-3" /> Visit</a>
                          : <span className="text-[10px] text-slate-300 italic">N/A</span>}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Toggle checked={company.isActive} onToggle={() => handleToggle(company._id, company.isActive)} />
                          <span className={`text-[10px] font-bold ${company.isActive ? 'text-[#003399]' : 'text-slate-400'}`}>
                            {company.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center">
                          <ActionMenu actions={[
                            { label: 'View', icon: Eye, onClick: () => navigate(`/dashboard/college-admin/companies/${company._id}`), color: 'text-[#003399] hover:bg-slate-50' },
                            { label: 'Edit', icon: SquarePen, onClick: () => navigate(`/dashboard/college-admin/companies/edit/${company._id}`), color: 'text-emerald-600 hover:bg-emerald-50' },
                            { label: 'Delete', icon: Trash2, onClick: () => handleDelete(company._id, company.name), danger: true },
                          ]} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-14 h-14 bg-[#003399]/10 rounded-2xl flex items-center justify-center mb-3">
                <Building2 className="w-7 h-7 text-white/60" />
              </div>
              <p className="text-sm font-semibold text-gray-600">No companies found</p>
              <p className="text-xs text-slate-400 mt-1">
                {searchTerm || filterStatus !== 'all' ? 'Try adjusting your filters' : 'Add your first company'}
              </p>
              {!searchTerm && filterStatus === 'all' && (
                <button onClick={() => navigate('/dashboard/college-admin/companies/create')}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#003399] to-[#00A9CE] text-white shadow-sm hover:scale-105 transition-all"
                ><Plus className="w-3 h-3" /> Add Company</button>
              )}
            </div>
          )}
        </div>
        <Pagination page={page} total={filtered.length} totalPages={totalPages} pageSize={PAGE_SIZE} onPageChange={setPage} />
          </div>
        </div>

    </div>

    </CollegeAdminLayout>
  );
};

export default CompanyManagement;