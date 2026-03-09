// pages/SuperAdmin/Dashboard.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, Users, Briefcase, Award, Plus, Eye, SquarePen,
  BookOpen, GraduationCap, UserCheck, Clock, RefreshCw,
  TrendingUp, Star, BarChart3, Crown,
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import StatCard from '../../components/common/StatCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import apiCall from '../../api/Api';

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const [loading,        setLoading]        = useState(true);
  const [stats,          setStats]          = useState(null);
  const [recentColleges, setRecentColleges] = useState([]);
  const [lastUpdated,    setLastUpdated]    = useState(new Date());

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [dashData, collegesData] = await Promise.all([
        apiCall('/super-admin/dashboard'),
        apiCall('/super-admin/colleges?limit=5&sortBy=-createdAt'),
      ]);
      if (dashData.success)    setStats(dashData.data?.stats || {});
      if (collegesData.success) setRecentColleges(collegesData.colleges || []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    const t = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(t);
  }, [fetchDashboardData]);

  if (loading && !stats) {
    return <LoadingSpinner message="Loading Dashboard..." submessage="Fetching platform-wide data" />;
  }

  return (
    <DashboardLayout title="Super Admin Dashboard">

      {/* ── Welcome banner ── */}
      <div className="mb-6">
        <div className="relative bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 rounded-2xl p-6 shadow-xl overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-0 right-0 w-56 h-56 bg-white rounded-full -mr-24 -mt-24" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-white rounded-full -ml-16 -mb-16" />
          </div>
          <div className="relative flex items-center justify-between flex-wrap gap-4">
            <div className="text-white">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Crown className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-bold">Welcome, Super Admin!</h1>
              </div>
              <p className="text-blue-100 text-sm">Platform-wide overview and management</p>
              <p className="text-blue-200 text-xs mt-1 flex items-center gap-1.5">
                <Clock className="w-3 h-3" />
                Updated {lastUpdated.toLocaleTimeString()}
              </p>
            </div>
            <button
              onClick={fetchDashboardData}
              disabled={loading}
              className="flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-white/30 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* ── Main KPI cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <StatCard icon={Building2}    label="Total Colleges"  value={stats?.totalColleges  ?? 0} trend="up" trendValue={`${stats?.activeColleges ?? 0} active`}   color="blue"   />
        <StatCard icon={Users}        label="College Admins"  value={stats?.totalAdmins    ?? 0} trend="up" trendValue="Across all colleges"                        color="green"  />
        <StatCard icon={GraduationCap}label="Total Students"  value={stats?.totalStudents  ?? 0} trend="up" trendValue="Platform-wide"                              color="purple" />
        <StatCard icon={Briefcase}    label="Total Companies" value={stats?.totalCompanies ?? 0} trend="up" trendValue={`${stats?.activeJobs ?? 0} active JDs`}    color="orange" />
      </div>

      {/* ── Course stats row  (replaces Applications row) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <CourseStatCard label="Total Courses"   value={stats?.totalCourses      ?? 0}  gradient="from-blue-600 to-blue-700"   icon={BookOpen}      />
        <CourseStatCard label="Enrollments"     value={stats?.totalEnrollments  ?? 0}  gradient="from-blue-500 to-cyan-500"   icon={UserCheck}     />
        <CourseStatCard label="Active Jobs"     value={stats?.activeJobs        ?? 0}  gradient="from-blue-700 to-indigo-600" icon={Briefcase}     />
        <CourseStatCard label="Platform Score"  value={`${stats?.activeColleges ?? 0}/${stats?.totalColleges ?? 0}`} gradient="from-cyan-500 to-blue-500" icon={Star} />
      </div>

      {/* ── Quick actions ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <QuickAction icon={Plus}       gradient="from-blue-600 to-blue-700"   title="Add College"    desc="Register a new college"            onClick={() => navigate('/dashboard/super-admin/colleges/new')}    />
        <QuickAction icon={Building2}  gradient="from-blue-700 to-indigo-700" title="Companies"      desc="View and manage companies"         onClick={() => navigate('/dashboard/super-admin/companies')}        />
        <QuickAction icon={Users}      gradient="from-blue-500 to-cyan-500"   title="Manage Admins"  desc="College administrators"            onClick={() => navigate('/dashboard/super-admin/admins')}           />
        <QuickAction icon={BookOpen}   gradient="from-cyan-500 to-blue-600"   title="View Courses"   desc="Browse platform courses"           onClick={() => navigate('/dashboard/super-admin/courses')}          />
      </div>

      {/* ── Recent colleges table ── */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center shadow-sm">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-sm font-bold text-gray-900">Recent Colleges</h3>
          </div>
          <button
            onClick={() => navigate('/dashboard/super-admin/colleges')}
            className="text-blue-600 hover:text-blue-700 text-xs font-semibold flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
          >
            View All <Eye className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          {recentColleges.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50">
                  {['College', 'Code', 'Students', 'Companies', 'JDs', 'Admins', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentColleges.map(college => {
                  const lc = college.liveCounts || {};
                  return (
                    <tr key={college._id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 truncate max-w-[160px]">{college.name}</div>
                        <div className="text-xs text-gray-400 truncate max-w-[160px]">{college.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2.5 py-1 text-xs font-bold bg-blue-50 text-blue-700 rounded-lg">
                          {college.code}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => navigate(`/dashboard/super-admin/colleges/${college._id}/students`)}
                          className="flex items-center gap-1.5 text-gray-900 font-medium hover:text-blue-600 transition-colors group text-xs"
                        >
                          <Users className="w-3.5 h-3.5 text-blue-400 group-hover:text-blue-600" />
                          {lc.studentsCount ?? 0}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-xs font-medium text-gray-700">{lc.companiesCount ?? 0}</td>
                      <td className="px-4 py-3 text-xs font-medium text-gray-700">{lc.jdsCount ?? 0}</td>
                      <td className="px-4 py-3 text-xs font-medium text-gray-700">{lc.adminsCount ?? 0}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 text-xs font-bold rounded-lg ${
                          college.isActive
                            ? 'bg-blue-50 text-blue-600'
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          {college.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => navigate(`/dashboard/super-admin/colleges/${college._id}`)}
                            className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => navigate(`/dashboard/super-admin/colleges/${college._id}/edit`)}
                            className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <SquarePen className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No colleges registered yet</p>
              <p className="text-gray-400 text-xs mt-1">Start by adding a new college</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

/* ── Sub-components ─────────────────────────────────────── */
const CourseStatCard = ({ label, value, gradient, icon: Icon }) => (
  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-white/60">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-1">{label}</p>
        <p className="text-2xl font-black text-gray-900">{value}</p>
      </div>
      <div className={`w-11 h-11 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center shadow-md`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
    </div>
  </div>
);

const QuickAction = ({ icon: Icon, gradient, title, desc, onClick }) => (
  <div
    onClick={onClick}
    className={`bg-gradient-to-br ${gradient} rounded-2xl p-5 shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer group hover:scale-[1.03]`}
  >
    <div className="flex flex-col items-center text-center text-white">
      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-3 group-hover:bg-white/30 transition-all">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-bold mb-1">{title}</h3>
      <p className="text-white/70 text-xs">{desc}</p>
    </div>
  </div>
);

export default SuperAdminDashboard;