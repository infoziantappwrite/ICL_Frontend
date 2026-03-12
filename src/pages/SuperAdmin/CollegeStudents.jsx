// src/pages/SuperAdmin/CollegeStudents.jsx
// Super Admin: view students of a specific college — live data, correct filters, real stats
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import SuperAdminDashboardLayout from '../../components/layout/SuperAdminDashboardLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useToast } from '../../context/ToastContext';
import apiCall, { tokenStore } from '../../api/Api';
import {
  ArrowLeft, Search, Users, GraduationCap, Mail, Phone,
  CheckCircle, XCircle, ChevronLeft, ChevronRight, X,
  Briefcase, BookOpen, Award, RefreshCw, Download, Eye,
  AlertCircle, TrendingUp, UserCheck, BarChart2, Building2,
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const LIMIT = 20;

/* ─── Badges ────────────────────────────────── */
const ActiveBadge = ({ active }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
    active
      ? 'bg-blue-50 text-blue-600 border-blue-100'
      : 'bg-gray-50 text-gray-400 border-gray-200'
  }`}>
    <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-blue-500' : 'bg-gray-400'}`} />
    {active ? 'Active' : 'Inactive'}
  </span>
);

const PlacedBadge = ({ isPlaced }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
    isPlaced
      ? 'bg-cyan-50 text-cyan-600 border-cyan-100'
      : 'bg-gray-50 text-gray-400 border-gray-200'
  }`}>
    {isPlaced ? <Briefcase className="w-3 h-3" /> : <BookOpen className="w-3 h-3" />}
    {isPlaced ? 'Placed' : 'Unplaced'}
  </span>
);

/* ─── Section heading ─────────────────────── */
const SHead = ({ icon: Icon, title, sub }) => (
  <div className="flex items-center gap-2">
    <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
      <Icon className="w-3 h-3 text-white" />
    </div>
    <div>
      <h3 className="text-sm font-bold text-gray-800 leading-none">{title}</h3>
      {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

/* ─── Stat Pill ───────────────────────────── */
const StatPill = ({ icon: Icon, label, value, color }) => {
  const c = {
    blue:   'bg-blue-50 border-blue-100 text-blue-600',
    cyan:   'bg-cyan-50 border-cyan-100 text-cyan-600',
    indigo: 'bg-indigo-50 border-indigo-100 text-indigo-600',
    violet: 'bg-violet-50 border-violet-100 text-violet-600',
    green:  'bg-green-50 border-green-100 text-green-600',
  }[color] || 'bg-blue-50 border-blue-100 text-blue-600';
  return (
    <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border ${c} w-full`}>
      <Icon className="w-4 h-4 flex-shrink-0 opacity-70" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-black leading-none">{value}</p>
        <p className="text-[9px] font-medium opacity-60 mt-0.5 leading-none truncate">{label}</p>
      </div>
    </div>
  );
};

