// pages/CollegeAdmin/Courses/AdminCourseManagement.jsx
// College Admin: VIEW ONLY — no create, edit, or delete rights
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, Search, BarChart3, Users, RefreshCw,
  AlertCircle, CheckCircle2, Clock, Award, X,
  Star, ChevronLeft, ChevronRight, Send,
} from 'lucide-react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { collegeAdminCourseAPI as courseAPI } from '../../../api/Api';

const CATEGORIES = [
  '', 'Full Stack Development', 'Data Science', 'AI/ML', 'DevOps',
  'Cloud Computing', 'Mobile Development', 'Cybersecurity', 'Blockchain', 'Other'
];

const STATUS_CONFIG = {
  Active:        { label: 'Active',       color: 'bg-green-100 text-green-700 border-green-200' },
  Inactive:      { label: 'Inactive',     color: 'bg-gray-100 text-gray-600 border-gray-200'   },
  Draft:         { label: 'Draft',        color: 'bg-amber-100 text-amber-700 border-amber-200' },
  'Coming Soon': { label: 'Coming Soon',  color: 'bg-blue-100 text-blue-700 border-blue-200'    },
};

const LEVEL_COLOR = {
  Beginner:     'bg-green-50 text-green-700',
  Intermediate: 'bg-blue-50 text-blue-700',
  Advanced:     'bg-purple-50 text-purple-700',
};

const PER_PAGE = 10;

const Pagination = ({ page, totalPages, onPrev, onNext, total, perPage }) => {
  if (totalPages <= 1) return null;
  const from = (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);
  return (
    <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 bg-gray-50/50">
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

const CourseRow = ({ course, onAnalytics, onViewEnrollments }) => {
  const statusCfg = STATUS_CONFIG[course.status] || STATUS_CONFIG.Inactive;
  const levelColor = LEVEL_COLOR[course.level] || '';
  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 text-sm truncate max-w-[200px]">{course.title}</p>
            <p className="text-xs text-gray-400">{course.category}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-4">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${levelColor}`}>{course.level}</span>
      </td>
      <td className="px-4 py-4">
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${statusCfg.color}`}>{statusCfg.label}</span>
      </td>
      <td className="px-4 py-4 text-sm text-gray-600">{course.enrollmentCount || 0}</td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-1 text-sm text-gray-600">
          <Clock className="w-3.5 h-3.5 text-gray-400" />
          {course.duration?.hours}h
        </div>
      </td>
      <td className="px-4 py-4">
        {course.rating?.count > 0 ? (
          <span className="flex items-center gap-1 text-sm text-gray-600">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            {course.rating.average?.toFixed(1)}
          </span>
        ) : <span className="text-xs text-gray-400">No ratings</span>}
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-1.5">
          <button onClick={() => onViewEnrollments(course._id)}
            className="p-1.5 text-gray-500 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors" title="Enrollments">
            <Users className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onAnalytics(course._id)}
            className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" title="Analytics">
            <BarChart3 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
};

const AdminCourseManagement = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { limit: 200 };
      if (categoryFilter) params.category = categoryFilter;
      if (statusFilter) params.status = statusFilter;
      const res = await courseAPI.getAllCourses(params);
      if (res.success) {
        const sorted = (res.data || []).sort(
          (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        );
        setCourses(sorted);
        setPage(1);
      } else {
        setError(res.message || 'Failed to load courses');
      }
    } catch (err) {
      setError(err.message || 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, statusFilter]);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);
  useEffect(() => { setPage(1); }, [search]);

  const filtered = courses.filter(c => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.title?.toLowerCase().includes(q) ||
      c.category?.toLowerCase().includes(q) ||
      c.instructor?.name?.toLowerCase().includes(q) ||
      c.tags?.some(t => t.toLowerCase().includes(q))
    );
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const stats = {
    total: courses.length,
    active: courses.filter(c => c.status === 'Active').length,
    totalEnrollments: courses.reduce((s, c) => s + (c.enrollmentCount || 0), 0),
    withCerts: courses.filter(c => c.certificateProvided).length,
  };

  if (loading && courses.length === 0) {
    return <LoadingSpinner message="Loading Courses..." submessage="Fetching all course data" icon={BookOpen} />;
  }

  return (
    <DashboardLayout title="Course Management">
      {/* Header Banner */}
      <div className="mb-6">
        <div className="relative bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 rounded-2xl p-6 shadow-xl overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute w-64 h-64 bg-white rounded-full -top-20 -right-20" />
            <div className="absolute w-48 h-48 bg-white rounded-full bottom-0 left-20" />
          </div>
          <div className="relative text-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Course Management</h1>
                <p className="text-blue-100 text-sm">View and track course performance</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-blue-100">
              <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4" /> {stats.total} Total</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> {stats.active} Active</span>
              <span className="flex items-center gap-1.5"><Users className="w-4 h-4" /> {stats.totalEnrollments} Enrollments</span>
              <span className="flex items-center gap-1.5"><Award className="w-4 h-4" /> {stats.withCerts} with Certificates</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-sm p-4 mb-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Search by title, category, instructor, tags..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-sm" />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 text-sm text-gray-700">
            <option value="">All Categories</option>
            {CATEGORIES.filter(Boolean).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 text-sm text-gray-700">
            <option value="">All Statuses</option>
            {Object.keys(STATUS_CONFIG).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button onClick={fetchCourses}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl hover:opacity-90 transition-all shadow-sm">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Table */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
          <p className="font-semibold text-gray-800">{filtered.length} Courses</p>
          <button onClick={() => navigate('/dashboard/college-admin/courses/assign-batch')}
            className="flex items-center gap-1.5 text-sm text-blue-600 font-medium hover:text-blue-700 transition-colors">
            <Send className="w-4 h-4" /> Assign to Batch
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
          </div>
        ) : paginated.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No courses found</p>
            <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-50">
                    {['Course','Level','Status','Enrolled','Duration','Rating','Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide bg-gradient-to-r from-blue-50 to-cyan-50 first:px-5">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginated.map(course => (
                    <CourseRow key={course._id} course={course}
                      onAnalytics={id => navigate(`/dashboard/college-admin/courses/${id}/analytics`)}
                      onViewEnrollments={id => navigate(`/dashboard/college-admin/courses/${id}/enrollments`)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={totalPages} total={filtered.length} perPage={PER_PAGE}
              onPrev={() => setPage(p => Math.max(1, p - 1))}
              onNext={() => setPage(p => Math.min(totalPages, p + 1))}
            />
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminCourseManagement;