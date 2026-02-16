// pages/CollegeAdmin/Analytics.jsx - LIVE DATA VERSION with Dashboard UI
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Users,
  Briefcase,
  FileText,
  Building2,
  Award,
  Activity,
  BarChart3,
  Target,
  CheckCircle,
  XCircle,
  Clock,
  GraduationCap,
  DollarSign,
  ArrowUp,
  Calendar,
  Eye,
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { collegeAdminAPI, jobAPI, applicationAPI } from '../../api/Api';

// Stat Card Component matching Dashboard style
const StatCard = ({ icon: Icon, label, value, subtext, color = 'blue', trend }) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-emerald-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
    pink: 'from-pink-500 to-rose-600',
    cyan: 'from-cyan-500 to-cyan-600',
    indigo: 'from-indigo-500 to-indigo-600',
  };

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-300 group hover:scale-105">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-gray-600 text-sm font-medium mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mb-2">{value}</p>
          {subtext && (
            <p className="text-sm text-gray-500 flex items-center gap-1">
              {trend && <ArrowUp className="w-3 h-3 text-green-600" />}
              {subtext}
            </p>
          )}
        </div>
        <div className={`w-14 h-14 bg-gradient-to-br ${colorClasses[color]} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
          <Icon className="w-7 h-7 text-white" />
        </div>
      </div>
    </div>
  );
};

const Analytics = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('all');
  
  // State for live data
  const [overviewStats, setOverviewStats] = useState({
    totalStudents: 0,
    totalCompanies: 0,
    totalJDs: 0,
    activeJDs: 0,
    totalApplications: 0,
    selectedStudents: 0,
    placedStudents: 0,
    placementPercentage: 0,
  });

  const [jobStats, setJobStats] = useState({
    active: 0,
    closed: 0,
    draft: 0,
    cancelled: 0,
  });

  const [applicationStats, setApplicationStats] = useState({
    pending: 0,
    shortlisted: 0,
    selected: 0,
    rejected: 0,
  });

  const [branchStats, setBranchStats] = useState([]);
  const [companyStats, setCompanyStats] = useState([]);
  const [packageStats, setPackageStats] = useState({
    avgPackage: 0,
    maxPackage: 0,
    minPackage: 0,
  });
  const [monthlyTrends, setMonthlyTrends] = useState([]);

  useEffect(() => {
    fetchAllData();
  }, [timeRange]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      console.log('📊 Fetching live analytics data...');
      
      // Fetch all data in parallel
      const [dashboardData, analyticsData, jobsData, applicationsData] = await Promise.all([
        collegeAdminAPI.getDashboard().catch(e => ({ success: false })),
        collegeAdminAPI.getAnalytics().catch(e => ({ success: false })),
        jobAPI.getAllJobs().catch(e => ({ success: false, jobs: [] })),
        applicationAPI.getAllApplications().catch(e => ({ success: false, applications: [] })),
      ]);

      console.log('✅ Dashboard Data:', dashboardData);
      console.log('✅ Analytics Data:', analyticsData);
      console.log('✅ Jobs Data:', jobsData);
      console.log('✅ Applications Data:', applicationsData);

      // Process Overview Stats from Dashboard
      if (dashboardData.success && dashboardData.stats) {
        setOverviewStats(dashboardData.stats);
      }

      // Process Job Stats
      if (jobsData.success && jobsData.jobs) {
        const jobs = jobsData.jobs;
        setJobStats({
          active: jobs.filter(j => j.status === 'Active').length,
          closed: jobs.filter(j => j.status === 'Closed').length,
          draft: jobs.filter(j => j.status === 'Draft').length,
          cancelled: jobs.filter(j => j.status === 'Cancelled').length,
        });
      }

      // Process Application Stats
      if (applicationsData.success && applicationsData.applications) {
        const apps = applicationsData.applications;
        setApplicationStats({
          pending: apps.filter(a => a.status === 'Pending' || a.status === 'Applied').length,
          shortlisted: apps.filter(a => a.status === 'Shortlisted').length,
          selected: apps.filter(a => a.status === 'Selected').length,
          rejected: apps.filter(a => a.status === 'Rejected').length,
        });
      }

      // Process Analytics Data
      if (analyticsData.success) {
        // Branch Stats
        if (analyticsData.branchStats) {
          setBranchStats(analyticsData.branchStats);
        }
        
        // Company Stats
        if (analyticsData.companyStats) {
          setCompanyStats(analyticsData.companyStats);
        }
        
        // Package Stats
        if (analyticsData.packageStats) {
          setPackageStats(analyticsData.packageStats);
        }
        
        // Monthly Trends
        if (analyticsData.monthlyTrends) {
          setMonthlyTrends(analyticsData.monthlyTrends);
        }
      }

      console.log('✅ All analytics data loaded successfully!');
    } catch (error) {
      console.error('❌ Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <LoadingSpinner
        message="Loading Analytics..."
        submessage="Fetching live placement data"
        icon={BarChart3}
      />
    );
  }

  return (
    <DashboardLayout title="Analytics Dashboard">
      {/* Welcome Banner - Matching Dashboard Style */}
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
                Analytics Dashboard
                <span className="text-2xl">📊</span>
              </h1>
              <p className="text-blue-100 text-base sm:text-lg font-medium">
                Comprehensive placement insights and performance metrics
              </p>
            </div>
            <div className="hidden lg:flex items-center gap-4">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-6 py-3 bg-white/20 backdrop-blur-sm text-white border-2 border-white/30 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                <option value="week" className="text-gray-900">Last Week</option>
                <option value="month" className="text-gray-900">Last Month</option>
                <option value="year" className="text-gray-900">Last Year</option>
                <option value="all" className="text-gray-900">All Time</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Overview Stats - Matching Dashboard Style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={Users}
          label="Total Students"
          value={overviewStats.totalStudents}
          subtext="Registered students"
          color="blue"
          trend={true}
        />
        <StatCard
          icon={Building2}
          label="Total Companies"
          value={overviewStats.totalCompanies}
          subtext="Recruiting partners"
          color="purple"
          trend={true}
        />
        <StatCard
          icon={Briefcase}
          label="Total Job Openings"
          value={overviewStats.totalJDs}
          subtext={`${overviewStats.activeJDs} active`}
          color="orange"
          trend={true}
        />
        <StatCard
          icon={FileText}
          label="Total Applications"
          value={overviewStats.totalApplications}
          subtext="All submissions"
          color="cyan"
          trend={true}
        />
      </div>

      {/* Placement Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard
          icon={Award}
          label="Students Placed"
          value={overviewStats.placedStudents}
          subtext={`${overviewStats.selectedStudents} offers received`}
          color="green"
          trend={true}
        />
        <StatCard
          icon={Target}
          label="Placement Rate"
          value={`${overviewStats.placementPercentage}%`}
          subtext="Overall success rate"
          color="indigo"
          trend={true}
        />
        <StatCard
          icon={DollarSign}
          label="Average Package"
          value={packageStats.avgPackage > 0 ? `₹${packageStats.avgPackage.toFixed(2)}L` : '₹0'}
          subtext={packageStats.maxPackage > 0 ? `Highest: ₹${packageStats.maxPackage.toFixed(2)}L` : 'No data'}
          color="pink"
        />
      </div>

      {/* Job & Application Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Job Statistics */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-blue-50 via-cyan-50 to-blue-50 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-600" />
              Job Statistics
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-xl border border-green-100">
                <div className="text-3xl font-bold text-green-600 mb-1">{jobStats.active}</div>
                <div className="text-sm text-gray-600 font-medium">Active Jobs</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="text-3xl font-bold text-gray-600 mb-1">{jobStats.closed}</div>
                <div className="text-sm text-gray-600 font-medium">Closed Jobs</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                <div className="text-3xl font-bold text-yellow-600 mb-1">{jobStats.draft}</div>
                <div className="text-sm text-gray-600 font-medium">Draft Jobs</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-xl border border-red-100">
                <div className="text-3xl font-bold text-red-600 mb-1">{jobStats.cancelled}</div>
                <div className="text-sm text-gray-600 font-medium">Cancelled</div>
              </div>
            </div>
          </div>
        </div>

        {/* Application Statistics */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-purple-50 via-pink-50 to-purple-50 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" />
              Application Status
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                <div className="text-3xl font-bold text-yellow-600 mb-1">{applicationStats.pending}</div>
                <div className="text-sm text-gray-600 font-medium">Pending</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-100">
                <div className="text-3xl font-bold text-blue-600 mb-1">{applicationStats.shortlisted}</div>
                <div className="text-sm text-gray-600 font-medium">Shortlisted</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-xl border border-green-100">
                <div className="text-3xl font-bold text-green-600 mb-1">{applicationStats.selected}</div>
                <div className="text-sm text-gray-600 font-medium">Selected</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-xl border border-red-100">
                <div className="text-3xl font-bold text-red-600 mb-1">{applicationStats.rejected}</div>
                <div className="text-sm text-gray-600 font-medium">Rejected</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Branch-wise Placement & Top Companies */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Branch-wise Placement */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-green-600" />
              Branch-wise Placement
            </h3>
          </div>
          <div className="p-6">
            {branchStats.length > 0 ? (
              <div className="space-y-4">
                {branchStats.map((branch, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">{branch.branch || branch._id || 'N/A'}</span>
                      <span className="text-sm font-bold text-gray-900">
                        {branch.placed}/{branch.total} ({Math.round(branch.placementPercentage || 0)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-gradient-to-r from-green-500 to-emerald-500 h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(branch.placementPercentage || 0, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <GraduationCap className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">No branch data available</p>
                <p className="text-sm mt-2">Data will appear as students get placed</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Companies */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-blue-50 via-cyan-50 to-blue-50 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              Top Hiring Companies
            </h3>
          </div>
          <div className="p-6">
            {companyStats.length > 0 ? (
              <div className="space-y-3">
                {companyStats.slice(0, 10).map((company, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{company.companyName || company._id}</p>
                        <p className="text-xs text-gray-500">Students hired</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-600">{company.studentsHired || 0}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">No hiring data yet</p>
                <p className="text-sm mt-2">Companies will appear as they hire students</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Package Distribution */}
      {packageStats.maxPackage > 0 && (
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 overflow-hidden mb-8">
          <div className="px-6 py-4 bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-orange-600" />
              Package Statistics
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
                <p className="text-sm text-gray-600 mb-2 font-medium">Highest Package</p>
                <p className="text-4xl font-bold text-green-600">₹{packageStats.maxPackage.toFixed(2)}L</p>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-100">
                <p className="text-sm text-gray-600 mb-2 font-medium">Average Package</p>
                <p className="text-4xl font-bold text-blue-600">₹{packageStats.avgPackage.toFixed(2)}L</p>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border border-orange-100">
                <p className="text-sm text-gray-600 mb-2 font-medium">Minimum Package</p>
                <p className="text-4xl font-bold text-orange-600">₹{packageStats.minPackage.toFixed(2)}L</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button
          onClick={() => navigate('/dashboard/college-admin/jobs')}
          className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50 hover:shadow-2xl transition-all hover:scale-105 group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <p className="font-bold text-gray-900 text-lg">Manage Jobs</p>
              <p className="text-sm text-gray-600">View and edit job postings</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => navigate('/dashboard/college-admin/applications')}
          className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50 hover:shadow-2xl transition-all hover:scale-105 group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <p className="font-bold text-gray-900 text-lg">Applications</p>
              <p className="text-sm text-gray-600">Review student applications</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => navigate('/dashboard/college-admin/companies')}
          className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50 hover:shadow-2xl transition-all hover:scale-105 group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <p className="font-bold text-gray-900 text-lg">Companies</p>
              <p className="text-sm text-gray-600">Manage recruiting partners</p>
            </div>
          </div>
        </button>
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
        .animation-delay-1000 {
          animation-delay: 1s;
        }
      `}</style>
    </DashboardLayout>
  );
};

export default Analytics;