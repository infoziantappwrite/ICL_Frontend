// pages/CollegeAdmin/JobManagement.jsx
import { useToast } from '../../context/ToastContext';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase, Plus, Search, SquarePen, Trash2, Eye, Pin, PinOff,
  Users, CircleCheck, CircleX, CircleDashed, Building2, Target,
  ChevronLeft, ChevronRight, RefreshCw, Filter, X, TrendingUp,
} from 'lucide-react';
import CollegeAdminLayout from '../../components/layout/CollegeAdminLayout';
import { TableSkeleton } from '../../components/common/SkeletonLoader';
import ActionMenu from '../../components/common/ActionMenu';
import { collegeAdminAPI, jobAPI } from '../../api/Api';

const PAGE_SIZE = 10;

/* ── Stat pill ── */
const StatPill = ({ icon: Icon, label, value, color }) => {
  const c = {
    blue:   'text-[#003399]',
    cyan:   'text-cyan-600',
    green:  'text-emerald-600',
    amber:  'text-amber-600',
    red:    'text-red-500',
    gray:   'text-gray-500',
  }[color] || 'text-[#003399]';
  return (
    <div className={`flex items-center gap-3 p-4 rounded-xl shadow-sm bg-white border border-slate-100`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${c.replace('text-', 'bg-').replace('600', '50').replace('500', '50')}`}>
        <Icon className={`w-5 h-5 ${c}`} />
      </div>
      <div className="flex-1">
        <p className="text-[12px] font-bold text-gray-500 mb-0.5">{label}</p>
        <p className={`text-[24px] font-black leading-none ${c}`}>{value}</p>
      </div>
    </div>
  );
};

/* ── Pagination ── */
const Pagination = ({ page, total, totalPages, pageSize, onPageChange }) => {
  if (totalPages <= 1) return null;
  const from  = (page - 1) * pageSize + 1;
  const to    = Math.min(page * pageSize, total);
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
    .reduce((acc, p, i, arr) => { if (i > 0 && p - arr[i-1] > 1) acc.push('…'); acc.push(p); return acc; }, []);
  return (
    <div className="px-6 py-4 bg-white border-t border-slate-100 flex items-center justify-between">
      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Showing {from}–{to} of {total}</span>
      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange(page - 1)} disabled={page === 1}
          className="p-1.5 rounded-lg border border-slate-100 text-slate-400 hover:border-[#003399]/30 hover:text-[#003399] disabled:opacity-40 transition-colors">
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        {pages.map((p, i) => p === '…'
          ? <span key={`e${i}`} className="px-1.5 text-slate-400 text-xs">…</span>
          : <button key={p} onClick={() => onPageChange(p)}
              className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${
                p === page
                  ? 'bg-[#003399] text-white shadow-md shadow-blue-500/10'
                  : 'border border-slate-100 text-slate-500 hover:border-[#003399]/30 hover:text-[#003399]'}`}>
              {p}
            </button>
        )}
        <button onClick={() => onPageChange(page + 1)} disabled={page === totalPages}
          className="p-1.5 rounded-lg border border-slate-100 text-slate-400 hover:border-[#003399]/30 hover:text-[#003399] disabled:opacity-40 transition-colors">
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════ */
const JobManagement = () => {
  const toast    = useToast();
  const navigate = useNavigate();

  const [loading,      setLoading]      = useState(true);
  const [jobs,         setJobs]         = useState([]);
  const [searchTerm,   setSearchTerm]   = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page,         setPage]         = useState(1);
  const [stats,        setStats]        = useState({ total: 0, active: 0, closed: 0, draft: 0 });

  useEffect(() => { fetchJobs(); }, []);
  useEffect(() => { setPage(1); }, [searchTerm, filterStatus]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await collegeAdminAPI.getJobs();
      if (response.success) {
        const sorted = (response.jobs || []).sort(
          (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        );
        setJobs(sorted);
        calcStats(sorted);
      }
    } catch (err) {
      toast.error('Error', 'Failed to fetch jobs: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const calcStats = (list) => {
    setStats({
      total:  list.length,
      active: list.filter(j => j.status === 'Active').length,
      closed: list.filter(j => j.status === 'Closed').length,
      draft:  list.filter(j => j.status === 'Draft').length,
    });
  };

  const handleTogglePin = async (jobId, currentPinStatus) => {
    try {
      await jobAPI.togglePinJob(jobId);
      setJobs(jobs.map(job => job._id === jobId ? { ...job, isPinned: !currentPinStatus } : job));
      toast.success('Success', `Job ${currentPinStatus ? 'unpinned' : 'pinned'} successfully`);
    } catch (err) {
      toast.error('Error', 'Failed to toggle pin: ' + err.message);
      fetchJobs();
    }
  };

  const handleStatusChange = async (jobId, newStatus) => {
    try {
      await jobAPI.updateJobStatus(jobId, newStatus);
      const updated = jobs.map(job => job._id === jobId ? { ...job, status: newStatus } : job);
      setJobs(updated);
      calcStats(updated);
      toast.success('Success', `Job status updated to ${newStatus}`);
    } catch (err) {
      toast.error('Error', 'Failed to update status: ' + err.message);
      fetchJobs();
    }
  };

  const handleDeleteJob = async (jobId, jobTitle) => {
    if (!confirm(`Are you sure you want to delete "${jobTitle}"? This action cannot be undone.`)) return;
    try {
      await jobAPI.deleteJob(jobId);
      toast.success('Success', 'Job deleted successfully');
      fetchJobs();
    } catch (err) {
      toast.error('Error', 'Failed to delete job: ' + err.message);
    }
  };

  const getStatusStyle = (s) => ({
    Active:    'bg-green-50 text-green-700 border border-green-200',
    Closed:    'bg-gray-100 text-gray-600 border border-gray-200',
    Draft:     'bg-amber-50 text-amber-700 border border-amber-200',
    Cancelled: 'bg-red-50 text-red-600 border border-red-200',
  }[s] || 'bg-gray-100 text-gray-600');

  const getJobTypeStyle = (t) => ({
    'Full-Time':        'bg-[#003399]/5 text-[#003399]',
    'Internship':       'bg-violet-50 text-violet-700',
    'Internship + FTE': 'bg-indigo-50 text-indigo-700',
  }[t] || 'bg-gray-100 text-gray-600');

  const getCompanyName = (job) =>
    (typeof job.companyId === 'object' ? job.companyId?.name : null) || job.companyName || 'N/A';

  const getPackageDisplay = (job) => {
    const min = job.package?.ctc?.min;
    const max = job.package?.ctc?.max;
    if (min == null) return 'N/A';
    return max && max !== min ? `₹${min}–₹${max} LPA` : `₹${min} LPA`;
  };

  const filtered = jobs.filter(job => {
    const company = getCompanyName(job);
    const matchSearch =
      job.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.jobCode?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchSearch && (!filterStatus || job.status === filterStatus);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  /* job-type mini chart */
  const typeMap = {};
  jobs.forEach(j => { const k = j.jobType || 'Other'; typeMap[k] = (typeMap[k]||0)+1; });
  const topTypes = Object.entries(typeMap).sort((a,b) => b[1]-a[1]).slice(0, 4);
  const maxType  = topTypes[0]?.[1] || 1;

  if (loading) return <TableSkeleton layout={CollegeAdminLayout} />;

  return (
    <CollegeAdminLayout>
      <div className="px-6 py-4 md:px-8 md:py-6 space-y-5 font-sans">

      {/* ══ HEADER ══ */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span className="w-2 h-8 bg-gradient-to-b from-[#003399] to-[#00A9CE] rounded-full inline-block flex-shrink-0" />
                Job <span className="text-[#003399]">Management</span>
              </h1>
              <p className="text-sm text-slate-400 mt-1 font-medium">
                Manage campus placement opportunities · {stats.total} total
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={() => navigate('/dashboard/college-admin/jobs/create')}
                className="inline-flex items-center gap-1.5 bg-[#003399] hover:bg-[#002d8b] text-white text-[11px] font-black uppercase tracking-wider px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-500/10 active:scale-95">
                <Plus className="w-4 h-4"/> Create Job
              </button>
            </div>
          </div>

      {/* Stats + job-type mini chart */}
      <div className="hidden grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <StatPill icon={Briefcase}   label="Total"  value={stats.total}  color="blue"  />
            <StatPill icon={CircleCheck} label="Active" value={stats.active} color="green" />
            <StatPill icon={CircleX}     label="Closed" value={stats.closed} color="gray"  />
            <StatPill icon={CircleDashed} label="Draft" value={stats.draft}  color="amber" />
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 bg-[#003399] rounded-md flex items-center justify-center">
              <TrendingUp className="w-2.5 h-2.5 text-white" />
            </div>
            <p className="text-xs font-bold text-gray-800">Job Types</p>
          </div>
          <div className="space-y-2">
            {topTypes.length > 0 ? topTypes.map(([name, count]) => (
              <div key={name}>
                <div className="flex justify-between mb-0.5">
                  <span className="text-[10px] text-gray-600 font-medium truncate max-w-[100px]">{name}</span>
                  <span className="text-[10px] font-black text-[#003399]">{count}</span>
                </div>
                <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#003399] to-[#00A9CE] transition-all duration-700"
                    style={{ width: `${Math.round((count/maxType)*100)}%` }} />
                </div>
              </div>
            )) : <p className="text-[10px] text-slate-400 text-center py-2">No data yet</p>}
          </div>
        </div>
      </div>

      {/* ══ MAIN PANEL ══ */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-100 flex flex-col">
          <div className="p-4 border-b border-slate-100">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search by job title, company, or job code…" value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 text-xs font-bold border border-slate-100 rounded-xl focus:outline-none focus:border-[#003399]/30 bg-white"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-gray-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <div className="relative flex items-center">
              <Filter className="absolute left-3 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                className="pl-8 pr-8 py-2.5 text-xs font-bold border border-slate-100 rounded-xl focus:outline-none focus:border-[#003399]/30 bg-white appearance-none transition-colors"
              >
                <option value="">All Status</option>
                <option value="Active">Active</option>
                <option value="Closed">Closed</option>
                <option value="Draft">Draft</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            <button onClick={fetchJobs} disabled={loading}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-black bg-white text-slate-500 border border-slate-100 rounded-xl hover:border-[#003399]/30 hover:text-[#003399] disabled:opacity-60 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
          <div className="flex-1 overflow-hidden">
        <div className="overflow-x-auto">
          {paginated.length > 0 ? (
            <table className="w-full table-fixed">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left w-[60px]">
                    S.No
                  </th>
                  <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left w-[180px]">
                    Job Title
                  </th>
                  <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left w-[150px]">
                    Company
                  </th>
                  <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left w-[120px]">
                    Type
                  </th>
                  <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left w-[140px]">
                    Package
                  </th>
                  <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left w-[110px]">
                    Applications
                  </th>
                  <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left w-[120px]">
                    Deadline
                  </th>
                  <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left w-[110px]">
                    Status
                  </th>
                  <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-[80px]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginated.map((job, index) => {
                  const sNo = (page - 1) * PAGE_SIZE + index + 1;
                  return (
                    <tr key={job._id} className="hover:bg-slate-50/30 transition-colors group">
                      <td className="px-4 py-4 text-xs font-bold text-slate-400">
                        {String(sNo).padStart(2, '0')}
                      </td>
                      <td className="px-4 py-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1">
                            {job.isPinned && <Pin className="w-3 h-3 text-[#00A9CE] flex-shrink-0" fill="currentColor" />}
                            <p className="text-sm font-bold text-slate-800 truncate w-full">{job.jobTitle}</p>
                          </div>
                          {job.jobCode && <p className="text-[10px] text-slate-400 font-mono w-full truncate">{job.jobCode}</p>}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5 truncate w-full">
                          <Building2 className="w-3 h-3 text-slate-300 flex-shrink-0" />
                          <span className="text-xs font-medium text-slate-700 truncate w-full">{getCompanyName(job)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-lg ${getJobTypeStyle(job.jobType)}`}>
                          {job.jobType || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-xs font-semibold text-gray-800 truncate">
                        {getPackageDisplay(job)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3 h-3 text-slate-400 flex-shrink-0" />
                          <span className="text-xs font-semibold text-gray-800">{job.stats?.totalApplications || 0}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                          {job.dates?.applicationDeadline
                            ? new Date(job.dates.applicationDeadline).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })
                            : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <select value={job.status} onChange={e => handleStatusChange(job._id, e.target.value)}
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-lg focus:outline-none cursor-pointer w-full ${getStatusStyle(job.status)}`}>
                          <option value="Active">Active</option>
                          <option value="Draft">Draft</option>
                          <option value="Closed">Closed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center">
                          <ActionMenu actions={[
                            { label: job.isPinned ? 'Unpin' : 'Pin', icon: job.isPinned ? Pin : PinOff, onClick: () => handleTogglePin(job._id, job.isPinned) },
                            { label: 'Matched Students', icon: Target, onClick: () => navigate(`/dashboard/college-admin/jobs/${job._id}/matched-students`), color: 'text-violet-600 hover:bg-violet-50' },
                            { label: 'View', icon: Eye, onClick: () => navigate(`/dashboard/college-admin/jobs/view/${job._id}`), color: 'text-[#003399] hover:bg-slate-50' },
                            { label: 'Edit', icon: SquarePen, onClick: () => navigate(`/dashboard/college-admin/jobs/edit/${job._id}`), color: 'text-emerald-600 hover:bg-emerald-50' },
                            { label: 'Delete', icon: Trash2, onClick: () => handleDeleteJob(job._id, job.jobTitle), danger: true },
                          ]} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-14 h-14 bg-[#003399]/10 rounded-2xl flex items-center justify-center mb-3">
                <Briefcase className="w-7 h-7 text-white/60" />
              </div>
              <p className="text-sm font-semibold text-gray-600">No jobs found</p>
              <p className="text-xs text-slate-400 mt-1">
                {searchTerm || filterStatus ? 'Try adjusting your filters' : 'Get started by creating your first job'}
              </p>
              {!searchTerm && !filterStatus && (
                <button onClick={() => navigate('/dashboard/college-admin/jobs/create')}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#003399] to-[#00A9CE] text-white shadow-sm hover:scale-105 transition-all"
                ><Plus className="w-3 h-3" /> Create First Job</button>
              )}
            </div>
          )}
        </div>
        <Pagination page={page} total={filtered.length} totalPages={totalPages} pageSize={PAGE_SIZE} onPageChange={setPage} />
          </div>
        </div>

    </div>

    </CollegeAdminLayout>
  );
};

export default JobManagement;