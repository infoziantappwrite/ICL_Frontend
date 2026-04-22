// src/pages/SuperAdmin/CollegeStudents.jsx
// Super Admin: view students of a specific college — live data, correct filters, real stats
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import SuperAdminDashboardLayout from '../../components/layout/SuperAdminDashboardLayout';
import { TableSkeleton } from '../../components/common/SkeletonLoader';
import { useToast } from '../../context/ToastContext';
import apiCall, { tokenStore } from '../../api/Api';
import ActionMenu from '../../components/common/ActionMenu';
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
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${active
    ? 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20'
    : 'bg-rose-50 text-rose-500 border-rose-100'
    }`}>
    <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-[#10b981]' : 'bg-rose-400'}`} />
    {active ? 'Active' : 'Inactive'}
  </span>
);

const PlacedBadge = ({ isPlaced }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${isPlaced
    ? 'bg-[#00A9CE]/10 text-[#00A9CE] border-[#00A9CE]/20'
    : 'bg-slate-50 text-slate-400 border-slate-100'
    }`}>
    {isPlaced ? <Briefcase className="w-3 h-3" /> : <BookOpen className="w-3 h-3" />}
    {isPlaced ? 'Placed' : 'Unplaced'}
  </span>
);

/* ─── Section heading ─────────────────────── */
const SHead = ({ icon: Icon, title, sub }) => (
  <div className="flex items-center gap-2">
    <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg,#003399,#00A9CE)' }}>
      <Icon className="w-3 h-3 text-white" />
    </div>
    <div>
      <h3 className="text-sm font-bold text-slate-800 leading-none">{title}</h3>
      {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

/* ─── Stat Pill ───────────────────────────── */
const StatPill = ({ icon: Icon, label, value, color }) => {
  const c = {
    blue: { bg: 'bg-[#003399]/5', border: 'border-[#003399]/10', text: 'text-[#003399]' },
    cyan: { bg: 'bg-[#00A9CE]/5', border: 'border-[#00A9CE]/10', text: 'text-[#00A9CE]' },
    indigo: { bg: 'bg-indigo-50', border: 'border-indigo-100', text: 'text-indigo-600' },
    violet: { bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-600' },
    green: { bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-600' },
  }[color] || { bg: 'bg-[#003399]/5', border: 'border-[#003399]/10', text: 'text-[#003399]' };
  return (
    <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border ${c.bg} ${c.border} w-full`}>
      <Icon className={`w-4 h-4 flex-shrink-0 ${c.text}`} />
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-black leading-none ${c.text}`}>{value}</p>
        <p className="text-[9px] font-medium text-slate-400 mt-0.5 leading-none truncate">{label}</p>
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
  const toast = useToast();
  const navigate = useNavigate();
  const { collegeId } = useParams();

  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [college, setCollege] = useState(null);
  const [students, setStudents] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({ branches: [], batches: [] });
  const [collegeStats, setCollegeStats] = useState({
    totalStudents: 0, totalPlaced: 0, totalEligible: 0, totalActive: 0, placementRate: '0.0',
  });
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [search, setSearch] = useState('');
  const [branch, setBranch] = useState('');
  const [batch, setBatch] = useState('');
  const [isPlaced, setIsPlaced] = useState('');
  const [isActive, setIsActive] = useState('');
  const [page, setPage] = useState(1);

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page, limit: LIMIT });
      if (search) params.set('search', search);
      if (branch) params.set('branch', branch);
      if (batch) params.set('batch', batch);
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
      if (branch) params.set('branch', branch);
      if (batch) params.set('batch', batch);
      if (isPlaced !== '') params.set('isPlaced', isPlaced);

      const res = await fetch(`${API_URL}/super-admin/students/export?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
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
    return <TableSkeleton layout={SuperAdminDashboardLayout} />;
  }

  /* Pagination pages */
  const from = (page - 1) * LIMIT + 1;
  const to = Math.min(page * LIMIT, total);
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
    .reduce((acc, p, i, arr) => {
      if (i > 0 && p - arr[i - 1] > 1) acc.push('…');
      acc.push(p);
      return acc;
    }, []);

  return (
    <SuperAdminDashboardLayout>
      <div className="px-6 py-4 md:px-8 md:py-6 space-y-5 font-sans">

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span className="w-2 h-8 bg-gradient-to-b from-[#003399] to-[#00A9CE] rounded-full" />
              {college?.name || 'College'}
            </h1>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {college?.code && (
                <span className="inline-flex items-center gap-1 bg-[#003399]/5 text-[#003399] border border-[#003399]/10 rounded-md px-2 py-0.5 text-[9px] font-black uppercase tracking-wider">
                  <Building2 className="w-3 h-3" /> {college.code}
                </span>
              )}
              <span className="inline-flex items-center gap-1 bg-[#00A9CE]/5 text-[#00A9CE] border border-[#00A9CE]/10 rounded-md px-2 py-0.5 text-[9px] font-black uppercase tracking-wider">
                <Users className="w-3 h-3" /> {collegeStats.totalStudents} Students
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={handleExport} disabled={exporting}
              className="inline-flex items-center gap-1.5 bg-[#003399] text-white text-[11px] font-black px-3 py-2 rounded-xl shadow-sm hover:bg-[#002d8b] transition-all disabled:opacity-50">
              {exporting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              {exporting ? 'Exporting...' : 'Export Excel'}
            </button>
          </div>
        </div>

        {/* STATS PILLS */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <StatPill icon={Users} label="Total Students" value={collegeStats.totalStudents} color="blue" />
            <StatPill icon={UserCheck} label="Active Accounts" value={collegeStats.totalActive} color="green" />
            <StatPill icon={Briefcase} label="Placed" value={collegeStats.totalPlaced} color="cyan" />
            <StatPill icon={Award} label="Eligible" value={collegeStats.totalEligible} color="indigo" />
            <StatPill icon={BarChart2} label="Placement Rate" value={`${collegeStats.placementRate}%`} color="violet" />
          </div>
        </div>

        {/* FILTERS */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
              <input
                type="text" placeholder="Name, email, or roll number…"
                value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-slate-100 hover:border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#003399]/30 bg-white"
              />
            </div>

            {[
              { val: branch, set: setBranch, opts: filters.branches, placeholder: 'All Branches' },
              { val: batch, set: setBatch, opts: filters.batches, placeholder: 'All Batches' },
            ].map(({ val, set, opts, placeholder }, i) => (
              <select key={i} value={val} onChange={e => set(e.target.value)}
                className="px-3 py-2.5 border border-slate-100 hover:border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#003399]/30 bg-white min-w-[120px]"
              >
                <option value="">{placeholder}</option>
                {opts.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            ))}

            <select value={isPlaced} onChange={e => setIsPlaced(e.target.value)}
              className="px-3 py-2.5 border border-slate-100 hover:border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#003399]/30 bg-white min-w-[120px]"
            >
              <option value="">All Placement</option>
              <option value="true">Placed</option>
              <option value="false">Unplaced</option>
            </select>

            <select value={isActive} onChange={e => setIsActive(e.target.value)}
              className="px-3 py-2.5 border border-slate-100 hover:border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#003399]/30 bg-white min-w-[120px]"
            >
              <option value="">All Accounts</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>

            {hasFilters && (
              <button onClick={clearFilters}
                className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-black border border-rose-100 transition-colors">
                <X className="w-3.5 h-3.5" /> Clear
              </button>
            )}
          </div>
          {hasFilters && (
            <p className="mt-2 text-[11px] text-[#003399] font-black">
              Showing {total} student{total !== 1 ? 's' : ''} matching current filters
            </p>
          )}
        </div>

        {/* STUDENT TABLE */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
            <SHead icon={GraduationCap} title="Student Records" sub={`Page ${page} of ${totalPages}`} />
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{total} total</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-[#003399] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : students.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-3 border border-slate-100">
                <Users className="w-6 h-6 text-slate-200" />
              </div>
              <p className="text-sm font-black text-slate-800">No students found</p>
              {hasFilters && (
                <button onClick={clearFilters} className="mt-2 text-[#003399] text-xs hover:underline font-black">
                  Clear filters to see all students
                </button>
              )}
              {!hasFilters && collegeStats.totalStudents === 0 && (
                <p className="text-xs text-slate-400 font-medium mt-1">No students have been registered yet.</p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    {['#', 'Student', 'Roll No.', 'Branch', 'Batch', 'CGPA', 'Backlogs', 'Status', 'Placement', 'Actions'].map(h => (
                      <th key={h} className={`px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left whitespace-nowrap ${h === 'Actions' ? 'text-right' : ''}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {students.map((s, idx) => {
                    const si = s.studentInfo || {};
                    return (
                      <tr key={s._id} className="hover:bg-[#003399]/[0.02] transition-colors group">
                        <td className="px-3 py-2.5 text-[11px] text-slate-400 font-mono">{(page - 1) * LIMIT + idx + 1}</td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
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
                            <span className="text-[10px] font-black text-[#003399] bg-[#003399]/5 px-1.5 py-0.5 rounded-md border border-[#003399]/10">{si.branch}</span>
                          ) : <span className="text-slate-200 text-xs">—</span>}
                        </td>

                        <td className="px-3 py-2.5 text-xs text-gray-600 font-medium">{si.batch || '—'}</td>

                        <td className="px-3 py-2.5">
                          {si.cgpa != null ? (
                            <div className="flex items-center gap-1">
                              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${si.cgpa >= 7.5 ? 'bg-green-500' : si.cgpa >= 6 ? 'bg-yellow-500' : 'bg-red-500'
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

                        <td className="px-5 py-4 text-right whitespace-nowrap">
                          <ActionMenu
                            actions={[
                              {
                                icon: Eye,
                                label: 'View Details',
                                onClick: () => setSelectedStudent(s),
                                color: 'text-slate-700 hover:bg-slate-50'
                              },
                            ]}
                          />
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
                    ? <span key={`e${i}`} className="px-1.5 text-slate-400 text-xs">…</span>
                    : <button key={p} onClick={() => setPage(p)}
                      className={`w-7 h-7 rounded-lg text-xs font-black transition-colors ${p === page
                        ? 'bg-[#003399] text-white shadow-sm'
                        : 'border border-slate-100 text-slate-600 hover:border-[#003399]/30 hover:text-[#003399]'
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

      </div>
    </SuperAdminDashboardLayout>
  );
};

export default CollegeStudents;