// pages/SuperAdmin/Dashboard.jsx - POLISHED UI VERSION
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Users,
  Briefcase,
  Award,
  Plus,
  Eye,
  Edit,
  FileText,
  UserCheck,
  Clock,
  RefreshCw,
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import StatCard from '../../components/common/StatCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [recentColleges, setRecentColleges] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    fetchDashboardData();

    const interval = setInterval(() => {
      fetchDashboardData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/super-admin/dashboard', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setStats(data.data?.stats || {});
        setRecentColleges(data.data?.recentColleges || []);
        setLastUpdated(new Date());
      } else {
        console.error('Failed to fetch dashboard data:', data.message);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <LoadingSpinner
        message="Loading Super Admin Dashboard..."
        submessage="Fetching platform-wide data"
      />
    );
  }

  return (
    <DashboardLayout title="Super Admin Dashboard">
      {/* Welcome Banner */}
      <div className="mb-8 animate-fade-in">
        <div className="relative bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 rounded-3xl p-8 shadow-2xl shadow-blue-500/30 overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full -ml-32 -mb-32"></div>
          </div>
          <div className="relative flex items-center justify-between">
            <div className="text-white">
              <h1 className="text-3xl font-bold mb-2">Welcome, Super Admin! 👋</h1>
              <p className="text-blue-100 text-lg">Platform-wide overview and management</p>
              <p className="text-blue-200 text-sm mt-2 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <button
                onClick={fetchDashboardData}
                disabled={loading}
                className="flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-xl font-medium hover:bg-white/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                title="Refresh data"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <Award className="w-12 h-12 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={Building2}
          label="Total Colleges"
          value={stats?.totalColleges ?? 0}
          trend="up"
          trendValue={`${stats?.activeColleges ?? 0} active`}
          color="blue"
        />
        <StatCard
          icon={Users}
          label="College Admins"
          value={stats?.totalAdmins ?? 0}
          trend="up"
          trendValue="Across all colleges"
          color="green"
        />
        <StatCard
          icon={Users}
          label="Total Students"
          value={stats?.totalStudents ?? 0}
          trend="up"
          trendValue="Platform-wide"
          color="purple"
        />
        <StatCard
          icon={Briefcase}
          label="Total Companies"
          value={stats?.totalCompanies ?? 0}
          trend="up"
          trendValue={`${stats?.activeJobs ?? 0} active JDs`}
          color="orange"
        />
      </div>

      {/* Applications Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">Total Applications</p>
              <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                {stats?.totalApplications ?? 0}
              </p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <FileText className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">Pending Review</p>
              <p className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                {stats?.pendingApplications ?? 0}
              </p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <Clock className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">Shortlisted</p>
              <p className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {stats?.shortlistedApplications ?? 0}
              </p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
              <UserCheck className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">Hired</p>
              <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                {stats?.hiredStudents ?? 0}
              </p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
              <Award className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <div
          onClick={() => navigate('/dashboard/super-admin/colleges/new')}
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer group hover:scale-105"
        >
          <div className="flex flex-col items-center text-center text-white">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-4 group-hover:bg-white/30 transition-all">
              <Plus className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold mb-2">Add New College</h3>
            <p className="text-blue-100 text-sm">Register a new college to the platform</p>
          </div>
        </div>

        <div
          onClick={() => navigate('/dashboard/super-admin/companies')}
          className="bg-gradient-to-br from-blue-700 to-blue-800 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer group hover:scale-105"
        >
          <div className="flex flex-col items-center text-center text-white">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-4 group-hover:bg-white/30 transition-all">
              <Building2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold mb-2">Manage Companies</h3>
            <p className="text-purple-100 text-sm">View and manage all companies</p>
          </div>
        </div>

        <div
          onClick={() => navigate('/dashboard/super-admin/admins')}
          className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer group hover:scale-105"
        >
          <div className="flex flex-col items-center text-center text-white">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-4 group-hover:bg-white/30 transition-all">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold mb-2">Manage Admins</h3>
            <p className="text-green-100 text-sm">View and manage college administrators</p>
          </div>
        </div>

        <div
          onClick={() => navigate('/dashboard/super-admin/applications')}
          className="bg-gradient-to-br from-slate-600 to-slate-700 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer group hover:scale-105"
        >
          <div className="flex flex-col items-center text-center text-white">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-4 group-hover:bg-white/30 transition-all">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold mb-2">View Applications</h3>
            <p className="text-orange-100 text-sm">Track and manage all applications</p>
          </div>
        </div>
      </div>

      {/* Recent Colleges Table */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-blue-50 via-cyan-50 to-blue-50 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Recent Colleges</h3>
          </div>
          <button
            onClick={() => navigate('/dashboard/super-admin/colleges')}
            className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1 transition-colors px-4 py-2 rounded-lg hover:bg-blue-50"
          >
            View All
            <Eye className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          {recentColleges.length > 0 ? (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['College', 'Code', 'Students', 'Companies', 'Status', 'Actions'].map((h) => (
                    <th
                      key={h}
                      className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentColleges.map((college) => (
                  <tr key={college._id} className="hover:bg-blue-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{college.name}</div>
                      <div className="text-sm text-gray-500">{college.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-700 rounded-full">
                        {college.code}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-900 font-medium">
                      {college.stats?.totalStudents ?? 0}
                    </td>
                    <td className="px-6 py-4 text-gray-900 font-medium">
                      {college.stats?.totalCompanies ?? 0}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          college.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {college.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/dashboard/super-admin/colleges/${college._id}`)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/dashboard/super-admin/colleges/${college._id}/edit`)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12">
              <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-medium">No colleges registered yet</p>
              <p className="text-gray-400 text-sm mt-2">
                Start by adding a new college to the platform
              </p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.5s ease-out; }
      `}</style>
    </DashboardLayout>
  );
};

export default SuperAdminDashboard;