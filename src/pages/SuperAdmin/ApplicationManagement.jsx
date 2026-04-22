import { useToast } from '../../context/ToastContext';
// pages/SuperAdmin/ApplicationManagement.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiCall from '../../api/Api';
import {
  FileText,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Building2,
  Briefcase,
  Calendar,
  Filter,
  Download,
  CheckCheck,
  ChevronRight,
  TrendingUp,
  X
} from 'lucide-react';
import SuperAdminDashboardLayout from '../../components/layout/SuperAdminDashboardLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ActionMenu from '../../components/common/ActionMenu';


const ApplicationManagement = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCollege, setFilterCollege] = useState('all');
  const [colleges, setColleges] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    shortlisted: 0,
    accepted: 0,
    rejected: 0,
  });

  useEffect(() => {
    fetchColleges();
    fetchApplications();
  }, [filterStatus, filterCollege]);

  const fetchColleges = async () => {
    try {
      const data = await apiCall('/super-admin/colleges?limit=1000');
      if (data.success) {
        setColleges(data.colleges || []);
      }
    } catch (error) {
      console.error('Error fetching colleges:', error);
    }
  };

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterCollege !== 'all') params.append('collegeId', filterCollege);

      const data = await apiCall(`/super-admin/applications?${params}`);
      if (data.success) {
        setApplications(data.applications || []);
        calculateStats(data.applications || []);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      // Mock data for demonstration
      const mockApplications = [
        {
          _id: '1',
          student: { fullName: 'John Doe', email: 'john@college.edu', rollNumber: 'CS2021001' },
          job: { title: 'Software Engineer', company: { name: 'Tech Corp' } },
          college: { name: 'MIT College', code: 'MIT01' },
          status: 'pending',
          appliedDate: new Date('2024-02-10'),
        },
        {
          _id: '2',
          student: { fullName: 'Jane Smith', email: 'jane@college.edu', rollNumber: 'CS2021002' },
          job: { title: 'Data Analyst', company: { name: 'Data Inc' } },
          college: { name: 'Stanford Tech', code: 'STAN01' },
          status: 'shortlisted',
          appliedDate: new Date('2024-02-12'),
        },
      ];
      setApplications(mockApplications);
      calculateStats(mockApplications);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (applicationsList) => {
    const total = applicationsList.length;
    const pending = applicationsList.filter(a => a.status === 'pending' || a.status === 'applied').length;
    const shortlisted = applicationsList.filter(a => a.status === 'shortlisted').length;
    const accepted = applicationsList.filter(a => a.status === 'accepted' || a.status === 'hired').length;
    const rejected = applicationsList.filter(a => a.status === 'rejected').length;
    setStats({ total, pending, shortlisted, accepted, rejected });
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-700',
      applied: 'bg-yellow-100 text-yellow-700',
      shortlisted: 'bg-blue-100 text-blue-700',
      accepted: 'bg-green-100 text-green-700',
      hired: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: Clock,
      applied: Clock,
      shortlisted: FileText,
      accepted: CheckCircle,
      hired: CheckCircle,
      rejected: XCircle,
    };
    const Icon = icons[status] || Clock;
    return <Icon className="w-3 h-3" />;
  };

  const filteredApplications = applications.filter(app => {
    const matchesSearch =
      app.student?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.student?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.student?.rollNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.job?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.job?.company?.name?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const exportApplications = () => {
    // Implement CSV export
    toast.info('Info', 'Export functionality coming soon!');
  };

  if (loading) {
    return <LoadingSpinner message="Loading Applications..." />;
  }

  return (
    <SuperAdminDashboardLayout>
      <div className="px-6 py-4 md:px-8 md:py-6 space-y-5 font-sans">

        {/* Header Section */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span className="w-2 h-8 bg-gradient-to-b from-[#003399] to-[#00A9CE] rounded-full" />
              Application Management
            </h1>
            <p className="text-sm text-slate-400 mt-1 font-medium">Track and manage all student applications platform-wide.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="relative flex-1 min-w-[240px] lg:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
              <input type="text" placeholder="Search students, jobs, companies..." value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); }}
                className="w-full pl-9 pr-4 py-2.5 text-xs font-bold border border-slate-100 rounded-xl focus:outline-none focus:border-[#003399]/30 bg-white"
              />
              {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"><X className="w-3.5 h-3.5" /></button>}
            </div>

            <select value={filterCollege} onChange={e => { setFilterCollege(e.target.value); }}
              className="pl-4 pr-10 py-2.5 text-xs font-black uppercase tracking-wider border border-slate-100 rounded-xl focus:outline-none focus:border-[#003399]/30 bg-white appearance-none cursor-pointer text-slate-600"
            >
              <option value="all">All Colleges</option>
              {colleges.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>

            <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); }}
              className="pl-4 pr-10 py-2.5 text-xs font-black uppercase tracking-wider border border-slate-100 rounded-xl focus:outline-none focus:border-[#003399]/30 bg-white appearance-none cursor-pointer text-slate-600"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>

            <button onClick={exportApplications}
              className="inline-flex items-center gap-2 bg-[#003399] text-white text-[11px] font-black uppercase tracking-wider px-5 py-2.5 rounded-xl hover:bg-[#002d8b] transition-all shadow-lg shadow-blue-500/10 active:scale-95"
            >
              <Download className="w-4 h-4" /> Export Excel
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">Total Applications</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">Pending</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">Shortlisted</p>
              <p className="text-3xl font-bold text-blue-600">{stats.shortlisted}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">Accepted</p>
              <p className="text-3xl font-bold text-green-600">{stats.accepted}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-slate-500 to-slate-600 rounded-xl flex items-center justify-center shadow-lg">
                <XCircle className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">Rejected</p>
              <p className="text-3xl font-bold text-red-600">{stats.rejected}</p>
            </div>
          </div>
        </div>


        {/* Applications Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            {filteredApplications.length > 0 ? (
              <table className="w-full">
                <thead className="bg-slate-50/50 border-b border-gray-200">
                  <tr>
                    {['Student', 'Job Position', 'Company', 'College', 'Applied Date', 'Status', 'Actions'].map((h) => (
                      <th
                        key={h}
                        className={`px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left ${h === 'Actions' ? 'text-right' : ''}`}
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
                            {application.student?.fullName?.charAt(0) || 'S'}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{application.student?.fullName || 'N/A'}</div>
                            <div className="text-sm text-gray-500">{application.student?.rollNumber || 'N/A'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-blue-500" />
                          <span className="font-medium text-gray-900">{application.job?.title || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-700">{application.job?.company?.name || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-700">{application.college?.name || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span className="text-sm">
                            {application.appliedDate ? new Date(application.appliedDate).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full flex items-center gap-1 w-fit ${getStatusColor(application.status)}`}>
                          {getStatusIcon(application.status)}
                          {application.status?.charAt(0).toUpperCase() + application.status?.slice(1) || 'N/A'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <ActionMenu
                          actions={[
                            {
                              icon: Eye,
                              label: 'View Details',
                              onClick: () => navigate(`/dashboard/super-admin/applications/${application._id}`),
                              color: 'text-slate-700 hover:bg-slate-50'
                            },
                          ]}
                        />
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
                  {searchTerm || filterStatus !== 'all' || filterCollege !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'Applications will appear here once students start applying'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </SuperAdminDashboardLayout>
  );
};

export default ApplicationManagement;