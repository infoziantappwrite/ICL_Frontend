// src/pages/CollegeAdmin/ApplicationManagement.jsx
import { useToast } from '../../context/ToastContext';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Search, Eye, CircleCheck, CircleX, Clock,
  FileText, Briefcase, Calendar, Building2,
  ChevronLeft, ChevronRight, RefreshCw, ListFilter,
} from 'lucide-react';
import CollegeAdminLayout from '../../components/layout/CollegeAdminLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ActionMenu from '../../components/common/ActionMenu';
import { collegeAdminAPI } from '../../api/Api';

const PER_PAGE = 10;

const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] border border-gray-100 ${className}`}>
    {children}
  </div>
);

const Pagination = ({ page, totalPages, total, perPage, onPrev, onNext }) => {
  if (totalPages <= 1) return null;
  const from = (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);
  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-white rounded-b-xl">
      <span className="text-[12px] text-gray-500 font-medium">Showing {from}–{to} of {total}</span>
      <div className="flex items-center gap-2">
        <button onClick={onPrev} disabled={page === 1}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-bold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          <ChevronLeft className="w-3.5 h-3.5" /> Prev
        </button>
        <span className="text-[12px] font-bold text-gray-700 px-2">{page} / {totalPages}</span>
        <button onClick={onNext} disabled={page === totalPages}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-bold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          Next <ChevronRight className="w-3.5 h-3.5" />
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
    'Submitted':   'bg-blue-50 text-blue-700',
    'Pending':     'bg-amber-50 text-amber-700',
    'Selected':    'bg-emerald-50 text-emerald-700',
    'Rejected':    'bg-red-50 text-red-700',
    'Shortlisted': 'bg-indigo-50 text-indigo-700',
    'Interviewing':'bg-fuchsia-50 text-fuchsia-700',
  }[status] || 'bg-gray-50 text-gray-700');

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
      <div className="min-h-screen bg-[#f0f4f8] px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4">
        <div className="max-w-[1240px] mx-auto space-y-3 sm:space-y-4">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
            <div>
              <h1 className="text-[20px] md:text-[26px] font-bold text-gray-900 tracking-tight">
                Application <span className="text-blue-600">Management</span>
              </h1>
              <p className="text-[12px] md:text-[14px] text-gray-500 mt-1">
                Track, review, and manage student job applications.
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
            {[
              { label: 'Total Applications', value: stats.total,    bg: 'bg-blue-50',     tc: 'text-blue-700',   Icon: FileText },
              { label: 'In Progress',        value: stats.pending,  bg: 'bg-amber-50',    tc: 'text-amber-700',  Icon: Clock },
              { label: 'Selected',           value: stats.selected, bg: 'bg-emerald-50',  tc: 'text-emerald-700',Icon: CircleCheck },
              { label: 'Rejected',           value: stats.rejected, bg: 'bg-red-50',      tc: 'text-red-700',    Icon: CircleX },
            ].map(({ label, value, bg, tc, Icon }) => (
              <Card key={label} className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-[12px] font-bold text-gray-500 mb-0.5">{label}</p>
                  <p className={`text-[24px] font-black ${tc} leading-none`}>{value}</p>
                </div>
                <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${tc}`} />
                </div>
              </Card>
            ))}
          </div>

          {/* Filters & Table */}
          <Card className="flex flex-col overflow-hidden">
            
            {/* Toolbar */}
            <div className="p-4 border-b border-gray-100 bg-white flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Search by student, job, or company..."
                  value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-shadow" />
              </div>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2.5 text-[13px] font-semibold text-gray-700 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm cursor-pointer bg-white min-w-[140px]">
                <option value="all">Check All Status</option>
                <option value="Submitted">Submitted</option>
                <option value="Pending">Pending</option>
                <option value="Shortlisted">Shortlisted</option>
                <option value="Interviewing">Interviewing</option>
                <option value="Selected">Selected</option>
                <option value="Rejected">Rejected</option>
              </select>
              <button onClick={fetchApplications} className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-[13px] font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              {paginated.length > 0 ? (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      {['Student','Job Title','Company','Applied Date','Status','Actions'].map(h => (
                        <th key={h} className="px-5 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {paginated.map((application) => (
                      <tr key={application._id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-blue-50 text-blue-700 rounded-xl flex items-center justify-center font-black text-[13px] flex-shrink-0">
                              {application.studentId?.fullName?.charAt(0) || 'S'}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-gray-900 text-[13px] truncate">{application.studentId?.fullName || 'N/A'}</p>
                              <p className="text-[11px] text-gray-500 truncate">{application.studentId?.email || 'N/A'}</p>
                              {application.studentId?.studentInfo?.rollNumber && (
                                <p className="text-[10px] text-gray-400 font-mono mt-0.5">{application.studentId.studentInfo.rollNumber}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-[13px] font-bold text-gray-900 truncate max-w-[150px]">{application.jobId?.jobTitle || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-[12px] font-semibold text-gray-700 truncate max-w-[120px]">{application.companyId?.name || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-[12px] font-medium">
                              {application.createdAt ? new Date(application.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : 'N/A'}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <select value={application.status} onChange={(e) => handleStatusChange(application._id, e.target.value)}
                            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border border-transparent shadow-sm appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-400 ${getStatusBadge(application.status)}`}>
                            <option value="Submitted">Submitted</option>
                            <option value="Pending">Pending</option>
                            <option value="Shortlisted">Shortlisted</option>
                            <option value="Interviewing">Interviewing</option>
                            <option value="Selected">Selected</option>
                            <option value="Rejected">Rejected</option>
                          </select>
                        </td>
                        <td className="px-5 py-3.5">
                          <ActionMenu actions={[
                            { label: 'View Details', icon: Eye, onClick: () => navigate(`/dashboard/college-admin/applications/${application._id}`), color: 'text-blue-600 hover:bg-blue-50' },
                          ]} />
                        </td>
                      </tr>
                    ))}
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