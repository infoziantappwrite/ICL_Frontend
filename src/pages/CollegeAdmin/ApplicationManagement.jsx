// pages/CollegeAdmin/ApplicationManagement.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  Filter,
  Eye,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft,
  FileText,
  Briefcase,
  Mail,
  Phone,
  Calendar,
  Award,
  TrendingUp,
} from 'lucide-react';
import { applicationAPI } from '../../api/Api';

const ApplicationManagement = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterJob, setFilterJob] = useState('all');
  const [jobs, setJobs] = useState([]);
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
      const response = await applicationAPI.getAllApplications();
      
      if (response.success) {
        setApplications(response.applications);
        calculateStats(response.applications);
        extractJobs(response.applications);
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
    const pending = applicationsList.filter(a => a.status === 'Pending').length;
    const selected = applicationsList.filter(a => a.status === 'Selected').length;
    const rejected = applicationsList.filter(a => a.status === 'Rejected').length;
    setStats({ total, pending, selected, rejected });
  };

  const extractJobs = (applicationsList) => {
    const uniqueJobs = [...new Set(
      applicationsList
        .map(a => a.jobId)
        .filter(Boolean)
    )];
    setJobs(uniqueJobs);
  };

  const handleStatusChange = async (applicationId, newStatus) => {
    try {
      await applicationAPI.updateApplicationStatus(applicationId, newStatus);
      setApplications(applications.map(app =>
        app._id === applicationId ? { ...app, status: newStatus } : app
      ));
      calculateStats(applications.map(app =>
        app._id === applicationId ? { ...app, status: newStatus } : app
      ));
    } catch (error) {
      alert('Failed to update status: ' + error.message);
    }
  };

  const filteredApplications = applications.filter(application => {
    const matchesSearch = 
      application.studentId?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      application.studentId?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      application.jobId?.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      application.companyId?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      filterStatus === 'all' || application.status === filterStatus;
    
    const matchesJob = 
      filterJob === 'all' || application.jobId?._id === filterJob;
    
    return matchesSearch && matchesStatus && matchesJob;
  });

  const getStatusBadge = (status) => {
    const badges = {
      'Pending': { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200', icon: Clock },
      'Selected': { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200', icon: CheckCircle },
      'Rejected': { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200', icon: XCircle },
    };
    return badges[status] || badges.Pending;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate('/dashboard/college-admin')}
          className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Back to Dashboard</span>
        </button>

        {/* Header */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500 rounded-3xl p-8 shadow-2xl shadow-blue-500/30">
            <div className="flex items-center justify-between">
              <div className="text-white">
                <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                  <Users className="w-8 h-8" />
                  Student Applications
                </h1>
                <p className="text-blue-100 text-lg">
                  Manage and track student job applications
                </p>
              </div>
              <div className="hidden md:block">
                <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <FileText className="w-12 h-12 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={<FileText className="w-6 h-6" />}
            label="Total Applications"
            value={stats.total}
            color="blue"
          />
          <StatCard
            icon={<Clock className="w-6 h-6" />}
            label="Pending"
            value={stats.pending}
            color="yellow"
          />
          <StatCard
            icon={<CheckCircle className="w-6 h-6" />}
            label="Selected"
            value={stats.selected}
            color="green"
          />
          <StatCard
            icon={<XCircle className="w-6 h-6" />}
            label="Rejected"
            value={stats.rejected}
            color="red"
          />
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
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="pl-11 pr-8 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white min-w-[180px]"
              >
                <option value="all">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Selected">Selected</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Applications List */}
        {filteredApplications.length > 0 ? (
          <div className="space-y-4">
            {filteredApplications.map((application) => (
              <ApplicationCard
                key={application._id}
                application={application}
                onStatusChange={handleStatusChange}
                getStatusBadge={getStatusBadge}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-16 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium mb-2">No applications found</p>
            <p className="text-gray-400">
              {searchTerm || filterStatus !== 'all'
                ? 'Try adjusting your search or filters'
                : 'No student applications yet'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ icon, label, value, color }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    red: 'bg-red-50 text-red-600 border-red-200',
  };

  return (
    <div className={`bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border-2 ${colors[color]}`}>
      <div className="flex items-center gap-3">
        <div className={`p-3 rounded-xl ${colors[color]}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium opacity-80">{label}</p>
          <p className="text-3xl font-bold">{value}</p>
        </div>
      </div>
    </div>
  );
};

// Application Card Component
const ApplicationCard = ({ application, onStatusChange, getStatusBadge }) => {
  const [showDetails, setShowDetails] = useState(false);
  const statusBadge = getStatusBadge(application.status);
  const StatusIcon = statusBadge.icon;

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 overflow-hidden hover:shadow-2xl transition-all duration-300">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg text-gray-900 truncate flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600 flex-shrink-0" />
              {application.studentId?.fullName || 'N/A'}
            </h3>
            <p className="text-sm text-gray-600 truncate mt-1">
              <Briefcase className="inline w-4 h-4 mr-1" />
              {application.jobId?.jobTitle || 'N/A'} • {application.companyId?.name || 'N/A'}
            </p>
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Applied on: {new Date(application.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}>
            <StatusIcon className="w-4 h-4" />
            <span className="text-sm font-semibold">{application.status}</span>
          </div>
        </div>

        {/* Student Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 rounded-xl">
          {application.studentId?.email && (
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="truncate">{application.studentId.email}</span>
            </div>
          )}
          {application.studentId?.phone && (
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span>{application.studentId.phone}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium text-sm flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            {showDetails ? 'Hide Details' : 'View Details'}
          </button>

          {application.status === 'Pending' && (
            <>
              <button
                onClick={() => onStatusChange(application._id, 'Selected')}
                className="px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors font-medium text-sm flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Accept
              </button>
              <button
                onClick={() => onStatusChange(application._id, 'Rejected')}
                className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium text-sm flex items-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Reject
              </button>
            </>
          )}

          {application.status !== 'Pending' && (
            <select
              value={application.status}
              onChange={(e) => onStatusChange(application._id, e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm font-medium"
            >
              <option value="Pending">Pending</option>
              <option value="Selected">Selected</option>
              <option value="Rejected">Rejected</option>
            </select>
          )}
        </div>

        {/* Expandable Details */}
        {showDetails && (
          <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">CGPA</p>
                <p className="text-sm font-medium text-gray-900">
                  {application.studentId?.cgpa || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Graduation Year</p>
                <p className="text-sm font-medium text-gray-900">
                  {application.studentId?.graduationYear || 'N/A'}
                </p>
              </div>
            </div>
            {application.studentId?.resumeUrl && (
              <a
                href={application.studentId.resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors font-medium text-sm"
              >
                <Download className="w-4 h-4" />
                Download Resume
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ApplicationManagement;