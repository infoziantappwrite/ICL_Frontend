// pages/CollegeAdmin/CompanyList.jsx — redesigned to match SuperAdmin/CollegeAdmin theme
import { useToast } from '../../context/ToastContext';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, Search, Eye, MapPin, Globe, Mail, Users,
  CheckCircle, Filter, ChevronLeft, ChevronRight, AlertCircle,
} from 'lucide-react';
import CollegeAdminLayout from '../../components/layout/CollegeAdminLayout';
import { TableSkeleton } from '../../components/common/SkeletonLoader';
import { companyAPI } from '../../api/Api';

const PAGE_SIZE = 12;

/* ─── Pagination ─────────────────────────── */
const Pagination = ({ page, total, totalPages, pageSize, onPageChange }) => {
  if (totalPages <= 1) return null;
  const from  = (page - 1) * pageSize + 1;
  const to    = Math.min(page * pageSize, total);
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
    .reduce((acc, p, i, arr) => {
      if (i > 0 && p - arr[i - 1] > 1) acc.push('…');
      acc.push(p);
      return acc;
    }, []);
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
                  : 'border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600'
              }`}>
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
const CompanyList = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const [loading, setLoading]         = useState(true);
  const [companies, setCompanies]     = useState([]);
  const [searchTerm, setSearchTerm]   = useState('');
  const [filterIndustry, setFilterIndustry] = useState('all');
  const [industries, setIndustries]   = useState([]);
  const [page, setPage]               = useState(1);
  const [stats, setStats]             = useState({ total: 0, active: 0 });

  useEffect(() => { fetchCompanies(); }, []);
  useEffect(() => { setPage(1); }, [searchTerm, filterIndustry]);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const response = await companyAPI.getAllCompanies({ isActive: true });
      if (response.success) {
        setCompanies(response.companies);
        const total  = response.companies.length;
        const active = response.companies.filter(c => c.isActive).length;
        setStats({ total, active });
        const uniqueIndustries = [...new Set(response.companies.map(c => c.industry).filter(Boolean))].sort();
        setIndustries(uniqueIndustries);
      }
    } catch (error) {
      toast.error('Error', 'Failed to fetch companies: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredCompanies = companies.filter(company => {
    const matchesSearch =
      company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (company.headquarters?.city || company.location)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.industry?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesIndustry = filterIndustry === 'all' || company.industry === filterIndustry;
    return matchesSearch && matchesIndustry;
  });

  const totalPages = Math.ceil(filteredCompanies.length / PAGE_SIZE);
  const paginated  = filteredCompanies.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (loading) return <TableSkeleton layout={CollegeAdminLayout} />;

  return (
    <CollegeAdminLayout>

      {/* ══ HERO BANNER ══ */}
      <div className="relative bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 rounded-2xl px-5 py-4 mb-4 shadow-xl shadow-blue-500/20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-10 -right-10 w-44 h-44 bg-white/10 rounded-full" />
          <div className="absolute -bottom-8 left-1/3 w-28 h-28 bg-white/10 rounded-full" />
          <div className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: 'radial-gradient(circle,white 1px,transparent 1px)', backgroundSize: '18px 18px' }} />
        </div>
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-blue-200 text-[11px] font-semibold">Placement Portal</p>
            <h1 className="text-white font-black text-lg leading-tight">Available Companies</h1>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              <span className="inline-flex items-center gap-1 bg-white/15 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white border border-white/20">
                <Building2 className="w-3 h-3" /> {stats.total} Total
              </span>
              <span className="inline-flex items-center gap-1 bg-white/15 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white border border-white/20">
                <CheckCircle className="w-3 h-3" /> {stats.active} Active
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-4 flex items-start gap-2.5">
        <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-xs font-bold text-blue-800">Super Admin Approved Companies</p>
          <p className="text-[10px] text-blue-600 mt-0.5">
            Use these companies when creating job descriptions. To add a new company, contact your Super Admin.
          </p>
        </div>
      </div>

      {/* Stats pills */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-3 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {[
            { icon: Building2,  label: 'Total Companies', value: stats.total,             color: 'bg-blue-50 border-blue-100 text-blue-600'   },
            { icon: CheckCircle, label: 'Active',         value: stats.active,            color: 'bg-green-50 border-green-100 text-green-600' },
            { icon: Filter,     label: 'Filtered',        value: filteredCompanies.length, color: 'bg-cyan-50 border-cyan-100 text-cyan-600'   },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${color}`}>
              <Icon className="w-4 h-4 flex-shrink-0 opacity-70" />
              <div>
                <p className="text-sm font-black leading-none">{value}</p>
                <p className="text-[9px] font-medium opacity-60 mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-3 mb-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search by company name, location, or industry..."
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
          <div className="relative sm:w-48">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select value={filterIndustry} onChange={(e) => setFilterIndustry(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white appearance-none">
              <option value="all">All Industries</option>
              {industries.map(ind => <option key={ind} value={ind}>{ind}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Company Grid */}
      {paginated.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
            {paginated.map((company) => (
              <div key={company._id}
                className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm overflow-hidden hover:shadow-md hover:scale-[1.01] transition-all group">
                {/* Card header */}
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-gray-100 px-4 py-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-[11px] font-black text-white flex-shrink-0 shadow-sm">
                      {company.name?.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">{company.name}</h3>
                      {company.industry && (
                        <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-600 text-[9px] font-bold rounded-full mt-0.5">{company.industry}</span>
                      )}
                    </div>
                    <span className={`flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold rounded-full border ${
                      company.isActive ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-gray-50 text-gray-400 border-gray-200'
                    }`}>
                      <span className={`w-1 h-1 rounded-full ${company.isActive ? 'bg-blue-500' : 'bg-gray-400'}`} />
                      {company.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                {/* Card body */}
                <div className="p-4">
                  <div className="space-y-2 mb-3">
                    {(company.headquarters?.city || company.location) && (
                      <div className="flex items-center gap-2 text-[11px] text-gray-600">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span>{company.headquarters?.city || company.location}</span>
                      </div>
                    )}
                    {company.companySize && (
                      <div className="flex items-center gap-2 text-[11px] text-gray-600">
                        <Users className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span>{company.companySize} employees</span>
                      </div>
                    )}
                    {company.email && (
                      <div className="flex items-center gap-2 text-[11px] text-gray-600">
                        <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{company.email}</span>
                      </div>
                    )}
                    {company.website && (
                      <div className="flex items-center gap-2 text-[11px]">
                        <Globe className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <a href={company.website} target="_blank" rel="noopener noreferrer"
                          className="text-blue-600 hover:underline truncate" onClick={e => e.stopPropagation()}>
                          Visit Website
                        </a>
                      </div>
                    )}
                  </div>

                  {company.description && (
                    <p className="text-[10px] text-gray-500 line-clamp-2 mb-3 leading-relaxed">{company.description}</p>
                  )}

                  <button onClick={() => navigate(`/dashboard/college-admin/companies/${company._id}`)}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs font-bold rounded-xl hover:shadow-md hover:scale-[1.02] transition-all">
                    <Eye className="w-3.5 h-3.5" /> View Details
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm overflow-hidden">
            <Pagination page={page} total={filteredCompanies.length} totalPages={totalPages}
              pageSize={PAGE_SIZE} onPageChange={setPage} />
          </div>
        </>
      ) : (
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-16 text-center">
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Building2 className="w-6 h-6 text-blue-300" />
          </div>
          <p className="text-sm font-semibold text-gray-600 mb-1">No companies found</p>
          <p className="text-xs text-gray-400">
            {searchTerm || filterIndustry !== 'all'
              ? 'Try adjusting your search or filters'
              : 'No companies are available yet. Contact your Super Admin to add companies.'}
          </p>
        </div>
      )}

    </CollegeAdminLayout>
  );
};

export default CompanyList;