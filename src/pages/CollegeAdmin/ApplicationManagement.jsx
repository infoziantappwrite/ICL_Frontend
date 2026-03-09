// pages/CollegeAdmin/ApplicationManagement.jsx
import { useToast } from '../../context/ToastContext';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Search, Eye, CircleCheck, CircleX, Clock,
  FileText, Briefcase, Calendar, Building2,
  ChevronLeft, ChevronRight, RefreshCw, ListFilter,
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { collegeAdminAPI } from '../../api/Api';

const PER_PAGE = 10;

const Pagination = ({ page, totalPages, total, perPage, onPrev, onNext }) => {
  if (totalPages <= 1) return null;
  const from = (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);
  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
      <span className="text-xs text-gray-500">Showing {from}–{to} of {total}</span>
      <div className="flex items-center gap-2">
        <button onClick={onPrev} disabled={page === 1}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          <ChevronLeft className="w-3.5 h-3.5" /> Prev
        </button>
        <span className="text-xs text-gray-500 px-1">{page} / {totalPages}</span>
        <button onClick={onNext} disabled={page === totalPages}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
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
        // Sort newest first
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
      pending:  list.filter(a => a.status === 'Pending' || a.status === 'Submitted').length,
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
    'Submitted':   'bg-blue-100 text-blue-700',
    'Pending':     'bg-yellow-100 text-yellow-700',
    'Selected':    'bg-green-100 text-green-700',
    'Rejected':    'bg-red-100 text-red-700',
    'Shortlisted': 'bg-purple-100 text-purple-700',
    'Interviewing':'bg-indigo-100 text-indigo-700',
  }[status] || 'bg-yellow-100 text-yellow-700');

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
    <DashboardLayout title="Application Management">
      {/* Header */}
      <div className="mb-6">
        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 rounded-2xl p-6 shadow-xl">
          <div className="text-white">
            <h1 className="text-xl font-bold mb-1 flex items-center gap-3">
              <FileText className="w-5 h-5" /> Application Management
            </h1>
            <p className="text-blue-100 text-sm">Track and manage student applications</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Applications', value: stats.total,    grad: 'from-blue-500 to-cyan-500',    Icon: FileText,   tc: 'text-gray-900'   },
          { label: 'Pending',            value: stats.pending,  grad: 'from-amber-400 to-yellow-500', Icon: Clock,      tc: 'text-amber-600'  },
          { label: 'Selected',           value: stats.selected, grad: 'from-green-500 to-emerald-500', Icon: CircleCheck, tc: 'text-green-600' },
          { label: 'Rejected',           value: stats.rejected, grad: 'from-slate-500 to-slate-600',  Icon: CircleX,    tc: 'text-red-600'    },
        ].map(({ label, value, grad, Icon, tc }) => (
          <div key={label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs font-medium mb-1">{label}</p>
                <p className={`text-2xl font-bold ${tc}`}>{value}</p>
              </div>
              <div className={`w-11 h-11 bg-gradient-to-br ${grad} rounded-xl flex items-center justify-center shadow`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-white/60 mb-5">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
            <input type="text" placeholder="Search by student name, email, job title, or company..."
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent text-sm" />
          </div>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent text-sm text-gray-700">
            <option value="all">All Status</option>
            <option value="Submitted">Submitted</option>
            <option value="Pending">Pending</option>
            <option value="Shortlisted">Shortlisted</option>
            <option value="Interviewing">Interviewing</option>
            <option value="Selected">Selected</option>
            <option value="Rejected">Rejected</option>
          </select>
          <button onClick={fetchApplications}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl hover:opacity-90 transition-all shadow-sm">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/60 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50">
          <p className="font-semibold text-gray-800 text-sm">{filteredApplications.length} Applications</p>
        </div>
        <div className="overflow-x-auto">
          {paginated.length > 0 ? (
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-gray-100">
                <tr>
                  {['Student','Job Title','Company','Applied Date','Status','Actions'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginated.map((application) => (
                  <tr key={application._id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                          {application.studentId?.fullName?.charAt(0) || 'S'}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 text-sm">{application.studentId?.fullName || 'N/A'}</div>
                          <div className="text-xs text-gray-400">{application.studentId?.email || 'N/A'}</div>
                          {application.studentId?.studentInfo?.rollNumber && (
                            <div className="text-xs text-gray-400">Roll: {application.studentId.studentInfo.rollNumber}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">{application.jobId?.jobTitle || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-sm text-gray-700">{application.companyId?.name || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-sm">
                          {application.createdAt ? new Date(application.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select value={application.status} onChange={(e) => handleStatusChange(application._id, e.target.value)}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-full border-0 cursor-pointer ${getStatusBadge(application.status)}`}>
                        <option value="Submitted">Submitted</option>
                        <option value="Pending">Pending</option>
                        <option value="Shortlisted">Shortlisted</option>
                        <option value="Interviewing">Interviewing</option>
                        <option value="Selected">Selected</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <button onClick={() => navigate(`/dashboard/college-admin/applications/${application._id}`)}
                        className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="View Details">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-16">
              <FileText className="w-14 h-14 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No applications found</p>
              <p className="text-gray-400 text-sm mt-1">
                {searchTerm || filterStatus !== 'all' ? 'Try adjusting your search or filters' : 'Applications will appear here once students start applying'}
              </p>
            </div>
          )}
        </div>
        <Pagination page={page} totalPages={totalPages} total={filteredApplications.length} perPage={PER_PAGE}
          onPrev={() => setPage(p => Math.max(1, p - 1))}
          onNext={() => setPage(p => Math.min(totalPages, p + 1))}
        />
      </div>
    </DashboardLayout>
  );
};

export default ApplicationManagement;