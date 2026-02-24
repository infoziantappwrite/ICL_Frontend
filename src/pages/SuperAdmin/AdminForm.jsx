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
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
 
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
      setErrors(prev => ({...prev, [name]: ''}));
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
    return <LoadingSpinner message={isEditMode ? "Loading Admin..." : "Loading Form..."} />;
  }
 
  return (
    <DashboardLayout title={isEditMode ? "Edit Admin" : "Create Admin"}>
      <div className="mb-8">
        <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 rounded-3xl p-8 shadow-2xl shadow-blue-500/30">
          <div className="flex items-center justify-between">
            <div className="text-white">
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <Users className="w-8 h-8" />
                {isEditMode ? 'Edit College Admin' : 'Create College Admin'}
              </h1>
              <p className="text-blue-100 text-lg">
                {isEditMode ? 'Update admin details' : 'Add a new college administrator'}
              </p>
            </div>
          </div>
        </div>
      </div>
 
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Users className="inline w-4 h-4 mr-2" />
                Full Name *
              </label>
              <input
                type="text"
                name="fullName"
                id="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                autoComplete="off"
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                  errors.fullName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter full name"
                required
              />
              {errors.fullName && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.fullName}
                </p>
              )}
            </div>
 
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Mail className="inline w-4 h-4 mr-2" />
                Email *
              </label>
              <input
                type="email"
                name="email"
                id="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={isEditMode}
                autoComplete="off"
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                } ${isEditMode ? 'bg-gray-100' : ''}`}
                placeholder="Enter email address"
                required
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.email}
                </p>
              )}
            </div>
 
            {/* Phone */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Phone className="inline w-4 h-4 mr-2" />
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                id="phone"
                value={formData.phone}
                onChange={handleInputChange}
                autoComplete="off"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter phone number"
              />
            </div>
 
            {/* College */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <GraduationCap className="inline w-4 h-4 mr-2" />
                College *
              </label>
              <select
                name="collegeId"
                id="collegeId"
                value={formData.collegeId}
                onChange={handleInputChange}
                disabled={isEditMode}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                  errors.collegeId ? 'border-red-500' : 'border-gray-300'
                } ${isEditMode ? 'bg-gray-100' : ''}`}
                required
              >
                <option value="">Select a college</option>
                {colleges.filter(c => c.isActive).map(college => (
                  <option key={college._id} value={college._id}>
                    {college.name} ({college.code})
                  </option>
                ))}
              </select>
              {errors.collegeId && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.collegeId}
                </p>
              )}
            </div>
 
            {/* Password */}
            {(!isEditMode || formData.password) && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Shield className="inline w-4 h-4 mr-2" />
                  Password {!isEditMode && '*'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    id="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    autoComplete="new-password"
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-12 ${
                      errors.password ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder={isEditMode ? 'Leave blank to keep current' : 'Enter password'}
                    required={!isEditMode}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.password}
                  </p>
                )}
              </div>
            )}
 
            {/* Confirm Password */}
            {(!isEditMode || formData.password) && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Shield className="inline w-4 h-4 mr-2" />
                  Confirm Password {!isEditMode && '*'}
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  id="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  autoComplete="new-password"
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Confirm password"
                  required={!isEditMode}
                />
                {errors.confirmPassword && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            )}
          </div>
 
          {/* Active Status */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              checked={formData.isActive}
              onChange={handleInputChange}
              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700 cursor-pointer">
              Active (Admin can log in and access the system)
            </label>
          </div>
 
          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Saving...' : isEditMode ? 'Update Admin' : 'Create Admin'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/dashboard/super-admin/admins')}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold flex items-center gap-2 hover:bg-gray-50 transition-all"
            >
              <X className="w-5 h-5" />
              Cancel
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};
 
export default AdminForm;