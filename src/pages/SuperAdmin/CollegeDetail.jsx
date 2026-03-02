import { useToast } from '../../context/ToastContext';
// pages/SuperAdmin/CollegeDetail.jsx - View College Details
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Building2, Edit, Trash2, ArrowLeft, Mail, Phone, MapPin, Globe,
  Calendar, Award, Users, Briefcase, FileText, GraduationCap,
  CheckCircle, XCircle, Plus, RefreshCw,
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import apiCall from '../../api/Api';

const CollegeDetail = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const { collegeId } = useParams();
  const [college, setCollege] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [liveCounts, setLiveCounts] = useState({
    totalStudents: 0,
    totalCompanies: 0,
    totalJDs: 0,
    activeAdmins: 0,
  });

  useEffect(() => {
    fetchCollegeDetails();
  }, [collegeId]);

  const fetchCollegeDetails = async (isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);

      const data = await apiCall(`/super-admin/colleges/${collegeId}`);

      if (data.success) {
        const c = data.college;
        setCollege(c);
        setLiveCounts({
          totalStudents: c.studentsCount ?? 0,
          totalCompanies: c.companiesCount ?? 0,
          totalJDs: c.jdsCount ?? 0,
          activeAdmins: c.adminsCount ?? 0,
        });
      } else {
        toast.error('Error', data.message || 'Failed to load college details');
      }
    } catch (error) {
      console.error('Error fetching college:', error);
      toast.error('Error', 'Error loading college details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete "${college?.name}"? This action cannot be undone.`)) {
      return;
    }
    try {
      const data = await apiCall(`/super-admin/colleges/${collegeId}`, { method: 'DELETE' });
      if (data.success) {
        toast.success('Success', 'College deleted successfully');
        navigate('/dashboard/super-admin/colleges');
      } else {
        toast.error('Error', data.message || 'Failed to delete college');
      }
    } catch (error) {
      console.error('Error deleting college:', error);
      toast.error('Error', 'Error deleting college');
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading College Details..." submessage="Fetching information" />;
  }

  if (!college) {
    return (
      <DashboardLayout>
        <div className="text-center py-16">
          <Building2 className="w-20 h-20 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-xl font-medium">College not found</p>
          <button
            onClick={() => navigate('/dashboard/super-admin/colleges')}
            className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
          >
            Back to Colleges
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={college.name}>
      <div className="mb-8 animate-fade-in">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 rounded-3xl p-8 shadow-2xl shadow-blue-500/30 overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -mr-32 -mt-32" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full -ml-32 -mb-32" />
          </div>
          <div className="relative">
            <button
              onClick={() => navigate('/dashboard/super-admin/colleges')}
              className="flex items-center gap-2 text-white/90 hover:text-white mb-4 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Colleges
            </button>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="text-white">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h1 className="text-3xl font-bold">{college.name}</h1>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    college.isActive ? 'bg-green-500/20 text-green-100' : 'bg-red-500/20 text-red-100'
                  }`}>
                    {college.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-blue-100 text-lg">{college.university}</p>
              </div>
              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={() => fetchCollegeDetails(true)}
                  disabled={refreshing}
                  className="flex items-center gap-2 bg-white/20 text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-white/30 transition-all"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
                <button
                  onClick={() => navigate(`/dashboard/super-admin/colleges/${collegeId}/edit`)}
                  className="flex items-center gap-2 bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-all shadow-lg"
                >
                  <Edit className="w-5 h-5" />
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 bg-red-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-600 transition-all shadow-lg"
                >
                  <Trash2 className="w-5 h-5" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* Students — clickable */}
        <div
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 cursor-pointer hover:shadow-xl hover:border-blue-200 transition-all group"
          onClick={() => navigate(`/dashboard/super-admin/colleges/${collegeId}/students`)}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">Total Students</p>
              <p className="text-3xl font-bold text-purple-600 group-hover:text-blue-600 transition-colors">
                {liveCounts.totalStudents}
              </p>
              <p className="text-xs text-blue-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                Click to view →
              </p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        {/* Companies */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">Companies</p>
              <p className="text-3xl font-bold text-orange-600">{liveCounts.totalCompanies}</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-slate-500 to-slate-600 rounded-xl flex items-center justify-center">
              <Briefcase className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        {/* Job Descriptions */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">Job Descriptions</p>
              <p className="text-3xl font-bold text-blue-600">{liveCounts.totalJDs}</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <FileText className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        {/* Active Admins */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">Active Admins</p>
              <p className="text-3xl font-bold text-green-600">{liveCounts.activeAdmins}</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
              <Users className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Information */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-50 via-cyan-50 to-blue-50 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-600" />
                Contact Information
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <ContactRow icon={Mail} iconBg="bg-blue-100" iconColor="text-blue-600" label="Email" value={college.email} />
              <ContactRow icon={Phone} iconBg="bg-green-100" iconColor="text-green-600" label="Phone" value={college.phone} />
              {college.website && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Globe className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Website</p>
                    <a href={college.website} target="_blank" rel="noopener noreferrer"
                       className="text-blue-600 hover:text-blue-700 font-medium">
                      {college.website}
                    </a>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Address</p>
                  <p className="text-gray-900 font-medium">
                    {college.address?.street && `${college.address.street}, `}
                    {college.address?.city}, {college.address?.state}
                    {college.address?.pincode && ` - ${college.address.pincode}`}
                    {college.address?.country && `, ${college.address.country}`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Departments */}
          {college.departments && college.departments.length > 0 && (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-blue-50 via-cyan-50 to-blue-50 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-blue-600" />
                  Departments ({college.departments.length})
                </h2>
              </div>
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        {['Department', 'Code', 'HOD Name', 'HOD Email'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-sm font-semibold text-gray-700">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {college.departments.map((dept, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-900 font-medium">{dept.name}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm font-semibold">{dept.code}</span>
                          </td>
                          <td className="px-4 py-3 text-gray-600">{dept.hodName || '—'}</td>
                          <td className="px-4 py-3 text-gray-600">{dept.hodEmail || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Basic Details */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-50 via-cyan-50 to-blue-50 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                College Details
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">College Code</p>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-bold">{college.code}</span>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Type</p>
                <p className="text-gray-900 font-medium">{college.type}</p>
              </div>
              {college.establishedYear && (
                <div>
                  <p className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                    <Calendar className="w-4 h-4" /> Established
                  </p>
                  <p className="text-gray-900 font-medium">{college.establishedYear}</p>
                </div>
              )}
              {college.accreditation && college.accreditation.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 mb-2 flex items-center gap-1">
                    <Award className="w-4 h-4" /> Accreditations
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {college.accreditation.map((acc, i) => (
                      <span key={i} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">{acc}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Placement Configuration */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-50 via-cyan-50 to-blue-50 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-blue-600" />
                Placement Config
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Academic Year</p>
                <p className="text-gray-900 font-medium">{college.placementConfig?.academicYear || 'Not Set'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Minimum CGPA</p>
                <p className="text-gray-900 font-medium">{college.placementConfig?.minimumCGPA ?? 6.0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Allow Backlogs</p>
                <div className="flex items-center gap-2">
                  {(college.placementConfig?.allowBacklogs ?? true) ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  <p className="text-gray-900 font-medium">
                    {(college.placementConfig?.allowBacklogs ?? true) ? 'Yes' : 'No'}
                  </p>
                </div>
              </div>
              {(college.placementConfig?.allowBacklogs ?? true) && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Max Backlogs</p>
                  <p className="text-gray-900 font-medium">{college.placementConfig?.maxBacklogsAllowed ?? 3}</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-50 via-cyan-50 to-blue-50 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Quick Actions</h2>
            </div>
            <div className="p-6 space-y-3">
              <ActionBtn
                icon={Users}
                label="View Students"
                color="purple"
                onClick={() => navigate(`/dashboard/super-admin/colleges/${collegeId}/students`)}
              />
              <ActionBtn
                icon={Edit}
                label="Edit College"
                color="green"
                onClick={() => navigate(`/dashboard/super-admin/colleges/${collegeId}/edit`)}
              />
              <ActionBtn
                icon={Trash2}
                label="Delete College"
                color="red"
                onClick={handleDelete}
              />
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.5s ease-out; }
      `}</style>
    </DashboardLayout>
  );
};

const ContactRow = ({ icon: Icon, iconBg, iconColor, label, value }) => (
  <div className="flex items-center gap-3">
    <div className={`w-10 h-10 ${iconBg} rounded-lg flex items-center justify-center`}>
      <Icon className={`w-5 h-5 ${iconColor}`} />
    </div>
    <div>
      <p className="text-sm text-gray-600">{label}</p>
      <p className="text-gray-900 font-medium">{value || '—'}</p>
    </div>
  </div>
);

const colorMap = {
  purple: 'bg-purple-50 text-purple-700 hover:bg-purple-100',
  green:  'bg-green-50 text-green-700 hover:bg-green-100',
  red:    'bg-red-50 text-red-700 hover:bg-red-100',
};

const ActionBtn = ({ icon: Icon, label, color, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 ${colorMap[color]} rounded-xl transition-colors font-medium`}
  >
    <Icon className="w-5 h-5" />
    {label}
  </button>
);

export default CollegeDetail;