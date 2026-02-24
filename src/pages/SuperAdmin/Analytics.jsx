// pages/SuperAdmin/Analytics.jsx
import { useState, useEffect } from 'react';
import apiCall from '../../api/Api';
import {
  TrendingUp,
  Users,
  Building2,
  Briefcase,
  GraduationCap,
  Award,
  Target,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [timeRange, setTimeRange] = useState('month'); // week, month, year, all

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const data = await apiCall(`/super-admin/analytics?timeRange=${timeRange}`);
      if (data.success) {
        setAnalytics(data.analytics);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      // Use mock data for demonstration
      setAnalytics({
        overview: {
          totalColleges: 45,
          totalStudents: 12450,
          totalCompanies: 320,
          totalJobs: 875,
          placedStudents: 8920,
          placementRate: 71.6,
        },
        trends: {
          collegesGrowth: 12.5,
          studentsGrowth: 18.3,
          companiesGrowth: 15.8,
          jobsGrowth: 22.4,
        },
        topColleges: [
          { name: 'MIT College', students: 2500, placements: 2100, rate: 84 },
          { name: 'Stanford Tech', students: 1800, placements: 1530, rate: 85 },
          { name: 'Berkeley Institute', students: 2200, placements: 1800, rate: 82 },
          { name: 'Harvard College', students: 1500, placements: 1290, rate: 86 },
          { name: 'Princeton University', students: 1400, placements: 1120, rate: 80 },
        ],
        topIndustries: [
          { name: 'IT/Software', companies: 145, jobs: 425, percentage: 48.6 },
          { name: 'Consulting', companies: 68, jobs: 180, percentage: 20.6 },
          { name: 'BFSI', companies: 42, jobs: 115, percentage: 13.1 },
          { name: 'E-commerce', companies: 35, jobs: 85, percentage: 10.9 },
          { name: 'Other', companies: 30, jobs: 70, percentage: 6.8 },
        ],
        recentActivity: [
          { event: 'New college registered', college: 'Tech Institute', date: '2 hours ago' },
          { event: '45 new job postings', college: 'MIT College', date: '5 hours ago' },
          { event: '120 applications submitted', college: 'Stanford Tech', date: '1 day ago' },
          { event: 'New admin created', college: 'Berkeley Institute', date: '2 days ago' },
          { event: 'Company partnership', college: 'Harvard College', date: '3 days ago' },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading Analytics..." />;
  }

  return (
    <DashboardLayout title="Platform Analytics">
      {/* Header */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 rounded-3xl p-8 shadow-2xl shadow-blue-500/30">
          <div className="flex items-center justify-between">
            <div className="text-white">
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <BarChart3 className="w-8 h-8" />
                Platform Analytics
              </h1>
              <p className="text-blue-100 text-lg">
                Comprehensive insights and performance metrics
              </p>
            </div>
            <div className="flex gap-2">
              {['week', 'month', 'year', 'all'].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-2 rounded-lg font-semibold capitalize transition-all ${
                    timeRange === range
                      ? 'bg-white text-blue-600 shadow-lg'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className={`flex items-center gap-1 text-sm font-semibold ${
              analytics?.trends?.collegesGrowth >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {analytics?.trends?.collegesGrowth >= 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
              {Math.abs(analytics?.trends?.collegesGrowth || 0)}%
            </span>
          </div>
          <div>
            <p className="text-gray-600 text-sm font-medium mb-1">Total Colleges</p>
            <p className="text-3xl font-bold text-gray-900">{analytics?.overview?.totalColleges || 0}</p>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <span className={`flex items-center gap-1 text-sm font-semibold ${
              analytics?.trends?.studentsGrowth >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {analytics?.trends?.studentsGrowth >= 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
              {Math.abs(analytics?.trends?.studentsGrowth || 0)}%
            </span>
          </div>
          <div>
            <p className="text-gray-600 text-sm font-medium mb-1">Total Students</p>
            <p className="text-3xl font-bold text-gray-900">{analytics?.overview?.totalStudents?.toLocaleString() || 0}</p>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <span className={`flex items-center gap-1 text-sm font-semibold ${
              analytics?.trends?.companiesGrowth >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {analytics?.trends?.companiesGrowth >= 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
              {Math.abs(analytics?.trends?.companiesGrowth || 0)}%
            </span>
          </div>
          <div>
            <p className="text-gray-600 text-sm font-medium mb-1">Total Companies</p>
            <p className="text-3xl font-bold text-gray-900">{analytics?.overview?.totalCompanies || 0}</p>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-slate-500 to-slate-600 rounded-xl flex items-center justify-center shadow-lg">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <span className={`flex items-center gap-1 text-sm font-semibold ${
              analytics?.trends?.jobsGrowth >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {analytics?.trends?.jobsGrowth >= 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
              {Math.abs(analytics?.trends?.jobsGrowth || 0)}%
            </span>
          </div>
          <div>
            <p className="text-gray-600 text-sm font-medium mb-1">Total Jobs</p>
            <p className="text-3xl font-bold text-gray-900">{analytics?.overview?.totalJobs || 0}</p>
          </div>
        </div>
      </div>

      {/* Placement Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
              <Award className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Top Performing Colleges</h3>
          </div>
          <div className="space-y-4">
            {analytics?.topColleges?.map((college, index) => (
              <div key={index} className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-white font-bold shadow-lg">
                  #{index + 1}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">{college.name}</div>
                  <div className="text-sm text-gray-600">
                    {college.placements.toLocaleString()} / {college.students.toLocaleString()} students placed
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">{college.rate}%</div>
                  <div className="text-xs text-gray-500">Placement Rate</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
              <Target className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Placement Overview</h3>
          </div>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600 font-medium">Placement Rate</span>
                <span className="text-2xl font-bold text-green-600">{analytics?.overview?.placementRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-blue-600 to-cyan-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${analytics?.overview?.placementRate || 0}%` }}
                />
              </div>
            </div>
            <div className="pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Placed Students</span>
                <span className="font-bold text-gray-900">{analytics?.overview?.placedStudents?.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Students</span>
                <span className="font-bold text-gray-900">{analytics?.overview?.totalStudents?.toLocaleString() || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Industry Distribution & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
              <PieChart className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Industry Distribution</h3>
          </div>
          <div className="space-y-3">
            {analytics?.topIndustries?.map((industry, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700">{industry.name}</span>
                  <span className="text-sm text-gray-500">
                    {industry.companies} companies • {industry.jobs} jobs
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${industry.percentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-blue-600 w-12 text-right">{industry.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-slate-500 to-slate-600 rounded-xl flex items-center justify-center shadow-lg">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Recent Activity</h3>
          </div>
          <div className="space-y-4">
            {analytics?.recentActivity?.map((activity, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <Calendar className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{activity.event}</p>
                  <p className="text-sm text-gray-600">{activity.college}</p>
                  <p className="text-xs text-gray-500 mt-1">{activity.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Analytics;