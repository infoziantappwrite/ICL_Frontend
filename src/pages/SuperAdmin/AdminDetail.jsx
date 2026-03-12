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
  ChevronRight,
  CheckCircle2,
  XCircle,
  Hash,
  Clock,
} from 'lucide-react';
import SuperAdminDashboardLayout from '../../components/layout/SuperAdminDashboardLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';

/* ─── Section heading ─────────────────────── */
const SHead = ({ icon: Icon, title, sub }) => (
  <div className="flex items-center gap-2 mb-4">
    <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
      <Icon className="w-3 h-3 text-white" />
    </div>
    <div>
      <h3 className="text-sm font-bold text-gray-800 leading-none">{title}</h3>
      {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

/* ─── Info row ────────────────────────────── */
const InfoRow = ({ icon: Icon, label, value, mono }) => (
  <div className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
    <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
      <Icon className="w-3.5 h-3.5 text-blue-500" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
      <p className={`text-sm font-medium text-gray-800 break-all ${mono ? 'font-mono' : ''}`}>{value || 'N/A'}</p>
    </div>
  </div>
);

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
      <SuperAdminDashboardLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-3">
            <Users className="w-7 h-7 text-blue-300" />
          </div>
          <p className="text-sm font-semibold text-gray-600 mb-4">Admin not found</p>
          <button
            onClick={() => navigate('/dashboard/super-admin/admins')}
            className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-sm hover:scale-105 transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Admins
          </button>
        </div>
      </SuperAdminDashboardLayout>
    );
  }

  const formattedAddress = admin.college?.address
    ? typeof admin.college.address === 'object'
      ? [
          admin.college.address.street,
          admin.college.address.city,
          admin.college.address.state,
          admin.college.address.pincode,
          admin.college.address.country,
        ]
          .filter(Boolean)
          .join(', ')
      : admin.college.address
    : null;

  return (
    <SuperAdminDashboardLayout>

      {/* ══ HERO BANNER ══ */}
      <div className="relative bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 rounded-2xl px-5 py-4 mb-4 shadow-xl shadow-blue-500/20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-10 -right-10 w-44 h-44 bg-white/10 rounded-full" />
          <div className="absolute -bottom-8 left-1/3 w-28 h-28 bg-white/10 rounded-full" />
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: 'radial-gradient(circle,white 1px,transparent 1px)', backgroundSize: '18px 18px' }}
          />
        </div>
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <button
                onClick={() => navigate('/dashboard/super-admin/admins')}
                className="text-blue-200 hover:text-white text-[11px] font-semibold flex items-center gap-1 mb-1 transition-colors"
              >
                <ArrowLeft className="w-3 h-3" /> Back to Admins
              </button>
              <h1 className="text-white font-black text-lg leading-tight">{admin.fullName}</h1>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                <span className="inline-flex items-center gap-1 bg-white/15 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white border border-white/20">
                  <Shield className="w-3 h-3" /> College Admin
                </span>
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                  admin.isActive
                    ? 'bg-white/15 text-white border-white/20'
                    : 'bg-white/10 text-white/60 border-white/10'
                }`}>
                  {admin.isActive
                    ? <><CheckCircle2 className="w-3 h-3" /> Active</>
                    : <><XCircle className="w-3 h-3" /> Inactive</>}
                </span>
                {admin.college && (
                  <span className="inline-flex items-center gap-1 bg-white/15 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white border border-white/20">
                    <Building2 className="w-3 h-3" /> {admin.college.name?.split(' ').slice(0, 3).join(' ')}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleToggleStatus}
              className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border transition-all hover:scale-105 ${
                admin.isActive
                  ? 'bg-red-500/20 hover:bg-red-500/30 text-white border-red-300/30'
                  : 'bg-green-500/20 hover:bg-green-500/30 text-white border-green-300/30'
              }`}
            >
              {admin.isActive
                ? <><ToggleLeft className="w-3.5 h-3.5" /> Deactivate</>
                : <><ToggleRight className="w-3.5 h-3.5" /> Activate</>}
            </button>
            <button
              onClick={() => navigate(`/dashboard/super-admin/admins/edit/${adminId}`)}
              className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-3 py-2 rounded-xl border border-white/20 transition-all hover:scale-105"
            >
              <Edit className="w-3.5 h-3.5" /> Edit
            </button>
            <button
              onClick={handleDelete}
              className="inline-flex items-center gap-1.5 bg-red-500/20 hover:bg-red-500/30 text-white text-xs font-bold px-3 py-2 rounded-xl border border-red-300/30 transition-all hover:scale-105"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        </div>
      </div>

      {/* ══ MAIN GRID ══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* ── LEFT (2 cols) ── */}
        <div className="lg:col-span-2 flex flex-col gap-4">

          {/* Basic Information */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-4">
            <SHead icon={Users} title="Basic Information" sub="Personal contact details" />
            <div className="space-y-0.5">
              <InfoRow icon={Users} label="Full Name" value={admin.fullName} />
              <InfoRow icon={Mail} label="Email Address" value={admin.email} mono />
              <InfoRow icon={Phone} label="Phone Number" value={admin.phone} />
              <InfoRow icon={Shield} label="Role" value="College Administrator" />
            </div>
          </div>

          {/* College Information */}
          {admin.college && (
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-4">
              <div className="flex items-center justify-between mb-4">
                <SHead icon={GraduationCap} title="College Information" sub="Associated institution details" />
                <button
                  onClick={() => navigate(`/dashboard/super-admin/colleges/${admin.college._id}`)}
                  className="text-[10px] font-bold text-blue-600 flex items-center gap-0.5 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  View College <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <div className="space-y-0.5">
                <InfoRow icon={Building2} label="College Name" value={admin.college.name} />
                <InfoRow icon={Hash} label="College Code" value={admin.college.code} mono />
                {admin.college.email && <InfoRow icon={Mail} label="College Email" value={admin.college.email} mono />}
                {admin.college.phone && <InfoRow icon={Phone} label="College Phone" value={admin.college.phone} />}
                {formattedAddress && <InfoRow icon={MapPin} label="College Address" value={formattedAddress} />}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT (1 col) ── */}
        <div className="flex flex-col gap-4">

          {/* Status Card */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-4">
            <SHead icon={Shield} title="Account Status" />
            <div className="space-y-3">
              <div className={`flex items-center gap-3 p-3 rounded-xl border ${
                admin.isActive
                  ? 'bg-blue-50 border-blue-100'
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  admin.isActive ? 'bg-blue-100' : 'bg-gray-200'
                }`}>
                  {admin.isActive
                    ? <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    : <XCircle className="w-4 h-4 text-gray-500" />}
                </div>
                <div>
                  <p className={`text-xs font-bold ${admin.isActive ? 'text-blue-700' : 'text-gray-600'}`}>
                    {admin.isActive ? 'Active' : 'Inactive'}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {admin.isActive ? 'Can log in and access the system' : 'Access is currently restricted'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 py-2">
                <div className="w-7 h-7 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Created At</p>
                  <p className="text-xs font-medium text-gray-800">
                    {admin.createdAt
                      ? new Date(admin.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric', month: 'long', day: 'numeric',
                        })
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-4">
            <SHead icon={Clock} title="Quick Actions" />
            <div className="space-y-2">
              <button
                onClick={() => navigate(`/dashboard/super-admin/admins/edit/${adminId}`)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-100 text-blue-700 text-xs font-semibold transition-all hover:scale-[1.02]"
              >
                <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Edit className="w-3 h-3" />
                </div>
                Edit Admin Details
              </button>

              <button
                onClick={handleToggleStatus}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all hover:scale-[1.02] ${
                  admin.isActive
                    ? 'bg-amber-50 hover:bg-amber-100 border-amber-100 text-amber-700'
                    : 'bg-green-50 hover:bg-green-100 border-green-100 text-green-700'
                }`}
              >
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  admin.isActive ? 'bg-amber-100' : 'bg-green-100'
                }`}>
                  {admin.isActive
                    ? <ToggleLeft className="w-3 h-3" />
                    : <ToggleRight className="w-3 h-3" />}
                </div>
                {admin.isActive ? 'Deactivate Admin' : 'Activate Admin'}
              </button>

              <button
                onClick={handleDelete}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-100 text-red-700 text-xs font-semibold transition-all hover:scale-[1.02]"
              >
                <div className="w-6 h-6 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Trash2 className="w-3 h-3" />
                </div>
                Delete Admin
              </button>
            </div>
          </div>

          {/* Admin Avatar Card */}
          <div className="bg-gradient-to-br from-blue-600 via-blue-600 to-cyan-500 rounded-2xl p-4 text-white shadow-lg shadow-blue-500/20 relative overflow-hidden">
            <div className="absolute -top-6 -right-6 w-20 h-20 bg-white/10 rounded-full" />
            <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white/10 rounded-full" />
            <div className="relative flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-3 border border-white/25">
                <span className="text-xl font-black text-white">
                  {admin.fullName?.substring(0, 2).toUpperCase()}
                </span>
              </div>
              <p className="text-sm font-bold text-white leading-tight">{admin.fullName}</p>
              <p className="text-[11px] text-blue-200 mt-0.5">{admin.email}</p>
              {admin.college && (
                <span className="mt-2 inline-flex items-center gap-1 bg-white/15 rounded-full px-2.5 py-1 text-[10px] font-semibold text-white border border-white/20">
                  <Building2 className="w-3 h-3" />
                  {admin.college.name?.split(' ').slice(0, 3).join(' ')}
                </span>
              )}
            </div>
          </div>

        </div>
      </div>

    </SuperAdminDashboardLayout>
  );
};

export default AdminDetail;