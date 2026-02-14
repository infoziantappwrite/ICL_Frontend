// pages/CollegeAdmin/Dashboard.jsx - FINAL PRODUCTION VERSION
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Users,
  Briefcase,
  FileText,
  TrendingUp,
  Award,
  Plus,
  BarChart3,
  ArrowUp,
  Clock,
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const CollegeAdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalStudents: 0,
    placedStudents: 0,
    totalCompanies: 0,
    totalJDs: 0,
    activeJDs: 0,
    placementPercentage: 0,
    selectedStudents: 0,
  });
  const [recentJDs, setRecentJDs] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/college-admin/dashboard', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        setStats(data.stats || stats);
        setRecentJDs(data.recentJDs || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Continue with default values
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <LoadingSpinner
        message="Loading College Admin Dashboard..."
        submessage="Fetching placement data"
        icon={Building2}
      />
    );
  }

  return (
    <DashboardLayout title="College Admin Dashboard">
      {/* Welcome Banner - STUNNING GRADIENT */}
      <div className="mb-8 animate-fade-in">
        <div className="relative bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 rounded-3xl p-8 sm:p-10 shadow-2xl shadow-blue-500/40 overflow-hidden">
          {/* Animated Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute w-64 h-64 bg-white rounded-full -top-20 -left-20 animate-pulse"></div>
            <div className="absolute w-96 h-96 bg-white rounded-full -bottom-32 -right-32 animate-pulse animation-delay-1000"></div>
          </div>
          
          <div className="relative flex items-center justify-between">
            <div className="text-white max-w-2xl">
              <h1 className="text-3xl sm:text-4xl font-bold mb-3 flex items-center gap-3">
                College Placement Portal
                <span className="text-2xl">🎓</span>
              </h1>
              <p className="text-blue-100 text-base sm:text-lg font-medium">
                Manage placements, companies, and job opportunities for your institution
              </p>
            </div>
            <div className="hidden lg:block">
              <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-2xl">
                <Building2 className="w-14 h-14 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid - ENHANCED */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={Users}
          label="Total Students"
          value={stats?.totalStudents ?? 0}
          subtext={`${stats?.placedStudents ?? 0} placed`}
          color="blue"
          trend="+12%"
        />
        <StatCard
          icon={Briefcase}
          label="Companies"
          value={stats?.totalCompanies ?? 0}
          subtext="Registered"
          color="cyan"
          trend="+8%"
        />
        <StatCard
          icon={FileText}
          label="Job Descriptions"
          value={stats?.totalJDs ?? 0}
          subtext={`${stats?.activeJDs ?? 0} active`}
          color="indigo"
          trend="+15%"
        />
        <StatCard
          icon={Award}
          label="Placement Rate"
          value={`${stats?.placementPercentage ?? 0}%`}
          subtext={`${stats?.selectedStudents ?? 0} selected`}
          color="purple"
          trend="+5%"
        />
      </div>

      {/* Quick Actions - STUNNING CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <QuickActionCard
          icon={Building2}
          title="Manage Companies"
          description="Add, edit, and manage companies"
          gradient="from-blue-600 via-blue-500 to-cyan-500"
          onClick={() => navigate('/dashboard/college-admin/companies')}
        />
        <QuickActionCard
          icon={Plus}
          title="Add Company"
          description="Register a new company"
          gradient="from-cyan-600 via-cyan-500 to-teal-500"
          onClick={() => navigate('/dashboard/college-admin/companies/create')}
        />
        <QuickActionCard
          icon={FileText}
          title="Create JD"
          description="Post new job description"
          gradient="from-indigo-600 via-indigo-500 to-purple-500"
          onClick={() => navigate('/dashboard/college-admin/jobs/create')}
        />
        <QuickActionCard
          icon={TrendingUp}
          title="Manage Jobs"
          description="View and manage job postings"
          gradient="from-purple-600 via-purple-500 to-pink-500"
          onClick={() => navigate('/dashboard/college-admin/jobs')}
        />
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Job Descriptions - 2/3 width */}
        <div className="lg:col-span-2">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Recent Job Descriptions</h3>
              </div>
              <button
                onClick={() => navigate('/dashboard/college-admin/jobs')}
                className="text-blue-600 hover:text-blue-700 font-semibold text-sm transition-colors flex items-center gap-1 group"
              >
                View All
                <TrendingUp className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
            <div className="p-6">
              {recentJDs.length > 0 ? (
                <div className="space-y-3">
                  {recentJDs.slice(0, 5).map((jd, index) => (
                    <JobDescriptionCard key={jd._id || index} jd={jd} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={FileText}
                  title="No job descriptions yet"
                  description="Start by creating your first job description"
                  actionLabel="Create JD"
                  onAction={() => navigate('/dashboard/college-admin/jobs/create')}
                />
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats - 1/3 width */}
        <div className="space-y-6">
          {/* Activity Summary */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Activity</h3>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <ActivityItem
                label="Active Jobs"
                value={stats?.activeJDs ?? 0}
                icon={FileText}
                color="blue"
              />
              <ActivityItem
                label="Companies"
                value={stats?.totalCompanies ?? 0}
                icon={Building2}
                color="cyan"
              />
              <ActivityItem
                label="Placed Students"
                value={stats?.placedStudents ?? 0}
                icon={Users}
                color="green"
              />
            </div>
          </div>

          {/* Quick Actions Mini */}
          <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl shadow-xl p-6 text-white">
            <h3 className="font-bold text-lg mb-4">Need Help?</h3>
            <p className="text-indigo-100 text-sm mb-4">
              Check our guides and documentation for managing placements effectively.
            </p>
            <button
              onClick={() => navigate('/dashboard/college-admin/help')}
              className="w-full py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl font-semibold text-sm transition-all"
            >
              View Documentation
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

// Enhanced Stat Card Component
const StatCard = ({ icon: Icon, label, value, subtext, color, trend }) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    cyan: 'from-cyan-500 to-cyan-600',
    indigo: 'from-indigo-500 to-indigo-600',
    purple: 'from-purple-500 to-purple-600',
    green: 'from-green-500 to-green-600',
  };

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-6 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 group">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 bg-gradient-to-br ${colorClasses[color]} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend && (
          <div className="flex items-center gap-1 text-green-600 text-sm font-semibold">
            <ArrowUp className="w-4 h-4" />
            {trend}
          </div>
        )}
      </div>
      <div>
        <p className="text-gray-600 text-sm font-medium mb-1">{label}</p>
        <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
        <p className="text-sm text-gray-500">{subtext}</p>
      </div>
    </div>
  );
};

// Quick Action Card Component
const QuickActionCard = ({ icon: Icon, title, description, gradient, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`relative bg-gradient-to-br ${gradient} rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 text-left group overflow-hidden`}
    >
      {/* Animated background effect */}
      <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
      
      <div className="relative">
        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
          <Icon className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
        <p className="text-sm text-white/90">{description}</p>
      </div>
    </button>
  );
};

// Job Description Card
const JobDescriptionCard = ({ jd }) => {
  const navigate = useNavigate();
  
  return (
    <button
      onClick={() => navigate(`/dashboard/college-admin/jobs/${jd._id}`)}
      className="w-full p-4 bg-gray-50 hover:bg-blue-50 rounded-xl transition-all border border-gray-100 hover:border-blue-200 text-left group"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
            {jd.jobTitle || 'Untitled Position'}
          </h4>
          <p className="text-sm text-gray-600 truncate mt-1">
            {jd.companyId?.name || jd.company || 'Company Name'}
          </p>
        </div>
        <div className="flex items-center gap-2 ml-3">
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
            jd.status === 'Active' ? 'bg-green-100 text-green-700' :
            jd.status === 'Draft' ? 'bg-yellow-100 text-yellow-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            {jd.status || 'Draft'}
          </span>
        </div>
      </div>
    </button>
  );
};

// Activity Item Component
const ActivityItem = ({ label, value, icon: Icon, color }) => {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-50',
    cyan: 'text-cyan-600 bg-cyan-50',
    green: 'text-green-600 bg-green-50',
  };

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 ${colorClasses[color]} rounded-lg flex items-center justify-center`}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-sm font-medium text-gray-700">{label}</span>
      </div>
      <span className="text-lg font-bold text-gray-900">{value}</span>
    </div>
  );
};

// Empty State Component
const EmptyState = ({ icon: Icon, title, description, actionLabel, onAction }) => {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Icon className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">{description}</p>
      {actionLabel && (
        <button
          onClick={onAction}
          className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg font-medium"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default CollegeAdminDashboard;