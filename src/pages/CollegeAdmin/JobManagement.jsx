// pages/CollegeAdmin/JobManagement.jsx - FIXED: correct API, data paths, + Matched Students btn
import { useToast } from '../../context/ToastContext';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase, Plus, Search, Edit, Trash2, Eye, Pin, PinOff,
  Users, CheckCircle, XCircle, AlertCircle, Building2, Target,
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { collegeAdminAPI, jobAPI } from '../../api/Api';
 
const JobManagement = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [stats, setStats] = useState({ total: 0, active: 0, closed: 0, draft: 0 });
 
  useEffect(() => { fetchJobs(); }, []);
 
  const fetchJobs = async () => {
    try {
      setLoading(true);
      // ✅ FIX: was jobAPI.getJobList() → /jobs/joblist (route doesn't exist!)
      // Correct: collegeAdminAPI.getJobs() → /college-admin/jobs
      const response = await collegeAdminAPI.getJobs();
      if (response.success) {
        setJobs(response.jobs || []);
        calculateStats(response.jobs || []);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error('Error', 'Failed to fetch jobs: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
 
  const calculateStats = (jobsList) => {
    setStats({
      total: jobsList.length,
      active: jobsList.filter(j => j.status === 'Active').length,
      closed: jobsList.filter(j => j.status === 'Closed').length,
      draft:  jobsList.filter(j => j.status === 'Draft').length,
    });
  };
 
  const handleTogglePin = async (jobId, currentPinStatus) => {
    try {
      await jobAPI.togglePinJob(jobId);
      setJobs(jobs.map(job => job._id === jobId ? { ...job, isPinned: !currentPinStatus } : job));
      toast.success('Success', `Job ${currentPinStatus ? 'unpinned' : 'pinned'} successfully`);
    } catch (error) {
      toast.error('Error', 'Failed to toggle pin: ' + error.message);
      fetchJobs();
    }
  };
 
  const handleStatusChange = async (jobId, newStatus) => {
    try {
      await jobAPI.updateJobStatus(jobId, newStatus);
      const updated = jobs.map(job => job._id === jobId ? { ...job, status: newStatus } : job);
      setJobs(updated);
      calculateStats(updated);
      toast.success('Success', `Job status updated to ${newStatus}`);
    } catch (error) {
      toast.error('Error', 'Failed to update status: ' + error.message);
      fetchJobs();
    }
  };
 
  const handleDeleteJob = async (jobId, jobTitle) => {
    if (!confirm(`Are you sure you want to delete "${jobTitle}"? This action cannot be undone.`)) return;
    try {
      await jobAPI.deleteJob(jobId);
      toast.success('Success', 'Job deleted successfully');
      fetchJobs();
    } catch (error) {
      toast.error('Error', 'Failed to delete job: ' + error.message);
    }
  };
 
  const getStatusBadge = (s) => ({
    Active: 'bg-green-100 text-green-700 border border-green-200',
    Closed: 'bg-gray-100 text-gray-700 border border-gray-200',
    Draft: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
    Cancelled: 'bg-red-100 text-red-700 border border-red-200',
  }[s] || 'bg-gray-100 text-gray-700');
 
  const getJobTypeColor = (t) => ({
    'Full-Time': 'bg-blue-100 text-blue-700',
    'Internship': 'bg-purple-100 text-purple-700',
    'Internship + FTE': 'bg-indigo-100 text-indigo-700',
  }[t] || 'bg-gray-100 text-gray-700');
 
  // ✅ FIX: backend populates companyId as object with .name
  const getCompanyName = (job) =>
    (typeof job.companyId === 'object' ? job.companyId?.name : null) || job.companyName || 'N/A';
 
  // ✅ FIX: package stored as package.ctc.min / package.ctc.max
  const getPackageDisplay = (job) => {
    const min = job.package?.ctc?.min;
    const max = job.package?.ctc?.max;
    if (min == null) return 'N/A';
    return max && max !== min ? `₹${min} - ₹${max} LPA` : `₹${min} LPA`;
  };
 
  const filteredJobs = jobs.filter(job => {
    const company = getCompanyName(job);
    const matchSearch =
      job.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.jobCode?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchSearch && (!filterStatus || job.status === filterStatus);
  });
 
  if (loading) return <LoadingSpinner message="Loading Job Descriptions..." />;
 
  const statCards = [
    { label: 'Total Jobs',  value: stats.total,  grad: 'from-blue-500 to-cyan-500',      Icon: Briefcase,    tc: 'text-gray-900'   },
    { label: 'Active',      value: stats.active, grad: 'from-green-500 to-emerald-500',   Icon: CheckCircle,  tc: 'text-green-600'  },
    { label: 'Closed',      value: stats.closed, grad: 'from-gray-500 to-gray-600',       Icon: XCircle,      tc: 'text-gray-600'   },
    { label: 'Draft',       value: stats.draft,  grad: 'from-yellow-400 to-amber-500',    Icon: AlertCircle,  tc: 'text-yellow-600' },
  ];
 
  return (
    <DashboardLayout title="Job Management">
      {/* Header */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 rounded-3xl p-8 shadow-2xl shadow-blue-500/30">
          <div className="flex items-center justify-between">
            <div className="text-white">
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <Briefcase className="w-8 h-8" /> Job Management
              </h1>
              <p className="text-blue-100 text-lg">Manage campus placement opportunities</p>
            </div>
            <button
              onClick={() => navigate('/dashboard/college-admin/jobs/create')}
              className="bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold flex items-center gap-2 hover:bg-blue-50 transition-all shadow-lg hover:scale-105"
            >
              <Plus className="w-5 h-5" /> Create Job
            </button>
          </div>
        </div>
      </div>
 
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {statCards.map(({ label, value, grad, Icon, tc }) => (
          <div key={label} className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">{label}</p>
                <p className={`text-3xl font-bold ${tc}`}>{value}</p>
              </div>
              <div className={`w-14 h-14 bg-gradient-to-br ${grad} rounded-xl flex items-center justify-center shadow-lg`}>
                <Icon className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>
 
      {/* Search and Filters */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by job title, company, or job code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="Active">Active Only</option>
            <option value="Closed">Closed Only</option>
            <option value="Draft">Draft Only</option>
          </select>
        </div>
      </div>
 
      {/* Jobs Table */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 overflow-hidden">
        <div className="overflow-x-auto">
          {filteredJobs.length > 0 ? (
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-gray-200">
                <tr>
                  {['Job Title','Company','Job Type','Package','Applications','Deadline','Status','Actions'].map(h => (
                    <th key={h} className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredJobs.map(job => (
                  <tr key={job._id} className="hover:bg-blue-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {job.isPinned && <Pin className="w-4 h-4 text-blue-600 shrink-0" fill="currentColor" />}
                        <div>
                          <div className="font-semibold text-gray-900">{job.jobTitle}</div>
                          <div className="text-xs text-gray-400 font-mono">{job.jobCode}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
                        <span className="text-sm text-gray-700">{getCompanyName(job)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getJobTypeColor(job.jobType)}`}>
                        {job.jobType}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-gray-900">{getPackageDisplay(job)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-700">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium">{job.stats?.totalApplications || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">
                        {job.dates?.applicationDeadline
                          ? new Date(job.dates.applicationDeadline).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })
                          : '—'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={job.status}
                        onChange={(e) => handleStatusChange(job._id, e.target.value)}
                        className={`px-3 py-1 text-xs font-semibold rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer ${getStatusBadge(job.status)}`}
                      >
                        <option value="Active">Active</option>
                        <option value="Draft">Draft</option>
                        <option value="Closed">Closed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleTogglePin(job._id, job.isPinned)}
                          className={`p-2 rounded-lg transition-colors ${job.isPinned ? 'text-blue-600 hover:bg-blue-50' : 'text-gray-400 hover:bg-gray-50'}`}
                          title={job.isPinned ? 'Unpin' : 'Pin'}>
                          {job.isPinned ? <Pin className="w-4 h-4" fill="currentColor" /> : <PinOff className="w-4 h-4" />}
                        </button>
                        {/* ✅ NEW: Skill Match button */}
                        <button
                          onClick={() => navigate(`/dashboard/college-admin/jobs/${job._id}/matched-students`)}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="View Matched Students (Skill Match)">
                          <Target className="w-4 h-4" />
                        </button>
                        <button onClick={() => navigate(`/dashboard/college-admin/jobs/view/${job._id}`)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => navigate(`/dashboard/college-admin/jobs/edit/${job._id}`)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Edit">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteJob(job._id, job.jobTitle)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-16">
              <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-medium mb-2">No job descriptions found</p>
              <p className="text-gray-400 mb-6">
                {searchTerm || filterStatus ? 'Try adjusting your search or filters' : 'Get started by creating your first job description'}
              </p>
              {!searchTerm && !filterStatus && (
                <button onClick={() => navigate('/dashboard/college-admin/jobs/create')}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 mx-auto hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg">
                  <Plus className="w-5 h-5" /> Create First Job
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};
 
export default JobManagement;