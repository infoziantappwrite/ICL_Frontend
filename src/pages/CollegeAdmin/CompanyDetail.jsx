// pages/CollegeAdmin/CompanyDetail.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Building2,
  ArrowLeft,
  Mail,
  Phone,
  Globe,
  MapPin,
  Briefcase,
  Users,
  Calendar,
  FileText,
  CheckCircle,
  XCircle,
  ExternalLink,
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { companyAPI } from '../../api/Api';

const CompanyDetail = () => {
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
      alert('Failed to fetch company details: ' + error.message);
      navigate('/dashboard/college-admin/companies');
    } finally {
      setLoading(false);
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
            className="mt-6 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700"
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
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Companies
        </button>

        <div className="bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500 rounded-3xl p-8 shadow-2xl shadow-blue-500/30">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="text-white">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">{company.name}</h1>
                  {company.industry && (
                    <p className="text-blue-100 text-lg mt-1">{company.industry}</p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className={`px-6 py-3 rounded-xl font-semibold flex items-center gap-2 ${
                company.isActive
                  ? 'bg-white/20 backdrop-blur-sm text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}>
                {company.isActive ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Active
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5" />
                    Inactive
                  </>
                )}
              </div>
              {company.website && (
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold flex items-center gap-2 hover:bg-blue-50 transition-all shadow-lg"
                >
                  <ExternalLink className="w-5 h-5" />
                  Visit Website
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Info Note */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-r-xl">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-blue-900 font-medium">
              This company is available for job postings
            </p>
            <p className="text-blue-700 text-sm mt-1">
              You can select this company when creating job descriptions. To update company information, contact your Super Admin.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Left Side */}
        <div className="lg:col-span-2 space-y-6">
          {/* Company Description */}
          {company.description && (
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">About</h2>
              </div>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{company.description}</p>
            </div>
          )}

          {/* Contact Information */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Contact Information</h2>
            </div>

            <div className="space-y-4">
              {company.email && (
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                  <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Email</p>
                    <a
                      href={`mailto:${company.email}`}
                      className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
                    >
                      {company.email}
                    </a>
                  </div>
                </div>
              )}

              {company.phone && (
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                  <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Phone</p>
                    <a
                      href={`tel:${company.phone}`}
                      className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
                    >
                      {company.phone}
                    </a>
                  </div>
                </div>
              )}

              {company.website && (
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                  <Globe className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Website</p>
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 font-medium hover:underline flex items-center gap-1"
                    >
                      {company.website}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              )}

              {company.location && (
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Location</p>
                    <p className="text-gray-900 font-medium">{company.location}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar - Right Side */}
        <div className="space-y-6">
          {/* Quick Info */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Info</h3>
            <div className="space-y-4">
              {company.industry && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 font-medium">Industry</p>
                    <p className="text-sm font-semibold text-gray-900">{company.industry}</p>
                  </div>
                </div>
              )}

              {company.companySize && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 font-medium">Company Size</p>
                    <p className="text-sm font-semibold text-gray-900">{company.companySize} employees</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  company.isActive ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  {company.isActive ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-gray-600" />
                  )}
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-medium">Status</p>
                  <p className={`text-sm font-semibold ${
                    company.isActive ? 'text-green-600' : 'text-gray-600'
                  }`}>
                    {company.isActive ? 'Active & Hiring' : 'Inactive'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Metadata */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Information</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-4 h-4 text-gray-400" />
                <div>
                  <span className="text-gray-600">Added on:</span>
                  <span className="ml-2 font-medium text-gray-900">
                    {new Date(company.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-4 h-4 text-gray-400" />
                <div>
                  <span className="text-gray-600">Last updated:</span>
                  <span className="ml-2 font-medium text-gray-900">
                    {new Date(company.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Card */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 shadow-xl text-white">
            <h3 className="text-lg font-bold mb-2">Ready to post a job?</h3>
            <p className="text-blue-100 text-sm mb-4">
              Create a new job description and select this company
            </p>
            <button
              onClick={() => navigate('/dashboard/college-admin/jobs/create')}
              className="w-full py-2.5 bg-white text-blue-600 rounded-xl hover:bg-blue-50 transition-all font-semibold"
            >
              Create Job Description
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CompanyDetail;