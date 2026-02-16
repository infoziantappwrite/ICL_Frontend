// pages/CollegeAdmin/ApplicationManagement.jsx - Redesigned with SuperAdmin UI
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Briefcase,
  Calendar,
  Award,
  Building2,
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { collegeAdminAPI } from '../../api/Api';

const ApplicationManagement = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    selected: 0,
    rejected: 0,
  });

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await collegeAdminAPI.getApplications();
      
      if (response.success) {
        setApplications(response.applications);
        calculateStats(response.applications);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      alert('Failed to fetch applications: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (applicationsList) => {
    const total = applicationsList.length;
    const pending = applicationsList.filter(a => a.status === 'Pending' || a.status === 'Submitted').length;
    const selected = applicationsList.filter(a => a.status === 'Selected').length;
    const rejected = applicationsList.filter(a => a.status === 'Rejected').length;
    setStats({ total, pending, selected, rejected });
  };

  const handleStatusChange = async (applicationId, newStatus, remarks = '') => {
    try {
      await collegeAdminAPI.updateApplicationStatus(applicationId, { status: newStatus, remarks });
      setApplications(applications.map(app =>
        app._id === applicationId ? { ...app, status: newStatus } : app
      ));
      calculateStats(applications.map(app =>
        app._id === applicationId ? { ...app, status: newStatus } : app
      ));
      alert(`Application status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status: ' + error.message);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      'Submitted': 'bg-blue-100 text-blue-700',
      'Pending': 'bg-yellow-100 text-yellow-700',
      'Selected': 'bg-green-100 text-green-700',
      'Rejected': 'bg-red-100 text-red-700',
      'Shortlisted': 'bg-purple-100 text-purple-700',
      'Interviewing': 'bg-indigo-100 text-indigo-700',
    };
    return badges[status] || badges.Pending;
  };

  const filteredApplications = applications.filter(application => {
    const matchesSearch = 
      application.studentId?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      application.studentId?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      application.jobId?.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      application.companyId?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      filterStatus === 'all' || application.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <LoadingSpinner message="Loading Applications..." />;
  }

  return (
    <DashboardLayout title="Application Management">
      {/* Header */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 rounded-3xl p-8 shadow-2xl shadow-blue-500/30">
          <div className="flex items-center justify-between">
            <div className="text-white">
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <FileText className="w-8 h-8" />
                Application Management
              </h1>
              <p className="text-blue-100 text-lg">
                Track and manage student applications
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">Total Applications</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
              <FileText className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">Pending</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
              <Clock className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">Selected</p>
              <p className="text-3xl font-bold text-green-600">{stats.selected}</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
              <CheckCircle className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">Rejected</p>
              <p className="text-3xl font-bold text-red-600">{stats.rejected}</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
              <XCircle className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by student name, email, job title, or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="Submitted">Submitted</option>
            <option value="Pending">Pending</option>
            <option value="Shortlisted">Shortlisted</option>
            <option value="Interviewing">Interviewing</option>
            <option value="Selected">Selected</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 overflow-hidden">
        <div className="overflow-x-auto">
          {filteredApplications.length > 0 ? (
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-gray-200">
                <tr>
                  {['Student', 'Job Title', 'Company', 'Applied Date', 'Status', 'Actions'].map((h) => (
                    <th
                      key={h}
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredApplications.map((application) => (
                  <tr key={application._id} className="hover:bg-blue-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-white font-bold">
                          {application.studentId?.fullName?.charAt(0) || 'S'}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">
                            {application.studentId?.fullName || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {application.studentId?.email || 'N/A'}
                          </div>
                          {application.studentId?.studentInfo?.rollNumber && (
                            <div className="text-xs text-gray-400">
                              Roll: {application.studentId.studentInfo.rollNumber}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">
                          {application.jobId?.jobTitle || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700">
                          {application.companyId?.name || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-700">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">
                          {application.createdAt
                            ? new Date(application.createdAt).toLocaleDateString()
                            : 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={application.status}
                        onChange={(e) => handleStatusChange(application._id, e.target.value)}
                        className={`px-3 py-1 text-xs font-semibold rounded-full border-0 cursor-pointer transition-all ${getStatusBadge(application.status)}`}
                      >
                        <option value="Submitted">Submitted</option>
                        <option value="Pending">Pending</option>
                        <option value="Shortlisted">Shortlisted</option>
                        <option value="Interviewing">Interviewing</option>
                        <option value="Selected">Selected</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/dashboard/college-admin/applications/${application._id}`)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-16">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-medium mb-2">No applications found</p>
              <p className="text-gray-400">
                {searchTerm || filterStatus !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Applications will appear here once students start applying'}
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ApplicationManagement;