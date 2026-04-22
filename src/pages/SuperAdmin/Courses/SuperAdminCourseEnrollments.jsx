// pages/SuperAdmin/Courses/SuperAdminCourseEnrollments.jsx
import { useState, useEffect, useMemo } from 'react';
import {
  BookOpen, Users, Search, AlertCircle, RefreshCw, X,
  ChevronDown, GraduationCap, Building2, Calendar, TrendingUp,
  CheckCircle2, Clock, BarChart2,
} from 'lucide-react';
import SuperAdminDashboardLayout from '../../../components/layout/SuperAdminDashboardLayout';
import { TableSkeleton } from '../../../components/common/SkeletonLoader';
import { superAdminCourseAPI } from '../../../api/Api';

/* ─── Section heading ─────────────────────── */
const SHead = ({ icon: Icon, title, sub, badge, color = '#003399' }) => (
  <div className="flex items-center gap-2 mb-4">
    <div
      className="w-6 h-6 rounded-lg flex items-center justify-center border flex-shrink-0"
      style={{ backgroundColor: `${color}15`, borderColor: `${color}30` }}
    >
      <Icon className="w-3.5 h-3.5" style={{ color }} />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-bold text-slate-800 leading-none">{title}</h3>
        {badge != null && (
          <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md border border-blue-100">{badge}</span>
        )}
      </div>
      {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

const ProgressBar = ({ value = 0 }) => (
  <div className="flex items-center gap-2">
    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all"
        style={{
          width: `${Math.min(100, value)}%`,
          background: value >= 100 ? '#16a34a' : value >= 50 ? '#2563eb' : '#f59e0b',
        }}
      />
    </div>
    <span className="text-[10px] font-bold text-slate-500 w-7 text-right">{Math.round(value)}%</span>
  </div>
);

const StatusBadge = ({ progress }) => {
  if (progress >= 100) return <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-100"><CheckCircle2 className="w-2.5 h-2.5" />Completed</span>;
  if (progress > 0) return <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100"><Clock className="w-2.5 h-2.5" />In Progress</span>;
  return <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-50 text-slate-500 border border-slate-100"><Clock className="w-2.5 h-2.5" />Not Started</span>;
};

const SuperAdminCourseEnrollments = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [enrollments, setEnrollments] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [collegeFilter, setCollegeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  /* ── Fetch courses list ── */
  useEffect(() => {
    const fetchCourses = async () => {
      setCoursesLoading(true);
      try {
        const res = await superAdminCourseAPI.getAllCourses({ limit: 200 });
        if (res?.success) setCourses(res.data || []);
      } catch {
        showToast('Failed to load courses', 'error');
      } finally {
        setCoursesLoading(false);
      }
    };
    fetchCourses();
  }, []);

  /* ── Fetch enrollments when course changes ── */
  useEffect(() => {
    if (!selectedCourse) { setEnrollments([]); return; }
    const fetchEnrollments = async () => {
      setEnrollmentsLoading(true);
      try {
        const res = await superAdminCourseAPI.getCourseEnrollments(selectedCourse, { limit: 500 });
        if (res?.success) {
          const raw = res.data || res.enrollments || [];
          // Normalize: handle both { user: {...} } and { student: {...} } and flat structures
          const normalized = raw.map(e => {
            // Try all possible user field locations
            const userObj = e.user || e.student || e.userId || {};
            // Some APIs return the user fields directly on the enrollment object
            const user = (userObj && (userObj._id || userObj.email || userObj.fullName))
              ? { ...userObj }
              : {
                _id: e._id,
                fullName: e.fullName || e.name || e.studentName || userObj.fullName,
                name: e.name || userObj.name,
                email: e.email || userObj.email,
                college: e.college || e.collegeId || userObj.college,
                studentInfo: e.studentInfo || userObj.studentInfo || {
                  rollNumber: e.rollNumber || e.studentInfo?.rollNumber,
                },
              };

            // Ensure college is attached to the normalized user object
            if (!user.college && (e.college || e.collegeId)) {
              user.college = e.college || e.collegeId;
            }
            return {
              ...e,
              user,
              progress: e.progress ?? e.completionPercentage ?? 0,
              enrolledAt: e.enrolledAt || e.createdAt || e.assignedAt,
            };
          });
          setEnrollments(normalized);
        } else {
          showToast(res?.message || 'Failed to load enrollments', 'error');
        }
      } catch (err) {
        showToast(err?.message || 'Failed to load enrollments', 'error');
      } finally {
        setEnrollmentsLoading(false);
      }
    };
    fetchEnrollments();
  }, [selectedCourse]);

  /* ── Derived data ── */
  const selectedCourseObj = courses.find(c => c._id === selectedCourse);

  const allColleges = useMemo(() => {
    const seen = new Set();
    return enrollments
      .map(e => e.user?.college || e.college)
      .filter(col => col && col._id && !seen.has(col._id) && seen.add(col._id));
  }, [enrollments]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return enrollments.filter(e => {
      const name = (e.user?.fullName || e.user?.name || '').toLowerCase();
      const email = (e.user?.email || '').toLowerCase();
      const roll = (e.user?.studentInfo?.rollNumber || '').toLowerCase();
      const college = e.user?.college?._id || e.user?.college || '';
      const progress = e.progress ?? 0;
      const matchSearch = !q || name.includes(q) || email.includes(q) || roll.includes(q);
      const matchCollege = !collegeFilter || college === collegeFilter;
      const matchStatus = !statusFilter ||
        (statusFilter === 'completed' && progress >= 100) ||
        (statusFilter === 'in_progress' && progress > 0 && progress < 100) ||
        (statusFilter === 'not_started' && progress === 0);
      return matchSearch && matchCollege && matchStatus;
    });
  }, [enrollments, search, collegeFilter, statusFilter]);

  /* ── KPI ── */
  const kpi = useMemo(() => {
    const total = enrollments.length;
    const completed = enrollments.filter(e => (e.progress ?? 0) >= 100).length;
    const inProgress = enrollments.filter(e => (e.progress ?? 0) > 0 && (e.progress ?? 0) < 100).length;
    const avgProgress = total ? Math.round(enrollments.reduce((s, e) => s + (e.progress ?? 0), 0) / total) : 0;
    return { total, completed, inProgress, avgProgress };
  }, [enrollments]);

  if (coursesLoading) return <TableSkeleton layout={SuperAdminDashboardLayout} />;

  return (
    <SuperAdminDashboardLayout>
      <div className="px-6 py-4 md:px-8 md:py-6 space-y-5 font-sans">

        {/* Toast */}
        {toast && (
          <div className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl text-xs font-bold border backdrop-blur-xl ${toast.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
            {toast.type === 'error' ? <AlertCircle className="w-4 h-4 flex-shrink-0" /> : <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
            {toast.msg}
          </div>
        )}

        {/* Brand Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span className="w-2 h-8 bg-gradient-to-b from-[#003399] to-[#00A9CE] rounded-full" />
            Course Enrollments
          </h1>
          <p className="text-sm text-slate-400 font-medium mt-1">View and monitor student enrollments per course</p>
        </div>

        <div className="space-y-4">

          {/* Course Selector */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <SHead icon={BookOpen} title="Select Course" sub="Pick a course to view its enrolled students" badge={courses.length} />
            <div className="relative">
              <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <select
                value={selectedCourse}
                onChange={e => { setSelectedCourse(e.target.value); setSearch(''); setCollegeFilter(''); setStatusFilter(''); }}
                className="w-full pl-9 pr-9 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-xs text-slate-700 appearance-none bg-white transition-all"
              >
                <option value="">— Choose a course —</option>
                {courses.map(c => (
                  <option key={c._id} value={c._id}>{c.title} ({c.category})</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* KPI Row — only if a course is selected */}
          {selectedCourse && !enrollmentsLoading && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: 'Total Enrolled', value: kpi.total, icon: Users, color: '#003399' },
                { label: 'Completed', value: kpi.completed, icon: CheckCircle2, color: '#16a34a' },
                { label: 'In Progress', value: kpi.inProgress, icon: TrendingUp, color: '#2563eb' },
                { label: 'Avg Progress', value: `${kpi.avgProgress}%`, icon: BarChart2, color: '#7c3aed' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border"
                    style={{ backgroundColor: `${color}12`, borderColor: `${color}25` }}
                  >
                    <Icon className="w-4 h-4" style={{ color }} />
                  </div>
                  <div>
                    <p className="text-xl font-black text-slate-900 leading-none">{value}</p>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Enrollment Table */}
          {selectedCourse && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <SHead
                icon={Users}
                title={selectedCourseObj ? `Enrolled in "${selectedCourseObj.title}"` : 'Enrolled Students'}
                sub="Search, filter, and review student details"
                badge={filtered.length !== enrollments.length ? `${filtered.length} / ${enrollments.length}` : enrollments.length}
                color="#003399"
              />

              {/* Filters bar */}
              <div className="flex flex-col sm:flex-row gap-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search by name, email or roll no…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 border border-slate-200 hover:border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-xs bg-white transition-all"
                  />
                  {search && (
                    <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* College filter */}
                {allColleges.length > 0 && (
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                    <select
                      value={collegeFilter}
                      onChange={e => setCollegeFilter(e.target.value)}
                      className="pl-9 pr-8 py-2 border border-slate-200 hover:border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-xs appearance-none bg-white transition-all min-w-[160px]"
                    >
                      <option value="">All Colleges</option>
                      {allColleges.map(col => (
                        <option key={col._id} value={col._id}>{col.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  </div>
                )}

                {/* Status filter */}
                <div className="relative">
                  <TrendingUp className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="pl-9 pr-8 py-2 border border-slate-200 hover:border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-xs appearance-none bg-white transition-all min-w-[140px]"
                  >
                    <option value="">All Status</option>
                    <option value="completed">Completed</option>
                    <option value="in_progress">In Progress</option>
                    <option value="not_started">Not Started</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Table / States */}
              {enrollmentsLoading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
                  <p className="text-xs text-slate-400 font-medium">Loading enrollments…</p>
                </div>
              ) : enrollments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100">
                    <GraduationCap className="w-7 h-7 text-slate-200" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-slate-600">No enrollments yet</p>
                    <p className="text-xs text-slate-400 mt-0.5">No students have been enrolled in this course.</p>
                  </div>
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Search className="w-8 h-8 text-slate-200" />
                  <p className="text-xs text-slate-400 font-medium">No students match your filters</p>
                  <button onClick={() => { setSearch(''); setCollegeFilter(''); setStatusFilter(''); }} className="text-xs text-blue-600 font-bold hover:underline">Clear all filters</button>
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-slate-100">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="text-left px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider">#</th>
                        <th className="text-left px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider">Student</th>
                        <th className="text-left px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider hidden sm:table-cell">Roll No.</th>
                        <th className="text-left px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider hidden md:table-cell">College</th>
                        <th className="text-left px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider hidden lg:table-cell">Enrolled On</th>
                        <th className="text-left px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider">Progress</th>
                        <th className="text-left px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filtered.map((e, i) => {
                        const user = e.user || {};
                        const college = user.college;
                        const progress = e.progress ?? 0;
                        const enrolledAt = e.enrolledAt || e.createdAt;
                        return (
                          <tr key={e._id || i} className="hover:bg-slate-50/60 transition-colors group">
                            <td className="px-4 py-3 text-[10px] text-slate-400 font-bold">{i + 1}</td>
                            <td className="px-4 py-3">
                              <div className="min-w-0">
                                <p className="font-bold text-slate-800 truncate">{user.fullName || user.name || '—'}</p>
                                <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3 hidden sm:table-cell text-slate-500">
                              {user.studentInfo?.rollNumber || <span className="text-slate-300">—</span>}
                            </td>
                            <td className="px-4 py-3 hidden md:table-cell text-slate-600">
                              {college?.name
                                ? <span className="inline-flex items-center gap-1"><Building2 className="w-3 h-3 text-slate-300" />{college.name}</span>
                                : <span className="text-slate-300">—</span>}
                            </td>
                            <td className="px-4 py-3 hidden lg:table-cell text-slate-400">
                              {enrolledAt
                                ? <span className="inline-flex items-center gap-1"><Calendar className="w-3 h-3 text-slate-300" />{new Date(enrolledAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                : <span className="text-slate-300">—</span>}
                            </td>
                            <td className="px-4 py-3 min-w-[100px]">
                              <ProgressBar value={progress} />
                            </td>
                            <td className="px-4 py-3">
                              <StatusBadge progress={progress} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Empty state — no course selected */}
          {!selectedCourse && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center border" style={{ backgroundColor: '#00339912', borderColor: '#00339930' }}>
                <GraduationCap className="w-8 h-8" style={{ color: '#003399' }} />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-slate-700">Select a course to get started</p>
                <p className="text-xs text-slate-400 mt-1">Choose a course from the dropdown above to view its enrolled students and track their progress.</p>
              </div>
            </div>
          )}

        </div>
      </div>
    </SuperAdminDashboardLayout>
  );
};

export default SuperAdminCourseEnrollments;