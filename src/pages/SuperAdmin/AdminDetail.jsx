import { useToast } from '../../context/ToastContext';
// pages/SuperAdmin/AdminDetail.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import apiCall from '../../api/Api';
import {
  Users,
  ArrowLeft,
  Mail,
  Phone,
  GraduationCap,
  Shield,
  Calendar,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Building2,
  MapPin,
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const AdminDetail = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const { adminId } = useParams();
  const [loading, setLoading] = useState(true);
  const [admin, setAdmin] = useState(null);

  useEffect(() => {
    fetchAdminDetails();
  }, [adminId]);

  const fetchAdminDetails = async () => {
    try {
      setLoading(true);
      const data = await apiCall(`/super-admin/admins/${adminId}`);
      if (data.success) {
        setAdmin(data.admin);
      } else {
        toast.error('Error', 'Failed to fetch admin details');
        navigate('/dashboard/super-admin/admins');
      }
    } catch (error) {
      console.error('Error fetching admin:', error);
      toast.error('Error', 'Failed to fetch admin: ' + error.message);
      navigate('/dashboard/super-admin/admins');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!confirm(`Are you sure you want to ${admin.isActive ? 'deactivate' : 'activate'} this admin?`)) {
      return;
    }

    try {
      const data = await apiCall(`/super-admin/admins/${adminId}/toggle-status`, { method: 'PATCH' });
      if (data.success) {
        toast.success('Success', `Admin ${admin.isActive ? 'deactivated' : 'activated'} successfully`);
        fetchAdminDetails();
      }
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error('Error', 'Failed to update status: ' + error.message);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${admin.fullName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await apiCall(`/super-admin/admins/${adminId}`, { method: 'DELETE' });
      toast.success('Success', 'Admin deleted successfully');
      navigate('/dashboard/super-admin/admins');
    } catch (error) {
      console.error('Error deleting admin:', error);
      toast.error('Error', 'Failed to delete admin: ' + error.message);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading Admin Details..." />;
  }

  if (!admin) {
    return (
      <DashboardLayout title="Admin Not Found">
        <div className="text-center py-16">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg font-medium">Admin not found</p>
          <button
            onClick={() => navigate('/dashboard/super-admin/admins')}
            className="mt-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-2 rounded-xl"
          >
            Back to Admins
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Admin Details">
      {/* Header */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 rounded-3xl p-8 shadow-2xl shadow-blue-500/30">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => navigate('/dashboard/super-admin/admins')}
                className="text-white/80 hover:text-white mb-4 flex items-center gap-2 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Admins
              </button>
              <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <Users className="w-8 h-8" />
                {admin.fullName}
              </h1>
              <p className="text-blue-100 text-lg">College Administrator</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleToggleStatus}
                className={`px-4 py-2 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-lg hover:shadow-xl ${
                  admin.isActive
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
              >
                {admin.isActive ? (
                  <>
                    <ToggleLeft className="w-5 h-5" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <ToggleRight className="w-5 h-5" />
                    Activate
                  </>
                )}
              </button>
              <button
                onClick={() => navigate(`/dashboard/super-admin/admins/edit/${adminId}`)}
                className="bg-white text-blue-600 px-4 py-2 rounded-xl font-semibold flex items-center gap-2 hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl"
              >
                <Edit className="w-5 h-5" />
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="bg-white text-red-600 px-4 py-2 rounded-xl font-semibold flex items-center gap-2 hover:bg-red-50 transition-all shadow-lg hover:shadow-xl"
              >
                <Trash2 className="w-5 h-5" />
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Users className="w-6 h-6 text-blue-600" />
              Basic Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-semibold text-gray-500 mb-1 block">Full Name</label>
                <p className="text-gray-900 font-medium">{admin.fullName || 'N/A'}</p>
              </div>
              
              <div>
                <label className="text-sm font-semibold text-gray-500 mb-1 block">Email</label>
                <div className="flex items-center gap-2 text-gray-900">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <p className="font-medium">{admin.email}</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-semibold text-gray-500 mb-1 block">Phone</label>
                <div className="flex items-center gap-2 text-gray-900">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <p className="font-medium">{admin.phone || 'N/A'}</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-semibold text-gray-500 mb-1 block">Role</label>
                <span className="px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-700 rounded-full flex items-center gap-1 w-fit">
                  <Shield className="w-3 h-3" />
                  College Admin
                </span>
              </div>
            </div>
          </div>

          {/* College Information */}
          {admin.college && (
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <GraduationCap className="w-6 h-6 text-blue-600" />
                College Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-semibold text-gray-500 mb-1 block">College Name</label>
                  <p className="text-gray-900 font-medium">{admin.college.name || 'N/A'}</p>
                </div>
                
                <div>
                  <label className="text-sm font-semibold text-gray-500 mb-1 block">College Code</label>
                  <p className="text-gray-900 font-medium">{admin.college.code || 'N/A'}</p>
                </div>
                
                {admin.college.email && (
                  <div>
                    <label className="text-sm font-semibold text-gray-500 mb-1 block">College Email</label>
                    <div className="flex items-center gap-2 text-gray-900">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <p className="font-medium">{admin.college.email}</p>
                    </div>
                  </div>
                )}
                
                {admin.college.phone && (
                  <div>
                    <label className="text-sm font-semibold text-gray-500 mb-1 block">College Phone</label>
                    <div className="flex items-center gap-2 text-gray-900">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <p className="font-medium">{admin.college.phone}</p>
                    </div>
                  </div>
                )}
                
                {admin.college.address && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-semibold text-gray-500 mb-1 block">College Address</label>
                    <div className="flex items-start gap-2 text-gray-900">
                      <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                      <p className="font-medium">{admin.college.address}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Status</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-500 mb-2 block">Account Status</label>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full flex items-center gap-1 w-fit ${
                  admin.isActive 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                  {admin.isActive ? (
                    <>
                      <ToggleRight className="w-3 h-3" />
                      Active
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-3 h-3" />
                      Inactive
                    </>
                  )}
                </span>
              </div>
              
              <div>
                <label className="text-sm font-semibold text-gray-500 mb-2 block">Created At</label>
                <div className="flex items-center gap-2 text-gray-700">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">
                    {admin.createdAt ? new Date(admin.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button
                onClick={() => navigate(`/dashboard/super-admin/admins/edit/${adminId}`)}
                className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-3 rounded-xl font-medium flex items-center gap-2 transition-all"
              >
                <Edit className="w-4 h-4" />
                Edit Details
              </button>
              
              <button
                onClick={handleToggleStatus}
                className={`w-full px-4 py-3 rounded-xl font-medium flex items-center gap-2 transition-all ${
                  admin.isActive
                    ? 'bg-red-50 hover:bg-red-100 text-red-700'
                    : 'bg-green-50 hover:bg-green-100 text-green-700'
                }`}
              >
                {admin.isActive ? (
                  <>
                    <ToggleLeft className="w-4 h-4" />
                    Deactivate Admin
                  </>
                ) : (
                  <>
                    <ToggleRight className="w-4 h-4" />
                    Activate Admin
                  </>
                )}
              </button>
              
              <button
                onClick={handleDelete}
                className="w-full bg-red-50 hover:bg-red-100 text-red-700 px-4 py-3 rounded-xl font-medium flex items-center gap-2 transition-all"
              >
                <Trash2 className="w-4 h-4" />
                Delete Admin
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDetail;