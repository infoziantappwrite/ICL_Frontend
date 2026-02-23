// pages/CollegeAdmin/Dashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, Users, Briefcase, FileText, TrendingUp,
  Award, Plus, BarChart3, ArrowUp, MapPin, Phone,
  Globe, Mail, AlertCircle,
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { collegeAdminAPI } from '../../api/Api';
import { useAuth } from '../../context/AuthContext';

const CollegeAdminDashboard = () => {
  const navigate = useNavigate();
  const { user, college: cachedCollege, updateCollege } = useAuth();

  const [loading, setLoading] = useState(true);
  const [college, setCollege] = useState(cachedCollege || null);
  const [stats, setStats] = useState({
    totalStudents: 0, placedStudents: 0, totalCompanies: 0,
    totalJDs: 0, activeJDs: 0, placementPercentage: 0, selectedStudents: 0,
  });
  const [recentJDs, setRecentJDs] = useState([]);
  const [noCollegeError, setNoCollegeError] = useState(false);

  useEffect(() => { fetchAllData(); }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [dashboardRes, collegeRes] = await Promise.allSettled([
        collegeAdminAPI.getDashboard(),
        collegeAdminAPI.getMyCollegeProfile(),
      ]);

      if (dashboardRes.status === 'fulfilled' && dashboardRes.value?.success) {
        setStats(dashboardRes.value.stats || stats);
        setRecentJDs(dashboardRes.value.recentJDs || []);
      }

      if (collegeRes.status === 'fulfilled' && collegeRes.value?.success) {
        const collegeData = collegeRes.value.college;
        setCollege(collegeData);
        updateCollege(collegeData);
      } else {
        setNoCollegeError(true);
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading College Dashboard..." submessage="Fetching your college data" icon={Building2} />;
  }

  const collegeName    = college?.name || user?.college?.name || 'Your College';
  const collegeCode    = college?.code || '';
  const collegeCity    = college?.address?.city || '';
  const collegeState   = college?.address?.state || '';
  const collegeLocation = [collegeCity, collegeState].filter(Boolean).join(', ');
  const collegeEmail   = college?.email || '';
  const collegePhone   = college?.phone || '';
  const collegeWebsite = college?.website || '';

  return (
    <DashboardLayout title={`${collegeName} — Dashboard`}>

      {/* No-college warning */}
      {noCollegeError && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-800">No College Assigned</p>
            <p className="text-sm text-amber-700 mt-1">
              Your account is not linked to a college yet. Please contact the Super Admin.
            </p>
          </div>
        </div>
      )}

      {/* Welcome Banner */}
      <div className="mb-8 animate-fade-in">
        <div className="relative bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 rounded-3xl p-8 sm:p-10 shadow-2xl shadow-blue-500/40 overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute w-64 h-64 bg-white rounded-full -top-20 -left-20 animate-pulse" />
            <div className="absolute w-96 h-96 bg-white rounded-full -bottom-32 -right-32 animate-pulse animation-delay-1000" />
          </div>
          <div className="relative flex items-start justify-between gap-6 flex-wrap">
            <div className="text-white flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                  <Building2 className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">
                    {collegeName}
                  </h1>
                  {collegeCode && (
                    <span className="inline-block mt-1 px-3 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold tracking-widest uppercase">
                      {collegeCode}
                    </span>
                  )}
                </div>
              </div>
              <p className="text-blue-100 text-sm sm:text-base font-medium mt-3 mb-4">
                Placement Management Portal — College Admin Dashboard
              </p>
              <div className="flex flex-wrap gap-3">
                {collegeLocation && <CollegeChip icon={MapPin} label={collegeLocation} />}
                {collegePhone    && <CollegeChip icon={Phone}  label={collegePhone}    />}
                {collegeEmail    && <CollegeChip icon={Mail}   label={collegeEmail}    />}
                {collegeWebsite  && (
                  <a href={collegeWebsite.startsWith('http') ? collegeWebsite : `https://${collegeWebsite}`}
                     target="_blank" rel="noopener noreferrer"
                     className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-medium text-white hover:bg-white/25 transition-all">
                    <Globe className="w-3.5 h-3.5" /> Website
                  </a>
                )}
              </div>
            </div>
            <div className="hidden lg:flex flex-col items-center gap-2">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-2xl">
                <span className="text-3xl font-bold text-white">{collegeName.substring(0, 2).toUpperCase()}</span>
              </div>
              <div className="text-white/80 text-xs text-center">
                <p className="font-semibold">{user?.fullName}</p>
                <p>College Admin</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard icon={Users}    label="Total Students"    value={stats?.totalStudents ?? 0}        subtext={`${stats?.placedStudents ?? 0} placed`}   color="blue"   trend="+12%" />
        <StatCard icon={Briefcase} label="Companies"        value={stats?.totalCompanies ?? 0}       subtext="Registered"                               color="cyan"   trend="+8%"  />
        <StatCard icon={FileText}  label="Job Descriptions" value={stats?.totalJDs ?? 0}             subtext={`${stats?.activeJDs ?? 0} active`}        color="indigo" trend="+15%" />
        <StatCard icon={Award}     label="Placement Rate"   value={`${stats?.placementPercentage ?? 0}%`} subtext={`${stats?.selectedStudents ?? 0} selected`} color="purple" trend="+5%"  />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <QuickActionCard icon={Building2} title="Manage Companies" description="Add, edit, and manage companies" gradient="from-blue-600 via-blue-500 to-cyan-500" onClick={() => navigate('/dashboard/college-admin/companies')} />
        <QuickActionCard icon={Plus}      title="Add Company"      description="Register a new company"         gradient="from-blue-500 via-cyan-500 to-cyan-600" onClick={() => navigate('/dashboard/college-admin/companies/create')} />
        <QuickActionCard icon={FileText}  title="Create JD"        description="Post new job description"       gradient="from-blue-600 via-blue-500 to-cyan-500" onClick={() => navigate('/dashboard/college-admin/jobs/create')} />
        <QuickActionCard icon={TrendingUp} title="Manage Jobs"     description="View and manage job postings"   gradient="from-blue-700 via-blue-600 to-blue-700" onClick={() => navigate('/dashboard/college-admin/jobs')} />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Recent Job Descriptions</h3>
              </div>
              <button onClick={() => navigate('/dashboard/college-admin/jobs')}
                      className="text-blue-600 hover:text-blue-700 font-semibold text-sm flex items-center gap-1 group">
                View All <TrendingUp className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
            <div className="p-6">
              {recentJDs.length > 0 ? (
                <div className="space-y-3">
                  {recentJDs.slice(0, 5).map((jd, i) => <JobDescriptionCard key={jd._id || i} jd={jd} />)}
                </div>
              ) : (
                <EmptyState icon={FileText} title="No job descriptions yet" description="Start by creating your first job description"
                            actionLabel="Create JD" onAction={() => navigate('/dashboard/college-admin/jobs/create')} />
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Activity</h3>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <ActivityItem label="Active Jobs"     value={stats?.activeJDs ?? 0}     icon={FileText}  color="blue"  />
              <ActivityItem label="Companies"       value={stats?.totalCompanies ?? 0} icon={Building2} color="cyan"  />
              <ActivityItem label="Placed Students" value={stats?.placedStudents ?? 0} icon={Users}     color="green" />
            </div>
          </div>

          {college && (
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">College Info</h3>
                </div>
              </div>
              <div className="p-5 space-y-3">
                <InfoRow label="Name"     value={college.name} />
                <InfoRow label="Code"     value={college.code} />
                {college.type        && <InfoRow label="Type"     value={college.type} />}
                {collegeLocation     && <InfoRow label="Location" value={collegeLocation} />}
                {college.established && <InfoRow label="Est."     value={college.established} />}
                <div className="pt-2 border-t border-gray-100">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                    college.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    <span className={`w-2 h-2 rounded-full ${college.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                    {college.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

/* ── Sub-components ─────────────────────────────────────────── */

const CollegeChip = ({ icon: Icon, label }) => (
  <span className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-medium text-white">
    <Icon className="w-3.5 h-3.5" />{label}
  </span>
);

const InfoRow = ({ label, value }) => (
  <div className="flex justify-between items-start gap-2">
    <span className="text-xs text-gray-500 flex-shrink-0">{label}</span>
    <span className="text-xs font-semibold text-gray-800 text-right">{value}</span>
  </div>
);

const StatCard = ({ icon: Icon, label, value, subtext, color, trend }) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600', cyan: 'from-cyan-500 to-cyan-600',
    indigo: 'from-indigo-500 to-indigo-600', purple: 'from-blue-700 to-blue-800',
  };
  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-6 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 group">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 bg-gradient-to-br ${colorClasses[color]} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend && <div className="flex items-center gap-1 text-green-600 text-sm font-semibold"><ArrowUp className="w-4 h-4" />{trend}</div>}
      </div>
      <p className="text-gray-600 text-sm font-medium mb-1">{label}</p>
      <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
      <p className="text-sm text-gray-500">{subtext}</p>
    </div>
  );
};

const QuickActionCard = ({ icon: Icon, title, description, gradient, onClick }) => (
  <button onClick={onClick}
    className={`relative bg-gradient-to-br ${gradient} rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 text-left group overflow-hidden`}>
    <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
    <div className="relative">
      <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
        <Icon className="w-6 h-6 text-white" />
      </div>
      <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
      <p className="text-sm text-white/90">{description}</p>
    </div>
  </button>
);

const JobDescriptionCard = ({ jd }) => {
  const navigate = useNavigate();
  return (
    <button onClick={() => navigate(`/dashboard/college-admin/jobs/view/${jd._id}`)}
      className="w-full p-4 bg-gray-50 hover:bg-blue-50 rounded-xl transition-all border border-gray-100 hover:border-blue-200 text-left group">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">{jd.title || jd.jobTitle || 'Untitled Position'}</h4>
          <p className="text-sm text-gray-600 truncate mt-1">{jd.companyId?.name || jd.company || 'Company Name'}</p>
        </div>
        <span className={`ml-3 px-2 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${
          jd.status === 'Active' ? 'bg-green-100 text-green-700' : jd.status === 'Draft' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>
          {jd.status || 'Draft'}
        </span>
      </div>
    </button>
  );
};

const ActivityItem = ({ label, value, icon: Icon, color }) => {
  const c = { blue: 'text-blue-600 bg-blue-50', cyan: 'text-cyan-600 bg-cyan-50', green: 'text-green-600 bg-green-50' };
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 ${c[color]} rounded-lg flex items-center justify-center`}><Icon className="w-4 h-4" /></div>
        <span className="text-sm font-medium text-gray-700">{label}</span>
      </div>
      <span className="text-lg font-bold text-gray-900">{value}</span>
    </div>
  );
};

const EmptyState = ({ icon: Icon, title, description, actionLabel, onAction }) => (
  <div className="text-center py-12">
    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4"><Icon className="w-8 h-8 text-gray-400" /></div>
    <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
    <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">{description}</p>
    {actionLabel && (
      <button onClick={onAction} className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg font-medium">
        {actionLabel}
      </button>
    )}
  </div>
);

export default CollegeAdminDashboard;