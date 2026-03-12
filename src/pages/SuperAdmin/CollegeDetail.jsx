import { useToast } from '../../context/ToastContext';
// pages/SuperAdmin/CollegeDetail.jsx - View College Details
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Building2, Edit, Trash2, ArrowLeft, Mail, Phone, MapPin, Globe,
  Calendar, Award, Users, Briefcase, FileText, GraduationCap,
  CheckCircle, XCircle, RefreshCw, ChevronRight, Hash,
  TrendingUp, Shield,
} from 'lucide-react';
import SuperAdminDashboardLayout from '../../components/layout/SuperAdminDashboardLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import apiCall from '../../api/Api';

/* ─── Section heading ─────────────────────── */
const SHead = ({ icon: Icon, title, sub }) => (
  <div className="flex items-center gap-2 mb-4">
    <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
      <Icon className="w-3 h-3 text-white" />
    </div>
    <div>
      <h3 className="text-sm font-bold text-gray-800 leading-none">{title}</h3>
      {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
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
const StatPill = ({ icon: Icon, label, value, color, onClick }) => {
  const c = {
    blue:   'bg-blue-50 border-blue-100 text-blue-600',
    cyan:   'bg-cyan-50 border-cyan-100 text-cyan-600',
    indigo: 'bg-indigo-50 border-indigo-100 text-indigo-600',
    violet: 'bg-violet-50 border-violet-100 text-violet-600',
  }[color] || 'bg-blue-50 border-blue-100 text-blue-600';

  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag onClick={onClick}
      className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl border ${c} ${onClick ? 'hover:shadow-md hover:scale-[1.03] transition-all duration-150 cursor-pointer' : ''} w-full text-left`}
    >
      <Icon className="w-4 h-4 flex-shrink-0 opacity-70" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-black leading-none">{value}</p>
        <p className="text-[9px] font-medium opacity-60 mt-0.5 leading-none truncate">{label}</p>
      </div>
      {onClick && <ChevronRight className="w-3 h-3 opacity-40 group-hover:opacity-100 transition-opacity flex-shrink-0" />}
    </Tag>
  );
};

const CollegeDetail = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const { collegeId } = useParams();
  const [college, setCollege] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [liveCounts, setLiveCounts] = useState({
    totalStudents: 0,
    totalCompanies: 0,
    totalJDs: 0,
    activeAdmins: 0,
  });

  useEffect(() => {
    fetchCollegeDetails();
  }, [collegeId]);

  const fetchCollegeDetails = async (isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);

      const data = await apiCall(`/super-admin/colleges/${collegeId}`);

      if (data.success) {
        const c = data.college;
        setCollege(c);
        setLiveCounts({
          totalStudents: c.studentsCount ?? 0,
          totalCompanies: c.companiesCount ?? 0,
          totalJDs: c.jdsCount ?? 0,
          activeAdmins: c.adminsCount ?? 0,
        });
      } else {
        toast.error('Error', data.message || 'Failed to load college details');
      }
    } catch (error) {
      console.error('Error fetching college:', error);
      toast.error('Error', 'Error loading college details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete "${college?.name}"? This action cannot be undone.`)) {
      return;
    }
    try {
      const data = await apiCall(`/super-admin/colleges/${collegeId}`, { method: 'DELETE' });
      if (data.success) {
        toast.success('Success', 'College deleted successfully');
        navigate('/dashboard/super-admin/colleges');
      } else {
        toast.error('Error', data.message || 'Failed to delete college');
      }
    } catch (error) {
      console.error('Error deleting college:', error);
      toast.error('Error', 'Error deleting college');
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading College Details..." submessage="Fetching information" />;
  }

  if (!college) {
    return (
      <SuperAdminDashboardLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-3">
            <Building2 className="w-7 h-7 text-blue-300" />
          </div>
          <p className="text-sm font-semibold text-gray-600 mb-4">College not found</p>
          <button
            onClick={() => navigate('/dashboard/super-admin/colleges')}
            className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-sm hover:scale-105 transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Colleges
          </button>
        </div>
      </SuperAdminDashboardLayout>
    );
  }

  const addressStr = [
    college.address?.street,
    college.address?.city,
    college.address?.state,
    college.address?.pincode && `- ${college.address.pincode}`,
    college.address?.country,
  ].filter(Boolean).join(', ');

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
              <button
                onClick={() => navigate('/dashboard/super-admin/colleges')}
                className="text-blue-200 hover:text-white text-[11px] font-semibold flex items-center gap-1 mb-1 transition-colors"
              >
                <ArrowLeft className="w-3 h-3" /> Back to Colleges
              </button>
              <h1 className="text-white font-black text-lg leading-tight">{college.name}</h1>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                <span className="inline-flex items-center gap-1 bg-white/15 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white border border-white/20">
                  <Hash className="w-3 h-3" /> {college.code}
                </span>
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                  college.isActive
                    ? 'bg-white/15 text-white border-white/20'
                    : 'bg-white/10 text-white/60 border-white/10'
                }`}>
                  {college.isActive
                    ? <><CheckCircle className="w-3 h-3" /> Active</>
                    : <><XCircle className="w-3 h-3" /> Inactive</>}
                </span>
                {college.type && (
                  <span className="inline-flex items-center gap-1 bg-white/15 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white border border-white/20">
                    <Shield className="w-3 h-3" /> {college.type}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => fetchCollegeDetails(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-3 py-2 rounded-xl border border-white/20 transition-all hover:scale-105 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => navigate(`/dashboard/super-admin/colleges/${collegeId}/edit`)}
              className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-3 py-2 rounded-xl border border-white/20 transition-all hover:scale-105"
            >
              <Edit className="w-3.5 h-3.5" /> Edit
            </button>
            <button
              onClick={handleDelete}
              className="inline-flex items-center gap-1.5 bg-red-500/20 hover:bg-red-500/30 text-white text-xs font-bold px-3 py-2 rounded-xl border border-red-300/30 transition-all hover:scale-105"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        </div>
      </div>

      {/* ══ LIVE STAT PILLS ══ */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-3 mb-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <StatPill icon={Users}    label="Total Students"   value={liveCounts.totalStudents}  color="blue"   onClick={() => navigate(`/dashboard/super-admin/colleges/${collegeId}/students`)} />
          <StatPill icon={Briefcase} label="Companies"       value={liveCounts.totalCompanies} color="cyan"   />
          <StatPill icon={FileText} label="Job Descriptions" value={liveCounts.totalJDs}       color="indigo" />
          <StatPill icon={Users}    label="Active Admins"    value={liveCounts.activeAdmins}   color="violet" />
        </div>
      </div>

      {/* ══ MAIN GRID ══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* ── LEFT (2 cols) ── */}
        <div className="lg:col-span-2 flex flex-col gap-4">

          {/* Contact Information */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-4">
            <SHead icon={Mail} title="Contact Information" sub="How to reach this institution" />
            <div className="space-y-0.5">
              <InfoRow icon={Mail}   label="Email Address" value={college.email} mono />
              <InfoRow icon={Phone}  label="Phone Number"  value={college.phone} />
              {college.website && (
                <InfoRow icon={Globe} label="Website" value={college.website} href={college.website} />
              )}
              <InfoRow icon={MapPin} label="Address" value={addressStr} />
            </div>
          </div>

          {/* Departments */}
          {college.departments && college.departments.length > 0 && (
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center">
                    <GraduationCap className="w-3 h-3 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-800 leading-none">Departments</h3>
                    <p className="text-[10px] text-gray-400 mt-0.5">{college.departments.length} department{college.departments.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-50 bg-gray-50/40">
                      {['Department', 'Code', 'HOD Name', 'HOD Email'].map(h => (
                        <th key={h} className="px-3 py-2 text-left text-[9px] font-black text-gray-400 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {college.departments.map((dept, i) => (
                      <tr key={i} className="hover:bg-blue-50/20 transition-colors">
                        <td className="px-3 py-2.5 text-xs font-semibold text-gray-800">{dept.name}</td>
                        <td className="px-3 py-2.5">
                          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md">{dept.code}</span>
                        </td>
                        <td className="px-3 py-2.5 text-xs text-gray-600">{dept.hodName || '—'}</td>
                        <td className="px-3 py-2.5 text-xs text-gray-500 font-mono">{dept.hodEmail || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT (1 col) ── */}
        <div className="flex flex-col gap-4">

          {/* College Details */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-4">
            <SHead icon={Building2} title="College Details" />
            <div className="space-y-3">
              <div className="flex items-center justify-between py-1.5 border-b border-gray-50">
                <span className="text-xs text-gray-500">College Code</span>
                <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md font-mono">{college.code}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-gray-50">
                <span className="text-xs text-gray-500">Type</span>
                <span className="text-xs font-bold text-gray-700">{college.type}</span>
              </div>
              {college.university && (
                <div className="flex items-center justify-between py-1.5 border-b border-gray-50">
                  <span className="text-xs text-gray-500">University</span>
                  <span className="text-xs font-bold text-gray-700 text-right max-w-[140px]">{college.university}</span>
                </div>
              )}
              {college.establishedYear && (
                <div className="flex items-center justify-between py-1.5 border-b border-gray-50">
                  <span className="text-xs text-gray-500 flex items-center gap-1"><Calendar className="w-3 h-3" /> Established</span>
                  <span className="text-xs font-bold text-gray-700">{college.establishedYear}</span>
                </div>
              )}
              {college.accreditation && college.accreditation.length > 0 && (
                <div className="pt-1">
                  <p className="text-xs text-gray-500 flex items-center gap-1 mb-2"><Award className="w-3 h-3" /> Accreditations</p>
                  <div className="flex flex-wrap gap-1.5">
                    {college.accreditation.map((acc, i) => (
                      <span key={i} className="px-2 py-0.5 bg-cyan-50 text-cyan-700 border border-cyan-100 rounded-full text-[10px] font-bold">{acc}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Placement Configuration */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-4">
            <SHead icon={TrendingUp} title="Placement Config" sub="Academic placement settings" />
            <div className="space-y-0.5">
              <div className="flex items-center justify-between py-1.5 border-b border-gray-50">
                <span className="text-xs text-gray-500">Academic Year</span>
                <span className="text-xs font-bold text-gray-700">{college.placementConfig?.academicYear || 'Not Set'}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-gray-50">
                <span className="text-xs text-gray-500">Minimum CGPA</span>
                <span className="text-xs font-black text-blue-600">{college.placementConfig?.minimumCGPA ?? 6.0}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-gray-50">
                <span className="text-xs text-gray-500">Allow Backlogs</span>
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  (college.placementConfig?.allowBacklogs ?? true)
                    ? 'bg-blue-50 text-blue-600 border border-blue-100'
                    : 'bg-gray-50 text-gray-500 border border-gray-200'
                }`}>
                  {(college.placementConfig?.allowBacklogs ?? true)
                    ? <><CheckCircle className="w-3 h-3" /> Yes</>
                    : <><XCircle className="w-3 h-3" /> No</>}
                </span>
              </div>
              {(college.placementConfig?.allowBacklogs ?? true) && (
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-xs text-gray-500">Max Backlogs</span>
                  <span className="text-xs font-black text-gray-700">{college.placementConfig?.maxBacklogsAllowed ?? 3}</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-4">
            <SHead icon={Shield} title="Quick Actions" />
            <div className="space-y-2">
              <button
                onClick={() => navigate(`/dashboard/super-admin/colleges/${collegeId}/students`)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-100 text-blue-700 text-xs font-semibold transition-all hover:scale-[1.02]"
              >
                <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users className="w-3 h-3" />
                </div>
                View Students
              </button>
              <button
                onClick={() => navigate(`/dashboard/super-admin/colleges/${collegeId}/edit`)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-cyan-50 hover:bg-cyan-100 border border-cyan-100 text-cyan-700 text-xs font-semibold transition-all hover:scale-[1.02]"
              >
                <div className="w-6 h-6 bg-cyan-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Edit className="w-3 h-3" />
                </div>
                Edit College
              </button>
              <button
                onClick={handleDelete}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-100 text-red-700 text-xs font-semibold transition-all hover:scale-[1.02]"
              >
                <div className="w-6 h-6 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Trash2 className="w-3 h-3" />
                </div>
                Delete College
              </button>
            </div>
          </div>

        </div>
      </div>

    </SuperAdminDashboardLayout>
  );
};

export default CollegeDetail;