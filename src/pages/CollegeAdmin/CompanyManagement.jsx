// pages/CollegeAdmin/CompanyManagement.jsx - Full CRUD Operations
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Plus,
  MoreVertical,
  MapPin,
  Users,
  Globe,
  Mail,
  CheckCircle,
  XCircle,
  ArrowLeft,
  TrendingUp,
} from 'lucide-react';
import { companyAPI } from '../../api/Api';

const CompanyManagement = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterIndustry, setFilterIndustry] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [industries, setIndustries] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
  });

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const response = await companyAPI.getAllCompanies();
      
      if (response.success) {
        setCompanies(response.companies);
        calculateStats(response.companies);
        extractIndustries(response.companies);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
      alert('Failed to fetch companies: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (companiesList) => {
    const total = companiesList.length;
    const active = companiesList.filter(c => c.isActive).length;
    const inactive = companiesList.filter(c => !c.isActive).length;
    setStats({ total, active, inactive });
  };

  const extractIndustries = (companiesList) => {
    const uniqueIndustries = [...new Set(
      companiesList
        .map(c => c.industry)
        .filter(Boolean)
    )].sort();
    setIndustries(uniqueIndustries);
  };

  const handleToggleStatus = async (companyId) => {
    try {
      await companyAPI.toggleActiveStatus(companyId);
      setCompanies(companies.map(company =>
        company._id === companyId ? { ...company, isActive: !company.isActive } : company
      ));
      calculateStats(companies.map(company =>
        company._id === companyId ? { ...company, isActive: !company.isActive } : company
      ));
    } catch (error) {
      alert('Failed to toggle status: ' + error.message);
    }
  };

  const handleDelete = async (companyId) => {
    if (!confirm('Are you sure you want to delete this company? This action cannot be undone.')) return;
    
    try {
      await companyAPI.deleteCompany(companyId);
      setCompanies(companies.filter(company => company._id !== companyId));
      calculateStats(companies.filter(company => company._id !== companyId));
    } catch (error) {
      alert('Failed to delete company: ' + error.message);
    }
  };

  const filteredCompanies = companies.filter(company => {
    const matchesSearch = 
      company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.industry?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesIndustry = 
      filterIndustry === 'all' || company.industry === filterIndustry;
    
    const matchesStatus = 
      filterStatus === 'all' || 
      (filterStatus === 'active' && company.isActive) ||
      (filterStatus === 'inactive' && !company.isActive);
    
    return matchesSearch && matchesIndustry && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading companies...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate('/dashboard/college-admin')}
          className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Back to Dashboard</span>
        </button>

        {/* Header */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Company Management
              </h1>
              <p className="text-gray-600">
                Manage companies for campus placements
              </p>
            </div>
            <button
              onClick={() => navigate('/dashboard/college-admin/companies/create')}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg hover:shadow-xl font-medium"
            >
              <Plus className="w-5 h-5" />
              Add New Company
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <StatCard
              icon={<Building2 className="w-6 h-6" />}
              label="Total Companies"
              value={stats.total}
              color="blue"
            />
            <StatCard
              icon={<CheckCircle className="w-6 h-6" />}
              label="Active"
              value={stats.active}
              color="green"
            />
            <StatCard
              icon={<XCircle className="w-6 h-6" />}
              label="Inactive"
              value={stats.inactive}
              color="red"
            />
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search companies, locations, or industries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={filterIndustry}
              onChange={(e) => setFilterIndustry(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Industries</option>
              {industries.map(industry => (
                <option key={industry} value={industry}>{industry}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Companies Grid */}
        {filteredCompanies.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCompanies.map((company) => (
              <CompanyCard
                key={company._id}
                company={company}
                onToggleStatus={handleToggleStatus}
                onDelete={handleDelete}
                onEdit={() => navigate(`/dashboard/college-admin/companies/edit/${company._id}`)}
                onView={() => navigate(`/dashboard/college-admin/companies/${company._id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-16 text-center">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium mb-2">No companies found</p>
            <p className="text-gray-400 mb-6">
              {searchTerm || filterIndustry !== 'all' || filterStatus !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Start by adding your first company'}
            </p>
            <button
              onClick={() => navigate('/dashboard/college-admin/companies/create')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg font-medium"
            >
              <Plus className="w-5 h-5" />
              Add First Company
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ icon, label, value, color }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    red: 'bg-red-50 text-red-600 border-red-200',
  };

  return (
    <div className={`bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border-2 ${colors[color]}`}>
      <div className="flex items-center gap-3">
        <div className={`p-3 rounded-xl ${colors[color]}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium opacity-80">{label}</p>
          <p className="text-3xl font-bold">{value}</p>
        </div>
      </div>
    </div>
  );
};

// Company Card Component
const CompanyCard = ({ company, onToggleStatus, onDelete, onEdit, onView }) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
      {/* Company Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-white font-bold text-lg truncate">{company.name}</h3>
              {company.industry && (
                <span className="inline-block px-2 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold rounded-full mt-1">
                  {company.industry}
                </span>
              )}
            </div>
          </div>
          
          {/* Menu Dropdown */}
          <div className="relative ml-2">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <MoreVertical className="w-5 h-5 text-white" />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-10">
                <button
                  onClick={() => { onView(); setShowMenu(false); }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                >
                  <Eye className="w-4 h-4" />
                  View Details
                </button>
                <button
                  onClick={() => { onEdit(); setShowMenu(false); }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => { onToggleStatus(company._id); setShowMenu(false); }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                >
                  {company.isActive ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                  {company.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <hr className="my-1" />
                <button
                  onClick={() => { onDelete(company._id); setShowMenu(false); }}
                  className="w-full px-4 py-2 text-left hover:bg-red-50 flex items-center gap-2 text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Company Info */}
      <div className="p-6">
        <div className="space-y-3 mb-4">
          {company.location && (
            <div className="flex items-center gap-2 text-gray-700">
              <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-sm truncate">{company.location}</span>
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
                onClick={(e) => e.stopPropagation()}
              >
                Visit Website
              </a>
            </div>
          )}
        </div>

        {/* Description Preview */}
        {company.description && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 line-clamp-2">
              {company.description}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onView}
            className="flex-1 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium text-sm"
          >
            View
          </button>
          <button
            onClick={onEdit}
            className="flex-1 px-4 py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors font-medium text-sm"
          >
            Edit
          </button>
        </div>
      </div>

      {/* Status Footer */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600">Status</span>
          <button
            onClick={() => onToggleStatus(company._id)}
            className={`flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full transition-colors ${
              company.isActive 
                ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
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
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompanyManagement;