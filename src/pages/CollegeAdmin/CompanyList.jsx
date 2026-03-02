// pages/CollegeAdmin/CompanyList.jsx
import { useToast } from '../../context/ToastContext';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Search,
  Eye,
  MapPin,
  Globe,
  Mail,
  Phone,
  Briefcase,
  Users,
  CheckCircle,
  XCircle,
  Filter,
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { companyAPI } from '../../api/Api';

const CompanyList = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterIndustry, setFilterIndustry] = useState('all');
  const [industries, setIndustries] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
  });

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      // Fetch only active companies for college admins
      const response = await companyAPI.getAllCompanies({ isActive: true });
      
      if (response.success) {
        setCompanies(response.companies);
        calculateStats(response.companies);
        extractIndustries(response.companies);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
      toast.error('Error', 'Failed to fetch companies: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (companiesList) => {
    const total = companiesList.length;
    const active = companiesList.filter(c => c.isActive).length;
    setStats({ total, active });
  };

  const extractIndustries = (companiesList) => {
    const uniqueIndustries = [...new Set(
      companiesList
        .map(c => c.industry)
        .filter(Boolean)
    )].sort();
    setIndustries(uniqueIndustries);
  };

  const filteredCompanies = companies.filter(company => {
    const matchesSearch = 
      company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (company.headquarters?.city || company.location)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.industry?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesIndustry = 
      filterIndustry === 'all' || company.industry === filterIndustry;
    
    return matchesSearch && matchesIndustry;
  });

  if (loading) {
    return <LoadingSpinner message="Loading Companies..." />;
  }

  return (
    <DashboardLayout title="Available Companies">
      {/* Header */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500 rounded-3xl p-8 shadow-2xl shadow-blue-500/30">
          <div className="flex items-center justify-between">
            <div className="text-white">
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <Building2 className="w-8 h-8" />
                Available Companies
              </h1>
              <p className="text-blue-100 text-lg">
                View companies available for job postings
              </p>
            </div>
            <div className="hidden md:block">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <Building2 className="w-12 h-12 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-r-xl">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-blue-900 font-medium">
              These are companies approved by the Super Admin
            </p>
            <p className="text-blue-700 text-sm mt-1">
              You can use these companies when creating job descriptions. To add a new company, contact your Super Admin.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">Total Companies</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-green-600 mt-1">Available for job postings</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
              <Building2 className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">Active Companies</p>
              <p className="text-3xl font-bold text-green-600">{stats.active}</p>
              <p className="text-sm text-gray-600 mt-1">Ready to hire</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
              <CheckCircle className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by company name, location, or industry..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={filterIndustry}
              onChange={(e) => setFilterIndustry(e.target.value)}
              className="pl-11 pr-8 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white min-w-[200px]"
            >
              <option value="all">All Industries</option>
              {industries.map(industry => (
                <option key={industry} value={industry}>{industry}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Companies Grid */}
      {filteredCompanies.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCompanies.map((company) => (
            <div
              key={company._id}
              className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
            >
              {/* Company Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg">{company.name}</h3>
                      {company.industry && (
                        <span className="inline-block px-2 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold rounded-full mt-1">
                          {company.industry}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Company Info */}
              <div className="p-6">
                <div className="space-y-3 mb-4">
                  {(company.headquarters?.city || company.location) && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-sm">{company.headquarters?.city || company.location}</span>
                    </div>
                  )}
                  
                  {company.companySize && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <Users className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-sm">{company.companySize} employees</span>
                    </div>
                  )}

                  {company.email && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-sm truncate">{company.email}</span>
                    </div>
                  )}

                  {company.website && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <a
                        href={company.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline truncate"
                      >
                        Visit Website
                      </a>
                    </div>
                  )}
                </div>

                {/* Description Preview */}
                {company.description && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {company.description}
                    </p>
                  </div>
                )}

                {/* View Details Button */}
                <button
                  onClick={() => navigate(`/dashboard/college-admin/companies/${company._id}`)}
                  className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl font-medium flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  View Details
                </button>
              </div>

              {/* Status Footer */}
              <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Status</span>
                  <span className={`flex items-center gap-1 text-xs font-semibold ${
                    company.isActive ? 'text-green-600' : 'text-gray-400'
                  }`}>
                    {company.isActive ? (
                      <>
                        <CheckCircle className="w-3 h-3" />
                        Active
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3" />
                        Inactive
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-16 text-center">
          <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg font-medium mb-2">No companies found</p>
          <p className="text-gray-400">
            {searchTerm || filterIndustry !== 'all'
              ? 'Try adjusting your search or filters'
              : 'No companies are available yet. Contact your Super Admin to add companies.'}
          </p>
        </div>
      )}
    </DashboardLayout>
  );
};

export default CompanyList;