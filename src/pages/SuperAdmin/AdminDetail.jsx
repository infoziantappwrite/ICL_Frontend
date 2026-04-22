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
import { DetailSkeleton } from '../../components/common/SkeletonLoader';

/* ─── Section heading ─────────────────────── */
const SHead = ({ icon: Icon, title, sub }) => (
  <div className="flex items-center gap-2 mb-4">
    <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{background:'linear-gradient(135deg,#003399,#00A9CE)'}}>
      <Icon className="w-3 h-3 text-white" />
    </div>
    <div>
      <h3 className="text-sm font-bold text-slate-800 leading-none">{title}</h3>
      {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

/* ─── Info row ────────────────────────────── */
const InfoRow = ({ icon: Icon, label, value, mono }) => (
  <div className="flex items-start gap-3 py-2.5 border-b border-slate-50 last:border-0">
    <div className="w-7 h-7 bg-[#003399]/5 border border-[#003399]/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
      <Icon className="w-3.5 h-3.5 text-[#003399]" />
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
    return <DetailSkeleton layout={SuperAdminDashboardLayout} />;
  }

  if (!admin) {
    return (
      <SuperAdminDashboardLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-3 border border-slate-100">
            <Users className="w-7 h-7 text-slate-200" />
          </div>
          <p className="text-sm font-black text-slate-800 mb-4">Admin not found</p>
          <button
            onClick={() => navigate('/dashboard/super-admin/admins')}
            className="inline-flex items-center gap-1.5 text-[11px] font-black px-4 py-2 rounded-xl bg-[#003399] text-white shadow-sm hover:bg-[#002d8b] transition-all"
          >
            Go to Admins List
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
      <div className="px-6 py-4 md:px-8 md:py-6 space-y-5 font-sans">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span className="w-2 h-8 bg-gradient-to-b from-[#003399] to-[#00A9CE] rounded-full" />
            {admin.fullName}
          </h1>
          <div className="flex flex-wrap gap-1.5 mt-2">
            <span className="inline-flex items-center gap-1 bg-[#003399]/5 text-[#003399] border border-[#003399]/10 rounded-md px-2 py-0.5 text-[9px] font-black uppercase tracking-wider">
              <Shield className="w-3 h-3" /> College Admin
            </span>
            <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[9px] font-black uppercase tracking-wider border ${
              admin.isActive ? 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20' : 'bg-rose-50 text-rose-500 border-rose-100'
            }`}>
              {admin.isActive ? <><CheckCircle2 className="w-3 h-3" /> Active</> : <><XCircle className="w-3 h-3" /> Inactive</>}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={handleToggleStatus}
            className={`inline-flex items-center gap-1.5 text-[11px] font-black px-3 py-2 rounded-xl border transition-all ${
              admin.isActive ? 'bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100'
            }`}>
            {admin.isActive ? <><ToggleLeft className="w-3.5 h-3.5" /> Deactivate</> : <><ToggleRight className="w-3.5 h-3.5" /> Activate</>}
          </button>
          <button onClick={() => navigate(`/dashboard/super-admin/admins/edit/${adminId}`)}
            className="inline-flex items-center gap-1.5 bg-white text-[#003399] text-[11px] font-black px-3 py-2 rounded-xl border border-slate-100 hover:border-[#003399] shadow-sm transition-all">
            <Edit className="w-3.5 h-3.5" /> Edit
          </button>
          <button onClick={handleDelete}
            className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-600 text-[11px] font-black px-3 py-2 rounded-xl border border-rose-100 hover:bg-rose-100 transition-all">
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
        </div>
      </div>

      {/* ══ MAIN GRID ══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── LEFT (2 cols) ── */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* Basic Information */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
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
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <SHead icon={GraduationCap} title="College Information" sub="Associated institution details" />
                <button
                  onClick={() => navigate(`/dashboard/super-admin/colleges/${admin.college._id}`)}
                  className="text-[10px] font-black text-[#003399] flex items-center gap-0.5 px-2 py-1 rounded-lg hover:bg-[#003399]/5 transition-colors uppercase tracking-widest"
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
        <div className="flex flex-col gap-6">

          {/* Status Card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <SHead icon={Shield} title="Account Status" />
            <div className="space-y-3">
              <div className={`flex items-center gap-3 p-3 rounded-xl border ${
                admin.isActive ? 'bg-[#10b981]/5 border-[#10b981]/15' : 'bg-rose-50 border-rose-100'
              }`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  admin.isActive ? 'bg-[#10b981]/10' : 'bg-rose-100'
                }`}>
                  {admin.isActive
                    ? <CheckCircle2 className="w-4 h-4 text-[#10b981]" />
                    : <XCircle className="w-4 h-4 text-rose-500" />}
                </div>
                <div>
                  <p className={`text-xs font-black ${admin.isActive ? 'text-[#10b981]' : 'text-rose-600'}`}>
                    {admin.isActive ? 'Active' : 'Inactive'}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {admin.isActive ? 'Can log in and access the system' : 'Access is currently restricted'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 py-2">
                <div className="w-7 h-7 bg-[#00A9CE]/5 border border-[#00A9CE]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-3.5 h-3.5 text-[#00A9CE]" />
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
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <SHead icon={Clock} title="Quick Actions" />
            <div className="space-y-2">
              <button onClick={() => navigate(`/dashboard/super-admin/admins/edit/${adminId}`)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-[#003399]/5 hover:bg-[#003399]/10 border border-[#003399]/10 text-[#003399] text-xs font-black transition-all">
                <div className="w-6 h-6 bg-[#003399]/10 rounded-lg flex items-center justify-center flex-shrink-0"><Edit className="w-3 h-3" /></div>
                Edit Admin Details
              </button>
              <button onClick={handleToggleStatus}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-xs font-black transition-all ${
                  admin.isActive ? 'bg-amber-50 hover:bg-amber-100 border-amber-100 text-amber-700' : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-100 text-emerald-700'
                }`}>
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${admin.isActive ? 'bg-amber-100' : 'bg-emerald-100'}`}>
                  {admin.isActive ? <ToggleLeft className="w-3 h-3" /> : <ToggleRight className="w-3 h-3" />}
                </div>
                {admin.isActive ? 'Deactivate Admin' : 'Activate Admin'}
              </button>
              <button onClick={handleDelete}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-700 text-xs font-black transition-all">
                <div className="w-6 h-6 bg-rose-100 rounded-lg flex items-center justify-center flex-shrink-0"><Trash2 className="w-3 h-3" /></div>
                Delete Admin
              </button>
            </div>
          </div>

          {/* Admin Profile Card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md" style={{background:'linear-gradient(135deg,#003399,#00A9CE)'}}>
              <span className="text-xl font-black text-white">{admin.fullName?.substring(0, 2).toUpperCase()}</span>
            </div>
            <p className="text-sm font-black text-slate-800 leading-tight">{admin.fullName}</p>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">{admin.email}</p>
            {admin.college && (
              <span className="mt-2 inline-flex items-center gap-1 bg-[#003399]/5 text-[#003399] border border-[#003399]/10 rounded-md px-2.5 py-1 text-[10px] font-black">
                <Building2 className="w-3 h-3" />{admin.college.name?.split(' ').slice(0, 3).join(' ')}
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