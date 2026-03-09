// src/pages/JobList.jsx - Student view of all available jobs
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import StudentLayout from '../components/layout/StudentLayout';
import {
  Briefcase,
  MapPin,
  Calendar,
  DollarSign,
  Search,
  Filter,
  TrendingUp,
  Clock,
  Building2,
  X,
  Star,
  ChevronRight
} from 'lucide-react';

// Attempt to gracefully import jobAPI, fallback to window.jobAPI
import { jobAPI as importedJobAPI } from '../api/Api';
const jobAPI = importedJobAPI || window.jobAPI;

// ─── Reusable Naukri-Style Card Wrapper ───
const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 ${className}`}>
    {children}
  </div>
);

const JobList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0
  });

  // Filter states
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    jobType: searchParams.get('jobType') || '',
    jobRole: searchParams.get('jobRole') || '',
    workMode: searchParams.get('workMode') || '',
    minCTC: searchParams.get('minCTC') || '',
    status: 'Active'
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, [filters, pagination.currentPage]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query params
      const params = {
        ...filters,
        page: pagination.currentPage,
        limit: 12,
        sortBy: '-isPinned,-createdAt'
      };

      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (!params[key]) delete params[key];
      });

      if (!jobAPI) throw new Error("jobAPI is not defined");
      const response = await jobAPI.getAllJobs(params);

      if (response && response.success) {
        setJobs(response.jobs || []);
        setPagination({
          currentPage: response.currentPage || 1,
          totalPages: response.totalPages || 1,
          total: response.total || 0
        });
      } else {
        // Fallback for different response formats
        setJobs(response?.data || response || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setFilters({ ...filters, search: e.target.search.value });
    setPagination({ ...pagination, currentPage: 1 });
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
    setPagination({ ...pagination, currentPage: 1 });

    // Update URL params
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      jobType: '',
      jobRole: '',
      workMode: '',
      minCTC: '',
      status: 'Active'
    });
    setSearchParams({});
    setPagination({ ...pagination, currentPage: 1 });
  };

  return (
    <StudentLayout>
      <div className="min-h-screen bg-[#f8f9fa] -mx-4 lg:-mx-6 -mt-4 lg:-mt-6 px-4 md:px-6 lg:px-8 py-6">
        <div className="max-w-[1240px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-6">

          {/* ─────── LEFT SIDEBAR: FILTERS (col-span-3) ─────── */}
          <div className="md:col-span-3 md:sticky md:top-[100px] self-start space-y-5">
            {/* Mobile Filter Toggle */}
            <div className="md:hidden">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 font-bold shadow-sm"
              >
                <Filter className="w-5 h-5" />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </button>
            </div>

            <div className={`space-y-5 ${showFilters ? 'block' : 'hidden md:block'}`}>
              <Card className="p-5">
                <h3 className="font-bold text-gray-900 text-[16px] mb-4 flex items-center gap-2">
                  <Filter className="w-5 h-5 text-blue-600" /> All Filters
                </h3>

                <form onSubmit={handleSearch} className="mb-5">
                  <label className="block text-[12px] font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      name="search"
                      placeholder="Title, company, skills..."
                      defaultValue={filters.search}
                      className="w-full pl-9 pr-3 py-2 text-[13px] border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                  {/* Hidden submit so Enter key works */}
                  <button type="submit" className="hidden">Search</button>
                </form>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[12px] font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Job Type</label>
                    <select
                      value={filters.jobType}
                      onChange={(e) => handleFilterChange('jobType', e.target.value)}
                      className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
                    >
                      <option value="">All Job Types</option>
                      <option value="Full-Time">Full-Time</option>
                      <option value="Internship">Internship</option>
                      <option value="Internship + FTE">Internship + FTE</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[12px] font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Role</label>
                    <select
                      value={filters.jobRole}
                      onChange={(e) => handleFilterChange('jobRole', e.target.value)}
                      className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
                    >
                      <option value="">All Roles</option>
                      <option value="Software Engineer">Software Engineer</option>
                      <option value="Data Analyst">Data Analyst</option>
                      <option value="Frontend Developer">Frontend Developer</option>
                      <option value="Backend Developer">Backend Developer</option>
                      <option value="Full Stack Developer">Full Stack Developer</option>
                      <option value="Product Manager">Product Manager</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[12px] font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Work Mode</label>
                    <select
                      value={filters.workMode}
                      onChange={(e) => handleFilterChange('workMode', e.target.value)}
                      className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
                    >
                      <option value="">All Modes</option>
                      <option value="On-site">On-site</option>
                      <option value="Remote">Remote</option>
                      <option value="Hybrid">Hybrid</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[12px] font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Min CTC (LPA)</label>
                    <input
                      type="number"
                      placeholder="e.g. 5"
                      value={filters.minCTC}
                      onChange={(e) => handleFilterChange('minCTC', e.target.value)}
                      className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>

                {Object.values(filters).some(v => v && v !== 'Active') && (
                  <button
                    onClick={clearFilters}
                    className="w-full mt-6 py-2 border border-gray-200 text-gray-600 text-[13px] font-bold rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <X className="w-4 h-4" /> Clear filters
                  </button>
                )}
              </Card>
            </div>
          </div>

          {/* ─────── RIGHT MAIN FEED (col-span-9) ─────── */}
          <div className="md:col-span-9 space-y-5 md:space-y-6">

            {/* Header & Stats */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h1 className="text-[24px] md:text-[28px] font-bold text-gray-900 leading-tight">
                  Jobs form your College
                </h1>
                <p className="text-[14px] text-gray-600 mt-1">
                  Discover and apply to top placement opportunities
                </p>
              </div>
              <div className="text-[13px] font-medium text-gray-500 bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-sm inline-flex w-fit">
                {pagination.total} {pagination.total === 1 ? 'opportunity' : 'opportunities'} matches your profile
              </div>
            </div>

            {/* Error State */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                <X className="w-5 h-5 text-red-600" />
                <p className="text-red-800 text-[14px]">{error}</p>
              </div>
            )}

            {/* Jobs Grid or Loading State */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="h-[220px] bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0" />
                      <div className="flex-1">
                        <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
                        <div className="h-4 bg-gray-100 rounded w-1/2" />
                      </div>
                    </div>
                    <div className="flex gap-2 mb-4">
                      <div className="h-5 w-20 bg-gray-100 rounded" />
                      <div className="h-5 w-24 bg-gray-100 rounded" />
                    </div>
                    <div className="space-y-2 mt-auto">
                      <div className="h-4 bg-gray-50 rounded w-full" />
                      <div className="h-4 bg-gray-50 rounded w-5/6" />
                    </div>
                  </div>
                ))}
              </div>
            ) : jobs.length === 0 && !error ? (
              <Card className="text-center py-16">
                <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-[18px] font-bold text-gray-900 mb-2">
                  No matching jobs found
                </h3>
                <p className="text-[14px] text-gray-500">
                  Try adjusting your filters or search terms.
                </p>
                <button
                  onClick={clearFilters}
                  className="mt-6 px-6 py-2 bg-blue-50 text-blue-600 text-[13px] font-bold rounded-full hover:bg-blue-100 transition-colors"
                >
                  Reset parameters
                </button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-5">
                {jobs.map((job) => (
                  <JobCard
                    key={job._id || job.id}
                    job={job}
                    onClick={() => navigate(`/dashboard/student/jobs/${job._id || job.id}`)}
                  />
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {!loading && pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-4 pb-10 border-t border-gray-200">
                <button
                  onClick={() => setPagination({ ...pagination, currentPage: pagination.currentPage - 1 })}
                  disabled={pagination.currentPage === 1}
                  className={`px-4 py-2 text-[13px] font-bold rounded-lg transition-colors border ${pagination.currentPage === 1
                    ? 'border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50'
                    : 'border-blue-200 text-blue-600 hover:bg-blue-50 bg-white shadow-sm'
                    }`}
                >
                  Previous
                </button>
                <div className="text-[13px] font-medium text-gray-600 mx-2">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </div>
                <button
                  onClick={() => setPagination({ ...pagination, currentPage: pagination.currentPage + 1 })}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className={`px-4 py-2 text-[13px] font-bold rounded-lg transition-colors border ${pagination.currentPage === pagination.totalPages
                    ? 'border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50'
                    : 'border-blue-200 text-blue-600 hover:bg-blue-50 bg-white shadow-sm'
                    }`}
                >
                  Next
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </StudentLayout>
  );
};

// ─── Reusable Job Card matching dashboard aesthetics ───
const JobCard = ({ job, onClick }) => {
  const isPinned = job.isPinned;

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 hover:shadow-md transition-shadow cursor-pointer flex flex-col h-full ${isPinned ? 'border-t-4 border-t-yellow-400 pt-4' : ''
        }`}
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 border border-gray-100 rounded-lg flex items-center justify-center bg-gray-50 flex-shrink-0 overflow-hidden">
            {job.company?.logo || job.companyId?.logo ? (
              <img src={job.company?.logo || job.companyId?.logo} alt="Company Logo" className="w-full h-full object-cover" />
            ) : (
              <span className="font-bold text-gray-500 text-lg">
                {(job.company?.name || job.companyName || job.companyId?.name || 'C')[0]}
              </span>
            )}
          </div>
          <div>
            <h3 className="font-bold text-[16px] text-gray-900 leading-tight hover:text-blue-600 transition-colors line-clamp-2">
              {job.title || job.jobTitle}
            </h3>
            <p className="text-[13px] text-gray-600 mt-1 flex items-center gap-1.5 line-clamp-1">
              {(job.company && job.company.name) || job.companyName || job.companyId?.name || job.companyId?.displayName || 'Partner Company'}
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span className="font-medium">4.2</span>
            </p>
          </div>
        </div>
        {isPinned && (
          <div className="bg-yellow-50 flex-shrink-0 text-yellow-700 w-8 h-8 rounded-full flex items-center justify-center" title="Featured Job">
            <TrendingUp className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-5">
        <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
          {job.jobType}
        </span>
        <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-gray-50 text-gray-600 border border-gray-200">
          {job.jobRole}
        </span>
      </div>

      <div className="space-y-2 mb-5 mt-auto">
        <div className="flex items-center gap-2 text-[13px] text-gray-500 font-medium">
          <MapPin className="w-4 h-4 text-gray-400" />
          <span className="line-clamp-1">
            {job.locations && job.locations.length > 0
              ? job.locations.map(l => l.city).filter(Boolean).join(', ')
              : job.jobLocation || 'Remote'}
          </span>
        </div>

        <div className="flex items-center gap-2 text-[13px] text-gray-500 font-medium">
          <DollarSign className="w-4 h-4 text-gray-400" />
          <span>
            {job.package?.ctc ? `₹${job.package.ctc.min}${job.package.ctc.max ? ' - ' + job.package.ctc.max : ''} LPA` : 'Competitive CTC'}
          </span>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
        <div className={`flex items-center gap-1.5 text-[12px] font-bold ${getDeadlineColor(job.dates?.applicationDeadline || job.deadline)}`}>
          <Clock className="w-3.5 h-3.5" />
          {formatDeadline(job.dates?.applicationDeadline || job.deadline)}
        </div>
        <div className="text-[12px] font-medium text-gray-400">
          {job.stats?.totalApplications || 0} applied
        </div>
      </div>
    </div>
  );
};

// Helper functions matching aesthetic rules
const formatDeadline = (deadline) => {
  if (!deadline) return 'Open';
  const date = new Date(deadline);
  const daysLeft = Math.ceil((date - new Date()) / (1000 * 60 * 60 * 24));

  if (daysLeft < 0) return 'Expired';
  if (daysLeft === 0) return 'Ends Today';
  if (daysLeft === 1) return '1 day left';
  return `${daysLeft} days left`;
};

const getDeadlineColor = (deadline) => {
  if (!deadline) return 'text-green-600';
  const date = new Date(deadline);
  const daysLeft = Math.ceil((date - new Date()) / (1000 * 60 * 60 * 24));

  if (daysLeft < 0) return 'text-red-500';
  if (daysLeft <= 3) return 'text-orange-500';
  if (daysLeft <= 7) return 'text-amber-500';
  return 'text-green-600';
};

export default JobList;