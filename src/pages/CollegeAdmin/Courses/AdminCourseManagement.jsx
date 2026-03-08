// pages/CollegeAdmin/Courses/AdminCourseManagement.jsx
// College Admin / Super Admin: Manage courses — create, edit, delete, assign, analytics
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, Plus, Search, Edit, Trash2, BarChart3, Users, RefreshCw,
  AlertCircle, CheckCircle2, Clock, Award, Globe, X, Filter, Eye,
  ToggleLeft, ToggleRight, Send, Star
} from 'lucide-react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { collegeAdminCourseAPI as courseAPI } from '../../../api/Api';
import { useAuth } from '../../../context/AuthContext';

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORIES = [
  '', 'Full Stack Development', 'Data Science', 'AI/ML', 'DevOps',
  'Cloud Computing', 'Mobile Development', 'Cybersecurity', 'Blockchain', 'Other'
];

const STATUS_CONFIG = {
  Active:       { label: 'Active',       color: 'bg-green-100 text-green-700 border-green-200' },
  Inactive:     { label: 'Inactive',     color: 'bg-gray-100 text-gray-600 border-gray-200'   },
  Draft:        { label: 'Draft',        color: 'bg-amber-100 text-amber-700 border-amber-200' },
  'Coming Soon':{ label: 'Coming Soon',  color: 'bg-blue-100 text-blue-700 border-blue-200'    },
};

const LEVEL_COLOR = {
  Beginner:     'bg-green-50 text-green-700',
  Intermediate: 'bg-blue-50 text-blue-700',
  Advanced:     'bg-purple-50 text-purple-700',
};

// ─── Sub-components ───────────────────────────────────────────────────────────
const Toast = ({ toast }) => {
  if (!toast) return null;
  return (
    <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-medium ${
      toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
    }`}>
      {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
      {toast.msg}
    </div>
  );
};

const DeleteModal = ({ course, onConfirm, onCancel, loading }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
    <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full">
      <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mb-4">
        <Trash2 className="w-6 h-6 text-red-600" />
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Course?</h3>
      <p className="text-sm text-gray-600 mb-6">
        Are you sure you want to delete <strong>{course.title}</strong>? This will soft-delete the course and hide it from students.
      </p>
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-700 text-sm font-medium hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-60"
        >
          {loading ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </div>
  </div>
);

const CourseRow = ({ course, onEdit, onDelete, onAnalytics, onViewEnrollments }) => {
  const statusCfg = STATUS_CONFIG[course.status] || STATUS_CONFIG.Inactive;
  const levelColor = LEVEL_COLOR[course.level] || '';

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-5 h-5 text-white" />
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
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${statusCfg.color}`}>
          {statusCfg.label}
        </span>
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
          <button onClick={() => onEdit(course._id)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
            <Edit className="w-4 h-4" />
          </button>
          <button onClick={() => onViewEnrollments(course._id)} className="p-1.5 text-gray-500 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors" title="Enrollments">
            <Users className="w-4 h-4" />
          </button>
          <button onClick={() => onAnalytics(course._id)} className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" title="Analytics">
            <BarChart3 className="w-4 h-4" />
          </button>
          <button onClick={() => onDelete(course)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const AdminCourseManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState(null);
  const [total, setTotal] = useState(0);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { limit: 50 };
      if (categoryFilter) params.category = categoryFilter;
      if (statusFilter) params.status = statusFilter;
      const res = await courseAPI.getAllCourses(params);
      if (res.success) {
        let list = res.data || [];
        if (search.trim()) {
          const q = search.toLowerCase();
          list = list.filter(c =>
            c.title?.toLowerCase().includes(q) ||
            c.category?.toLowerCase().includes(q) ||
            c.instructor?.name?.toLowerCase().includes(q) ||
            c.tags?.some(t => t.toLowerCase().includes(q))
          );
        }
        setCourses(list);
        setTotal(res.total || list.length);
      } else {
        setError(res.message || 'Failed to load courses');
      }
    } catch (err) {
      setError(err.message || 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, statusFilter]);

  useEffect(() => {
    const t = setTimeout(fetchCourses, search ? 400 : 0);
    return () => clearTimeout(t);
  }, [fetchCourses]);

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      const res = await courseAPI.deleteCourse(deleteConfirm._id);
      if (res.success) {
        showToast('Course deleted successfully');
        setCourses(prev => prev.filter(c => c._id !== deleteConfirm._id));
        setDeleteConfirm(null);
      } else {
        showToast(res.message || 'Delete failed', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Delete failed', 'error');
    } finally {
      setDeleting(false);
    }
  };

  // Summary stats
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
      <Toast toast={toast} />
      {deleteConfirm && (
        <DeleteModal
          course={deleteConfirm}
          onConfirm={handleDelete}
          onCancel={() => setDeleteConfirm(null)}
          loading={deleting}
        />
      )}

      {/* Header Banner */}
      <div className="mb-8">
        <div className="relative bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 rounded-3xl p-8 shadow-2xl shadow-blue-500/30 overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute w-64 h-64 bg-white rounded-full -top-20 -right-20" />
            <div className="absolute w-48 h-48 bg-white rounded-full bottom-0 left-20" />
          </div>
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="text-white">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                  <BookOpen className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold">Course Management</h1>
                  <p className="text-blue-100 text-sm">Create, manage and track course performance</p>
                </div>
              </div>
              {/* Quick stats */}
              <div className="flex flex-wrap gap-4 text-sm text-blue-100">
                <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4" /> {stats.total} Total</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> {stats.active} Active</span>
                <span className="flex items-center gap-1.5"><Users className="w-4 h-4" /> {stats.totalEnrollments} Enrollments</span>
                <span className="flex items-center gap-1.5"><Award className="w-4 h-4" /> {stats.withCerts} with Certificates</span>
              </div>
            </div>
            <button
              onClick={() => navigate('/dashboard/college-admin/courses/create')}
              className="flex-shrink-0 flex items-center gap-2 bg-white text-blue-700 font-bold px-5 py-3 rounded-xl hover:bg-blue-50 transition-all shadow-lg"
              style={{ display: user?.role === 'super_admin' ? undefined : 'none' }}
            >
              <Plus className="w-5 h-5" /> Create Course
            </button>
          </div>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by title, category, instructor, tags..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-sm"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 text-sm text-gray-700"
          >
            <option value="">All Categories</option>
            {CATEGORIES.filter(Boolean).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 text-sm text-gray-700"
          >
            <option value="">All Statuses</option>
            {Object.keys(STATUS_CONFIG).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button onClick={fetchCourses} className="p-2.5 border border-gray-200 rounded-xl hover:border-blue-300 text-gray-500 hover:text-blue-600 transition-colors">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
          <p className="font-semibold text-gray-800">{courses.length} Courses</p>
          <button
            onClick={() => navigate('/dashboard/college-admin/courses/assign-batch')}
            className="flex items-center gap-1.5 text-sm text-blue-600 font-medium hover:text-blue-700 transition-colors"
          >
            <Send className="w-4 h-4" /> Assign to Batch
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No courses found</p>
            <p className="text-sm text-gray-400 mt-1">Create your first course to get started</p>
            <button
              onClick={() => navigate('/dashboard/college-admin/courses/create')}
              className="mt-4 flex items-center gap-2 mx-auto px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-all"
              style={{ display: user?.role === 'super_admin' ? undefined : 'none' }}
            >
              <Plus className="w-4 h-4" /> Create Course
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Course</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Level</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Enrolled</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Duration</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rating</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {courses.map(course => (
                  <CourseRow
                    key={course._id}
                    course={course}
                    onEdit={id => navigate(`/dashboard/college-admin/courses/edit/${id}`)}
                    onDelete={setDeleteConfirm}
                    onAnalytics={id => navigate(`/dashboard/college-admin/courses/${id}/analytics`)}
                    onViewEnrollments={id => navigate(`/dashboard/college-admin/courses/${id}/enrollments`)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminCourseManagement;