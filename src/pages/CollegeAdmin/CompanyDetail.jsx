// pages/CollegeAdmin/CompanyDetail.jsx - Fixed JD live fetching + eligible student count
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
import { companyAPI, collegeAdminAPI } from '../../api/Api';

// Status values from backend are capitalized
const JD_STATUS_CONFIG = {
  Active:    { label: 'Active',    color: 'bg-green-100 text-green-700',   icon: CheckCircle },
  Closed:    { label: 'Closed',    color: 'bg-red-100 text-red-700',       icon: XCircle },
  Draft:     { label: 'Draft',     color: 'bg-yellow-100 text-yellow-700', icon: AlertCircle },
  Cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-600',     icon: XCircle },
};

// Compute how many students are eligible for a given job
const countEligibleStudents = (job, students) => {
  if (!students || students.length === 0) return 0;
  const { branches = [], batches = [], minCGPA } = job.eligibility || {};
  return students.filter((s) => {
    const cgpaOk  = !minCGPA  || (s.cgpa  != null && parseFloat(s.cgpa)  >= parseFloat(minCGPA));
    const branchOk = !branches.length || branches.includes(s.branch);
    const batchOk  = !batches.length  || batches.includes(String(s.batch));
    return cgpaOk && branchOk && batchOk;
  }).length;
};

