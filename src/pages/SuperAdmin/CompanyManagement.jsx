import { useToast } from '../../context/ToastContext';
// pages/SuperAdmin/CompanyManagement.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, Plus, Search, Pencil, Trash2, Eye, MapPin,
  CircleCheck, CircleX, ChevronLeft, ChevronRight, RefreshCw,
  CheckCircle2, XCircle,
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { companyAPI } from '../../api/Api';

const PAGE_SIZE = 10;

const Pagination = ({ page, total, totalPages, pageSize, onPageChange }) => {
  if (totalPages <= 1) return null;
  const from = (page - 1) * pageSize + 1;
  const to   = Math.min(page * pageSize, total);
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
    .reduce((acc, p, i, arr) => { if (i > 0 && p - arr[i - 1] > 1) acc.push('…'); acc.push(p); return acc; }, []);
  return (
    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
      <p className="text-sm text-gray-600">Showing <span className="font-semibold">{from}–{to}</span> of <span className="font-semibold">{total}</span> companies</p>
      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange(page - 1)} disabled={page === 1}
          className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        {pages.map((p, i) =>
          p === '…' ? <span key={`e${i}`} className="px-2 text-gray-400 text-sm">…</span> :
          <button key={p} onClick={() => onPageChange(p)}
            className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${p === page ? 'bg-blue-600 text-white' : 'border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600'}`}>
            {p}
          </button>
        )}
        <button onClick={() => onPageChange(page + 1)} disabled={page === totalPages}
          className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
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
        const detailedCompanies = await Promise.all(
          response.companies.map(async (company) => {
            try {
              const detail = await companyAPI.getCompanyById(company._id);
              if (detail.success && detail.company) {
                return { ...company, headquarters: detail.company.headquarters, location: detail.company.location };
              }
            } catch { /* fall back */ }
            return company;
          })
        );
        // Sort latest first
        const sorted = detailedCompanies.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setCompanies(sorted);
        calculateStats(sorted);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
      toast.error('Error', 'Failed to fetch companies: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (list) => {
    const total = list.length;
    const active = list.filter(c => c.isActive).length;
    setStats({ total, active, inactive: total - active });
  };

  const handleDeleteCompany = async (companyId) => {
    try {
      await companyAPI.deleteCompany(companyId);
      toast.success('Success', 'Company deleted successfully');
      setCompanies(prev => {
        const updated = prev.filter(c => c._id !== companyId);
        calculateStats(updated);
        return updated;
      });
    } catch (error) {
      console.error('Error deleting company:', error);
      toast.error('Error', 'Failed to delete company: ' + error.message);
    }
  };

  const handleToggleStatus = async (companyId, currentStatus) => {
    try {
      await companyAPI.toggleActiveStatus(companyId);
      toast.success('Success', `Company ${currentStatus ? 'deactivated' : 'activated'} successfully`);
      setCompanies(prev => {
        const updated = prev.map(c => c._id === companyId ? { ...c, isActive: !currentStatus } : c);
        calculateStats(updated);
        return updated;
      });
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error('Error', 'Failed to update status: ' + error.message);
    }
  };

  const filtered = companies.filter(company => {
    const matchesSearch =
      company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (company.headquarters?.city || company.location)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.industry?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && company.isActive) ||
      (filterStatus === 'inactive' && !company.isActive);
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSearch = (val) => { setSearchTerm(val); setPage(1); };
  const handleFilter = (val) => { setFilterStatus(val); setPage(1); };

  if (loading) return <LoadingSpinner message="Loading Companies..." />;

  return (
    <DashboardLayout title="Company Management">
      {/* Header */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 rounded-3xl p-8 shadow-2xl shadow-blue-500/30">
          <div className="flex items-center justify-between">
            <div className="text-white">
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <Building2 className="w-8 h-8" /> Company Management
              </h1>
              <p className="text-blue-100 text-lg">Manage all companies and their information</p>
            </div>
            <button
              onClick={() => navigate('/dashboard/super-admin/companies/create')}
              className="bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold flex items-center gap-2 hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl hover:scale-105"
            >
              <Plus className="w-5 h-5" /> Add Company
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
          { label: 'Total Companies', value: stats.total,    Icon: Building2,    bg: 'from-blue-500 to-cyan-500',     text: 'text-gray-900'  },
          { label: 'Active',          value: stats.active,   Icon: CircleCheck,  bg: 'from-emerald-500 to-green-500', text: 'text-green-600' },
          { label: 'Inactive',        value: stats.inactive, Icon: CircleX,      bg: 'from-slate-500 to-slate-600',   text: 'text-red-600'   },
        ].map(({ label, value, Icon, bg, text }) => (
          <div key={label} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">{label}</p>
                <p className={`text-3xl font-bold ${text}`}>{value}</p>
              </div>
              <div className={`w-14 h-14 bg-gradient-to-br ${bg} rounded-xl flex items-center justify-center shadow-lg`}>
                <Icon className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by company name, location, or industry..."
              value={searchTerm}
              onChange={e => handleSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-3">
            <select value={filterStatus} onChange={e => handleFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="all">All Companies</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
            <button onClick={fetchCompanies} disabled={loading}
              className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-60">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Companies Table */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          {paginated.length > 0 ? (
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-gray-200">
                <tr>
                  {['Company', 'Industry', 'Location', 'Website', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginated.map(company => (
                  <tr key={company._id} className="hover:bg-blue-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-white font-bold">
                          {company.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{company.name}</div>
                          {company.email && <div className="text-sm text-gray-500">{company.email}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-700 rounded-full">
                        {company.industry || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-700">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">
                          {company.headquarters?.city
                            ? [company.headquarters.city, company.headquarters.state].filter(Boolean).join(', ')
                            : company.location || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {company.website ? (
                        <a href={company.website} target="_blank" rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 text-sm hover:underline">
                          Visit Site
                        </a>
                      ) : (
                        <span className="text-gray-400 text-sm">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleStatus(company._id, company.isActive)}
                        title={company.isActive ? 'Click to deactivate' : 'Click to activate'}
                        className="group flex items-center gap-2 cursor-pointer focus:outline-none"
                      >
                        <div className={`relative w-9 h-5 rounded-full transition-all duration-300 flex-shrink-0 ${company.isActive ? 'bg-gradient-to-r from-blue-500 to-cyan-500' : 'bg-gray-300 group-hover:bg-gray-400'}`}>
                          <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-300 ${company.isActive ? 'translate-x-4' : 'translate-x-0.5'}`} />
                        </div>
                        <span className={`flex items-center gap-1 text-xs font-semibold ${company.isActive ? 'text-blue-600' : 'text-gray-400'}`}>
                          {company.isActive
                            ? <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                            : <XCircle className="w-3.5 h-3.5 text-gray-400" />}
                          {company.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => navigate(`/dashboard/super-admin/companies/${company._id}`)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View Details">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => navigate(`/dashboard/super-admin/companies/edit/${company._id}`)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Edit">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteCompany(company._id, company.name)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-16">
              <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-medium mb-2">No companies found</p>
              <p className="text-gray-400 mb-6">
                {searchTerm || filterStatus !== 'all' ? 'Try adjusting your search or filters' : 'Get started by adding your first company'}
              </p>
              {!searchTerm && filterStatus === 'all' && (
                <button onClick={() => navigate('/dashboard/super-admin/companies/create')}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 mx-auto hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg">
                  <Plus className="w-5 h-5" /> Add First Company
                </button>
              )}
            </div>
          )}
        </div>
        <Pagination page={page} total={filtered.length} totalPages={totalPages} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </div>
    </DashboardLayout>
  );
};

export default CompanyManagement;