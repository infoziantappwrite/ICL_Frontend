// pages/CollegeAdmin/Courses/CourseEnrollments.jsx
// Admin: View all students enrolled in a specific course with progress details
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Users, ChevronLeft, Search, RefreshCw, AlertCircle, CheckCircle2,
  Award, BarChart3, BookOpen, X, ChevronRight,
} from 'lucide-react';
import CollegeAdminLayout from '../../../components/layout/CollegeAdminLayout';
import { TableSkeleton } from '../../../components/common/SkeletonLoader';
import { collegeAdminCourseAPI as courseAPI } from '../../../api/Api';

const STATUS_CONFIG = {
  pending:   { label: 'Enrolled',    color: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-400' },
  active:    { label: 'In Progress', color: 'bg-[#003399]/5 text-[#003399] border-[#003399]/10',    dot: 'bg-[#003399]'  },
  completed: { label: 'Completed',   color: 'bg-green-50 text-green-700 border-green-200', dot: 'bg-green-500' },
  dropped:   { label: 'Dropped',     color: 'bg-gray-50 text-gray-600 border-gray-200',    dot: 'bg-gray-400'  },
};

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
    return <TableSkeleton layout={CollegeAdminLayout} />;
  }

  return (
    <CollegeAdminLayout>
      <div className="px-6 py-4 md:px-8 md:py-6 space-y-5 font-sans">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <button onClick={() => navigate('/dashboard/college-admin/courses')} className="text-slate-400 hover:text-[#003399] transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span className="w-2 h-8 bg-gradient-to-b from-[#003399] to-[#00A9CE] rounded-full inline-block flex-shrink-0" />
                Course <span className="text-[#003399]">Enrollments</span>
              </h1>
            </div>
            <p className="text-sm text-slate-400 font-medium ml-7">
              {courseTitle || 'Loading course...'} — {stats.total} students enrolled
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={fetchData} title="Refresh"
              className="inline-flex items-center justify-center gap-1.5 bg-white border border-slate-100 text-slate-500 text-xs font-bold px-4 py-2 rounded-xl hover:border-[#003399]/30 hover:text-[#003399] transition-all">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
            <button onClick={() => navigate(`/dashboard/college-admin/courses/${courseId}/analytics`)}
              className="inline-flex items-center gap-1.5 bg-white border border-[#003399]/20 text-[#003399] hover:bg-slate-50 text-[11px] font-black uppercase tracking-wider px-5 py-2.5 rounded-xl transition-all shadow-sm">
              <BarChart3 className="w-4 h-4" /> View Analytics
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-4">
          {[
            { label: 'Total Enrolled', value: stats.total,             bg: 'bg-[#003399]/5',    tc: 'text-[#003399]',   Icon: Users        },
            { label: 'Completed',      value: stats.completed,         bg: 'bg-emerald-50',     tc: 'text-emerald-700', Icon: CheckCircle2 },
            { label: 'Avg Progress',   value: `${stats.avgProgress}%`, bg: 'bg-purple-50',      tc: 'text-purple-700',  Icon: BarChart3    },
            { label: 'Certificates',   value: stats.certs,             bg: 'bg-amber-50',       tc: 'text-amber-700',   Icon: Award        },
          ].map(({ label, value, bg, tc, Icon }) => (
            <div key={label} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[12px] font-bold text-gray-500 mb-0.5">{label}</p>
                <p className={`text-[24px] font-black ${tc} leading-none`}>{value}</p>
              </div>
              <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${tc}`} />
              </div>
            </div>
          ))}
        </div>

        {/* Table Panel */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Search students by name, email or roll no..." value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs font-bold border border-slate-100 rounded-xl focus:outline-none focus:border-[#003399]/30 bg-white" />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 text-xs font-bold border border-slate-100 rounded-xl focus:outline-none focus:border-[#003399]/30 bg-white appearance-none cursor-pointer min-w-[140px]">
              <option value="">All Statuses</option>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>

          <div className="overflow-x-auto min-h-[300px]">
            {loading ? (
              <div className="flex justify-center py-20">
                <RefreshCw className="w-8 h-8 text-[#00A9CE] animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 bg-[#003399]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-[#003399]/40" />
                </div>
                <h3 className="text-lg font-bold text-gray-700 mb-2">No Students Found</h3>
                <p className="text-slate-400 text-sm">No enrollments match your criteria.</p>
              </div>
            ) : (
              <table className="w-full table-fixed">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left w-[60px]">S.No</th>
                    <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left w-[220px]">Student</th>
                    <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left w-[130px]">Status</th>
                    <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left w-[150px]">Progress</th>
                    <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left w-[100px]">Modules</th>
                    <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left w-[120px]">Enrolled</th>
                    <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left w-[120px]">Certificate</th>
                    <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left w-[140px]">Assigned By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((e, index) => {
                    const statusCfg = STATUS_CONFIG[e.status] || STATUS_CONFIG.pending;
                    const completedMods = e.moduleProgress?.filter(m => m.completed).length || 0;
                    const totalMods = e.moduleProgress?.length || 0;
                    return (
                      <tr key={e._id} className="hover:bg-slate-50/30 transition-colors group">
                        <td className="px-5 py-4 text-xs font-bold text-slate-400">
                          {String(index + 1).padStart(2, '0')}
                        </td>
                        <td className="px-5 py-4">
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-800 truncate w-full group-hover:text-[#003399] transition-colors">
                              {e.userId?.fullName || e.userId?.name || e.userId?.email || '—'}
                            </p>
                            {e.userId?.studentInfo?.rollNumber && (
                              <p className="text-[10px] text-[#00A9CE] font-black uppercase tracking-wider">{e.userId.studentInfo.rollNumber}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${statusCfg.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                            {statusCfg.label}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-[#003399] to-[#00A9CE] rounded-full"
                                style={{ width: `${e.overallProgress || 0}%` }} />
                            </div>
                            <span className="text-[10px] font-black text-slate-700 tabular-nums">{e.overallProgress || 0}%</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-xs font-black text-slate-700 uppercase tracking-wider">{completedMods}/{totalMods}</span>
                        </td>
                        <td className="px-5 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {e.enrolledAt ? new Date(e.enrolledAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short' }) : '—'}
                        </td>
                        <td className="px-5 py-4">
                          {e.certificateIssued ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-purple-700">
                              <Award className="w-3 h-3" /> Issued
                            </span>
                          ) : (
                            <span className="text-xs text-slate-300">—</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest truncate w-full">
                            {e.assignedBy?.fullName || e.assignedBy?.name || 'Self-enrolled'}
                          </p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </CollegeAdminLayout>
  );
};

export default CourseEnrollments;