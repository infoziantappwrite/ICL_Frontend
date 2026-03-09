// pages/CollegeAdmin/CompanyManagement.jsx
import { useToast } from '../../context/ToastContext';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, Plus, Search, SquarePen, Trash2, Eye, MapPin,
  ToggleLeft, ToggleRight, ChevronLeft, ChevronRight, RefreshCw,
  CircleCheck, CircleOff,
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { collegeAdminAPI } from '../../api/Api';

const PER_PAGE = 10;

const Pagination = ({ page, totalPages, total, perPage, onPrev, onNext }) => {
  if (totalPages <= 1) return null;
  const from = (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);
  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
      <span className="text-xs text-gray-500">Showing {from}–{to} of {total}</span>
      <div className="flex items-center gap-2">
        <button onClick={onPrev} disabled={page === 1}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          <ChevronLeft className="w-3.5 h-3.5" /> Prev
        </button>
        <span className="text-xs text-gray-500 px-1">{page} / {totalPages}</span>
        <button onClick={onNext} disabled={page === totalPages}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          Next <ChevronRight className="w-3.5 h-3.5" />
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
  useEffect(() => { setPage(1); }, [searchTerm, filterStatus]);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const response = await collegeAdminAPI.getCompanies();
      if (response.success) {
        // Sort newest first
        const sorted = (response.companies || []).sort(
          (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        );
        setCompanies(sorted);
        calculateStats(sorted);
      }
    } catch (error) {
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

  const handleDeleteCompany = async (companyId, companyName) => {
    if (!confirm(`Are you sure you want to delete "${companyName}"? This action cannot be undone.`)) return;
    try {
      await collegeAdminAPI.deleteCompany(companyId);
      toast.success('Success', 'Company deleted successfully');
      fetchCompanies();
    } catch (error) {
      toast.error('Error', 'Failed to delete company: ' + error.message);
    }
  };

  const handleToggleStatus = async (companyId, currentStatus) => {
    try {
      const updated = companies.map(c => c._id === companyId ? { ...c, isActive: !c.isActive } : c);
      setCompanies(updated);
      calculateStats(updated);
      await collegeAdminAPI.updateCompany(companyId, { isActive: !currentStatus });
      toast.success('Success', `Company ${currentStatus ? 'deactivated' : 'activated'} successfully`);
    } catch (error) {
      toast.error('Error', 'Failed to update status: ' + error.message);
      fetchCompanies();
    }
  };

  const filteredCompanies = companies.filter(company => {
    const matchesSearch =
      company.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (company.headquarters?.city || company.location)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.industry?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && company.isActive) ||
      (filterStatus === 'inactive' && !company.isActive);
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredCompanies.length / PER_PAGE);
  const paginated = filteredCompanies.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  if (loading) return <LoadingSpinner message="Loading Companies..." />;

  return (
    <DashboardLayout title="Company Management">
      {/* Header */}
      <div className="mb-6">
        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="text-white">
              <h1 className="text-xl font-bold mb-1 flex items-center gap-3">
                <Building2 className="w-5 h-5" /> Company Management
              </h1>
              <p className="text-blue-100 text-sm">Manage all companies and their information</p>
            </div>
            <button onClick={() => navigate('/dashboard/college-admin/companies/create')}
              className="bg-white text-blue-600 px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-50 transition-all shadow-md hover:scale-105">
              <Plus className="w-5 h-5" /> Add Company
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Companies', value: stats.total,    grad: 'from-blue-500 to-cyan-500',   Icon: Building2,    tc: 'text-gray-900'  },
          { label: 'Active',          value: stats.active,   grad: 'from-green-500 to-emerald-500', Icon: CircleCheck,  tc: 'text-green-600' },
          { label: 'Inactive',        value: stats.inactive, grad: 'from-slate-500 to-slate-600',   Icon: CircleOff,    tc: 'text-red-600'   },
        ].map(({ label, value, grad, Icon, tc }) => (
          <div key={label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs font-medium mb-1">{label}</p>
                <p className={`text-2xl font-bold ${tc}`}>{value}</p>
              </div>
              <div className={`w-11 h-11 bg-gradient-to-br ${grad} rounded-xl flex items-center justify-center shadow`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-white/60 mb-5">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
            <input type="text" placeholder="Search by company name, location, or industry..."
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent text-sm" />
          </div>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent text-sm text-gray-700">
            <option value="all">All Companies</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
          <button onClick={fetchCompanies}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl hover:opacity-90 transition-all shadow-sm">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/60 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50">
          <p className="font-semibold text-gray-800 text-sm">{filteredCompanies.length} Companies</p>
        </div>
        <div className="overflow-x-auto">
          {paginated.length > 0 ? (
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-gray-100">
                <tr>
                  {['Company','Industry','Location','Website','Status','Actions'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginated.map(company => (
                  <tr key={company._id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                          {company.name?.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 text-sm">{company.name}</div>
                          {company.email && <div className="text-xs text-gray-400">{company.email}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 text-xs font-semibold bg-blue-50 text-blue-700 rounded-full">
                        {company.industry || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-gray-700">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-sm">{company.headquarters?.city || company.location || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {company.website ? (
                        <a href={company.website} target="_blank" rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 text-sm hover:underline">Visit Site</a>
                      ) : <span className="text-gray-400 text-sm">N/A</span>}
                    </td>
                    <td className="px-6 py-4">
                      <button onClick={() => handleToggleStatus(company._id, company.isActive)}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-full flex items-center gap-1 transition-all ${
                          company.isActive ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'
                        }`}>
                        {company.isActive ? <><ToggleRight className="w-3 h-3" /> Active</> : <><ToggleLeft className="w-3 h-3" /> Inactive</>}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <button onClick={() => navigate(`/dashboard/college-admin/companies/${company._id}`)}
                          className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="View">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => navigate(`/dashboard/college-admin/companies/edit/${company._id}`)}
                          className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors" title="Edit">
                          <SquarePen className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDeleteCompany(company._id, company.name)}
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
              <Building2 className="w-14 h-14 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No companies found</p>
              <p className="text-gray-400 text-sm mt-1">
                {searchTerm || filterStatus !== 'all' ? 'Try adjusting your search or filters' : 'Get started by adding your first company'}
              </p>
              {!searchTerm && filterStatus === 'all' && (
                <button onClick={() => navigate('/dashboard/college-admin/companies/create')}
                  className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-all">
                  <Plus className="w-4 h-4" /> Add First Company
                </button>
              )}
            </div>
          )}
        </div>
        <Pagination page={page} totalPages={totalPages} total={filteredCompanies.length} perPage={PER_PAGE}
          onPrev={() => setPage(p => Math.max(1, p - 1))}
          onNext={() => setPage(p => Math.min(totalPages, p + 1))}
        />
      </div>
    </DashboardLayout>
  );
};

export default CompanyManagement;