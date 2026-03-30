import { useToast } from '../../context/ToastContext';
// pages/SuperAdmin/AdminForm.jsx - FINAL WORKING VERSION
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import apiCall from '../../api/Api';
import {
  Users,
  Save,
  X,
  Mail,
  Phone,
  GraduationCap,
  Shield,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import SuperAdminDashboardLayout from '../../components/layout/SuperAdminDashboardLayout';
import { DetailSkeleton } from '../../components/common/SkeletonLoader';

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

/* ─── Field wrapper ───────────────────────── */
const Field = ({ label, icon: Icon, required, error, children, hint }) => (
  <div>
    <label className="flex items-center gap-1.5 text-xs font-bold text-gray-600 mb-1.5">
      {Icon && <Icon className="w-3.5 h-3.5 text-gray-400" />}
      {label}
      {required && <span className="text-blue-500 text-xs">*</span>}
    </label>
    {children}
    {hint && !error && <p className="text-[10px] text-gray-400 mt-1">{hint}</p>}
    {error && (
      <p className="text-red-500 text-[11px] mt-1 flex items-center gap-1 font-medium">
        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
        {error}
      </p>
    )}
  </div>
);

const inputBase =
  'w-full px-3 py-2.5 text-sm border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white placeholder-gray-400';

const AdminForm = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const { adminId } = useParams();
  const isEditMode = !!adminId;

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [colleges, setColleges] = useState([]);
  const [loadingColleges, setLoadingColleges] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    collegeId: '',
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    isActive: true,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchColleges();
    if (isEditMode) {
      fetchAdminData();
    } else {
      setLoading(false);
    }
  }, [adminId]);

  const fetchColleges = async () => {
    try {
      setLoadingColleges(true);
      const data = await apiCall('/super-admin/colleges?limit=1000');
      if (data.success) {
        setColleges(data.colleges || []);
      }
    } catch (error) {
      console.error('Error fetching colleges:', error);
    } finally {
      setLoadingColleges(false);
    }
  };

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const data = await apiCall(`/super-admin/admins/${adminId}`);

      if (data.success) {
        setFormData({
          collegeId: data.admin.collegeId?._id || data.admin.collegeId || '',
          fullName: data.admin.fullName || '',
          email: data.admin.email || '',
          phone: data.admin.phone || '',
          password: '',
          confirmPassword: '',
          isActive: data.admin.isActive ?? true,
        });
      }
    } catch (error) {
      console.error('Error fetching admin:', error);
      toast.error('Error', 'Failed to fetch admin: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    console.log('Input changed:', name, '=', value); // DEBUG LOG

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    const trimmedFullName = (formData.fullName || '').trim();
    if (!trimmedFullName || trimmedFullName.length < 2) {
      newErrors.fullName = 'Full name is required (at least 2 characters)';
    }

    const trimmedEmail = (formData.email || '').trim();
    if (!trimmedEmail) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(trimmedEmail)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.collegeId) {
      newErrors.collegeId = 'College is required';
    }

    if (!isEditMode) {
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm password';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    } else if (formData.password) {
      if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log('=== FORM SUBMIT ===');
    console.log('formData:', formData);
    console.log('fullName:', `"${formData.fullName}"`);
    console.log('==================');

    if (!validateForm()) {
      toast.error('Error', 'Please fix the errors in the form');
      return;
    }

    try {
      setSaving(true);

      if (isEditMode) {
        toast.info('Notice', 'Admin update functionality needs to be implemented in the backend');
        navigate('/dashboard/super-admin/admins');
      } else {
        // FORCE trim and ensure not empty
        const trimmedFullName = (formData.fullName || '').trim();

        if (!trimmedFullName || trimmedFullName.length < 2) {
          toast.error('Error', 'ERROR: Full name is empty! Please type your name.');
          setSaving(false);
          return;
        }

        const requestBody = {
          fullName: trimmedFullName,
          email: (formData.email || '').trim(),
          phone: (formData.phone || '').trim(),
          password: formData.password,
          isActive: formData.isActive,
        };

        console.log('Sending:', requestBody);

        const data = await apiCall(`/super-admin/colleges/${formData.collegeId}/admins`, {
          method: 'POST',
          body: JSON.stringify(requestBody),
        });

        console.log('Response:', data);

        if (!data.success) {
          throw new Error(data.message || 'Failed to create admin');
        }

        toast.success('Success', 'Admin created successfully!');
        navigate('/dashboard/super-admin/admins');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error', 'Failed to save admin: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading || loadingColleges) {
    return <DetailSkeleton layout={SuperAdminDashboardLayout} />;
  }

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
        <div className="relative flex items-center gap-3">
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
            <h1 className="text-white font-black text-lg leading-tight">
              {isEditMode ? 'Edit College Admin' : 'Create College Admin'}
            </h1>
            <p className="text-blue-200 text-[11px] mt-0.5">
              {isEditMode ? 'Update administrator account details' : 'Register a new college administrator account'}
            </p>
          </div>
        </div>
      </div>

      {/* ══ FORM BODY ══ */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* ── LEFT: Main fields (2 cols) ── */}
        <div className="lg:col-span-2 flex flex-col gap-4">

          {/* Personal Details */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-4">
            <SHead icon={Users} title="Personal Details" sub="Administrator's basic information" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <Field label="Full Name" icon={Users} required error={errors.fullName}>
                <input
                  type="text"
                  name="fullName"
                  id="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  autoComplete="off"
                  className={`${inputBase} ${errors.fullName ? 'border-red-400 bg-red-50/30' : 'border-gray-200 hover:border-gray-300'}`}
                  placeholder="Enter full name"
                  required
                />
              </Field>

              <Field label="Email Address" icon={Mail} required error={errors.email}
                hint={isEditMode ? 'Email cannot be changed after creation' : undefined}>
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={isEditMode}
                  autoComplete="off"
                  className={`${inputBase} ${errors.email ? 'border-red-400 bg-red-50/30' : 'border-gray-200 hover:border-gray-300'} ${isEditMode ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                  placeholder="Enter email address"
                  required
                />
              </Field>

              <Field label="Phone Number" icon={Phone} error={errors.phone}>
                <input
                  type="tel"
                  name="phone"
                  id="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  autoComplete="off"
                  className={`${inputBase} border-gray-200 hover:border-gray-300`}
                  placeholder="Enter phone number"
                />
              </Field>

              <Field label="Assigned College" icon={GraduationCap} required error={errors.collegeId}
                hint={isEditMode ? 'College cannot be changed after creation' : undefined}>
                <select
                  name="collegeId"
                  id="collegeId"
                  value={formData.collegeId}
                  onChange={handleInputChange}
                  disabled={isEditMode}
                  className={`${inputBase} ${errors.collegeId ? 'border-red-400 bg-red-50/30' : 'border-gray-200 hover:border-gray-300'} ${isEditMode ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                  required
                >
                  <option value="">Select a college</option>
                  {colleges.filter(c => c.isActive).map(college => (
                    <option key={college._id} value={college._id}>
                      {college.name} ({college.code})
                    </option>
                  ))}
                </select>
              </Field>

            </div>
          </div>

          {/* Password Section */}
          {(!isEditMode || formData.password !== undefined) && (
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-4">
              <SHead
                icon={Lock}
                title={isEditMode ? 'Change Password' : 'Set Password'}
                sub={isEditMode ? 'Leave blank to keep current password' : 'Create a secure password for this account'}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                {(!isEditMode || formData.password !== undefined) && (
                  <Field
                    label={isEditMode ? 'New Password' : 'Password'}
                    icon={Shield}
                    required={!isEditMode}
                    error={errors.password}
                    hint={isEditMode ? 'Leave blank to keep current password' : 'Minimum 8 characters'}
                  >
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        id="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        autoComplete="new-password"
                        className={`${inputBase} pr-10 ${errors.password ? 'border-red-400 bg-red-50/30' : 'border-gray-200 hover:border-gray-300'}`}
                        placeholder={isEditMode ? 'Leave blank to keep current' : 'Enter password'}
                        required={!isEditMode}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </Field>
                )}

                {(!isEditMode || formData.password) && (
                  <Field
                    label="Confirm Password"
                    icon={Shield}
                    required={!isEditMode}
                    error={errors.confirmPassword}
                  >
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      id="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      autoComplete="new-password"
                      className={`${inputBase} ${errors.confirmPassword ? 'border-red-400 bg-red-50/30' : 'border-gray-200 hover:border-gray-300'}`}
                      placeholder="Confirm password"
                      required={!isEditMode}
                    />
                  </Field>
                )}

              </div>
            </div>
          )}

        </div>

        {/* ── RIGHT: Sidebar ── */}
        <div className="flex flex-col gap-4">

          {/* Account Settings */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-4">
            <SHead icon={Shield} title="Account Settings" sub="Access and permissions" />

            {/* Active toggle */}
            <div className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
              formData.isActive
                ? 'bg-blue-50 border-blue-100'
                : 'bg-gray-50 border-gray-200'
            }`}
              onClick={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
            >
              <div className={`relative w-9 h-5 rounded-full flex-shrink-0 transition-colors duration-200 ${
                formData.isActive ? 'bg-gradient-to-r from-blue-500 to-cyan-400' : 'bg-gray-300'
              }`}>
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                  formData.isActive ? 'translate-x-[18px]' : 'translate-x-0.5'
                }`} />
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="sr-only"
                />
              </div>
              <div>
                <p className={`text-xs font-bold ${formData.isActive ? 'text-blue-700' : 'text-gray-600'}`}>
                  {formData.isActive ? 'Account Active' : 'Account Inactive'}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {formData.isActive ? 'Admin can log in and access the system' : 'Access is currently restricted'}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-4">
            <SHead icon={CheckCircle2} title="Save Changes" />
            <div className="space-y-2">
              <button
                type="submit"
                disabled={saving}
                className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs font-bold px-4 py-3 rounded-xl shadow-sm hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <Save className="w-3.5 h-3.5" />
                {saving ? 'Saving...' : isEditMode ? 'Update Admin' : 'Create Admin'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/dashboard/super-admin/admins')}
                className="w-full inline-flex items-center justify-center gap-2 border border-gray-200 bg-white text-gray-600 text-xs font-semibold px-4 py-3 rounded-xl hover:bg-gray-50 transition-all"
              >
                <X className="w-3.5 h-3.5" />
                Cancel
              </button>
            </div>
          </div>

          {/* Form Tips */}
          <div className="bg-gradient-to-br from-blue-600 via-blue-600 to-cyan-500 rounded-2xl p-4 text-white shadow-lg shadow-blue-500/20 relative overflow-hidden">
            <div className="absolute -top-6 -right-6 w-20 h-20 bg-white/10 rounded-full" />
            <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white/10 rounded-full" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-3.5 h-3.5 text-white" />
                </div>
                <p className="text-xs font-bold text-white">
                  {isEditMode ? 'Editing Tips' : 'Creation Tips'}
                </p>
              </div>
              <ul className="space-y-1.5">
                {(isEditMode
                  ? [
                      'Email address cannot be changed',
                      'College assignment is permanent',
                      'Leave password blank to keep current',
                    ]
                  : [
                      'Use a valid institutional email',
                      'Password must be at least 8 characters',
                      'Only active colleges are shown',
                      'Admin can be activated/deactivated later',
                    ]
                ).map((tip, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="w-1 h-1 bg-cyan-300 rounded-full mt-1.5 flex-shrink-0" />
                    <p className="text-[10px] text-blue-100 leading-relaxed">{tip}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>

        </div>
      </form>

    </SuperAdminDashboardLayout>
  );
};

export default AdminForm;