/* ─── Student Detail Modal ──────────────────── */
const StudentModal = ({ student, onClose }) => {
  if (!student) return null;
  const si = student.studentInfo || {};

  const MField = ({ label, value }) => (
    <div>
      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-sm font-medium text-gray-800">
        {value != null && value !== '' ? value : <span className="text-gray-300 italic text-xs">—</span>}
      </p>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-white/60"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="relative bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 p-5 rounded-t-2xl overflow-hidden">
          <div className="absolute -top-8 -right-8 w-28 h-28 bg-white/10 rounded-full" />
          <div className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: 'radial-gradient(circle,white 1px,transparent 1px)', backgroundSize: '18px 18px' }} />
          <div className="relative flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-white font-black text-xl border border-white/25 flex-shrink-0">
                {student.fullName?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div className="text-white">
                <h2 className="text-base font-black leading-tight">{student.fullName}</h2>
                <p className="text-blue-200 text-xs mt-0.5">{student.email}</p>
                {student.phone && <p className="text-blue-300 text-[10px] mt-0.5">{student.phone}</p>}
                <div className="flex items-center gap-1.5 mt-2">
                  <ActiveBadge active={student.isActive} />
                  <PlacedBadge isPlaced={si.isPlaced} />
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-white/10 hover:bg-white/25 rounded-lg flex items-center justify-center text-white transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Academic Info */}
          <div className="bg-blue-50/40 rounded-xl border border-blue-100/60 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-md flex items-center justify-center">
                <GraduationCap className="w-2.5 h-2.5 text-white" />
              </div>
              <p className="text-xs font-bold text-gray-700">Academic Information</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <MField label="Roll Number" value={si.rollNumber} />
              <MField label="Branch" value={si.branch} />
              <MField label="Batch" value={si.batch} />
              <MField label="Semester" value={si.semester} />
              <MField label="CGPA" value={si.cgpa != null ? si.cgpa.toFixed(2) : null} />
              <MField label="Gap Years" value={si.gapYears || 0} />
              <MField label="10th %" value={si.tenthPercentage} />
              <MField label="12th %" value={si.twelfthPercentage} />
            </div>
          </div>

          {/* Placement Info */}
          <div className="bg-cyan-50/40 rounded-xl border border-cyan-100/60 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-md flex items-center justify-center">
                <Briefcase className="w-2.5 h-2.5 text-white" />
              </div>
              <p className="text-xs font-bold text-gray-700">Placement Details</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <MField label="Placed" value={si.isPlaced ? 'Yes' : 'No'} />
              <MField label="Eligible" value={si.isEligibleForPlacements ? 'Yes' : 'No'} />
              <MField label="Active Backlogs" value={si.activeBacklogs ?? 0} />
              <MField label="Total Backlogs" value={si.totalBacklogs ?? 0} />
              {si.isPlaced && (
                <>
                  <MField label="Package (LPA)" value={si.placementPackage} />
                  <MField
                    label="Placed Company"
                    value={si.placedCompany?.name || (typeof si.placedCompany === 'string' ? si.placedCompany : null)}
                  />
                </>
              )}
            </div>
          </div>

          {/* Contact & Account */}
          <div className="bg-indigo-50/40 rounded-xl border border-indigo-100/60 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-md flex items-center justify-center">
                <Mail className="w-2.5 h-2.5 text-white" />
              </div>
              <p className="text-xs font-bold text-gray-700">Contact & Account</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Mail className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Email</p>
                  <p className="text-xs font-medium text-gray-800 break-all">{student.email}</p>
                </div>
              </div>
              {student.phone && (
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-cyan-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Phone className="w-3.5 h-3.5 text-cyan-600" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Phone</p>
                    <p className="text-xs font-medium text-gray-800">{student.phone}</p>
                  </div>
                </div>
              )}
              <MField label="Email Verified" value={student.isEmailVerified ? '✅ Verified' : '❌ Not verified'} />
              <MField
                label="Joined"
                value={student.createdAt
                  ? new Date(student.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                  : null}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Main Component ─────────────────────────── */
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
      if (search)          params.set('search', search);
      if (branch)          params.set('branch', branch);
      if (batch)           params.set('batch', batch);
      if (isPlaced !== '') params.set('isPlaced', isPlaced);
      if (isActive !== '') params.set('isActive', isActive);

      const data = await apiCall(`/super-admin/colleges/${collegeId}/students?${params}`);

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
  useEffect(() => { setPage(1); }, [search, branch, batch, isPlaced, isActive]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const token = tokenStore.get();
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

  const clearFilters = () => { setSearch(''); setBranch(''); setBatch(''); setIsPlaced(''); setIsActive(''); };
  const hasFilters = search || branch || batch || isPlaced !== '' || isActive !== '';

  if (loading && !college) {
    return <LoadingSpinner message="Loading Students..." submessage="Fetching student records" />;
  }

  /* Pagination pages */
  const from = (page - 1) * LIMIT + 1;
  const to   = Math.min(page * LIMIT, total);
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
    .reduce((acc, p, i, arr) => {
      if (i > 0 && p - arr[i - 1] > 1) acc.push('…');
      acc.push(p);
      return acc;
    }, []);

  return (
    <SuperAdminDashboardLayout>

      {/* ══ HERO BANNER ══ */}
      <div className="relative bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 rounded-2xl px-5 py-4 mb-4 shadow-xl shadow-blue-500/20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-10 -right-10 w-44 h-44 bg-white/10 rounded-full" />
          <div className="absolute -bottom-8 left-1/3 w-28 h-28 bg-white/10 rounded-full" />
          <div className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: 'radial-gradient(circle,white 1px,transparent 1px)', backgroundSize: '18px 18px' }} />
        </div>
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <button
                onClick={() => navigate(`/dashboard/super-admin/colleges/${collegeId}`)}
                className="text-blue-200 hover:text-white text-[11px] font-semibold flex items-center gap-1 mb-1 transition-colors"
              >
                <ArrowLeft className="w-3 h-3" /> Back to College Details
              </button>
              <h1 className="text-white font-black text-lg leading-tight">
                {college?.name || 'College'}
              </h1>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {college?.code && (
                  <span className="inline-flex items-center gap-1 bg-white/15 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white border border-white/20">
                    <Building2 className="w-3 h-3" /> {college.code}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 bg-white/15 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white border border-white/20">
                  <Users className="w-3 h-3" /> {collegeStats.totalStudents} Students
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={fetchStudents} disabled={loading}
              className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-3 py-2 rounded-xl border border-white/20 transition-all hover:scale-105 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
            <button
              onClick={handleExport} disabled={exporting}
              className="inline-flex items-center gap-1.5 bg-white text-blue-600 text-xs font-bold px-3 py-2 rounded-xl transition-all hover:scale-105 shadow-sm disabled:opacity-50"
            >
              {exporting
                ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                : <Download className="w-3.5 h-3.5" />}
              {exporting ? 'Exporting...' : 'Export Excel'}
            </button>
          </div>
        </div>
      </div>

      {/* ══ STATS PILLS ══ */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-3 mb-4">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          <StatPill icon={Users}    label="Total Students"   value={collegeStats.totalStudents}  color="blue"   />
          <StatPill icon={UserCheck} label="Active Accounts" value={collegeStats.totalActive}    color="green"  />
          <StatPill icon={Briefcase} label="Placed"          value={collegeStats.totalPlaced}    color="cyan"   />
          <StatPill icon={Award}    label="Eligible"         value={collegeStats.totalEligible}  color="indigo" />
          <StatPill icon={BarChart2} label="Placement Rate"  value={`${collegeStats.placementRate}%`} color="violet" />
        </div>
      </div>

      {/* ══ FILTERS ══ */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-3 mb-4">
        <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text" placeholder="Name, email, or roll number…"
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 hover:border-gray-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white"
            />
          </div>

          {[
            { val: branch, set: setBranch, opts: filters.branches, placeholder: 'All Branches' },
            { val: batch,  set: setBatch,  opts: filters.batches,  placeholder: 'All Batches'  },
          ].map(({ val, set, opts, placeholder }, i) => (
            <select key={i} value={val} onChange={e => set(e.target.value)}
              className="px-3 py-2.5 border border-gray-200 hover:border-gray-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white min-w-[120px]"
            >
              <option value="">{placeholder}</option>
              {opts.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          ))}

          <select value={isPlaced} onChange={e => setIsPlaced(e.target.value)}
            className="px-3 py-2.5 border border-gray-200 hover:border-gray-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white min-w-[120px]"
          >
            <option value="">All Placement</option>
            <option value="true">Placed</option>
            <option value="false">Unplaced</option>
          </select>

          <select value={isActive} onChange={e => setIsActive(e.target.value)}
            className="px-3 py-2.5 border border-gray-200 hover:border-gray-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white min-w-[120px]"
          >
            <option value="">All Accounts</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>

          {hasFilters && (
            <button onClick={clearFilters}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-semibold border border-red-100 transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>
        {hasFilters && (
          <p className="mt-2 text-[11px] text-blue-600 font-semibold">
            Showing {total} student{total !== 1 ? 's' : ''} matching current filters
          </p>
        )}
      </div>

      {/* ══ STUDENT TABLE ══ */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm overflow-hidden mb-4">
        <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-gray-100 flex items-center justify-between">
          <SHead icon={GraduationCap} title="Student Records" sub={`Page ${page} of ${totalPages}`} />
          <span className="text-[10px] text-gray-400 font-mono">{total} total</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : students.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-3">
              <Users className="w-6 h-6 text-blue-200" />
            </div>
            <p className="text-sm font-semibold text-gray-500">No students found</p>
            {hasFilters && (
              <button onClick={clearFilters} className="mt-2 text-blue-500 text-xs hover:underline font-medium">
                Clear filters to see all students
              </button>
            )}
            {!hasFilters && collegeStats.totalStudents === 0 && (
              <p className="text-xs text-gray-400 mt-1">No students have been registered yet.</p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50/40">
                  {['#', 'Student', 'Roll No.', 'Branch', 'Batch', 'CGPA', 'Backlogs', 'Status', 'Placement', ''].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-[9px] font-black text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {students.map((s, idx) => {
                  const si = s.studentInfo || {};
                  return (
                    <tr key={s._id} className="hover:bg-blue-50/20 transition-colors group">
                      <td className="px-3 py-2.5 text-[11px] text-gray-400 font-mono">
                        {(page - 1) * LIMIT + idx + 1}
                      </td>

                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-md flex items-center justify-center text-white font-black text-[11px] flex-shrink-0">
                            {s.fullName?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-gray-900 truncate max-w-[140px]">{s.fullName}</p>
                            <p className="text-[10px] text-gray-400 truncate max-w-[140px]">{s.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-3 py-2.5">
                        <span className="text-[10px] font-mono bg-gray-100 px-2 py-0.5 rounded-md text-gray-600">
                          {si.rollNumber || '—'}
                        </span>
                      </td>

                      <td className="px-3 py-2.5">
                        {si.branch ? (
                          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md">{si.branch}</span>
                        ) : <span className="text-gray-300 text-xs">—</span>}
                      </td>

                      <td className="px-3 py-2.5 text-xs text-gray-600 font-medium">{si.batch || '—'}</td>

                      <td className="px-3 py-2.5">
                        {si.cgpa != null ? (
                          <div className="flex items-center gap-1">
                            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                              si.cgpa >= 7.5 ? 'bg-green-500' : si.cgpa >= 6 ? 'bg-yellow-500' : 'bg-red-500'
                            }`} />
                            <span className="text-xs font-bold text-gray-800">{si.cgpa.toFixed(2)}</span>
                          </div>
                        ) : <span className="text-gray-300 text-xs">—</span>}
                      </td>

                      <td className="px-3 py-2.5">
                        {(si.activeBacklogs ?? 0) > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-100">
                            <AlertCircle className="w-3 h-3" /> {si.activeBacklogs}
                          </span>
                        ) : (
                          <span className="text-[10px] text-green-600 font-bold">None</span>
                        )}
                      </td>

                      <td className="px-3 py-2.5"><ActiveBadge active={s.isActive} /></td>

                      <td className="px-3 py-2.5">
                        <div>
                          <PlacedBadge isPlaced={si.isPlaced} />
                          {si.isPlaced && si.placementPackage && (
                            <p className="text-[10px] text-cyan-600 font-bold mt-0.5 flex items-center gap-1">
                              <TrendingUp className="w-2.5 h-2.5" /> {si.placementPackage} LPA
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="px-3 py-2.5">
                        <button
                          onClick={() => setSelectedStudent(s)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-[10px] font-bold transition-colors border border-blue-100"
                        >
                          <Eye className="w-3 h-3" /> View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between">
            <span className="text-[11px] text-gray-500">
              Showing {from}–{to} of {total}{hasFilters ? ' (filtered)' : ''}
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600 disabled:opacity-40 transition-colors">
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              {pages.map((p, i) =>
                p === '…'
                  ? <span key={`e${i}`} className="px-1.5 text-gray-400 text-xs">…</span>
                  : <button key={p} onClick={() => setPage(p)}
                      className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${
                        p === page
                          ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-sm'
                          : 'border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600'
                      }`}>{p}</button>
              )}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600 disabled:opacity-40 transition-colors">
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Student Detail Modal */}
      {selectedStudent && (
        <StudentModal student={selectedStudent} onClose={() => setSelectedStudent(null)} />
      )}

    </SuperAdminDashboardLayout>
  );
};

export default CollegeStudents;