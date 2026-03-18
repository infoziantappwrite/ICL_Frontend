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
  ChevronRight,
  SlidersHorizontal
} from 'lucide-react';

// Attempt to gracefully import jobAPI, fallback to window.jobAPI
import { jobAPI as importedJobAPI } from '../api/Api';
const jobAPI = importedJobAPI || window.jobAPI;

// ─── Reusable Card Wrapper ───
const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 ${className}`}>
    {children}
  </div>
);

// ─── Filter Panel Content (shared by sidebar and drawer) ───
const FilterPanel = ({ filters, onFilterChange, onSearch, onClear }) => (
  <>
    <form onSubmit={onSearch} className="mb-5">
      <label className="block text-[11px] md:text-[12px] font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Search</label>
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
      <button type="submit" className="hidden">Search</button>
    </form>

    <div className="space-y-4">
      <div>
        <label className="block text-[11px] md:text-[12px] font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Job Type</label>
        <select
          value={filters.jobType}
          onChange={(e) => onFilterChange('jobType', e.target.value)}
          className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
        >
          <option value="">All Job Types</option>
          <option value="Full-Time">Full-Time</option>
          <option value="Internship">Internship</option>
          <option value="Internship + FTE">Internship + FTE</option>
        </select>
      </div>

      <div>
        <label className="block text-[11px] md:text-[12px] font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Role</label>
        <select
          value={filters.jobRole}
          onChange={(e) => onFilterChange('jobRole', e.target.value)}
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
        <label className="block text-[11px] md:text-[12px] font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Work Mode</label>
        <select
          value={filters.workMode}
          onChange={(e) => onFilterChange('workMode', e.target.value)}
          className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
        >
          <option value="">All Modes</option>
          <option value="On-site">On-site</option>
          <option value="Remote">Remote</option>
          <option value="Hybrid">Hybrid</option>
        </select>
      </div>

      <div>
        <label className="block text-[11px] md:text-[12px] font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Min CTC (LPA)</label>
        <input
          type="number"
          placeholder="e.g. 5"
          value={filters.minCTC}
          onChange={(e) => onFilterChange('minCTC', e.target.value)}
          className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
        />
      </div>
    </div>

    {Object.values(filters).some(v => v && v !== 'Active') && (
      <button
        onClick={onClear}
        className="w-full mt-6 py-2 border border-gray-200 text-gray-600 text-[13px] font-bold rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
      >
        <X className="w-4 h-4" /> Clear filters
      </button>
    )}
  </>
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

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    jobType: searchParams.get('jobType') || '',
    jobRole: searchParams.get('jobRole') || '',
    workMode: searchParams.get('workMode') || '',
    minCTC: searchParams.get('minCTC') || '',
    status: 'Active'
  });

  // Mobile filter drawer
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  const activeFilterCount = Object.entries(filters).filter(([k, v]) => v && v !== 'Active').length;

  useEffect(() => {
    fetchJobs();
  }, [filters, pagination.currentPage]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        ...filters,
        page: pagination.currentPage,
        limit: 12,
        sortBy: '-isPinned,-createdAt'
      };
      Object.keys(params).forEach(key => { if (!params[key]) delete params[key]; });
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
    setShowFilterDrawer(false);
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
    setPagination({ ...pagination, currentPage: 1 });
    const newParams = new URLSearchParams(searchParams);
    if (value) { newParams.set(key, value); } else { newParams.delete(key); }
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setFilters({ search: '', jobType: '', jobRole: '', workMode: '', minCTC: '', status: 'Active' });
    setSearchParams({});
    setPagination({ ...pagination, currentPage: 1 });
  };

  return (
    <StudentLayout>
      <div className="min-h-screen bg-[#f8f9fa] px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-6">
        <div className="max-w-[1240px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">

          {/* ─── LEFT SIDEBAR: FILTERS (desktop only, col-span-3) ─── */}
          <div className="hidden md:block md:col-span-3 md:sticky md:top-[100px] self-start">
            <Card className="p-4 md:p-5">
              <h3 className="font-bold text-gray-900 text-[15px] mb-4 flex items-center gap-2">
                <Filter className="w-4 h-4 text-blue-600" /> All Filters
              </h3>
              <FilterPanel
                filters={filters}
                onFilterChange={handleFilterChange}
                onSearch={handleSearch}
                onClear={clearFilters}
              />
            </Card>
          </div>

          {/* ─── MAIN FEED (col-span-9) ─── */}
          <div className="col-span-1 md:col-span-9 space-y-3 sm:space-y-4 md:space-y-5">

            {/* Header & Stats */}
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-[18px] sm:text-[22px] md:text-[26px] font-bold text-gray-900 leading-tight">
                  Jobs from your College
                </h1>
                <p className="text-[12px] md:text-[14px] text-gray-500 mt-0.5">
                  {pagination.total} {pagination.total === 1 ? 'opportunity' : 'opportunities'} available
                </p>
              </div>

              {/* Mobile filter icon button */}
              <button
                onClick={() => setShowFilterDrawer(true)}
                className="md:hidden flex-shrink-0 relative flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl text-gray-700 text-[13px] font-semibold shadow-sm hover:border-blue-300 transition-colors"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>Filter</span>
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>

            {/* Error State */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 md:p-4 flex items-center gap-3">
                <X className="w-4 h-4 text-red-600 flex-shrink-0" />
                <p className="text-red-800 text-[13px] md:text-[14px]">{error}</p>
              </div>
            )}

            {/* Jobs Grid or Loading State */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-5">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="h-[180px] md:h-[220px] bg-white rounded-2xl border border-gray-100 p-3 md:p-5 animate-pulse">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-lg flex-shrink-0" />
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                        <div className="h-3 bg-gray-100 rounded w-1/2" />
                      </div>
                    </div>
                    <div className="flex gap-2 mb-3">
                      <div className="h-5 w-16 bg-gray-100 rounded" />
                      <div className="h-5 w-20 bg-gray-100 rounded" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-50 rounded w-full" />
                      <div className="h-3 bg-gray-50 rounded w-5/6" />
                    </div>
                  </div>
                ))}
              </div>
            ) : jobs.length === 0 && !error ? (
              <Card className="text-center py-12 md:py-16 p-4">
                <Briefcase className="w-10 h-10 md:w-12 md:h-12 text-gray-300 mx-auto mb-3 md:mb-4" />
                <h3 className="text-[16px] md:text-[18px] font-bold text-gray-900 mb-2">No matching jobs found</h3>
                <p className="text-[13px] md:text-[14px] text-gray-500">Try adjusting your filters or search terms.</p>
                <button
                  onClick={clearFilters}
                  className="mt-4 md:mt-6 px-5 py-2 bg-blue-50 text-blue-600 text-[13px] font-bold rounded-full hover:bg-blue-100 transition-colors"
                >
                  Reset parameters
                </button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-5">
                {jobs.map((job) => (
                  <JobCard
                    key={job._id || job.id}
                    job={job}
                    onClick={() => navigate(`/dashboard/student/jobs/${job._id || job.id}`)}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {!loading && pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 md:gap-3 pt-3 pb-6 md:pb-10 border-t border-gray-200">
                <button
                  onClick={() => setPagination({ ...pagination, currentPage: pagination.currentPage - 1 })}
                  disabled={pagination.currentPage === 1}
                  className={`px-3 md:px-4 py-2 text-[12px] md:text-[13px] font-bold rounded-lg transition-colors border ${pagination.currentPage === 1
                    ? 'border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50'
                    : 'border-blue-200 text-blue-600 hover:bg-blue-50 bg-white shadow-sm'
                    }`}
                >
                  Previous
                </button>
                <div className="text-[12px] md:text-[13px] font-medium text-gray-600 mx-1">
                  {pagination.currentPage} / {pagination.totalPages}
                </div>
                <button
                  onClick={() => setPagination({ ...pagination, currentPage: pagination.currentPage + 1 })}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className={`px-3 md:px-4 py-2 text-[12px] md:text-[13px] font-bold rounded-lg transition-colors border ${pagination.currentPage === pagination.totalPages
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

      {/* ════ MOBILE FILTER DRAWER ════ */}
      {showFilterDrawer && (
        <div className="fixed inset-0 z-[100] flex md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowFilterDrawer(false)}
          />
          {/* Slide-in panel */}
          <div className="absolute right-0 top-0 bottom-0 w-[85vw] max-w-[340px] bg-white flex flex-col shadow-2xl filter-drawer-enter">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-blue-600" />
                <h2 className="text-[16px] font-bold text-gray-900">Filters</h2>
                {activeFilterCount > 0 && (
                  <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{activeFilterCount}</span>
                )}
              </div>
              <button
                onClick={() => setShowFilterDrawer(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter content */}
            <div className="flex-1 overflow-y-auto p-4">
              <FilterPanel
                filters={filters}
                onFilterChange={handleFilterChange}
                onSearch={handleSearch}
                onClear={clearFilters}
              />
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100">
              <button
                onClick={() => setShowFilterDrawer(false)}
                className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl text-[14px] hover:bg-blue-700 transition-colors"
              >
                Show Results
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .filter-drawer-enter {
          animation: slideInRight 0.28s cubic-bezier(0.16,1,0.3,1) forwards;
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
      `}</style>
    </StudentLayout>
  );
};

// ─── Job Card ───
const JobCard = ({ job, onClick }) => {
  const isPinned = job.isPinned;
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl p-3 md:p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 hover:shadow-md transition-shadow cursor-pointer flex flex-col h-full ${isPinned ? 'border-t-4 border-t-yellow-400 pt-3 md:pt-4' : ''}`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-2 md:gap-3 min-w-0">
          <div className="w-9 h-9 md:w-12 md:h-12 border border-gray-100 rounded-lg flex items-center justify-center bg-gray-50 flex-shrink-0 overflow-hidden">
            {job.company?.logo || job.companyId?.logo ? (
              <img src={job.company?.logo || job.companyId?.logo} alt="Company Logo" className="w-full h-full object-cover" />
            ) : (
              <span className="font-bold text-gray-500 text-sm md:text-lg">
                {(job.company?.name || job.companyName || job.companyId?.name || 'C')[0]}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-[13px] md:text-[16px] text-gray-900 leading-tight hover:text-blue-600 transition-colors line-clamp-2">
              {job.title || job.jobTitle}
            </h3>
            <p className="text-[11px] md:text-[13px] text-gray-600 mt-0.5 flex items-center gap-1 line-clamp-1">
              {(job.company && job.company.name) || job.companyName || job.companyId?.name || 'Partner Company'}
              <Star className="w-3 h-3 text-amber-400 fill-amber-400 flex-shrink-0" />
              <span className="font-medium">4.2</span>
            </p>
          </div>
        </div>
        {isPinned && (
          <div className="bg-yellow-50 flex-shrink-0 text-yellow-700 w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center">
            <TrendingUp className="w-3.5 h-3.5 md:w-4 md:h-4" />
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5 mb-3">
        <span className="px-2 py-0.5 rounded text-[10px] md:text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
          {job.jobType}
        </span>
        <span className="px-2 py-0.5 rounded text-[10px] md:text-[11px] font-bold bg-gray-50 text-gray-600 border border-gray-200">
          {job.jobRole}
        </span>
      </div>

      <div className="space-y-1.5 mb-3 mt-auto">
        <div className="flex items-center gap-1.5 text-[11px] md:text-[13px] text-gray-500 font-medium">
          <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          <span className="line-clamp-1">
            {job.locations && job.locations.length > 0
              ? job.locations.map(l => l.city).filter(Boolean).join(', ')
              : job.jobLocation || 'Remote'}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] md:text-[13px] text-gray-500 font-medium">
          <DollarSign className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          <span>
            {job.package?.ctc ? `₹${job.package.ctc.min}${job.package.ctc.max ? ' - ' + job.package.ctc.max : ''} LPA` : 'Competitive CTC'}
          </span>
        </div>
      </div>

      <div className="pt-2.5 md:pt-4 border-t border-gray-100 flex items-center justify-between">
        <div className={`flex items-center gap-1 text-[11px] md:text-[12px] font-bold ${getDeadlineColor(job.dates?.applicationDeadline || job.deadline)}`}>
          <Clock className="w-3 h-3 md:w-3.5 md:h-3.5" />
          {formatDeadline(job.dates?.applicationDeadline || job.deadline)}
        </div>
        <div className="text-[11px] md:text-[12px] font-medium text-gray-400">
          {job.stats?.totalApplications || 0} applied
        </div>
      </div>
    </div>
  );
};

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