const CompanyDetail = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const { companyId } = useParams();

  const [loading,     setLoading]     = useState(true);
  const [company,     setCompany]     = useState(null);
  const [jobs,        setJobs]        = useState([]);
  const [students,    setStudents]    = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);

  // 1️⃣ Load company details
  useEffect(() => { fetchCompanyDetails(); }, [companyId]);

  // 2️⃣ Load jobs + students in parallel (both needed for eligible count)
  useEffect(() => {
    if (companyId) {
      setJobsLoading(true);
      Promise.all([
        fetchCompanyJobs(),
        fetchAllStudents(),
      ]).finally(() => setJobsLoading(false));
    }
  }, [companyId]);

  const fetchCompanyDetails = async () => {
    try {
      setLoading(true);
      const response = await companyAPI.getCompanyById(companyId);
      if (response.success) setCompany(response.company);
    } catch (error) {
      toast.error('Error', 'Failed to fetch company details: ' + error.message);
      navigate('/dashboard/college-admin/companies');
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIX: Use collegeAdminAPI.getJobs() (existing working endpoint) + filter client-side
  const fetchCompanyJobs = async () => {
    try {
      const response = await collegeAdminAPI.getJobs();
      if (response.success) {
        const allJobs = response.jobs || [];
        // Filter to only this company's JDs
        const filtered = allJobs.filter(
          (job) => job.companyId?._id === companyId || job.companyId === companyId
        );
        setJobs(filtered);
      }
    } catch (error) {
      console.error('Error fetching company jobs:', error);
    }
  };

  // Fetch all students once so we can compute eligible count per JD on the frontend
  const fetchAllStudents = async () => {
    try {
      const response = await collegeAdminAPI.getStudents({ limit: 10000 });
      if (response.success) {
        setStudents(response.students || []);
      }
    } catch (error) {
      console.error('Error fetching students for eligible count:', error);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${company.name}"? This action cannot be undone.`)) return;
    try {
      await companyAPI.deleteCompany(companyId);
      toast.success('Success', 'Company deleted successfully');
      navigate('/dashboard/college-admin/companies');
    } catch (error) {
      toast.error('Error', 'Failed to delete company: ' + error.message);
    }
  };

  const handleToggleStatus = async () => {
    try {
      await companyAPI.updateCompany(companyId, { isActive: !company.isActive });
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
          <button onClick={() => navigate('/dashboard/college-admin/companies')}
            className="mt-6 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold">
            Back to Companies
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const totalEligibleAcrossJDs = jobs.reduce(
    (sum, job) => sum + countEligibleStudents(job, students), 0
  );

  return (
    <DashboardLayout title={company.name}>
      {/* Back + Hero */}
      <div className="mb-8">
        <button onClick={() => navigate('/dashboard/college-admin/companies')}
          className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors group">
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Back to Companies</span>
        </button>

        <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 rounded-3xl p-8 shadow-2xl shadow-blue-500/30">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4 text-white">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <Building2 className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-1">{company.name}</h1>
                <p className="text-blue-100 text-lg">{company.industry || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <button onClick={handleToggleStatus}
                className={`px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-lg ${company.isActive ? 'bg-white text-green-600 hover:bg-green-50' : 'bg-white text-red-600 hover:bg-red-50'}`}>
                {company.isActive ? <><ToggleRight className="w-5 h-5" />Active</> : <><ToggleLeft className="w-5 h-5" />Inactive</>}
              </button>
              <button onClick={() => navigate(`/dashboard/college-admin/companies/edit/${companyId}`)}
                className="bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold flex items-center gap-2 hover:bg-blue-50 transition-all shadow-lg">
                <Edit className="w-5 h-5" /> Edit
              </button>
              <button onClick={handleDelete}
                className="bg-white text-red-600 px-6 py-3 rounded-xl font-semibold flex items-center gap-2 hover:bg-red-50 transition-all shadow-lg">
                <Trash2 className="w-5 h-5" /> Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ── Main Content ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Contact Information */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 shadow-xl border border-white/50">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Mail className="w-6 h-6 text-blue-600" /> Contact Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-semibold text-gray-600 mb-2 block">Email</label>
                <div className="flex items-center gap-2 text-gray-900">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <a href={`mailto:${company.email}`} className="hover:text-blue-600">{company.email || 'N/A'}</a>
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600 mb-2 block">Phone</label>
                <div className="flex items-center gap-2 text-gray-900">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <a href={`tel:${company.phone}`} className="hover:text-blue-600">{company.phone || 'N/A'}</a>
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600 mb-2 block">Website</label>
                <div className="flex items-center gap-2 text-gray-900">
                  <Globe className="w-5 h-5 text-gray-400" />
                  {company.website
                    ? <a href={company.website} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 truncate">{company.website}</a>
                    : 'N/A'}
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600 mb-2 block">Location</label>
                <div className="flex items-center gap-2 text-gray-900">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <span>{company.headquarters?.city || company.location || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Company Details */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 shadow-xl border border-white/50">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <FileText className="w-6 h-6 text-blue-600" /> Company Details
            </h2>
            <div>
              <label className="text-sm font-semibold text-gray-600 mb-2 block">Description</label>
              <p className="text-gray-900 leading-relaxed">{company.description || 'No description provided'}</p>
            </div>
            {company.specialization?.length > 0 && (
              <div className="mt-4">
                <label className="text-sm font-semibold text-gray-600 mb-2 block">Specialization</label>
                <div className="flex flex-wrap gap-2">
                  {company.specialization.map((spec, i) => (
                    <span key={i} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">{spec}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── JOB DESCRIPTIONS ── */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 shadow-xl border border-white/50">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <Briefcase className="w-6 h-6 text-blue-600" />
                Job Descriptions
                <span className="ml-1 px-2.5 py-0.5 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">{jobs.length}</span>
              </h2>
              <button
                onClick={() => navigate(`/dashboard/college-admin/jobs/create?companyId=${companyId}`)}
                className="text-sm text-blue-600 hover:text-blue-700 font-semibold px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors">
                + Add JD
              </button>
            </div>

            {jobsLoading ? (
              <div className="flex items-center justify-center py-10">
                <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                <span className="ml-3 text-gray-500 font-medium">Loading job descriptions...</span>
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No job descriptions yet</p>
                <p className="text-gray-400 text-sm mt-1">Create a JD for this company to see it here</p>
                <button onClick={() => navigate(`/dashboard/college-admin/jobs/create?companyId=${companyId}`)}
                  className="mt-4 px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">
                  Create First JD
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {jobs.map((job) => {
                  const statusCfg = JD_STATUS_CONFIG[job.status] || JD_STATUS_CONFIG.Draft;
                  const StatusIcon = statusCfg.icon;

                  // ✅ Eligible count computed from students + job.eligibility (no extra API call)
                  const eligibleCount = countEligibleStudents(job, students);
                  const totalApplications = job.stats?.totalApplications || 0;

                  // ✅ Correct field: job.package?.ctc
                  const ctcMin = job.package?.ctc?.min;
                  const ctcMax = job.package?.ctc?.max;
                  const ctcLabel = ctcMin != null && ctcMax != null
                    ? `₹${ctcMin} – ₹${ctcMax} LPA`
                    : ctcMin != null ? `₹${ctcMin} LPA` : null;

                  return (
                    <div
                      key={job._id}
                      onClick={() => navigate(`/dashboard/college-admin/jobs/view/${job._id}`)}
                      className="border border-gray-100 rounded-xl p-5 bg-gray-50/50 hover:border-blue-200 hover:shadow-md transition-all group cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-4">
                        {/* Left info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <h3 className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                              {job.title}
                            </h3>
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusCfg.color}`}>
                              <StatusIcon className="w-3 h-3" />{statusCfg.label}
                            </span>
                            {job.jobType && (
                              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">{job.jobType}</span>
                            )}
                            {job.isPinned && (
                              <span className="px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full text-xs font-semibold">📌 Pinned</span>
                            )}
                          </div>

                          {/* Meta */}
                          <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-3">
                            {job.location && (
                              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{job.location}</span>
                            )}
                            {ctcLabel && (
                              <span className="flex items-center gap-1 font-medium text-gray-700">💰 {ctcLabel}</span>
                            )}
                            {job.lastDate && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                Deadline: {new Date(job.lastDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </span>
                            )}
                          </div>

                          {/* Eligibility tags — ✅ correct field: job.eligibility */}
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
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-400 rounded-md text-xs">
                                +{job.eligibility.branches.length - 3} more
                              </span>
                            )}
                            {job.eligibility?.batches?.length > 0 && (
                              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md text-xs font-medium border border-indigo-100">
                                Batch: {job.eligibility.batches.join(', ')}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Right: Eligible + Applied counts */}
                        <div className="flex flex-col items-center gap-2 shrink-0">
                          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl px-4 py-3 text-center min-w-[90px]">
                            <GraduationCap className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                            <p className="text-2xl font-bold text-blue-700 leading-none">{eligibleCount}</p>
                            <p className="text-xs text-blue-500 mt-1 font-medium">Eligible</p>
                          </div>
                          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2 text-center min-w-[90px]">
                            <p className="text-lg font-bold text-green-700 leading-none">{totalApplications}</p>
                            <p className="text-xs text-green-500 font-medium mt-0.5">Applied</p>
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
          {/* Quick Stats */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                <div className="flex items-center gap-3"><Briefcase className="w-5 h-5 text-blue-600" /><span className="text-sm font-medium text-gray-700">Active JDs</span></div>
                <span className="text-lg font-bold text-blue-600">{jobs.filter((j) => j.status === 'Active').length}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl">
                <div className="flex items-center gap-3"><FileText className="w-5 h-5 text-purple-600" /><span className="text-sm font-medium text-gray-700">Total JDs</span></div>
                <span className="text-lg font-bold text-purple-600">{jobs.length}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-cyan-50 rounded-xl">
                <div className="flex items-center gap-3"><GraduationCap className="w-5 h-5 text-cyan-600" /><span className="text-sm font-medium text-gray-700">Total Eligible</span></div>
                <span className="text-lg font-bold text-cyan-600">{totalEligibleAcrossJDs}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                <div className="flex items-center gap-3"><Users className="w-5 h-5 text-green-600" /><span className="text-sm font-medium text-gray-700">Hired Students</span></div>
                <span className="text-lg font-bold text-green-600">{company.stats?.hiredStudents || 0}</span>
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
                  <p className="text-sm font-medium">{company.createdAt ? new Date(company.createdAt).toLocaleDateString() : 'N/A'}</p>
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
                  <span className="text-blue-100 text-sm">Total Eligible Students</span>
                  <span className="font-bold text-lg">{totalEligibleAcrossJDs}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CompanyDetail;