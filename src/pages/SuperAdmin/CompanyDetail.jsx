// pages/SuperAdmin/CompanyDetail.jsx - Fixed JD live fetching + eligible student count
import { useToast } from '../../context/ToastContext';
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Building2, ArrowLeft, Edit, Trash2, Mail, Phone, Globe, MapPin,
  Briefcase, Users, ToggleLeft, ToggleRight, Calendar, FileText,
  Clock, CheckCircle, XCircle, AlertCircle, ChevronRight, GraduationCap,
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { companyAPI, jobAPI } from '../../api/Api';

const JD_STATUS_CONFIG = {
  Active:    { label: 'Active',    color: 'bg-green-100 text-green-700',   icon: CheckCircle },
  Closed:    { label: 'Closed',    color: 'bg-red-100 text-red-700',       icon: XCircle },
  Draft:     { label: 'Draft',     color: 'bg-yellow-100 text-yellow-700', icon: AlertCircle },
  Cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-600',     icon: XCircle },
};

const CompanyDetail = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const { companyId } = useParams();

  const [loading,     setLoading]     = useState(true);
  const [company,     setCompany]     = useState(null);
  const [jobs,        setJobs]        = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);

  useEffect(() => { fetchCompanyDetails(); }, [companyId]);
  useEffect(() => { if (companyId) fetchCompanyJobs(); }, [companyId]);

  const fetchCompanyDetails = async () => {
    try {
      setLoading(true);
      const response = await companyAPI.getCompanyById(companyId);
      if (response.success) setCompany(response.company);
    } catch (error) {
      toast.error('Error', 'Failed to fetch company details: ' + error.message);
      navigate('/dashboard/super-admin/companies');
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIX: Use jobAPI.getAllJobs() (working endpoint) and filter client-side by companyId
  const fetchCompanyJobs = async () => {
    try {
      setJobsLoading(true);
      const response = await jobAPI.getAllJobs();
      if (response.success) {
        const allJobs = response.jobs || [];
        const filtered = allJobs.filter(
          (job) => job.companyId?._id === companyId || job.companyId === companyId
        );
        setJobs(filtered);
      }
    } catch (error) {
      console.error('Error fetching company jobs:', error);
    } finally {
      setJobsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${company.name}"? This action cannot be undone.`)) return;
    try {
      await companyAPI.deleteCompany(companyId);
      toast.success('Success', 'Company deleted successfully');
      navigate('/dashboard/super-admin/companies');
    } catch (error) {
      toast.error('Error', 'Failed to delete company: ' + error.message);
    }
  };

  const handleToggleStatus = async () => {
    try {
      await companyAPI.toggleActiveStatus(companyId);
      toast.success('Success', `Company ${company.isActive ? 'deactivated' : 'activated'} successfully`);
      fetchCompanyDetails();
    } catch (error) {
      toast.error('Error', 'Failed to update status: ' + error.message);
    }
  };

  if (loading) return <LoadingSpinner message="Loading Company Details..." />;

  if (!company) {
    return (
      <DashboardLayout title="Company Not Found">
        <div className="text-center py-16">
          <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Company not found</p>
          <button onClick={() => navigate('/dashboard/super-admin/companies')}
            className="mt-6 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold">
            Back to Companies
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={company.name}>
      {/* Back + Hero */}
      <div className="mb-8">
        <button onClick={() => navigate('/dashboard/super-admin/companies')}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-4 transition-colors">
          <ArrowLeft className="w-5 h-5" /> Back to Companies
        </button>

        <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 rounded-3xl p-8 shadow-2xl shadow-blue-500/30">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="text-white flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">{company.name}</h1>
                {company.industry && <p className="text-blue-100 text-lg mt-1">{company.industry}</p>}
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <button onClick={handleToggleStatus}
                className={`px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-lg ${company.isActive ? 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30' : 'bg-white text-blue-600 hover:bg-blue-50'}`}>
                {company.isActive ? <><ToggleRight className="w-5 h-5" />Active</> : <><ToggleLeft className="w-5 h-5" />Inactive</>}
              </button>
              <button onClick={() => navigate(`/dashboard/super-admin/companies/edit/${companyId}`)}
                className="bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold flex items-center gap-2 hover:bg-blue-50 transition-all shadow-lg">
                <Edit className="w-5 h-5" /> Edit
              </button>
              <button onClick={handleDelete}
                className="bg-red-600 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 hover:bg-red-700 transition-all shadow-lg">
                <Trash2 className="w-5 h-5" /> Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Main Content ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* About */}
          {company.description && (
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">About</h2>
              </div>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{company.description}</p>
            </div>
          )}

          {/* Contact */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Contact Information</h2>
            </div>
            <div className="space-y-4">
              {company.email && (
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                  <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div><p className="text-sm font-medium text-gray-600 mb-1">Email</p>
                    <a href={`mailto:${company.email}`} className="text-blue-600 hover:underline font-medium">{company.email}</a></div>
                </div>
              )}
              {company.phone && (
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                  <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div><p className="text-sm font-medium text-gray-600 mb-1">Phone</p>
                    <a href={`tel:${company.phone}`} className="text-blue-600 hover:underline font-medium">{company.phone}</a></div>
                </div>
              )}
              {company.website && (
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                  <Globe className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div><p className="text-sm font-medium text-gray-600 mb-1">Website</p>
                    <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">{company.website}</a></div>
                </div>
              )}
              {(company.headquarters?.city || company.location) && (
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div><p className="text-sm font-medium text-gray-600 mb-1">Location</p>
                    <p className="text-gray-900 font-medium">{company.headquarters?.city || company.location}</p></div>
                </div>
              )}
            </div>
          </div>

          {/* ── JOB DESCRIPTIONS ── */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  Job Descriptions
                  <span className="px-2.5 py-0.5 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">{jobs.length}</span>
                </h2>
              </div>
            </div>

            {jobsLoading ? (
              <div className="flex items-center justify-center py-10">
                <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                <span className="ml-3 text-gray-500 font-medium">Loading job descriptions...</span>
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No job descriptions found</p>
                <p className="text-gray-400 text-sm mt-1">JDs created by college admins for this company will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {jobs.map((job) => {
                  const statusCfg = JD_STATUS_CONFIG[job.status] || JD_STATUS_CONFIG.Draft;
                  const StatusIcon = statusCfg.icon;
                  const totalApplications = job.stats?.totalApplications || 0;
                  const ctcMin = job.package?.ctc?.min;
                  const ctcMax = job.package?.ctc?.max;
                  const ctcLabel = ctcMin != null && ctcMax != null
                    ? `₹${ctcMin} – ₹${ctcMax} LPA`
                    : ctcMin != null ? `₹${ctcMin} LPA` : null;

                  return (
                    <div
                      key={job._id}
                      onClick={() => navigate(`/dashboard/super-admin/jobs/view/${job._id}`)}
                      className="border border-gray-100 rounded-xl p-5 bg-gray-50/50 hover:border-blue-200 hover:shadow-md transition-all group cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <h3 className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{job.title}</h3>
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusCfg.color}`}>
                              <StatusIcon className="w-3 h-3" />{statusCfg.label}
                            </span>
                            {job.jobType && (
                              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">{job.jobType}</span>
                            )}
                            {job.isPinned && <span className="px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full text-xs font-semibold">📌 Pinned</span>}
                          </div>

                          {/* College name (useful for super admin view) */}
                          {job.college?.name && (
                            <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                              <Building2 className="w-3 h-3" /> {job.college.name}
                            </p>
                          )}

                          <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-3">
                            {job.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{job.location}</span>}
                            {ctcLabel && <span className="font-medium text-gray-700">💰 {ctcLabel}</span>}
                            {job.lastDate && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                Deadline: {new Date(job.lastDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </span>
                            )}
                          </div>

                          {/* Eligibility — ✅ correct field: job.eligibility */}
                          <div className="flex flex-wrap gap-2">
                            {job.eligibility?.minCGPA && (
                              <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-xs font-medium border border-blue-100">
                                Min CGPA: {job.eligibility.minCGPA}
                              </span>
                            )}
                            {job.eligibility?.branches?.slice(0, 3).map((b, i) => (
                              <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-xs font-medium">{b}</span>
                            ))}
                            {(job.eligibility?.branches?.length || 0) > 3 && (
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-400 rounded-md text-xs">+{job.eligibility.branches.length - 3} more</span>
                            )}
                            {job.eligibility?.batches?.length > 0 && (
                              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md text-xs font-medium border border-indigo-100">
                                Batch: {job.eligibility.batches.join(', ')}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Applied count (super admin doesn't have student access to compute eligible) */}
                        <div className="flex flex-col items-center gap-2 shrink-0">
                          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-center min-w-[90px]">
                            <Users className="w-4 h-4 text-green-500 mx-auto mb-1" />
                            <p className="text-2xl font-bold text-green-700 leading-none">{totalApplications}</p>
                            <p className="text-xs text-green-500 mt-1 font-medium">Applied</p>
                          </div>
                        </div>

                        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-400 transition-colors self-center shrink-0" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Sidebar ── */}
        <div className="space-y-6">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Info</h3>
            <div className="space-y-4">
              {company.industry && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center"><Briefcase className="w-5 h-5 text-blue-600" /></div>
                  <div><p className="text-xs text-gray-600 font-medium">Industry</p><p className="text-sm font-semibold text-gray-900">{company.industry}</p></div>
                </div>
              )}
              {company.companySize && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center"><Users className="w-5 h-5 text-green-600" /></div>
                  <div><p className="text-xs text-gray-600 font-medium">Company Size</p><p className="text-sm font-semibold text-gray-900">{company.companySize} employees</p></div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${company.isActive ? 'bg-green-100' : 'bg-red-100'}`}>
                  {company.isActive ? <ToggleRight className="w-5 h-5 text-green-600" /> : <ToggleLeft className="w-5 h-5 text-red-600" />}
                </div>
                <div><p className="text-xs text-gray-600 font-medium">Status</p>
                  <p className={`text-sm font-semibold ${company.isActive ? 'text-green-600' : 'text-red-600'}`}>{company.isActive ? 'Active' : 'Inactive'}</p></div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center"><FileText className="w-5 h-5 text-purple-600" /></div>
                <div><p className="text-xs text-gray-600 font-medium">Total JDs</p><p className="text-sm font-semibold text-gray-900">{jobs.length}</p></div>
              </div>
            </div>
          </div>

          {/* JD Breakdown */}
          {jobs.length > 0 && (
            <div className="bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl p-6 shadow-xl text-white">
              <h3 className="text-lg font-bold mb-4">JD Breakdown</h3>
              <div className="space-y-3">
                {['Active', 'Draft', 'Closed', 'Cancelled'].map((status) => {
                  const count = jobs.filter((j) => j.status === status).length;
                  if (!count) return null;
                  return (
                    <div key={status} className="flex justify-between items-center">
                      <span className="text-blue-100 text-sm">{status}</span>
                      <span className="font-bold">{count}</span>
                    </div>
                  );
                })}
                <div className="border-t border-white/20 pt-3 flex justify-between items-center">
                  <span className="text-blue-100 text-sm">Total Applied</span>
                  <span className="font-bold text-lg">{jobs.reduce((s, j) => s + (j.stats?.totalApplications || 0), 0)}</span>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Metadata</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm"><Calendar className="w-4 h-4 text-gray-400" />
                <div><span className="text-gray-600">Created:</span><span className="ml-2 font-medium text-gray-900">{new Date(company.createdAt).toLocaleDateString()}</span></div>
              </div>
              <div className="flex items-center gap-3 text-sm"><Calendar className="w-4 h-4 text-gray-400" />
                <div><span className="text-gray-600">Updated:</span><span className="ml-2 font-medium text-gray-900">{new Date(company.updatedAt).toLocaleDateString()}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CompanyDetail;