// src/pages/CollegeAdmin/ApplicationManagement.jsx
import { useToast } from '../../context/ToastContext';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Search, Eye, CircleCheck, CircleX, Clock,
  FileText, Briefcase, Calendar, Building2,
  ChevronLeft, ChevronRight, RefreshCw, ListFilter, X,
} from 'lucide-react';
import CollegeAdminLayout from '../../components/layout/CollegeAdminLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ActionMenu from '../../components/common/ActionMenu';
import { collegeAdminAPI } from '../../api/Api';

const PER_PAGE = 10;

const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-slate-100 ${className}`}>
    {children}
  </div>
);

const Pagination = ({ page, totalPages, total, perPage, onPrev, onNext }) => {
  if (totalPages <= 1) return null;
  const from = (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);
  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-white rounded-b-xl">
      <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Showing {from}–{to} of {total}</span>
      <div className="flex items-center gap-1">
        <button onClick={onPrev} disabled={page === 1}
          className="p-1.5 rounded-lg border border-slate-100 text-slate-400 hover:border-[#003399]/30 hover:text-[#003399] disabled:opacity-40 transition-colors">
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        <span className="text-[12px] font-bold text-gray-700 px-2">{page} / {totalPages}</span>
        <button onClick={onNext} disabled={page === totalPages}
          className="p-1.5 rounded-lg border border-slate-100 text-slate-400 hover:border-[#003399]/30 hover:text-[#003399] disabled:opacity-40 transition-colors">
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

const ApplicationManagement = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [stats, setStats] = useState({ total: 0, pending: 0, selected: 0, rejected: 0 });

  useEffect(() => { fetchApplications(); }, []);
  useEffect(() => { setPage(1); }, [searchTerm, filterStatus]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await collegeAdminAPI.getApplications();
      if (response.success) {
        const sorted = (response.applications || []).sort(
          (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        );
        setApplications(sorted);
        calculateStats(sorted);
      }
    } catch (error) {
      toast.error('Error', 'Failed to fetch applications: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (list) => {
    setStats({
      total:    list.length,
      pending:  list.filter(a => a.status === 'Pending' || a.status === 'Submitted' || a.status === 'Shortlisted' || a.status === 'Interviewing').length,
      selected: list.filter(a => a.status === 'Selected').length,
      rejected: list.filter(a => a.status === 'Rejected').length,
    });
  };

  const handleStatusChange = async (applicationId, newStatus) => {
    try {
      await collegeAdminAPI.updateApplicationStatus(applicationId, { status: newStatus });
      const updated = applications.map(app =>
        app._id === applicationId ? { ...app, status: newStatus } : app
      );
      setApplications(updated);
      calculateStats(updated);
      toast.success('Success', `Application status updated to ${newStatus}`);
    } catch (error) {
      toast.error('Error', 'Failed to update status: ' + error.message);
    }
  };

  const getStatusBadge = (status) => ({
    'Submitted':   'bg-[#003399]/5 text-[#003399] border-[#003399]/10',
    'Pending':     'bg-amber-50 text-amber-700 border-amber-200',
    'Selected':    'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Rejected':    'bg-red-50 text-red-700 border-red-200',
    'Shortlisted': 'bg-indigo-50 text-indigo-700 border-indigo-200',
    'Interviewing':'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
  }[status] || 'bg-gray-50 text-gray-700 border-gray-200');

  const filteredApplications = applications.filter(application => {
    const matchesSearch =
      application.studentId?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      application.studentId?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      application.jobId?.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      application.companyId?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || application.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredApplications.length / PER_PAGE);
  const paginated = filteredApplications.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  if (loading) return <LoadingSpinner message="Loading Applications..." />;

  return (
    <CollegeAdminLayout>
      <div className="px-6 py-4 md:px-8 md:py-6 space-y-5 font-sans">
        <div className="max-w-[1240px] mx-auto space-y-3 sm:space-y-4">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span className="w-2 h-8 bg-gradient-to-b from-[#003399] to-[#00A9CE] rounded-full inline-block flex-shrink-0" />
                Application <span className="text-[#003399]">Management</span>
              </h1>
              <p className="text-sm text-slate-400 mt-1 font-medium">
                Track, review, and manage student job applications.
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Applications', value: stats.total,    color: 'navy',  Icon: FileText },
              { label: 'In Progress',        value: stats.pending,  color: 'amber', Icon: Clock },
              { label: 'Selected',           value: stats.selected, color: 'green', Icon: CircleCheck },
              { label: 'Rejected',           value: stats.rejected, color: 'red',   Icon: CircleX },
            ].map(({ label, value, color, Icon }) => {
              const themes = {
                navy:  { wrap: 'bg-[#003399]/5 text-[#003399] border-[#003399]/10', val: '#003399' },
                amber: { wrap: 'bg-amber-50 text-amber-600 border-amber-100', val: '#d97706' },
                green: { wrap: 'bg-emerald-50 text-emerald-600 border-emerald-100', val: '#059669' },
                red:   { wrap: 'bg-rose-50 text-rose-600 border-rose-100', val: '#e11d48' },
              };
              const t = themes[color];
              return (
                <div key={label} className="group bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${t.wrap} transition-transform group-hover:scale-110`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[28px] font-black leading-none mb-1" style={{ color: t.val }}>{value}</p>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">{label}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Filters & Table */}
          <Card className="flex flex-col overflow-hidden">
            
            {/* Toolbar */}
            <div className="p-4 border-b border-slate-100 bg-white flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" placeholder="Search by student, job, or company..."
                  value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-8 py-2.5 text-xs font-bold border border-slate-100 rounded-xl focus:outline-none focus:border-[#003399]/30 bg-white" />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-gray-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                  className="pl-4 pr-8 py-2.5 text-xs font-bold border border-slate-100 rounded-xl focus:outline-none focus:border-[#003399]/30 bg-white appearance-none cursor-pointer min-w-[160px]">
                  <option value="all">Check All Status</option>
                  <option value="Submitted">Submitted</option>
                  <option value="Pending">Pending</option>
                  <option value="Shortlisted">Shortlisted</option>
                  <option value="Interviewing">Interviewing</option>
                  <option value="Selected">Selected</option>
                  <option value="Rejected">Rejected</option>
                </select>
                <button onClick={fetchApplications} className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-black bg-white text-slate-500 border border-slate-100 rounded-xl hover:border-[#003399]/30 hover:text-[#003399] transition-all">
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              {paginated.length > 0 ? (
                <table className="w-full table-fixed">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left w-[60px]">S.No</th>
                      <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left w-[200px]">Student</th>
                      <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left w-[180px]">Job Title</th>
                      <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left w-[150px]">Company</th>
                      <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left w-[140px]">Applied Date</th>
                      <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left w-[130px]">Status</th>
                      <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-[80px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {paginated.map((application, index) => {
                      const sNo = (page - 1) * PER_PAGE + index + 1;
                      return (
                        <tr key={application._id} className="hover:bg-slate-50/30 transition-colors group">
                          <td className="px-5 py-4 text-xs font-bold text-slate-400">
                            {String(sNo).padStart(2, '0')}
                          </td>
                          <td className="px-5 py-4">
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-slate-800 truncate w-full">{application.studentId?.fullName || 'N/A'}</p>
                              <p className="text-[10px] text-slate-400 truncate w-full">{application.studentId?.email || 'N/A'}</p>
                              {application.studentId?.studentInfo?.rollNumber && (
                                <p className="text-[10px] text-slate-400 font-mono mt-0.5">{application.studentId.studentInfo.rollNumber}</p>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <Briefcase className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                              <span className="text-xs font-bold text-slate-800 truncate w-full">{application.jobId?.jobTitle || 'N/A'}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                              <span className="text-xs font-semibold text-slate-700 truncate w-full">{application.companyId?.name || 'N/A'}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-1.5 text-slate-400 min-w-0">
                              <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                              <span className="text-[11px] font-bold uppercase tracking-widest">
                                {application.createdAt ? new Date(application.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : 'N/A'}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <select value={application.status} onChange={(e) => handleStatusChange(application._id, e.target.value)}
                              className={`px-2.5 py-1 text-[10px] font-black rounded-lg border shadow-sm appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#003399]/30 w-full ${getStatusBadge(application.status)}`}>
                              <option value="Submitted">Submitted</option>
                              <option value="Pending">Pending</option>
                              <option value="Shortlisted">Shortlisted</option>
                              <option value="Interviewing">Interviewing</option>
                              <option value="Selected">Selected</option>
                              <option value="Rejected">Rejected</option>
                            </select>
                          </td>
                          <td className="px-5 py-4 text-center">
                            <div className="flex items-center justify-center">
                              <ActionMenu actions={[
                                { label: 'View Details', icon: Eye, onClick: () => navigate(`/dashboard/college-admin/applications/${application._id}`), color: 'text-[#003399] hover:bg-slate-50' },
                              ]} />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-16">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-900 font-bold text-[15px]">No applications found</p>
                  <p className="text-gray-500 text-[13px] mt-1 max-w-[250px] mx-auto">
                    {searchTerm || filterStatus !== 'all' ? 'Try adjusting your search or filters' : 'Applications will appear here once students start applying'}
                  </p>
                </div>
              )}
            </div>
            
            <Pagination page={page} totalPages={totalPages} total={filteredApplications.length} perPage={PER_PAGE}
              onPrev={() => setPage(p => Math.max(1, p - 1))}
              onNext={() => setPage(p => Math.min(totalPages, p + 1))}
            />
          </Card>
          
        </div>
      </div>
    </CollegeAdminLayout>
  );
};

export default ApplicationManagement;