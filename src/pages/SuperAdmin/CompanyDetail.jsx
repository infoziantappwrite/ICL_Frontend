// pages/SuperAdmin/CompanyDetail.jsx - Fixed JD live fetching + eligible student count
import { useToast } from '../../context/ToastContext';
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Building2, ArrowLeft, Edit, Trash2, Mail, Phone, Globe, MapPin,
  Briefcase, Users, ToggleLeft, ToggleRight, Calendar, FileText,
  Clock, CheckCircle, XCircle, AlertCircle, ChevronRight, Hash,
  TrendingUp, Shield, BarChart3,
} from 'lucide-react';
import SuperAdminDashboardLayout from '../../components/layout/SuperAdminDashboardLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { companyAPI, jobAPI } from '../../api/Api';

const JD_STATUS_CONFIG = {
  Active:    { label: 'Active',    color: 'bg-blue-50 text-blue-600 border-blue-100',     icon: CheckCircle },
  Closed:    { label: 'Closed',    color: 'bg-red-50 text-red-600 border-red-100',        icon: XCircle },
  Draft:     { label: 'Draft',     color: 'bg-amber-50 text-amber-600 border-amber-100',  icon: AlertCircle },
  Cancelled: { label: 'Cancelled', color: 'bg-gray-50 text-gray-500 border-gray-200',     icon: XCircle },
};

/* ─── Section heading ─────────────────────── */
const SHead = ({ icon: Icon, title, sub, action, onAction, badge }) => (
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
        <Icon className="w-3 h-3 text-white" />
      </div>
      <div>
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-gray-800 leading-none">{title}</h3>
          {badge != null && (
            <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md border border-blue-100">{badge}</span>
          )}
        </div>
        {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
    {action && (
      <button onClick={onAction}
        className="text-[10px] font-bold text-blue-600 flex items-center gap-0.5 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors">
        {action} <ChevronRight className="w-3 h-3" />
      </button>
    )}
  </div>
);

/* ─── Info row ────────────────────────────── */
const InfoRow = ({ icon: Icon, label, value, href, mono }) => (
  <div className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
    <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
      <Icon className="w-3.5 h-3.5 text-blue-500" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
      {href ? (
        <a href={href} target="_blank" rel="noopener noreferrer"
          className="text-sm font-medium text-blue-600 hover:underline break-all">{value || '—'}</a>
      ) : (
        <p className={`text-sm font-medium text-gray-800 break-all ${mono ? 'font-mono' : ''}`}>{value || '—'}</p>
      )}
    </div>
  </div>
);

/* ─── Stat pill ───────────────────────────── */
const StatPill = ({ icon: Icon, label, value, color }) => {
  const c = {
    blue:   'bg-blue-50 border-blue-100 text-blue-600',
    cyan:   'bg-cyan-50 border-cyan-100 text-cyan-600',
    indigo: 'bg-indigo-50 border-indigo-100 text-indigo-600',
    violet: 'bg-violet-50 border-violet-100 text-violet-600',
  }[color] || 'bg-blue-50 border-blue-100 text-blue-600';
  return (
    <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border ${c} w-full`}>
      <Icon className="w-4 h-4 flex-shrink-0 opacity-70" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-black leading-none">{value}</p>
        <p className="text-[9px] font-medium opacity-60 mt-0.5 leading-none truncate">{label}</p>
      </div>
    </div>
  );
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
      <SuperAdminDashboardLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-3">
            <Building2 className="w-7 h-7 text-blue-300" />
          </div>
          <p className="text-sm font-semibold text-gray-600 mb-4">Company not found</p>
          <button onClick={() => navigate('/dashboard/super-admin/companies')}
            className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-sm hover:scale-105 transition-all">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Companies
          </button>
        </div>
      </SuperAdminDashboardLayout>
    );
  }

  const totalApplications = jobs.reduce((s, j) => s + (j.stats?.totalApplications || 0), 0);
  const activeJobs = jobs.filter(j => j.status === 'Active').length;

  return (
    <SuperAdminDashboardLayout>

      {/* ══ HERO BANNER ══ */}
      <div className="relative bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 rounded-2xl px-5 py-4 mb-4 shadow-xl shadow-blue-500/20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-10 -right-10 w-44 h-44 bg-white/10 rounded-full" />
          <div className="absolute -bottom-8 left-1/3 w-28 h-28 bg-white/10 rounded-full" />
          <div className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: 'radial-gradient(circle,white 1px,transparent 1px)', backgroundSize: '18px 18px' }} />
        </div>
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <button onClick={() => navigate('/dashboard/super-admin/companies')}
                className="text-blue-200 hover:text-white text-[11px] font-semibold flex items-center gap-1 mb-1 transition-colors">
                <ArrowLeft className="w-3 h-3" /> Back to Companies
              </button>
              <h1 className="text-white font-black text-lg leading-tight">{company.name}</h1>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {company.industry && (
                  <span className="inline-flex items-center gap-1 bg-white/15 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white border border-white/20">
                    <Briefcase className="w-3 h-3" /> {company.industry}
                  </span>
                )}
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                  company.isActive
                    ? 'bg-white/15 text-white border-white/20'
                    : 'bg-white/10 text-white/60 border-white/10'
                }`}>
                  {company.isActive
                    ? <><CheckCircle className="w-3 h-3" /> Active</>
                    : <><XCircle className="w-3 h-3" /> Inactive</>}
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={handleToggleStatus}
              className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border transition-all hover:scale-105 ${
                company.isActive
                  ? 'bg-amber-500/20 hover:bg-amber-500/30 text-white border-amber-300/30'
                  : 'bg-green-500/20 hover:bg-green-500/30 text-white border-green-300/30'
              }`}>
              {company.isActive
                ? <><ToggleRight className="w-3.5 h-3.5" /> Active</>
                : <><ToggleLeft className="w-3.5 h-3.5" /> Inactive</>}
            </button>
            <button onClick={() => navigate(`/dashboard/super-admin/companies/edit/${companyId}`)}
              className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-3 py-2 rounded-xl border border-white/20 transition-all hover:scale-105">
              <Edit className="w-3.5 h-3.5" /> Edit
            </button>
            <button onClick={handleDelete}
              className="inline-flex items-center gap-1.5 bg-red-500/20 hover:bg-red-500/30 text-white text-xs font-bold px-3 py-2 rounded-xl border border-red-300/30 transition-all hover:scale-105">
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        </div>
      </div>

      {/* ══ STAT PILLS ══ */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-3 mb-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <StatPill icon={FileText}   label="Total JDs"        value={jobs.length}          color="blue"   />
          <StatPill icon={CheckCircle} label="Active JDs"      value={activeJobs}           color="cyan"   />
          <StatPill icon={Users}      label="Total Applicants" value={totalApplications}    color="indigo" />
          <StatPill icon={BarChart3}  label="Status"           value={company.isActive ? 'Active' : 'Inactive'} color="violet" />
        </div>
      </div>

      {/* ══ MAIN GRID ══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* ── LEFT (2 cols) ── */}
        <div className="lg:col-span-2 flex flex-col gap-4">

          {/* About */}
          {company.description && (
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-4">
              <SHead icon={FileText} title="About" sub="Company overview" />
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{company.description}</p>
            </div>
          )}

          {/* Contact */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-4">
            <SHead icon={Mail} title="Contact Information" sub="How to reach this company" />
            <div className="space-y-0.5">
              {company.email && (
                <InfoRow icon={Mail}  label="Email Address" value={company.email} href={`mailto:${company.email}`} mono />
              )}
              {company.phone && (
                <InfoRow icon={Phone} label="Phone Number"  value={company.phone} href={`tel:${company.phone}`} />
              )}
              {company.website && (
                <InfoRow icon={Globe} label="Website"       value={company.website} href={company.website} />
              )}
              {(company.headquarters?.city || company.location) && (
                <InfoRow icon={MapPin} label="Location"     value={company.headquarters?.city || company.location} />
              )}
            </div>
          </div>

          {/* Job Descriptions */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-gray-100">
              <SHead icon={Briefcase} title="Job Descriptions" sub="All JDs linked to this company" badge={jobs.length} />
            </div>

            {jobsLoading ? (
              <div className="flex items-center justify-center gap-3 py-12">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-gray-500 font-medium">Loading job descriptions…</span>
              </div>
            ) : jobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center mb-2">
                  <Briefcase className="w-5 h-5 text-blue-200" />
                </div>
                <p className="text-sm font-semibold text-gray-500">No job descriptions found</p>
                <p className="text-xs text-gray-400 mt-1">JDs created by college admins will appear here</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {jobs.map((job) => {
                  const statusCfg = JD_STATUS_CONFIG[job.status] || JD_STATUS_CONFIG.Draft;
                  const StatusIcon = statusCfg.icon;
                  const totalApps = job.stats?.totalApplications || 0;
                  const ctcMin = job.package?.ctc?.min;
                  const ctcMax = job.package?.ctc?.max;
                  const ctcLabel = ctcMin != null && ctcMax != null
                    ? `₹${ctcMin} – ₹${ctcMax} LPA`
                    : ctcMin != null ? `₹${ctcMin} LPA` : null;

                  return (
                    <div key={job._id}
                      onClick={() => navigate(`/dashboard/super-admin/jobs/view/${job._id}`)}
                      className="group flex items-start gap-3 px-4 py-3.5 hover:bg-blue-50/30 transition-colors cursor-pointer">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Briefcase className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors truncate">{job.title}</p>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusCfg.color}`}>
                            <StatusIcon className="w-3 h-3" />{statusCfg.label}
                          </span>
                          {job.jobType && (
                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-full text-[10px] font-bold">{job.jobType}</span>
                          )}
                          {job.isPinned && (
                            <span className="px-2 py-0.5 bg-amber-50 text-amber-600 border border-amber-100 rounded-full text-[10px] font-bold">📌 Pinned</span>
                          )}
                        </div>

                        {job.college?.name && (
                          <p className="text-[10px] text-gray-400 mb-1.5 flex items-center gap-1">
                            <Building2 className="w-3 h-3" /> {job.college.name}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-3 text-[11px] text-gray-500 mb-2">
                          {job.location && (
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>
                          )}
                          {ctcLabel && (
                            <span className="font-semibold text-gray-700">💰 {ctcLabel}</span>
                          )}
                          {job.lastDate && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Deadline: {new Date(job.lastDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          {job.eligibility?.minCGPA && (
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[10px] font-bold border border-blue-100">
                              Min CGPA: {job.eligibility.minCGPA}
                            </span>
                          )}
                          {job.eligibility?.branches?.slice(0, 3).map((b, i) => (
                            <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-[10px] font-medium">{b}</span>
                          ))}
                          {(job.eligibility?.branches?.length || 0) > 3 && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-400 rounded-md text-[10px]">
                              +{job.eligibility.branches.length - 3} more
                            </span>
                          )}
                          {job.eligibility?.batches?.length > 0 && (
                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md text-[10px] font-bold border border-indigo-100">
                              Batch: {job.eligibility.batches.join(', ')}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-center gap-1 flex-shrink-0">
                        <div className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 text-center min-w-[64px]">
                          <Users className="w-3.5 h-3.5 text-blue-500 mx-auto mb-0.5" />
                          <p className="text-base font-black text-blue-700 leading-none">{totalApps}</p>
                          <p className="text-[9px] text-blue-400 mt-0.5 font-semibold">Applied</p>
                        </div>
                      </div>

                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-400 transition-colors self-center flex-shrink-0" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT (1 col) ── */}
        <div className="flex flex-col gap-4">

          {/* Quick Info */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-4">
            <SHead icon={Building2} title="Quick Info" />
            <div className="space-y-0.5">
              {company.industry && (
                <div className="flex items-center justify-between py-1.5 border-b border-gray-50">
                  <span className="text-xs text-gray-500 flex items-center gap-1.5"><Briefcase className="w-3 h-3" /> Industry</span>
                  <span className="text-xs font-bold text-gray-700">{company.industry}</span>
                </div>
              )}
              {company.companySize && (
                <div className="flex items-center justify-between py-1.5 border-b border-gray-50">
                  <span className="text-xs text-gray-500 flex items-center gap-1.5"><Users className="w-3 h-3" /> Company Size</span>
                  <span className="text-xs font-bold text-gray-700">{company.companySize} employees</span>
                </div>
              )}
              <div className="flex items-center justify-between py-1.5 border-b border-gray-50">
                <span className="text-xs text-gray-500 flex items-center gap-1.5"><Shield className="w-3 h-3" /> Status</span>
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  company.isActive
                    ? 'bg-blue-50 text-blue-600 border-blue-100'
                    : 'bg-gray-50 text-gray-500 border-gray-200'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${company.isActive ? 'bg-blue-500' : 'bg-gray-400'}`} />
                  {company.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-xs text-gray-500 flex items-center gap-1.5"><FileText className="w-3 h-3" /> Total JDs</span>
                <span className="text-xs font-black text-blue-600">{jobs.length}</span>
              </div>
            </div>
          </div>

          {/* JD Breakdown */}
          {jobs.length > 0 && (
            <div className="bg-gradient-to-br from-blue-600 via-blue-600 to-cyan-500 rounded-2xl p-4 text-white shadow-lg shadow-blue-500/20 relative overflow-hidden">
              <div className="absolute -top-6 -right-6 w-20 h-20 bg-white/10 rounded-full" />
              <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white/10 rounded-full" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-3.5 h-3.5 text-white" />
                  </div>
                  <p className="text-xs font-bold text-white">JD Breakdown</p>
                </div>
                <div className="space-y-2">
                  {['Active', 'Draft', 'Closed', 'Cancelled'].map((status) => {
                    const count = jobs.filter((j) => j.status === status).length;
                    if (!count) return null;
                    return (
                      <div key={status} className="flex justify-between items-center">
                        <span className="text-[11px] text-blue-100">{status}</span>
                        <span className="text-xs font-black text-white">{count}</span>
                      </div>
                    );
                  })}
                  <div className="border-t border-white/20 pt-2 flex justify-between items-center">
                    <span className="text-[11px] text-blue-100">Total Applied</span>
                    <span className="text-base font-black text-white">{totalApplications}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-4">
            <SHead icon={Calendar} title="Metadata" />
            <div className="space-y-0.5">
              <div className="flex items-center justify-between py-1.5 border-b border-gray-50">
                <span className="text-xs text-gray-500 flex items-center gap-1.5"><Calendar className="w-3 h-3" /> Created</span>
                <span className="text-xs font-bold text-gray-700">{new Date(company.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-xs text-gray-500 flex items-center gap-1.5"><Calendar className="w-3 h-3" /> Updated</span>
                <span className="text-xs font-bold text-gray-700">{new Date(company.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-4">
            <SHead icon={Shield} title="Quick Actions" />
            <div className="space-y-2">
              <button onClick={() => navigate(`/dashboard/super-admin/companies/edit/${companyId}`)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-100 text-blue-700 text-xs font-semibold transition-all hover:scale-[1.02]">
                <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Edit className="w-3 h-3" />
                </div>
                Edit Company
              </button>
              <button onClick={handleToggleStatus}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all hover:scale-[1.02] ${
                  company.isActive
                    ? 'bg-amber-50 hover:bg-amber-100 border-amber-100 text-amber-700'
                    : 'bg-green-50 hover:bg-green-100 border-green-100 text-green-700'
                }`}>
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${company.isActive ? 'bg-amber-100' : 'bg-green-100'}`}>
                  {company.isActive ? <ToggleLeft className="w-3 h-3" /> : <ToggleRight className="w-3 h-3" />}
                </div>
                {company.isActive ? 'Deactivate Company' : 'Activate Company'}
              </button>
              <button onClick={handleDelete}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-100 text-red-700 text-xs font-semibold transition-all hover:scale-[1.02]">
                <div className="w-6 h-6 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Trash2 className="w-3 h-3" />
                </div>
                Delete Company
              </button>
            </div>
          </div>

        </div>
      </div>
    </SuperAdminDashboardLayout>
  );
};

export default CompanyDetail;