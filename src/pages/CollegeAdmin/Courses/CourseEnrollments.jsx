// pages/CollegeAdmin/Courses/CourseEnrollments.jsx
// Admin: View all students enrolled in a specific course with progress details
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Users, ChevronLeft, Search, RefreshCw, AlertCircle, CheckCircle2,
  Award, Clock, BarChart3, BookOpen, X, Filter, Download
} from 'lucide-react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { collegeAdminCourseAPI as courseAPI } from '../../../api/Api';

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  pending:   { label: 'Enrolled',    color: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-400' },
  active:    { label: 'In Progress', color: 'bg-blue-100 text-blue-700 border-blue-200',    dot: 'bg-blue-500'  },
  completed: { label: 'Completed',   color: 'bg-green-100 text-green-700 border-green-200', dot: 'bg-green-500' },
  dropped:   { label: 'Dropped',     color: 'bg-gray-100 text-gray-600 border-gray-200',    dot: 'bg-gray-400'  },
};

// ─── Main Component ───────────────────────────────────────────────────────────
const CourseEnrollments = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState([]);
  const [courseTitle, setCourseTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchData();
    fetchCourse();
  }, [courseId]);

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const fetchCourse = async () => {
    try {
      const res = await courseAPI.getCourseById(courseId);
      if (res.success) setCourseTitle(res.data.title);
    } catch {}
  };

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const params = { limit: 100 };
      if (statusFilter) params.status = statusFilter;
      const res = await courseAPI.getCourseEnrollments(courseId, params);
      if (res.success) {
        setEnrollments(res.data || []);
        setTotal(res.total || res.data?.length || 0);
      } else {
        setError(res.message || 'Failed to load enrollments');
      }
    } catch (err) {
      setError(err.message || 'Failed to load enrollments');
    } finally {
      setLoading(false);
    }
  };

  const filtered = enrollments.filter(e => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      e.userId?.fullName?.toLowerCase().includes(q) || e.userId?.name?.toLowerCase().includes(q) ||
      e.userId?.email?.toLowerCase().includes(q) ||
      e.userId?.studentInfo?.rollNumber?.toLowerCase().includes(q)
    );
  });

  // Aggregate stats
  const stats = {
    total: enrollments.length,
    completed: enrollments.filter(e => e.status === 'completed').length,
    active: enrollments.filter(e => e.status === 'active').length,
    certs: enrollments.filter(e => e.certificateIssued).length,
    avgProgress: enrollments.length
      ? Math.round(enrollments.reduce((s, e) => s + (e.overallProgress || 0), 0) / enrollments.length)
      : 0,
  };

  if (loading && enrollments.length === 0) {
    return <LoadingSpinner message="Loading Enrollments..." submessage="Fetching student data" icon={Users} />;
  }

  return (
    <DashboardLayout title="Course Enrollments">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/dashboard/college-admin/courses')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 mb-4 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Courses
        </button>

        <div className="relative bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 rounded-3xl p-8 shadow-2xl shadow-blue-500/30 overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute w-64 h-64 bg-white rounded-full -top-20 -right-20" />
          </div>
          <div className="relative text-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 bg-white/20 rounded-2xl flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">Enrolled Students</h1>
                {courseTitle && <p className="text-blue-100 text-sm">{courseTitle}</p>}
              </div>
            </div>
            {/* Stats */}
            <div className="flex flex-wrap gap-4 text-sm text-blue-100">
              <span className="flex items-center gap-1.5"><Users className="w-4 h-4" /> {stats.total} Total</span>
              <span className="flex items-center gap-1.5"><BarChart3 className="w-4 h-4" /> {stats.active} Active</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> {stats.completed} Completed</span>
              <span className="flex items-center gap-1.5"><Award className="w-4 h-4" /> {stats.certs} Certified</span>
              <span className="flex items-center gap-1.5"><BarChart3 className="w-4 h-4" /> {stats.avgProgress}% Avg Progress</span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Enrolled', value: stats.total,       color: 'from-blue-500 to-blue-600',     icon: Users       },
          { label: 'Completed',      value: stats.completed,   color: 'from-green-500 to-emerald-500', icon: CheckCircle2 },
          { label: 'Avg Progress',   value: `${stats.avgProgress}%`, color: 'from-purple-500 to-purple-600', icon: BarChart3 },
          { label: 'Certificates',   value: stats.certs,       color: 'from-amber-400 to-orange-500',  icon: Award       },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3`}>
              <s.icon className="w-4 h-4 text-white" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, roll number..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 text-sm"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 text-sm text-gray-700"
          >
            <option value="">All Statuses</option>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <button onClick={fetchData} className="p-2.5 border border-gray-200 rounded-xl hover:border-blue-300 text-gray-500 hover:text-blue-600 transition-colors">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-5 bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
          <p className="font-semibold text-gray-800">{filtered.length} Students</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-14">
            <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No students found</p>
            <p className="text-sm text-gray-400 mt-1">No enrollments match your search</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Student</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Progress</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Modules</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Enrolled</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Certificate</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Assigned By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(e => {
                  const statusCfg = STATUS_CONFIG[e.status] || STATUS_CONFIG.pending;
                  const completedMods = e.moduleProgress?.filter(m => m.completed).length || 0;
                  const totalMods = e.moduleProgress?.length || 0;
                  return (
                    <tr key={e._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4">
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{e.userId?.fullName || e.userId?.name || e.userId?.email || '—'}</p>
                          <p className="text-xs text-gray-400">{e.userId?.email || ''}</p>
                          {e.userId?.studentInfo?.rollNumber && (
                            <p className="text-xs text-blue-500">{e.userId.studentInfo.rollNumber}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`flex items-center gap-1.5 w-fit text-xs font-semibold px-2.5 py-1 rounded-full border ${statusCfg.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                              style={{ width: `${e.overallProgress || 0}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-gray-700">{e.overallProgress || 0}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">{completedMods}/{totalMods}</td>
                      <td className="px-4 py-4 text-xs text-gray-500">
                        {e.enrolledAt ? new Date(e.enrolledAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-4">
                        {e.certificateIssued ? (
                          <span className="flex items-center gap-1 text-xs text-purple-700 font-medium">
                            <Award className="w-3.5 h-3.5" /> Issued
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-xs text-gray-500">
                        {e.assignedBy?.fullName || e.assignedBy?.name || 'Self-enrolled'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CourseEnrollments;