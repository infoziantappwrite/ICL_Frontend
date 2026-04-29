// pages/CollegeAdmin/CompanyDetail.jsx — redesigned to match SuperAdmin/CollegeAdmin theme
import { useToast } from '../../context/ToastContext';
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Building2, ArrowLeft, SquarePen, Trash2, Mail, Phone, Globe, MapPin,
  Briefcase, Users, ToggleLeft, ToggleRight, Calendar, FileText,
  Clock, CheckCircle, XCircle, AlertCircle, ChevronRight, GraduationCap, Plus,
} from 'lucide-react';
import CollegeAdminLayout from '../../components/layout/CollegeAdminLayout';
import { DetailSkeleton } from '../../components/common/SkeletonLoader';
import { companyAPI, collegeAdminAPI } from '../../api/Api';

const JD_STATUS_CONFIG = {
  Active:    { label: 'Active',    color: 'bg-[#003399]/5 text-[#003399] border-[#003399]/10',   dot: 'bg-[#003399]',   icon: CheckCircle  },
  Closed:    { label: 'Closed',    color: 'bg-gray-50 text-gray-500 border-gray-200',   dot: 'bg-gray-400',   icon: XCircle      },
  Draft:     { label: 'Draft',     color: 'bg-amber-50 text-amber-600 border-amber-100', dot: 'bg-amber-400',  icon: AlertCircle  },
  Cancelled: { label: 'Cancelled', color: 'bg-red-50 text-red-500 border-red-100',      dot: 'bg-red-400',    icon: XCircle      },
};

const countEligibleStudents = (job, students) => {
  if (!students || students.length === 0) return 0;
  const { branches = [], batches = [], minCGPA } = job.eligibility || {};
  return students.filter((s) => {
    const cgpaOk   = !minCGPA  || (s.cgpa  != null && parseFloat(s.cgpa)  >= parseFloat(minCGPA));
    const branchOk = !branches.length || branches.includes(s.branch);
    const batchOk  = !batches.length  || batches.includes(String(s.batch));
    return cgpaOk && branchOk && batchOk;
  }).length;
};

/* ─── Section heading ─────────────────────── */
const SHead = ({ icon: Icon, title, count }) => (
  <div className="flex items-center gap-3 mb-4">
    <div className="w-8 h-8 bg-[#003399]/10 rounded-lg flex items-center justify-center flex-shrink-0">
      <Icon className="w-4 h-4 text-[#003399]" />
    </div>
    <h3 className="text-[15px] font-bold text-gray-900 leading-none">{title}</h3>
    {count !== undefined && (
      <span className="ml-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-[11px] font-bold">{count}</span>
    )}
  </div>
);

/* ─── Info row ─────────────────────────────── */
const InfoRow = ({ icon: Icon, label, children }) => (
  <div className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
    <div className="w-5 h-5 mt-0.5 flex-shrink-0 text-slate-400">
      <Icon className="w-4 h-4" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[10px] text-slate-400 font-medium leading-none mb-0.5">{label}</p>
      <div className="text-xs text-gray-800 font-semibold">{children}</div>
    </div>
  </div>
);

/* ─── Sidebar stat tile ─────────────────────── */
const StatTile = ({ icon: Icon, label, value, color, bg }) => (
  <div className={`flex items-center justify-between px-3 py-2.5 ${bg} rounded-xl border`}>
    <div className="flex items-center gap-2">
      <Icon className={`w-4 h-4 ${color}`} />
      <span className="text-xs font-medium text-gray-700">{label}</span>
    </div>
    <span className={`text-base font-black ${color}`}>{value}</span>
  </div>
);

/* ══════════════════════════════════════════ */
const CompanyDetail = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const { companyId } = useParams();

  const [loading,     setLoading]     = useState(true);
  const [company,     setCompany]     = useState(null);
  const [jobs,        setJobs]        = useState([]);
  const [students,    setStudents]    = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);

  useEffect(() => { fetchCompanyDetails(); }, [companyId]);

  useEffect(() => {
    if (companyId) {
      setJobsLoading(true);
      Promise.all([fetchCompanyJobs(), fetchAllStudents()]).finally(() => setJobsLoading(false));
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

  const fetchCompanyJobs = async () => {
    try {
      const response = await collegeAdminAPI.getJobs();
      if (response.success) {
        const allJobs = response.jobs || [];
        setJobs(allJobs.filter(job => job.companyId?._id === companyId || job.companyId === companyId));
      }
    } catch (error) { console.error('Error fetching company jobs:', error); }
  };

  const fetchAllStudents = async () => {
    try {
      const response = await collegeAdminAPI.getStudents({ limit: 10000 });
      if (response.success) setStudents(response.students || []);
    } catch (error) { console.error('Error fetching students:', error); }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${company.name}"? This action cannot be undone.`)) return;
    try {
      await companyAPI.deleteCompany(companyId);
      toast.success('Success', 'Company deleted successfully');
      navigate('/dashboard/college-admin/companies');
    } catch (error) { toast.error('Error', 'Failed to delete company: ' + error.message); }
  };

  const handleToggleStatus = async () => {
    try {
      await companyAPI.updateCompany(companyId, { isActive: !company.isActive });
      toast.success('Success', `Company ${company.isActive ? 'deactivated' : 'activated'} successfully`);
      fetchCompanyDetails();
    } catch (error) { toast.error('Error', 'Failed to update status: ' + error.message); }
  };

  if (loading) return <DetailSkeleton layout={CollegeAdminLayout} />;

  if (!company) {
    return (
      <CollegeAdminLayout>
      <div className="px-6 py-4 md:px-8 md:py-6 space-y-5 font-sans">
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-12 h-12 bg-[#003399]/10 rounded-2xl flex items-center justify-center mb-3">
            <Building2 className="w-6 h-6 text-[#003399]/30" />
          </div>
          <p className="text-sm font-semibold text-gray-600 mb-4">Company not found</p>
          <button onClick={() => navigate('/dashboard/college-admin/companies')}
            className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl bg-gradient-to-r from-[#003399] to-[#00A9CE] text-white shadow-sm hover:scale-105 transition-all">
            <ArrowLeft className="w-3 h-3" /> Back to Companies
          </button>
        </div>
      </div>
    </CollegeAdminLayout>
    );
  }

  const totalEligibleAcrossJDs = jobs.reduce((sum, job) => sum + countEligibleStudents(job, students), 0);
  const activeJDs = jobs.filter(j => j.status === 'Active').length;

  return (
    <CollegeAdminLayout>
      <div className="px-6 py-4 md:px-8 md:py-6 space-y-5 font-sans">

      {/* Back button */}
      <button onClick={() => navigate('/dashboard/college-admin/companies')}
        className="flex items-center gap-2 text-gray-500 hover:text-[#003399] mb-2 transition-colors group text-[13px] font-bold">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Companies
      </button>

      {/* ══ HEADER ══ */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-[#003399]/5 border border-[#003399]/20 rounded-2xl flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
            <Building2 className="w-8 h-8 text-[#003399]" />
          </div>
          <div>
            <h1 className="text-[24px] md:text-[28px] font-black text-gray-900 leading-tight tracking-tight">{company.name}</h1>
            <p className="text-[13px] font-bold text-gray-500 mt-0.5">{company.industry || 'N/A'}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold border shadow-sm ${
                company.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-500 border-gray-200'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${company.isActive ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                {company.isActive ? 'Active' : 'Inactive'}
              </span>
              <span className="inline-flex items-center gap-1 bg-[#003399]/5 text-[#003399] rounded-md px-2 py-0.5 text-[11px] font-bold border border-[#003399]/20 shadow-sm">
                <Briefcase className="w-3 h-3" /> {jobs.length} JD{jobs.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
          <button onClick={handleToggleStatus}
            className="inline-flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 text-[13px] font-bold px-4 py-2 rounded-lg hover:bg-slate-50/30 transition-colors shadow-sm">
            {company.isActive ? <ToggleRight className="w-4 h-4 text-emerald-500" /> : <ToggleLeft className="w-4 h-4 text-slate-400" />}
            {company.isActive ? 'Deactivate' : 'Activate'}
          </button>
          <button onClick={() => navigate(`/dashboard/college-admin/companies/edit/${companyId}`)}
            className="inline-flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 text-[13px] font-bold px-4 py-2 rounded-lg hover:bg-slate-50/30 transition-colors shadow-sm">
            <SquarePen className="w-4 h-4" /> Edit
          </button>
          <button onClick={handleDelete}
            className="inline-flex items-center gap-1.5 bg-white border border-red-200 text-red-600 text-[13px] font-bold px-4 py-2 rounded-lg hover:bg-red-50 transition-colors shadow-sm">
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      </div>

      {/* ══ MAIN GRID ══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* ── LEFT (2 cols) ── */}
        <div className="lg:col-span-2 flex flex-col gap-4">

          {/* Contact & Details */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-5">
            <SHead icon={Mail} title="Contact Information" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-0">
              <InfoRow icon={Mail} label="Email">
                <a href={`mailto:${company.email}`} className="hover:text-[#003399] transition-colors">{company.email || 'N/A'}</a>
              </InfoRow>
              <InfoRow icon={Phone} label="Phone">
                <a href={`tel:${company.phone}`} className="hover:text-[#003399] transition-colors">{company.phone || 'N/A'}</a>
              </InfoRow>
              <InfoRow icon={Globe} label="Website">
                {company.website
                  ? <a href={company.website} target="_blank" rel="noopener noreferrer" className="hover:text-[#003399] truncate block transition-colors">{company.website}</a>
                  : 'N/A'}
              </InfoRow>
              <InfoRow icon={MapPin} label="Location">
                {company.headquarters?.city || company.location || 'N/A'}
              </InfoRow>
            </div>
          </div>

          {/* Company Details */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-5">
            <SHead icon={FileText} title="Company Details" />
            <p className="text-[13px] text-gray-600 leading-relaxed mb-3">{company.description || 'No description provided'}</p>
            {company.specialization?.length > 0 && (
              <div>
                <p className="text-[10px] text-slate-400 font-semibold mb-2">SPECIALIZATION</p>
                <div className="flex flex-wrap gap-1.5">
                  {company.specialization.map((spec, i) => (
                    <span key={i} className="px-2.5 py-1 bg-[#003399]/5 text-[#003399] rounded-full text-[10px] font-semibold border border-[#003399]/10">{spec}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Job Descriptions */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-5 py-4 bg-gray-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#003399]/10 rounded-lg flex items-center justify-center">
                  <Briefcase className="w-4 h-4 text-[#003399]" />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-gray-900 leading-none">Job Descriptions</h3>
                  <p className="text-[12px] font-bold text-gray-500 mt-1">{jobs.length} posting{jobs.length !== 1 ? 's' : ''} for this company</p>
                </div>
              </div>
              <button onClick={() => navigate(`/dashboard/college-admin/jobs/create?companyId=${companyId}`)}
                className="inline-flex items-center gap-1 bg-white border border-gray-200 text-gray-700 text-[13px] font-bold px-3 py-2 rounded-lg hover:bg-slate-50/30 transition-colors shadow-sm">
                <Plus className="w-3 h-3" /> Add JD
              </button>
            </div>

            {jobsLoading ? (
              <div className="flex items-center justify-center py-10 gap-2">
                <div className="w-5 h-5 border-2 border-[#003399]/20 border-t-[#003399] rounded-full animate-spin" />
                <span className="text-xs text-slate-400 font-medium">Loading job descriptions...</span>
              </div>
            ) : jobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-10 h-10 bg-[#003399]/10 rounded-2xl flex items-center justify-center mb-2">
                  <Briefcase className="w-5 h-5 text-[#003399]/30" />
                </div>
                <p className="text-sm font-semibold text-gray-500 mb-1">No job descriptions yet</p>
                <p className="text-[10px] text-slate-400 mb-3">Create a JD for this company to see it here</p>
                <button onClick={() => navigate(`/dashboard/college-admin/jobs/create?companyId=${companyId}`)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#003399] to-[#00A9CE] text-white shadow-sm hover:scale-105 transition-all">
                  <Plus className="w-3 h-3" /> Create First JD
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {jobs.map((job) => {
                  const statusCfg     = JD_STATUS_CONFIG[job.status] || JD_STATUS_CONFIG.Draft;
                  const eligibleCount = countEligibleStudents(job, students);
                  const totalApplications = job.stats?.totalApplications || 0;
                  const ctcMin = job.package?.ctc?.min;
                  const ctcMax = job.package?.ctc?.max;
                  const ctcLabel = ctcMin != null && ctcMax != null
                    ? `₹${ctcMin}–₹${ctcMax} LPA` : ctcMin != null ? `₹${ctcMin} LPA` : null;

                  return (
                    <div key={job._id}
                      onClick={() => navigate(`/dashboard/college-admin/jobs/view/${job._id}`)}
                      className="p-4 hover:bg-slate-50/20 transition-colors group cursor-pointer">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <h4 className="text-[15px] font-bold text-gray-900 group-hover:text-[#003399] transition-colors">{job.title}</h4>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border ${statusCfg.color}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                              {statusCfg.label}
                            </span>
                            {job.jobType && (
                              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full text-[9px] font-bold border border-indigo-100">{job.jobType}</span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-4 text-[12px] font-bold text-gray-500 mb-3">
                            {job.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>}
                            {ctcLabel && <span className="font-semibold text-gray-700">💰 {ctcLabel}</span>}
                            {job.lastDate && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Deadline: {new Date(job.lastDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {job.eligibility?.minCGPA && (
                              <span className="px-2 py-0.5 bg-[#003399]/5 text-[#003399] rounded-md text-[9px] font-semibold border border-[#003399]/10">Min CGPA: {job.eligibility.minCGPA}</span>
                            )}
                            {job.eligibility?.branches?.slice(0, 3).map((b, i) => (
                              <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-[9px] font-medium">{b}</span>
                            ))}
                            {(job.eligibility?.branches?.length || 0) > 3 && (
                              <span className="px-2 py-0.5 bg-gray-100 text-slate-400 rounded-md text-[9px]">+{job.eligibility.branches.length - 3}</span>
                            )}
                          </div>
                        </div>

                        {/* Eligible + Applied counts */}
                        <div className="flex flex-col items-center gap-1.5 shrink-0">
                          <div className="bg-[#003399]/5 border border-[#003399]/20 rounded-xl px-3 py-2 text-center min-w-[70px]">
                            <GraduationCap className="w-3.5 h-3.5 text-[#00A9CE] mx-auto mb-0.5" />
                            <p className="text-base font-black text-[#003399] leading-none">{eligibleCount}</p>
                            <p className="text-[9px] text-[#00A9CE] font-medium">Eligible</p>
                          </div>
                          <div className="bg-green-50 border border-green-100 rounded-xl px-3 py-1.5 text-center min-w-[70px]">
                            <p className="text-sm font-black text-green-700 leading-none">{totalApplications}</p>
                            <p className="text-[9px] text-green-500 font-medium">Applied</p>
                          </div>
                        </div>

                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#003399]/70 transition-colors self-center shrink-0" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>{/* end LEFT */}

        {/* ── RIGHT (1 col) ── */}
        <div className="flex flex-col gap-4">

          {/* Quick Stats */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-5">
            <SHead icon={Briefcase} title="Quick Stats" />
            <div className="space-y-2">
              <StatTile icon={Briefcase}    label="Active JDs"      value={activeJDs}               color="text-[#003399]"   bg="bg-[#003399]/5 border-[#003399]/10"    />
              <StatTile icon={FileText}     label="Total JDs"       value={jobs.length}             color="text-indigo-600" bg="bg-indigo-50 border-indigo-100" />
              <StatTile icon={GraduationCap} label="Total Eligible" value={totalEligibleAcrossJDs}  color="text-cyan-600"   bg="bg-cyan-50 border-cyan-100"     />
              <StatTile icon={Users}        label="Hired Students"  value={company.stats?.hiredStudents || 0} color="text-green-600" bg="bg-green-50 border-green-100" />
            </div>
          </div>

          {/* Additional Info */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-5">
            <SHead icon={Calendar} title="Additional Information" />
            <InfoRow icon={Calendar} label="Added On">
              {company.createdAt ? new Date(company.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
            </InfoRow>
            {company.createdBy && (
              <InfoRow icon={Users} label="Added By">
                {company.createdBy.fullName || 'N/A'}
              </InfoRow>
            )}
            {company.companySize && (
              <InfoRow icon={Users} label="Company Size">
                {company.companySize} employees
              </InfoRow>
            )}
          </div>

          {/* JD Breakdown */}
          {jobs.length > 0 && (
            <div className="bg-[#003399]/5 border border-[#003399]/20 rounded-xl p-5 relative overflow-hidden">
              <div className="absolute -top-6 -right-6 w-20 h-20 bg-white/10 rounded-full" />
              <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white/10 rounded-full" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-[#003399]/10 rounded-lg flex items-center justify-center">
                    <Briefcase className="w-4 h-4 text-[#003399]" />
                  </div>
                  <p className="text-[14px] font-bold text-[#003399]">JD Breakdown</p>
                </div>
                <div className="space-y-2">
                  {['Active', 'Draft', 'Closed', 'Cancelled'].map((status) => {
                    const count = jobs.filter(j => j.status === status).length;
                    if (!count) return null;
                    return (
                      <div key={status} className="flex justify-between items-center">
                        <span className="text-[#003399] text-[12px] font-bold">{status}</span>
                        <span className="font-black text-[#003399] text-[15px]">{count}</span>
                      </div>
                    );
                  })}
                  <div className="border-t border-[#003399]/20 mt-2 pt-3 flex justify-between items-center">
                    <span className="text-[#003399] text-[12px] font-bold">Total Eligible Students</span>
                    <span className="font-black text-[#003399] text-[18px]">{totalEligibleAcrossJDs}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>{/* end RIGHT */}

      </div>{/* end main grid */}

    </div>
    </CollegeAdminLayout>
  );
};

export default CompanyDetail;