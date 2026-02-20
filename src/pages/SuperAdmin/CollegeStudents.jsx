// src/pages/SuperAdmin/CollegeStudents.jsx
// Super Admin: view students of a specific college — live data, correct filters, real stats
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useToast } from '../../context/ToastContext';
import {
  ArrowLeft, Search, Users, GraduationCap, Mail, Phone,
  CheckCircle, XCircle, ChevronLeft, ChevronRight, X,
  Briefcase, BookOpen, Award, RefreshCw, Download, Eye,
  AlertCircle, TrendingUp, UserCheck, BarChart2,
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const LIMIT = 20;

const authFetch = async (url) => {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `Error ${res.status}`);
  return data;
};

/* ─── Badges ────────────────────────────────────────────────── */
const ActiveBadge = ({ active }) => (
  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
    active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
  }`}>
    {active ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
    {active ? 'Active' : 'Inactive'}
  </span>
);

const PlacedBadge = ({ isPlaced }) => (
  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
    isPlaced ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
  }`}>
    {isPlaced ? <Briefcase className="w-3 h-3" /> : <BookOpen className="w-3 h-3" />}
    {isPlaced ? 'Placed' : 'Unplaced'}
  </span>
);

/* ─── Student Detail Modal ──────────────────────────────────── */
const StudentModal = ({ student, onClose }) => {
  if (!student) return null;
  const si = student.studentInfo || {};

  const Field = ({ label, value }) => (
    <div>
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-gray-800">
        {value != null && value !== '' ? value : <span className="text-gray-400 italic">—</span>}
      </p>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 p-6 rounded-t-2xl">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center text-white font-bold text-2xl">
                {student.fullName?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div className="text-white">
                <h2 className="text-xl font-bold">{student.fullName}</h2>
                <p className="text-blue-100 text-sm">{student.email}</p>
                {student.phone && <p className="text-blue-200 text-xs mt-0.5">{student.phone}</p>}
                <div className="flex items-center gap-2 mt-2">
                  <ActiveBadge active={student.isActive} />
                  <PlacedBadge isPlaced={si.isPlaced} />
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-white/10 hover:bg-white/25 rounded-lg flex items-center justify-center text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Academic Info */}
          <section>
            <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-blue-600" /> Academic Information
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-xl">
              <Field label="Roll Number" value={si.rollNumber} />
              <Field label="Branch" value={si.branch} />
              <Field label="Batch" value={si.batch} />
              <Field label="Semester" value={si.semester} />
              <Field label="CGPA" value={si.cgpa != null ? si.cgpa.toFixed(2) : null} />
              <Field label="Gap Years" value={si.gapYears || 0} />
              <Field label="10th %" value={si.tenthPercentage} />
              <Field label="12th %" value={si.twelfthPercentage} />
            </div>
          </section>

          {/* Placement Info */}
          <section>
            <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-purple-600" /> Placement Details
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-xl">
              <Field label="Placed" value={si.isPlaced ? 'Yes' : 'No'} />
              <Field label="Eligible" value={si.isEligibleForPlacements ? 'Yes' : 'No'} />
              <Field label="Active Backlogs" value={si.activeBacklogs ?? 0} />
              <Field label="Total Backlogs" value={si.totalBacklogs ?? 0} />
              {si.isPlaced && (
                <>
                  <Field label="Package (LPA)" value={si.placementPackage} />
                  <Field
                    label="Placed Company"
                    value={
                      si.placedCompany?.name ||
                      (typeof si.placedCompany === 'string' ? si.placedCompany : null)
                    }
                  />
                </>
              )}
            </div>
          </section>

          {/* Contact & Account */}
          <section>
            <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <Mail className="w-4 h-4 text-green-600" /> Contact & Account
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Mail className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm font-medium text-gray-800 break-all">{student.email}</p>
                </div>
              </div>
              {student.phone && (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center">
                    <Phone className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="text-sm font-medium text-gray-800">{student.phone}</p>
                  </div>
                </div>
              )}
              <div className="flex-1">
                <p className="text-xs text-gray-500">Email Verified</p>
                <p className="text-sm font-medium">{student.isEmailVerified ? '✅ Verified' : '❌ Not verified'}</p>
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500">Joined</p>
                <p className="text-sm font-medium">
                  {student.createdAt
                    ? new Date(student.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                    : '—'}
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

/* ─── Main Component ─────────────────────────────────────────── */
const CollegeStudents = () => {
  const toast    = useToast();
  const navigate = useNavigate();
  const { collegeId } = useParams();

  const [loading, setLoading]       = useState(true);
  const [exporting, setExporting]   = useState(false);
  const [college, setCollege]       = useState(null);
  const [students, setStudents]     = useState([]);
  const [total, setTotal]           = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters]       = useState({ branches: [], batches: [] });
  const [collegeStats, setCollegeStats] = useState({
    totalStudents: 0, totalPlaced: 0, totalEligible: 0, totalActive: 0, placementRate: '0.0',
  });
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [search, setSearch]     = useState('');
  const [branch, setBranch]     = useState('');
  const [batch, setBatch]       = useState('');
  const [isPlaced, setIsPlaced] = useState('');
  const [isActive, setIsActive] = useState('');
  const [page, setPage]         = useState(1);

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page, limit: LIMIT });
      if (search)         params.set('search', search);
      if (branch)         params.set('branch', branch);
      if (batch)          params.set('batch', batch);
      if (isPlaced !== '') params.set('isPlaced', isPlaced);
      if (isActive !== '') params.set('isActive', isActive);

      const data = await authFetch(
        `${API_URL}/super-admin/colleges/${collegeId}/students?${params}`
      );

      if (data.success) {
        setCollege(data.college);
        setStudents(data.students || []);
        setTotal(data.total ?? 0);
        setTotalPages(data.totalPages ?? 1);
        setFilters(data.filters || { branches: [], batches: [] });
        if (data.collegeStats) setCollegeStats(data.collegeStats);
      }
    } catch (err) {
      console.error(err);
      toast.error('Error', err.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  }, [collegeId, page, search, branch, batch, isPlaced, isActive]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [search, branch, batch, isPlaced, isActive]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const token = localStorage.getItem('authToken');
      const params = new URLSearchParams({ collegeId, format: 'xlsx' });
      if (branch)          params.set('branch', branch);
      if (batch)           params.set('batch', batch);
      if (isPlaced !== '') params.set('isPlaced', isPlaced);

      const res = await fetch(`${API_URL}/super-admin/students/export?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `${college?.name || 'college'}_students_${Date.now()}.xlsx`;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(url);
      toast.success('Exported!', 'Student data downloaded successfully.');
    } catch (err) {
      toast.error('Export Failed', err.message);
    } finally {
      setExporting(false);
    }
  };

  const clearFilters = () => {
    setSearch(''); setBranch(''); setBatch(''); setIsPlaced(''); setIsActive('');
  };
  const hasFilters = search || branch || batch || isPlaced !== '' || isActive !== '';

  if (loading && !college) {
    return <LoadingSpinner message="Loading Students..." submessage="Fetching student records" />;
  }

  return (
    <DashboardLayout title={college ? `${college.name} — Students` : 'Students'}>

      {/* Header Banner */}
      <div className="mb-6 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 rounded-3xl p-7 shadow-2xl shadow-blue-500/25 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full -ml-32 -mb-32" />
        </div>
        <div className="relative">
          <button
            onClick={() => navigate(`/dashboard/super-admin/colleges/${collegeId}`)}
            className="flex items-center gap-2 text-white/85 hover:text-white mb-4 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Back to College Details
          </button>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="text-white">
              {college?.code && (
                <p className="text-blue-200 text-sm font-medium mb-1">
                  <span className="bg-white/20 px-2 py-0.5 rounded-full mr-2">{college.code}</span>
                  Student Management
                </p>
              )}
              <h1 className="text-2xl md:text-3xl font-bold">{college?.name || 'College'}</h1>
              <p className="text-blue-100 mt-1">
                {collegeStats.totalStudents} total student{collegeStats.totalStudents !== 1 ? 's' : ''} registered
              </p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={fetchStudents}
                disabled={loading}
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2.5 rounded-xl font-medium transition-all disabled:opacity-60"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={handleExport}
                disabled={exporting}
                className="flex items-center gap-2 bg-white text-blue-600 px-5 py-2.5 rounded-xl font-semibold hover:bg-blue-50 transition-all shadow-lg disabled:opacity-60"
              >
                {exporting
                  ? <RefreshCw className="w-4 h-4 animate-spin" />
                  : <Download className="w-4 h-4" />}
                {exporting ? 'Exporting...' : 'Export Excel'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* College-wide Summary Stats — LIVE from backend, not page-scoped */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <SummaryCard
          label="Total Students"
          value={collegeStats.totalStudents}
          icon={<Users className="w-5 h-5 text-white" />}
          bg="from-blue-500 to-blue-700"
          color="text-blue-600"
        />
        <SummaryCard
          label="Active Accounts"
          value={collegeStats.totalActive}
          icon={<UserCheck className="w-5 h-5 text-white" />}
          bg="from-green-500 to-green-700"
          color="text-green-600"
        />
        <SummaryCard
          label="Placed"
          value={collegeStats.totalPlaced}
          icon={<Briefcase className="w-5 h-5 text-white" />}
          bg="from-purple-500 to-purple-700"
          color="text-purple-600"
        />
        <SummaryCard
          label="Eligible"
          value={collegeStats.totalEligible}
          icon={<Award className="w-5 h-5 text-white" />}
          bg="from-orange-500 to-orange-600"
          color="text-orange-600"
        />
        <SummaryCard
          label="Placement Rate"
          value={`${collegeStats.placementRate}%`}
          icon={<BarChart2 className="w-5 h-5 text-white" />}
          bg="from-cyan-500 to-cyan-700"
          color="text-cyan-600"
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Name, email, or roll number…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            />
          </div>

          <select
            value={branch}
            onChange={e => setBranch(e.target.value)}
            className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white min-w-[130px]"
          >
            <option value="">All Branches</option>
            {filters.branches.map(b => <option key={b} value={b}>{b}</option>)}
          </select>

          <select
            value={batch}
            onChange={e => setBatch(e.target.value)}
            className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white min-w-[130px]"
          >
            <option value="">All Batches</option>
            {filters.batches.map(b => <option key={b} value={b}>{b}</option>)}
          </select>

          <select
            value={isPlaced}
            onChange={e => setIsPlaced(e.target.value)}
            className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white min-w-[130px]"
          >
            <option value="">All Placement</option>
            <option value="true">Placed</option>
            <option value="false">Unplaced</option>
          </select>

          <select
            value={isActive}
            onChange={e => setIsActive(e.target.value)}
            className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white min-w-[130px]"
          >
            <option value="">All Accounts</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-red-50 text-red-600 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors"
            >
              <X className="w-4 h-4" /> Clear Filters
            </button>
          )}
        </div>

        {/* Active filter summary */}
        {hasFilters && (
          <p className="mt-2 text-xs text-blue-600 font-medium">
            Showing {total} student{total !== 1 ? 's' : ''} matching current filters
          </p>
        )}
      </div>

      {/* Student Table */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden mb-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : students.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Users className="w-16 h-16 mb-4 text-gray-200" />
            <p className="text-lg font-medium text-gray-500">No students found</p>
            {hasFilters && (
              <button onClick={clearFilters} className="mt-3 text-blue-500 text-sm hover:underline">
                Clear filters to see all students
              </button>
            )}
            {!hasFilters && collegeStats.totalStudents === 0 && (
              <p className="text-sm text-gray-400 mt-2">No students have been registered for this college yet.</p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-200">
                <tr>
                  {['#', 'Student', 'Roll No.', 'Branch', 'Batch', 'CGPA', 'Backlogs', 'Status', 'Placement', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {students.map((s, idx) => {
                  const si = s.studentInfo || {};
                  return (
                    <tr key={s._id} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="px-4 py-3 text-sm text-gray-400 font-medium">
                        {(page - 1) * LIMIT + idx + 1}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {s.fullName?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate max-w-[160px]">{s.fullName}</p>
                            <p className="text-xs text-gray-500 truncate max-w-[160px]">{s.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded-lg text-gray-700">
                          {si.rollNumber || '—'}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        {si.branch ? (
                          <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                            {si.branch}
                          </span>
                        ) : <span className="text-gray-400 text-sm">—</span>}
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-700 font-medium">
                        {si.batch || '—'}
                      </td>

                      <td className="px-4 py-3">
                        {si.cgpa != null ? (
                          <div className="flex items-center gap-1.5">
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                              si.cgpa >= 7.5 ? 'bg-green-500' : si.cgpa >= 6 ? 'bg-yellow-500' : 'bg-red-500'
                            }`} />
                            <span className="text-sm font-semibold text-gray-800">{si.cgpa.toFixed(2)}</span>
                          </div>
                        ) : <span className="text-gray-400 text-sm">—</span>}
                      </td>

                      <td className="px-4 py-3">
                        {(si.activeBacklogs ?? 0) > 0 ? (
                          <span className="flex items-center gap-1 text-xs font-semibold text-orange-600">
                            <AlertCircle className="w-3.5 h-3.5" /> {si.activeBacklogs}
                          </span>
                        ) : (
                          <span className="text-xs text-green-600 font-medium">None</span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <ActiveBadge active={s.isActive} />
                      </td>

                      <td className="px-4 py-3">
                        <PlacedBadge isPlaced={si.isPlaced} />
                        {si.isPlaced && si.placementPackage && (
                          <p className="text-xs text-blue-600 font-semibold mt-0.5 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" /> {si.placementPackage} LPA
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelectedStudent(s)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-semibold transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" /> View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-2xl shadow-md border border-gray-100 px-5 py-4">
          <p className="text-sm text-gray-600">
            Showing{' '}
            <span className="font-semibold">{(page - 1) * LIMIT + 1}</span>–
            <span className="font-semibold">{Math.min(page * LIMIT, total)}</span>
            {' '}of{' '}
            <span className="font-semibold">{total}</span>
            {hasFilters ? ' (filtered)' : ''} students
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pg = totalPages <= 5 ? i + 1
                : page <= 3 ? i + 1
                : page >= totalPages - 2 ? totalPages - 4 + i
                : page - 2 + i;
              return (
                <button
                  key={pg}
                  onClick={() => setPage(pg)}
                  className={`w-9 h-9 rounded-xl text-sm font-semibold transition-colors ${
                    pg === page
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {pg}
                </button>
              );
            })}

            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
      )}

      {/* Student Detail Modal */}
      {selectedStudent && (
        <StudentModal student={selectedStudent} onClose={() => setSelectedStudent(null)} />
      )}
    </DashboardLayout>
  );
};

/* ─── Summary Stat Card ─────────────────────────────────────── */
const SummaryCard = ({ label, value, icon, bg, color }) => (
  <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-500 text-xs font-medium mb-1">{label}</p>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
      </div>
      <div className={`w-10 h-10 bg-gradient-to-br ${bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
        {icon}
      </div>
    </div>
  </div>
);

export default CollegeStudents;