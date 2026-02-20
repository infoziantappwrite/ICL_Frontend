// pages/CollegeAdmin/CompanyDetail.jsx - Redesigned with SuperAdmin UI
import { useToast } from '../../context/ToastContext';
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Building2,
  ArrowLeft,
  Edit,
  Trash2,
  Mail,
  Phone,
  Globe,
  MapPin,
  Briefcase,
  Users,
  ToggleLeft,
  ToggleRight,
  Calendar,
  FileText,
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { companyAPI } from '../../api/Api';

const CompanyDetail = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const { companyId } = useParams();
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState(null);

  useEffect(() => {
    fetchCompanyDetails();
  }, [companyId]);

  const fetchCompanyDetails = async () => {
    try {
      setLoading(true);
      const response = await companyAPI.getCompanyById(companyId);
      
      if (response.success) {
        setCompany(response.company);
      }
    } catch (error) {
      console.error('Error fetching company details:', error);
      toast.error('Error', 'Failed to fetch company details: ' + error.message);
      navigate('/dashboard/college-admin/companies');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${company.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await companyAPI.deleteCompany(companyId);
      toast.success('Success', 'Company deleted successfully');
      navigate('/dashboard/college-admin/companies');
    } catch (error) {
      console.error('Error deleting company:', error);
      toast.error('Error', 'Failed to delete company: ' + error.message);
    }
  };

  const handleToggleStatus = async () => {
    try {
      await companyAPI.updateCompany(companyId, { isActive: !company.isActive });
      toast.success('Success', `Company ${company.isActive ? 'deactivated' : 'activated'} successfully`);
      fetchCompanyDetails();
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error('Error', 'Failed to update status: ' + error.message);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading Company Details..." />;
  }

  if (!company) {
    return (
      <DashboardLayout title="Company Not Found">
        <div className="text-center py-16">
          <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Company not found</p>
          <button
            onClick={() => navigate('/dashboard/college-admin/companies')}
            className="mt-6 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-cyan-700"
          >
            Back to Companies
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={company.name}>
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/dashboard/college-admin/companies')}
          className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Back to Companies</span>
        </button>

        <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 rounded-3xl p-8 shadow-2xl shadow-blue-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-white">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <Building2 className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2">{company.name}</h1>
                <p className="text-blue-100 text-lg">{company.industry || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleToggleStatus}
                className={`px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-lg ${
                  company.isActive
                    ? 'bg-white text-green-600 hover:bg-green-50'
                    : 'bg-white text-red-600 hover:bg-red-50'
                }`}
              >
                {company.isActive ? (
                  <>
                    <ToggleRight className="w-5 h-5" />
                    Active
                  </>
                ) : (
                  <>
                    <ToggleLeft className="w-5 h-5" />
                    Inactive
                  </>
                )}
              </button>
              <button
                onClick={() => navigate(`/dashboard/college-admin/companies/edit/${companyId}`)}
                className="bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold flex items-center gap-2 hover:bg-blue-50 transition-all shadow-lg"
              >
                <Edit className="w-5 h-5" />
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="bg-white text-red-600 px-6 py-3 rounded-xl font-semibold flex items-center gap-2 hover:bg-red-50 transition-all shadow-lg"
              >
                <Trash2 className="w-5 h-5" />
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Information */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 shadow-xl border border-white/50">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Mail className="w-6 h-6 text-blue-600" />
              Contact Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-semibold text-gray-600 mb-2 block">Email</label>
                <div className="flex items-center gap-2 text-gray-900">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <a href={`mailto:${company.email}`} className="hover:text-blue-600">
                    {company.email || 'N/A'}
                  </a>
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600 mb-2 block">Phone</label>
                <div className="flex items-center gap-2 text-gray-900">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <a href={`tel:${company.phone}`} className="hover:text-blue-600">
                    {company.phone || 'N/A'}
                  </a>
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600 mb-2 block">Website</label>
                <div className="flex items-center gap-2 text-gray-900">
                  <Globe className="w-5 h-5 text-gray-400" />
                  {company.website ? (
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-blue-600 truncate"
                    >
                      {company.website}
                    </a>
                  ) : (
                    'N/A'
                  )}
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600 mb-2 block">Location</label>
                <div className="flex items-center gap-2 text-gray-900">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <span>{company.location || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Company Details */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 shadow-xl border border-white/50">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <FileText className="w-6 h-6 text-blue-600" />
              Company Details
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-600 mb-2 block">Description</label>
                <p className="text-gray-900 leading-relaxed">
                  {company.description || 'No description provided'}
                </p>
              </div>
              {company.specialization && (
                <div>
                  <label className="text-sm font-semibold text-gray-600 mb-2 block">Specialization</label>
                  <div className="flex flex-wrap gap-2">
                    {company.specialization.map((spec, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Stats</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <Briefcase className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">Active Jobs</span>
                </div>
                <span className="text-lg font-bold text-blue-600">
                  {company.stats?.activeJobs || 0}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-gray-700">Hired Students</span>
                </div>
                <span className="text-lg font-bold text-green-600">
                  {company.stats?.hiredStudents || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Additional Information</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-gray-700">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Added On</p>
                  <p className="text-sm font-medium">
                    {company.createdAt
                      ? new Date(company.createdAt).toLocaleDateString()
                      : 'N/A'}
                  </p>
                </div>
              </div>
              {company.createdBy && (
                <div className="flex items-center gap-3 text-gray-700">
                  <Users className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Added By</p>
                    <p className="text-sm font-medium">{company.createdBy.fullName || 'N/A'}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CompanyDetail;