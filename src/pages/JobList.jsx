// src/pages/JobList.jsx - Student view of all available jobs
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/layout/DashboardLayout';
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
  X
} from 'lucide-react';

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

      const response = await window.jobAPI.getAllJobs(params);

      if (response.success) {
        setJobs(response.jobs);
        setPagination({
          currentPage: response.currentPage,
          totalPages: response.totalPages,
          total: response.total
        });
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
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Job Opportunities
          </h1>
          <p className="text-gray-600">
            Discover and apply to campus placement opportunities
          </p>
        </div>

        {/* Search and Filters Bar */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <form onSubmit={handleSearch} className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                name="search"
                placeholder="Search by job title, company, or skills..."
                defaultValue={filters.search}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <Filter className="w-5 h-5" />
              Filters
            </button>
          </form>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <select
                  value={filters.jobType}
                  onChange={(e) => handleFilterChange('jobType', e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Job Types</option>
                  <option value="Full-Time">Full-Time</option>
                  <option value="Internship">Internship</option>
                  <option value="Internship + FTE">Internship + FTE</option>
                </select>

                <select
                  value={filters.jobRole}
                  onChange={(e) => handleFilterChange('jobRole', e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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

                <select
                  value={filters.workMode}
                  onChange={(e) => handleFilterChange('workMode', e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Work Modes</option>
                  <option value="On-site">On-site</option>
                  <option value="Remote">Remote</option>
                  <option value="Hybrid">Hybrid</option>
                </select>

                <input
                  type="number"
                  placeholder="Min CTC (LPA)"
                  value={filters.minCTC}
                  onChange={(e) => handleFilterChange('minCTC', e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {Object.values(filters).some(v => v && v !== 'Active') && (
                <button
                  onClick={clearFilters}
                  className="mt-4 text-blue-600 hover:text-blue-700 flex items-center gap-2 text-sm font-medium"
                >
                  <X className="w-4 h-4" />
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-600">
            {pagination.total} {pagination.total === 1 ? 'opportunity' : 'opportunities'} found
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Jobs Grid */}
        {!loading && !error && (
          <>
            {jobs.length === 0 ? (
              <div className="text-center py-20">
                <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No jobs found
                </h3>
                <p className="text-gray-600">
                  Try adjusting your filters or check back later
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {jobs.map((job) => (
                  <JobCard
                    key={job._id}
                    job={job}
                    onClick={() => navigate(`/dashboard/student/jobs/${job._id}`)}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-8 flex justify-center gap-2">
                <button
                  onClick={() => setPagination({ ...pagination, currentPage: pagination.currentPage - 1 })}
                  disabled={pagination.currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-4 py-2">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPagination({ ...pagination, currentPage: pagination.currentPage + 1 })}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

// Job Card Component
const JobCard = ({ job, onClick }) => {
  const deadline = new Date(job.dates.applicationDeadline);
  const isPinned = job.isPinned;

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border-2 ${
        isPinned ? 'border-yellow-400' : 'border-transparent'
      }`}
    >
      {isPinned && (
        <div className="bg-yellow-400 text-yellow-900 px-4 py-1 text-sm font-medium flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Featured
        </div>
      )}

      <div className="p-6">
        {/* Company Logo and Name */}
        <div className="flex items-start gap-4 mb-4">
          {job.companyId?.logo ? (
            <img
              src={job.companyId.logo}
              alt={job.companyId.name}
              className="w-12 h-12 rounded-lg object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl">
              {job.companyId?.name?.charAt(0) || 'C'}
            </div>
          )}
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-gray-900 line-clamp-1">
              {job.jobTitle}
            </h3>
            <p className="text-sm text-gray-600 line-clamp-1">
              {job.companyId?.displayName || job.companyId?.name}
            </p>
          </div>
        </div>

        {/* Job Type Badge */}
        <div className="flex items-center gap-2 mb-4">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            job.jobType === 'Full-Time' ? 'bg-green-100 text-green-700' :
            job.jobType === 'Internship' ? 'bg-blue-100 text-blue-700' :
            'bg-purple-100 text-purple-700'
          }`}>
            {job.jobType}
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            {job.jobRole}
          </span>
        </div>

        {/* Key Info */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <DollarSign className="w-4 h-4" />
            <span className="font-medium">
              ₹{job.package.ctc.min}{job.package.ctc.max ? ` - ${job.package.ctc.max}` : ''} LPA
            </span>
          </div>

          {job.locations && job.locations.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4" />
              <span className="line-clamp-1">
                {job.locations.map(l => l.city).filter(Boolean).join(', ') || 'Multiple locations'}
              </span>
            </div>
          )}

          {job.locations && job.locations.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Building2 className="w-4 h-4" />
              <span>{job.locations[0].workMode}</span>
            </div>
          )}
        </div>

        {/* Deadline */}
        <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${getDeadlineColor(job.dates.applicationDeadline)}`}>
          <Clock className="w-4 h-4" />
          <span className="font-medium">
            {formatDeadline(job.dates.applicationDeadline)}
          </span>
        </div>

        {/* Stats */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span>{job.stats.totalViews} views</span>
          <span>{job.stats.totalApplications} applicants</span>
        </div>
      </div>
    </div>
  );
};

// Helper function for formatting deadline
const formatDeadline = (deadline) => {
  const date = new Date(deadline);
  const now = new Date();
  const daysLeft = Math.ceil((date - now) / (1000 * 60 * 60 * 24));

  if (daysLeft < 0) return 'Expired';
  if (daysLeft === 0) return 'Today';
  if (daysLeft === 1) return '1 day left';
  return `${daysLeft} days left`;
};

const getDeadlineColor = (deadline) => {
  const date = new Date(deadline);
  const now = new Date();
  const daysLeft = Math.ceil((date - now) / (1000 * 60 * 60 * 24));

  if (daysLeft < 0) return 'text-red-600 bg-red-50';
  if (daysLeft <= 3) return 'text-orange-600 bg-orange-50';
  if (daysLeft <= 7) return 'text-yellow-600 bg-yellow-50';
  return 'text-green-600 bg-green-50';
};

export default JobList;