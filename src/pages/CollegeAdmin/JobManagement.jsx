// pages/CollegeAdmin/JobManagement.jsx
import { useToast } from '../../context/ToastContext';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase, Plus, Search, SquarePen, Trash2, Eye, Pin, PinOff,
  Users, CircleCheck, CircleX, CircleDashed, Building2, Target,
  ChevronLeft, ChevronRight, RefreshCw,
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { collegeAdminAPI, jobAPI } from '../../api/Api';

const PER_PAGE = 10;

const Pagination = ({ page, totalPages, total, perPage, onPrev, onNext }) => {
  if (totalPages <= 1) return null;
  const from = (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);
  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
      <span className="text-xs text-gray-500">Showing {from}–{to} of {total}</span>
      <div className="flex items-center gap-2">
        <button onClick={onPrev} disabled={page === 1}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          <ChevronLeft className="w-3.5 h-3.5" /> Prev
        </button>
        <span className="text-xs text-gray-500 px-1">{page} / {totalPages}</span>
        <button onClick={onNext} disabled={page === totalPages}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          Next <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

const JobManagement = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [stats, setStats] = useState({ total: 0, active: 0, closed: 0, draft: 0 });

  useEffect(() => { fetchJobs(); }, []);
  useEffect(() => { setPage(1); }, [searchTerm, filterStatus]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await collegeAdminAPI.getJobs();
      if (response.success) {
        // Sort newest first
        const sorted = (response.jobs || []).sort(
          (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        );
        setJobs(sorted);
        calculateStats(sorted);
      }
    } catch (error) {
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
    Active:    'bg-green-100 text-green-700 border border-green-200',
    Closed:    'bg-gray-100 text-gray-700 border border-gray-200',
    Draft:     'bg-yellow-100 text-yellow-700 border border-yellow-200',
    Cancelled: 'bg-red-100 text-red-700 border border-red-200',
  }[s] || 'bg-gray-100 text-gray-700');

  const getJobTypeColor = (t) => ({
    'Full-Time':        'bg-blue-100 text-blue-700',
    'Internship':       'bg-purple-100 text-purple-700',
    'Internship + FTE': 'bg-indigo-100 text-indigo-700',
  }[t] || 'bg-gray-100 text-gray-700');

  const getCompanyName = (job) =>
    (typeof job.companyId === 'object' ? job.companyId?.name : null) || job.companyName || 'N/A';

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

  const totalPages = Math.ceil(filteredJobs.length / PER_PAGE);
  const paginated = filteredJobs.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  if (loading) return <LoadingSpinner message="Loading Job Descriptions..." />;

  const statCards = [
    { label: 'Total Jobs', value: stats.total,  grad: 'from-blue-500 to-cyan-500',    Icon: Briefcase,     tc: 'text-gray-900'   },
    { label: 'Active',     value: stats.active, grad: 'from-green-500 to-emerald-500', Icon: CircleCheck,   tc: 'text-green-600'  },
    { label: 'Closed',     value: stats.closed, grad: 'from-gray-500 to-gray-600',     Icon: CircleX,       tc: 'text-gray-600'   },
    { label: 'Draft',      value: stats.draft,  grad: 'from-yellow-400 to-amber-500',  Icon: CircleDashed,  tc: 'text-yellow-600' },
  ];

  return (
    <DashboardLayout title="Job Management">
      {/* Header */}
      <div className="mb-6">
        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="text-white">
              <h1 className="text-xl font-bold mb-1 flex items-center gap-3">
                <Briefcase className="w-5 h-5" /> Job Management
              </h1>
              <p className="text-blue-100 text-sm">Manage campus placement opportunities</p>
            </div>
            <button onClick={() => navigate('/dashboard/college-admin/jobs/create')}
              className="bg-white text-blue-600 px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-50 transition-all shadow-md hover:scale-105">
              <Plus className="w-5 h-5" /> Create Job
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {statCards.map(({ label, value, grad, Icon, tc }) => (
          <div key={label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs font-medium mb-1">{label}</p>
                <p className={`text-2xl font-bold ${tc}`}>{value}</p>
              </div>
              <div className={`w-11 h-11 bg-gradient-to-br ${grad} rounded-xl flex items-center justify-center shadow`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-white/60 mb-5">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
            <input type="text" placeholder="Search by job title, company, or job code..."
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent text-sm" />
          </div>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent text-sm text-gray-700">
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Closed">Closed</option>
            <option value="Draft">Draft</option>
          </select>
          <button onClick={fetchJobs}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl hover:opacity-90 transition-all shadow-sm">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/60 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50">
          <p className="font-semibold text-gray-800 text-sm">{filteredJobs.length} Jobs</p>
        </div>
        <div className="overflow-x-auto">
          {paginated.length > 0 ? (
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-gray-100">
                <tr>
                  {['Job Title','Company','Job Type','Package','Applications','Deadline','Status','Actions'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginated.map(job => (
                  <tr key={job._id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {job.isPinned && <Pin className="w-3.5 h-3.5 text-blue-600 shrink-0" fill="currentColor" />}
                        <div>
                          <div className="font-semibold text-gray-900 text-sm">{job.jobTitle}</div>
                          <div className="text-xs text-gray-400 font-mono">{job.jobCode}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="text-sm text-gray-700">{getCompanyName(job)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getJobTypeColor(job.jobType)}`}>
                        {job.jobType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">{getPackageDisplay(job)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-gray-700">
                        <Users className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-sm font-medium">{job.stats?.totalApplications || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {job.dates?.applicationDeadline
                        ? new Date(job.dates.applicationDeadline).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })
                        : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <select value={job.status} onChange={(e) => handleStatusChange(job._id, e.target.value)}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-full focus:outline-none cursor-pointer ${getStatusBadge(job.status)}`}>
                        <option value="Active">Active</option>
                        <option value="Draft">Draft</option>
                        <option value="Closed">Closed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleTogglePin(job._id, job.isPinned)}
                          className={`p-1.5 rounded-lg transition-colors ${job.isPinned ? 'text-blue-600 hover:bg-blue-50' : 'text-gray-400 hover:bg-gray-50'}`}
                          title={job.isPinned ? 'Unpin' : 'Pin'}>
                          {job.isPinned ? <Pin className="w-3.5 h-3.5" fill="currentColor" /> : <PinOff className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={() => navigate(`/dashboard/college-admin/jobs/${job._id}/matched-students`)}
                          className="p-1.5 text-purple-500 hover:bg-purple-50 rounded-lg transition-colors" title="Matched Students">
                          <Target className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => navigate(`/dashboard/college-admin/jobs/view/${job._id}`)}
                          className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="View">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => navigate(`/dashboard/college-admin/jobs/edit/${job._id}`)}
                          className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors" title="Edit">
                          <SquarePen className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDeleteJob(job._id, job.jobTitle)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-16">
              <Briefcase className="w-14 h-14 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No jobs found</p>
              <p className="text-gray-400 text-sm mt-1">
                {searchTerm || filterStatus ? 'Try adjusting your search or filters' : 'Get started by creating your first job'}
              </p>
              {!searchTerm && !filterStatus && (
                <button onClick={() => navigate('/dashboard/college-admin/jobs/create')}
                  className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-all">
                  <Plus className="w-4 h-4" /> Create First Job
                </button>
              )}
            </div>
          )}
        </div>
        <Pagination page={page} totalPages={totalPages} total={filteredJobs.length} perPage={PER_PAGE}
          onPrev={() => setPage(p => Math.max(1, p - 1))}
          onNext={() => setPage(p => Math.min(totalPages, p + 1))}
        />
      </div>
    </DashboardLayout>
  );
};

export default JobManagement;