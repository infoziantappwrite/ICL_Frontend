// src/pages/SuperAdmin/CompanyManagement.jsx
import { useToast } from '../../context/ToastContext';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, Plus, Search, SquarePen, Trash2, Eye, MapPin,
  CircleCheck, CircleX, ChevronLeft, ChevronRight,
  Globe, Briefcase, Filter, X, TrendingUp,
} from 'lucide-react';
import SuperAdminDashboardLayout from '../../components/layout/SuperAdminDashboardLayout';
import { TableSkeleton } from '../../components/common/SkeletonLoader';
import ActionMenu from '../../components/common/ActionMenu';
import { companyAPI } from '../../api/Api';

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

const CompanyManagement = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });

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
              if (d.success && d.company) return { ...company, headquarters: d.company.headquarters, location: d.company.location };
            } catch { }
            return company;
          })
        );
        const sorted = detailed.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setCompanies(sorted); calcStats(sorted);
      }
    } catch { toast.error('Error', 'Failed to fetch companies'); }
    finally { setLoading(false); }
  };

  const calcStats = (list) => {
    const total = list.length, active = list.filter(c => c.isActive).length;
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
    const matchSearch = c.name?.toLowerCase().includes(q) || (c.headquarters?.city || c.location || '').toLowerCase().includes(q) || (c.industry || '').toLowerCase().includes(q);
    const matchStatus = filterStatus === 'all' || (filterStatus === 'active' && c.isActive) || (filterStatus === 'inactive' && !c.isActive);
    return matchSearch && matchStatus;
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
              Company Management
            </h1>
            <p className="text-sm text-slate-400 mt-1 font-medium">Manage all partner companies — {stats.total} total</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="relative flex-1 min-w-[240px] lg:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
              <input type="text" placeholder="Search by name, location or industry…" value={searchTerm}
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
            <button onClick={() => navigate('/dashboard/super-admin/companies/create')}
              className="inline-flex items-center gap-2 bg-[#003399] text-white text-[11px] font-black uppercase tracking-wider px-5 py-2.5 rounded-xl hover:bg-[#002d8b] transition-all shadow-lg shadow-blue-500/10 active:scale-95">
              <Plus className="w-4 h-4" /> Add Company
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            {paginated.length > 0 ? (
              <table className="w-full table-fixed">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    {['S.No', 'Company', 'Email', 'Industry', 'Location', 'Website', 'Status', 'Actions'].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-50">
                  {paginated.map((company, index) => {
                    const serialNumber = (page - 1) * PAGE_SIZE + index + 1;

                    return (
                      <tr
                        key={company._id}
                        className="hover:bg-slate-50/30 transition-colors"
                      >

                        {/* S.No */}
                        <td className="px-4 py-4 text-center align-middle text-xs font-bold text-slate-600 w-[60px]">
                          {serialNumber}
                        </td>

                        {/* Company Name */}
                        <td className="px-4 py-4 text-center align-middle">
                          <p className="text-xs font-bold text-slate-800 truncate">
                            {company.name}
                          </p>
                        </td>

                        {/* Email */}
                        <td className="px-4 py-4 text-center align-middle">
                          {company.email ? (
                            <p className="text-[11px] text-slate-500 truncate">
                              {company.email}
                            </p>
                          ) : (
                            <span className="text-[10px] text-slate-300 italic">N/A</span>
                          )}
                        </td>

                        {/* Industry */}
                        <td className="px-4 py-4 text-center align-middle">
                          <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-[#00A9CE]/5 text-[#00A9CE] rounded-md border border-[#00A9CE]/15">
                            {company.industry || 'N/A'}
                          </span>
                        </td>

                        {/* Location */}
                        <td className="px-4 py-4 text-center align-middle">
                          <div className="flex items-center justify-center gap-1 text-[11px] text-slate-500">
                            <MapPin className="w-3 h-3 text-slate-300" />
                            {company.headquarters?.city
                              ? [company.headquarters.city, company.headquarters.state]
                                .filter(Boolean)
                                .join(', ')
                              : company.location || 'N/A'}
                          </div>
                        </td>

                        {/* Website */}
                        <td className="px-4 py-4 text-center align-middle">
                          {company.website ? (
                            <a
                              href={company.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-1 text-[10px] font-black text-[#003399] hover:underline"
                            >
                              <Globe className="w-3 h-3" /> Visit
                            </a>
                          ) : (
                            <span className="text-[10px] text-slate-300 italic">N/A</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-4 text-center align-middle">
                          <button
                            onClick={() => handleToggle(company._id, company.isActive)}
                            className={`inline-flex items-center justify-center px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-md border transition-all ${company.isActive
                              ? 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20'
                              : 'bg-rose-50 text-rose-500 border-rose-100'
                              }`}
                          >
                            {company.isActive ? 'Active' : 'Inactive'}
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-4 text-center align-middle">
                          <div className="flex items-center justify-center">
                            <ActionMenu
                              actions={[
                                {
                                  icon: Eye,
                                  label: 'View Details',
                                  onClick: () =>
                                    navigate(`/dashboard/super-admin/companies/${company._id}`),
                                  color: 'text-slate-700 hover:bg-slate-50',
                                },
                                {
                                  icon: SquarePen,
                                  label: 'Edit Company',
                                  onClick: () =>
                                    navigate(`/dashboard/super-admin/companies/edit/${company._id}`),
                                  color: 'text-[#00A9CE] hover:bg-[#00A9CE]/5',
                                },
                                {
                                  icon: Trash2,
                                  label: 'Delete Company',
                                  danger: true,
                                  onClick: () => {
                                    if (
                                      window.confirm(
                                        `Are you sure you want to delete ${company.name}?`
                                      )
                                    ) {
                                      handleDelete(company._id);
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
                  <Briefcase className="w-8 h-8 text-slate-200" />
                </div>
                <p className="text-sm font-black text-slate-800 tracking-tight">No companies found</p>
                <p className="text-xs text-slate-400 font-medium mt-1">{searchTerm || filterStatus !== 'all' ? 'Try adjusting filters' : 'Add your first company'}</p>
              </div>
            )}
          </div>
          <Pagination page={page} total={filtered.length} totalPages={totalPages} pageSize={PAGE_SIZE} onPageChange={setPage} />
        </div>
      </div>

      <button onClick={() => navigate('/dashboard/super-admin/companies/create')}
        className="md:hidden fixed bottom-8 right-8 w-16 h-16 bg-[#003399] text-white rounded-2xl shadow-xl shadow-blue-500/30 z-50 flex items-center justify-center hover:scale-110 active:scale-95 transition-all">
        <Plus className="w-8 h-8" />
      </button>
    </SuperAdminDashboardLayout>
  );
};

export default CompanyManagement;